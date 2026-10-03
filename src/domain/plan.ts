import type { SpecId } from './requirements'
import type { CourseCode, Season, TermLevel } from './types'

export type SequenceId = 'coop1' | 'coop2' | 'coop3' | 'coop4' | 'regular'
export type TermKind = 'study' | 'work' | 'off'

/**
 * Study/work sequences for Computer Science (2026/27 calendar, "Study/Work Sequences Chart").
 * Every sequence starts in a Fall term. 'WT' = work term.
 */
export const SEQUENCES: Record<SequenceId, { label: string; coop: boolean; pattern: string[] }> = {
  coop1: {
    label: 'Co-op Sequence 1',
    coop: true,
    pattern: ['1A', '1B', 'WT', '2A', 'WT', '2B', 'WT', '3A', 'WT', '3B', 'WT', '4A', 'WT', '4B'],
  },
  coop2: {
    label: 'Co-op Sequence 2',
    coop: true,
    pattern: ['1A', '1B', 'WT', '2A', '2B', 'WT', '3A', 'WT', '3B', 'WT', '4A', 'WT', 'WT', '4B'],
  },
  coop3: {
    label: 'Co-op Sequence 3',
    coop: true,
    pattern: ['1A', '1B', 'off', '2A', 'WT', '2B', 'WT', '3A', 'WT', '3B', 'WT', '4A', 'WT', 'WT', '4B'],
  },
  coop4: {
    label: 'Co-op Sequence 4',
    coop: true,
    pattern: ['1A', '1B', '2A', 'WT', '2B', 'WT', '3A', 'WT', '3B', 'WT', '4A', 'WT', 'WT', '4B'],
  },
  regular: {
    label: 'Regular (non co-op)',
    coop: false,
    pattern: ['1A', '1B', 'off', '2A', '2B', 'off', '3A', '3B', 'off', '4A', '4B'],
  },
}

export interface PlanTerm {
  /** Stable key into `Plan.placements`: "transfer" or "t<index>". */
  id: string
  index: number
  kind: TermKind
  /** Academic level for study terms. */
  level?: TermLevel
  /** UW term code, e.g. "1269" = Fall 2026. */
  termCode: string
  season: Season
  /** "Fall 2026". */
  name: string
  /** "2A", "WT 3", "Off". */
  label: string
}

export interface Plan {
  version: 1
  sequence: SequenceId
  /** Term code of the 1A (Fall) term. */
  startTerm: string
  specs: SpecId[]
  /** Courses allowed per work term: 1 by default, 2 with written employer support. */
  wtLimit: 1 | 2
  /** Term id → course codes. "transfer" holds AP/IB/transfer credit. */
  placements: Record<string, CourseCode[]>
  /** Index of the last completed term; terms after it are planned. -1 = none. */
  completedThrough: number
  /** Non-math elective rule; unset = chosen from the 1A term (see `resolveBreadthRule`). */
  breadthRule?: BreadthRule
}

export const TRANSFER_TERM_ID = 'transfer'

/**
 * 'breadth-depth': Humanities / Social / Pure / Pure-or-Applied Science breadth plus depth
 * (2025/26 and earlier calendars). 'elective': Elective Requirement by faculty (2026/27).
 */
export type BreadthRule = 'breadth-depth' | 'elective'

export const BREADTH_RULES: Record<BreadthRule, { label: string; calendars: string }> = {
  'breadth-depth': { label: 'Breadth & Depth', calendars: '2025/26 and earlier' },
  elective: { label: 'Elective Requirement', calendars: '2026/27' },
}

/** First 1A term under the 2026/27 calendar (Fall 2026). */
const ELECTIVE_RULE_FROM = '1269'

/** Students default to the calendar in effect when they entered the Faculty of Mathematics. */
export function resolveBreadthRule(plan: Pick<Plan, 'breadthRule' | 'startTerm'>): BreadthRule {
  return plan.breadthRule ?? (plan.startTerm < ELECTIVE_RULE_FROM ? 'breadth-depth' : 'elective')
}
