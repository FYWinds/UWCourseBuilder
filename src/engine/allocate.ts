/**
 * Course → slot allocation for one program via max-flow.
 *
 * Network: source → course (capacity = course units) → [maxFrom group] → slot
 * (capacity = slot units) → sink. Units are integer hundredths. With uniform
 * 0.5-unit candidates the max flow is integral in 0.5 steps, so no course is
 * split; a mixed-unit pool (e.g. 0.25-unit labs in a breadth pool) may split a
 * course across slots — an accepted approximation.
 */
import type { LevelFloor, Program, Slot } from '@/domain/requirements'
import type { CourseCode } from '@/domain/types'
import { type CatalogIndex, expandSet, numericPart } from './catalog'
import { FlowGraph } from './flow'

const toHundredths = (units: number) => Math.round(units * 100)

export interface SlotAllocation {
  slot: Slot
  /** Units filled (0..slot.units). */
  filled: number
  courses: CourseCode[]
  satisfied: boolean
}

export interface FloorResult {
  floor: LevelFloor
  units: number
  satisfied: boolean
}

export interface Allocation {
  slots: SlotAllocation[]
  floors: FloorResult[]
  /** Course → slot id it was allocated to (largest share). */
  assignment: Map<CourseCode, string>
  /** Total units still missing across slots. */
  deficit: number
  satisfied: boolean
}

/** Program slots with specialization overrides applied (e.g. DHW adds ECE 222 to cs251). */
export function effectiveSlots(program: Program, overrides: Program['coreOverrides'] = []): Slot[] {
  const slots = program.sections.flatMap((s) => s.slots)
  if (!overrides.length) return slots
  return slots.map((slot) => {
    const add = overrides.filter((o) => o.slot === slot.id)
    if (!add.length) return slot
    return {
      ...slot,
      label: `${slot.label} (or ${add.flatMap((o) => o.add).join(', ')})`,
      from: { union: [slot.from, { list: add.flatMap((o) => o.add) }] },
      note: [slot.note, ...add.map((o) => o.note)].filter(Boolean).join(' '),
    }
  })
}

/** Max-flow allocation of `courses` to `slots`. Only flow totals; see `allocate` for floors. */
export function solveFlow(
  slots: Slot[],
  courses: CourseCode[],
  idx: CatalogIndex,
  prioritize = false,
): { filled: number[]; edges: { course: CourseCode; slot: number; edge: number }[]; graph: FlowGraph } {
  const slotSets = slots.map((s) => expandSet(s.from, idx))
  const eligible = courses.filter((c) => slotSets.some((set) => set.has(c)))
  const groupSpecs = slots.flatMap((s, si) =>
    (s.maxFrom ?? []).map((m) => ({ si, set: expandSet(m.set, idx), cap: toHundredths(m.max * 0.5) })),
  )
  const S = 0
  const courseBase = 1
  const groupBase = courseBase + eligible.length
  const slotBase = groupBase + groupSpecs.length
  const T = slotBase + slots.length
  const g = new FlowGraph(T + 1)
  groupSpecs.forEach((gs, gi) => g.addEdge(groupBase + gi, slotBase + gs.si, gs.cap))
  const edges: { course: CourseCode; slot: number; edge: number }[] = []
  eligible.forEach((code, ci) => {
    const units = toHundredths(idx.byCode.get(code)?.units ?? 0.5)
    g.addEdge(S, courseBase + ci, units)
    slots.forEach((_, si) => {
      if (!slotSets[si].has(code)) return
      const gi = groupSpecs.findIndex((gs) => gs.si === si && gs.set.has(code))
      const target = gi >= 0 ? groupBase + gi : slotBase + si
      edges.push({ course: code, slot: si, edge: g.addEdge(courseBase + ci, target, units) })
    })
  })
  if (!prioritize) {
    const sinkEdges = slots.map((s, si) => g.addEdge(slotBase + si, T, toHundredths(s.units)))
    g.maxFlow(S, T)
    return { filled: sinkEdges.map((e) => g.flowOn(e)), edges, graph: g }
  }
  // Open sink edges one slot at a time, scarcest pool first. Augmenting paths never
  // reduce flow already reaching the sink, so scarce slots (communication, required
  // variants) are filled before broad pools (breadth) can claim shared courses.
  const sinkEdges = slots.map((_, si) => g.addEdge(slotBase + si, T, 0))
  const order = slots.map((_, si) => si).sort((a, b) => slotSets[a].size - slotSets[b].size)
  for (const si of order) {
    g.setCapacity(sinkEdges[si], toHundredths(slots[si].units))
    g.maxFlow(S, T)
  }
  return { filled: sinkEdges.map((e) => g.flowOn(e)), edges, graph: g }
}

/** Whether `courses` can satisfy every slot (ignores level floors). */
export function feasible(slots: Slot[], courses: CourseCode[], idx: CatalogIndex): boolean {
  const { filled } = solveFlow(slots, courses, idx)
  return filled.every((f, i) => f >= toHundredths(slots[i].units))
}

export function allocate(
  program: Program,
  courses: CourseCode[],
  idx: CatalogIndex,
  overrides: Program['coreOverrides'] = [],
): Allocation {
  const slots = effectiveSlots(program, overrides)
  const { filled, edges, graph } = solveFlow(slots, courses, idx, true)

  // Each course goes to the slot receiving its largest share.
  const best = new Map<CourseCode, { slot: number; flow: number }>()
  for (const e of edges) {
    const flow = graph.flowOn(e.edge)
    if (flow > 0 && flow > (best.get(e.course)?.flow ?? 0)) best.set(e.course, { slot: e.slot, flow })
  }
  const assignment = new Map([...best].map(([code, b]) => [code, slots[b.slot].id]))
  const filledUnits = filled.map((f) => f / 100)

  const floors = (program.levelFloors ?? []).map((floor) =>
    applyFloor(floor, slots, assignment, courses, idx),
  )

  const slotResults: SlotAllocation[] = slots.map((slot, si) => ({
    slot,
    filled: filledUnits[si],
    courses: [...assignment].filter(([, id]) => id === slot.id).map(([code]) => code),
    satisfied: filled[si] >= toHundredths(slot.units),
  }))
  const deficit = slotResults.reduce((s, r) => s + Math.max(0, r.slot.units - r.filled), 0)
  return {
    slots: slotResults,
    floors,
    assignment,
    deficit,
    satisfied: deficit === 0 && floors.every((f) => f.satisfied),
  }
}

/**
 * Level floor ("≥1.0 unit at the 200-level"): count allocated units at/above the
 * level; if short, swap unallocated higher-level courses into the absorbing slot,
 * displacing lower-level ones. Mutates `assignment`.
 */
function applyFloor(
  floor: LevelFloor,
  slots: Slot[],
  assignment: Map<CourseCode, string>,
  courses: CourseCode[],
  idx: CatalogIndex,
): FloorResult {
  const levelOf = (code: CourseCode) => numericPart(idx.byCode.get(code)?.number ?? '0')
  const unitsOf = (code: CourseCode) => idx.byCode.get(code)?.units ?? 0
  const inFloor = () => [...assignment].filter(([, id]) => floor.slots.includes(id)).map(([c]) => c)
  const highUnits = () => inFloor().filter((c) => levelOf(c) >= floor.level).reduce((s, c) => s + unitsOf(c), 0)

  const absorbing = slots.find((s) => s.id === floor.absorbingSlot)
  if (absorbing) {
    const pool = expandSet(absorbing.from, idx)
    const spare = courses.filter((c) => !assignment.has(c) && pool.has(c) && levelOf(c) >= floor.level)
    for (const code of spare) {
      if (highUnits() >= floor.units) break
      const low = [...assignment].find(([c, id]) => id === absorbing.id && levelOf(c) < floor.level)
      if (low) assignment.delete(low[0])
      assignment.set(code, absorbing.id)
    }
  }
  const units = highUnits()
  return { floor, units, satisfied: units >= floor.units }
}
