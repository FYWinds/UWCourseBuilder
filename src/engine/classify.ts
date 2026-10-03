/**
 * Classify every catalog course relative to a plan:
 *   taken / planned  — already in the plan
 *   blocked          — antirequisite of a placed course, or restricted to other programs
 *   must             — without it some active program becomes impossible
 *   required         — one interchangeable variant of an unmet mandatory requirement
 *   counts           — fills an unmet elective slot
 *   free             — only adds to the 20.0-unit total
 * Prerequisites of must/required courses that are themselves unavoidable are
 * promoted to `must` with `prereqFor` set.
 */
import type { Plan } from '@/domain/plan'
import type { Slot } from '@/domain/requirements'
import type { Course, CourseCode, Requisite } from '@/domain/types'
import { effectiveSlots, feasible, solveFlow } from './allocate'
import { type AuditResult, activePrograms } from './audit'
import { type CatalogIndex, countsTowardDegree, expandSet } from './catalog'
import { programAllows, studentPrograms } from './requisites'

export type CourseStatus = 'taken' | 'planned' | 'blocked' | 'must' | 'required' | 'counts' | 'free'

export interface SlotRef {
  programId: string
  programName: string
  slotId: string
  slotLabel: string
}

export interface Classification {
  status: CourseStatus
  /** Unmet slots this course could fill. */
  slots: SlotRef[]
  /** Why the course is blocked or must be taken. */
  reasons: string[]
  /** Must-take courses this one is an unavoidable prerequisite for. */
  prereqFor: CourseCode[]
}

export interface ClassifyResult {
  byCode: Map<CourseCode, Classification>
  /** Programs that cannot be completed even with every available course. */
  impossible: { programId: string; programName: string }[]
}

export const STATUS_ORDER: CourseStatus[] = ['must', 'required', 'counts', 'planned', 'taken', 'free', 'blocked']

export function enrolmentTokens(plan: Plan): Set<string> {
  const codes = activePrograms(plan).flatMap((p) => (p.enrolmentCode ? [p.enrolmentCode] : []))
  return studentPrograms(codes)
}

function blockReason(c: Course, placed: Set<CourseCode>, idx: CatalogIndex, programs: Set<string>): string | null {
  const anti = c.antireq.find((a) => placed.has(a))
  if (anti) return `Antirequisite: ${anti} is in your plan`
  for (const p of placed) {
    if (idx.byCode.get(p)?.antireq.includes(c.code)) return `Antirequisite: ${p} is in your plan`
    if (c.crossListed.includes(p)) return `Cross-listed with ${p}, which is in your plan`
  }
  if (!programAllows(c.prereq, programs) || !programAllows(c.coreq, programs)) {
    return 'Restricted to students in other programs'
  }
  return null
}

export function classify(plan: Plan, audit: AuditResult, idx: CatalogIndex): ClassifyResult {
  const programs = activePrograms(plan)
  const tokens = enrolmentTokens(plan)
  const placedStatus = new Map(audit.placed.map((p) => [p.code, p.status]))
  const placedSet = new Set(placedStatus.keys())
  const usable = audit.usable
  const overrides = programs.flatMap((p) => p.coreOverrides ?? [])

  const byCode = new Map<CourseCode, Classification>()
  const available: CourseCode[] = []
  for (const c of idx.courses) {
    const status = placedStatus.get(c.code)
    if (status) {
      byCode.set(c.code, { status, slots: [], reasons: [], prereqFor: [] })
      continue
    }
    const reason = blockReason(c, placedSet, idx, tokens)
    if (reason) {
      byCode.set(c.code, { status: 'blocked', slots: [], reasons: [reason], prereqFor: [] })
      continue
    }
    byCode.set(c.code, { status: countsTowardDegree(c) ? 'free' : 'blocked', slots: [], reasons: countsTowardDegree(c) ? [] : ['Does not count toward degree units'], prereqFor: [] })
    available.push(c.code)
  }

  const impossible: ClassifyResult['impossible'] = []
  const availableSet = new Set(available)

  for (const pa of audit.programs) {
    const program = pa.program
    const slots = effectiveSlots(program, program.kind === 'core' ? overrides : [])
    const unmet = pa.allocation.slots.filter((s) => !s.satisfied).map((s) => s.slot.id)
    if (unmet.length === 0 && pa.allocation.floors.every((f) => f.satisfied)) continue

    const ref = (slot: Slot): SlotRef => ({
      programId: program.id,
      programName: program.shortName,
      slotId: slot.id,
      slotLabel: slot.label,
    })

    // Candidates: available courses that fit an unmet slot of this program.
    for (const slot of slots) {
      if (!unmet.includes(slot.id)) continue
      for (const code of expandSet(slot.from, idx)) {
        const cl = byCode.get(code)
        if (!cl || !availableSet.has(code)) continue
        cl.slots.push(ref(slot))
        const rank = slot.kind === 'required' ? 'required' : 'counts'
        if (cl.status === 'free' || (cl.status === 'counts' && rank === 'required')) cl.status = rank
      }
    }
    // Unmet level floors make higher-level pool courses count toward the floor.
    for (const fr of pa.allocation.floors) {
      if (fr.satisfied) continue
      const absorbing = slots.find((s) => s.id === fr.floor.absorbingSlot)
      if (!absorbing) continue
      for (const code of expandSet(absorbing.from, idx)) {
        const cl = byCode.get(code)
        const course = idx.byCode.get(code)
        if (!cl || !course || !availableSet.has(code) || Number.parseInt(course.number) < fr.floor.level) continue
        cl.slots.push({ programId: program.id, programName: program.shortName, slotId: fr.floor.id, slotLabel: fr.floor.label })
        if (cl.status === 'free') cl.status = 'counts'
      }
    }

    // Essential courses: removing them makes the program infeasible.
    const candidates = available.filter((code) => slots.some((s) => expandSet(s.from, idx).has(code)))
    const universe = [...usable, ...candidates]
    if (!feasible(slots, universe, idx)) {
      impossible.push({ programId: program.id, programName: program.shortName })
      continue
    }
    const { edges, graph } = solveFlow(slots, universe, idx)
    const used = new Set(edges.filter((e) => graph.flowOn(e.edge) > 0).map((e) => e.course))
    for (const code of candidates) {
      if (!used.has(code)) continue
      if (feasible(slots, universe.filter((c) => c !== code), idx)) continue
      const cl = byCode.get(code)
      if (!cl) continue
      cl.status = 'must'
      const slotLabels = slots.filter((s) => expandSet(s.from, idx).has(code)).map((s) => s.label)
      cl.reasons.push(`${program.shortName}: no alternative for ${slotLabels.join(' / ')}`)
    }
  }

  promotePrereqs(byCode, idx)
  return { byCode, impossible }
}

/**
 * For each must/required course, walk its prerequisites: course leaves under an
 * `all` (or an `atLeast` whose available options equal n) are unavoidable.
 */
function promotePrereqs(byCode: Map<CourseCode, Classification>, idx: CatalogIndex) {
  const usableOption = (code: CourseCode) => {
    const s = byCode.get(code)?.status
    return s !== undefined && s !== 'blocked'
  }
  const queue = [...byCode].filter(([, c]) => c.status === 'must').map(([code]) => code)
  const seen = new Set(queue)
  const visit = (req: Requisite | undefined, root: CourseCode, forced: boolean) => {
    if (!req) return
    if (req.kind === 'course') {
      const cl = byCode.get(req.code)
      if (!forced || !cl || cl.status === 'taken' || cl.status === 'planned' || cl.status === 'blocked') return
      if (!cl.prereqFor.includes(root)) cl.prereqFor.push(root)
      if (cl.status !== 'must') {
        cl.status = 'must'
        cl.reasons.push(`Prerequisite for ${root}`)
      }
      if (!seen.has(req.code)) {
        seen.add(req.code)
        queue.push(req.code)
      }
      return
    }
    if (req.kind === 'all') req.of.forEach((r) => visit(r, root, forced))
    if (req.kind === 'atLeast') {
      // Already satisfied by placed courses → nothing forced below.
      const done = req.of.filter((r) => r.kind === 'course' && ['taken', 'planned'].includes(byCode.get(r.code)?.status ?? '')).length
      if (done >= req.n) return
      const options = req.of.filter((r) => r.kind !== 'course' || usableOption(r.code))
      req.of.forEach((r) => visit(r, root, forced && options.length <= req.n))
    }
  }
  while (queue.length) {
    const code = queue.shift() as CourseCode
    visit(idx.byCode.get(code)?.prereq, code, true)
  }
}

/** Courses of an unmet program slot that are still available, for "pick one" pickers. */
export function slotCandidates(slot: Slot, result: ClassifyResult, idx: CatalogIndex): Course[] {
  return [...expandSet(slot.from, idx)]
    .map((code) => idx.byCode.get(code))
    .filter((c): c is Course => !!c && !['blocked', 'taken', 'planned'].includes(result.byCode.get(c.code)?.status ?? 'blocked'))
}
