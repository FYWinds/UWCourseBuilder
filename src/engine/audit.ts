import type { Plan, PlanTerm } from '@/domain/plan'
import { SEQUENCES } from '@/domain/plan'
import type { Program } from '@/domain/requirements'
import type { CourseCode } from '@/domain/types'
import { bcsCore, coopProgram } from '@/requirements/bcs'
import { SPECS } from '@/requirements/specs'
import { type Allocation, allocate } from './allocate'
import { type CatalogIndex, countsTowardDegree, expandSet } from './catalog'
import { type PlacedCourse, buildTerms, placedCourses } from './terms'

export interface TotalResult {
  id: string
  label: string
  units: number
  have: number
  satisfied: boolean
}

export interface ProgramAudit {
  program: Program
  allocation: Allocation
  totals: TotalResult[]
}

export interface AuditResult {
  terms: PlanTerm[]
  placed: PlacedCourse[]
  /** Courses that count, in chronological order (duplicates/antirequisites removed). */
  usable: CourseCode[]
  /** Placed courses that do not count, with the reason. */
  excluded: { code: CourseCode; reason: string }[]
  programs: ProgramAudit[]
  fullTimeTerms: { have: number; need: number }
  satisfied: boolean
}

/** Programs that apply to this plan, core first. */
export function activePrograms(plan: Plan): Program[] {
  return [
    bcsCore,
    ...(SEQUENCES[plan.sequence].coop ? [coopProgram] : []),
    ...plan.specs.map((id) => SPECS[id]),
  ]
}

/** Remove repeats, cross-listed twins and antirequisite pairs (the earlier course wins). */
export function dedupe(
  codes: CourseCode[],
  idx: CatalogIndex,
): { usable: CourseCode[]; excluded: { code: CourseCode; reason: string }[] } {
  const usable: CourseCode[] = []
  const excluded: { code: CourseCode; reason: string }[] = []
  for (const code of codes) {
    const c = idx.byCode.get(code)
    if (!c) {
      excluded.push({ code, reason: 'Not in the 2026/27 calendar' })
      continue
    }
    const clash = usable.find(
      (u) =>
        u === code ||
        c.crossListed.includes(u) ||
        c.antireq.includes(u) ||
        (idx.byCode.get(u)?.antireq.includes(code) ?? false),
    )
    if (clash) {
      excluded.push({
        code,
        reason: clash === code ? 'Duplicate' : `Overlaps with ${clash} (antirequisite / cross-listed)`,
      })
      continue
    }
    usable.push(code)
  }
  return { usable, excluded }
}

export function auditCourses(
  programs: Program[],
  usable: CourseCode[],
  idx: CatalogIndex,
): ProgramAudit[] {
  const overrides = programs.flatMap((p) => p.coreOverrides ?? [])
  return programs.map((program) => {
    const allocation = allocate(program, usable, idx, program.kind === 'core' ? overrides : [])
    const totals = (program.totals ?? []).map((t) => {
      const filter = t.from ? expandSet(t.from, idx) : null
      const have = usable
        .map((code) => idx.byCode.get(code))
        .filter((c) => c && countsTowardDegree(c) && (!filter || filter.has(c.code)))
        .reduce((s, c) => s + (c?.units ?? 0), 0)
      return { id: t.id, label: t.label, units: t.units, have, satisfied: have >= t.units - 1e-9 }
    })
    return { program, allocation, totals }
  })
}

export function auditPlan(
  plan: Plan,
  idx: CatalogIndex,
  scope: 'all' | 'taken' = 'all',
): AuditResult {
  const terms = buildTerms(plan)
  const placed = placedCourses(plan, terms)
  const counted = placed.filter((p) => scope === 'all' || p.status === 'taken')
  const { usable, excluded } = dedupe(counted.map((p) => p.code), idx)
  const programs = auditCourses(activePrograms(plan), usable, idx)

  const coop = SEQUENCES[plan.sequence].coop
  const fullTime = terms.filter((t) => {
    if (t.kind !== 'study' || (scope === 'taken' && t.index > plan.completedThrough)) return false
    const codes = plan.placements[t.id] ?? []
    const units = codes.reduce((s, code) => s + (idx.byCode.get(code)?.units ?? 0), 0)
    return codes.length >= 3 && units >= 1.5
  }).length
  const fullTimeTerms = { have: fullTime, need: coop ? 8 : 7 }

  return {
    terms,
    placed,
    usable,
    excluded,
    programs,
    fullTimeTerms,
    satisfied:
      programs.every((p) => p.allocation.satisfied && p.totals.every((t) => t.satisfied)) &&
      fullTime >= fullTimeTerms.need,
  }
}
