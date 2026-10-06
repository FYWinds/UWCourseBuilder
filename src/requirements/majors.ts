/**
 * Supported majors, keyed by the id stored in plans. Plans are sanitized on load
 * (`src/store/plan.ts`), so `MAJORS[plan.major]` always resolves.
 */
import type { BreadthRule, Plan } from '@/domain/plan'
import type { DegreeId, Major } from '@/domain/requirements'
import { bcsMajor } from './bcs'
import { MATH_MAJORS } from './math'

export const MAJORS: Record<string, Major> = Object.fromEntries(
  [bcsMajor, ...MATH_MAJORS].map((m) => [m.id, m]),
)

export const DEFAULT_MAJOR = bcsMajor.id

/** Kuali pages with degree-level requirements (BCFM states them on the major page). */
export const DEGREE_PAGES: Record<DegreeId, string | null> = { bcs: 'r1y1WO5ka', bmath: 'rJj6aXDk6', bcfm: null }

/** First 1A term under the 2026/27 calendar (Fall 2026). */
const ELECTIVE_RULE_FROM = '1269'

/**
 * Non-math elective rule in effect. Majors without the choice always follow the 2026/27
 * calendar; BCS students default to the calendar in effect when they entered Mathematics.
 */
export function resolveBreadthRule(plan: Pick<Plan, 'major' | 'breadthRule' | 'startTerm'>): BreadthRule {
  if (!MAJORS[plan.major].breadthRuleChoice) return 'elective'
  return plan.breadthRule ?? (plan.startTerm < ELECTIVE_RULE_FROM ? 'breadth-depth' : 'elective')
}

/** Majors grouped by degree for pickers, each group sorted by name. */
export const MAJORS_BY_DEGREE: { degree: DegreeId; majors: Major[] }[] = (['bcs', 'bmath', 'bcfm'] as DegreeId[]).map(
  (degree) => ({
    degree,
    majors: Object.values(MAJORS)
      .filter((m) => m.degree === degree)
      .sort((a, b) => a.shortName.localeCompare(b.shortName)),
  }),
)
