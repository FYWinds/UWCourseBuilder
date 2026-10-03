import { TERM_LEVELS, type CourseCode, type Requisite, type TermLevel } from '@/domain/types'
import { type CatalogIndex, numericPart } from './catalog'

export type Verdict = 'met' | 'unmet' | 'unknown'

export interface RequisiteContext {
  idx: CatalogIndex
  /** Courses completed (or planned) strictly before the term being checked. */
  before: Set<CourseCode>
  /** Courses in the same term (count for "concurrently enrolled" and corequisites). */
  same: Set<CourseCode>
  /** Student's level in the term; null when unknown (e.g. transfer credit). */
  level: TermLevel | null
  /** Program tokens the student is enrolled in (see `studentPrograms`). */
  programs: Set<string>
}

/** Tokens matched against "Enrolled in …" rules for a BCS student. */
export function studentPrograms(enrolmentCodes: string[]): Set<string> {
  return new Set([
    'H-Computer Science (BCS)',
    'Honours',
    'Honours Mathematics',
    'Faculty of Mathematics',
    ...enrolmentCodes,
  ])
}

function hasCourse(code: CourseCode, set: Set<CourseCode>, idx: CatalogIndex): boolean {
  if (set.has(code)) return true
  return idx.byCode.get(code)?.crossListed.some((x) => set.has(x)) ?? false
}

function combine(verdicts: Verdict[], need: number): Verdict {
  const met = verdicts.filter((v) => v === 'met').length
  const unknown = verdicts.filter((v) => v === 'unknown').length
  if (met >= need) return 'met'
  return met + unknown >= need ? 'unknown' : 'unmet'
}

/**
 * Evaluate a requisite tree. `asCoreq` treats same-term courses as satisfying
 * every course leaf (corequisites may be taken concurrently).
 */
export function evaluate(req: Requisite, ctx: RequisiteContext, asCoreq = false): Verdict {
  switch (req.kind) {
    case 'all':
      return combine(req.of.map((r) => evaluate(r, ctx, asCoreq)), req.of.length)
    case 'atLeast':
      return combine(req.of.map((r) => evaluate(r, ctx, asCoreq)), req.n)
    case 'course':
      if (hasCourse(req.code, ctx.before, ctx.idx)) return 'met'
      return (asCoreq || req.concurrentOk) && hasCourse(req.code, ctx.same, ctx.idx) ? 'met' : 'unmet'
    case 'level': {
      if (!ctx.level) return 'unknown'
      const have = TERM_LEVELS.indexOf(ctx.level)
      const need = TERM_LEVELS.indexOf(req.min)
      return (req.exact ? have === need : have >= need) ? 'met' : 'unmet'
    }
    case 'program': {
      const any = req.programs.some((p) => ctx.programs.has(p))
      return any === (req.mode === 'in') ? 'met' : 'unmet'
    }
    case 'units': {
      let units = 0
      for (const code of ctx.before) {
        const c = ctx.idx.byCode.get(code)
        if (!c || c.subject !== req.subject) continue
        const n = numericPart(c.number)
        if (req.minLevel !== undefined && (n < req.minLevel || n > (req.maxLevel ?? 999) + 99)) continue
        units += c.units
      }
      return units >= req.min ? 'met' : 'unmet'
    }
    case 'average':
    case 'text':
      return 'unknown'
  }
}

/**
 * Whether program restrictions alone rule the course out for this student
 * (every course/level/grade condition is assumed achievable).
 */
export function programAllows(req: Requisite | undefined, programs: Set<string>): boolean {
  if (!req) return true
  const walk = (r: Requisite): Verdict => {
    switch (r.kind) {
      case 'all':
        return combine(r.of.map(walk), r.of.length)
      case 'atLeast':
        return combine(r.of.map(walk), r.n)
      case 'program':
        return r.programs.some((p) => programs.has(p)) === (r.mode === 'in') ? 'met' : 'unmet'
      default:
        return 'unknown'
    }
  }
  return walk(req) !== 'unmet'
}

/** Leaves that need a human check (grades, averages, free text). */
export function manualChecks(req: Requisite | undefined, out: string[] = []): string[] {
  if (!req) return out
  if (req.kind === 'all' || req.kind === 'atLeast') req.of.forEach((r) => manualChecks(r, out))
  else if (req.kind === 'text') out.push(req.raw)
  else if (req.kind === 'average') out.push(`Minimum cumulative average of ${req.min}%`)
  else if (req.kind === 'course' && req.minGrade) out.push(`Minimum grade of ${req.minGrade}% in ${req.code}`)
  return out
}
