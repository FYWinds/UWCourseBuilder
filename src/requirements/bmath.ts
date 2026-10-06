/**
 * Bachelor of Mathematics (Honours) majors, 2026/27 calendar. Degree-level rules from
 * Kuali rJj6aXDk6: 20.0 units, List A, the Undergraduate Communication Requirement,
 * 7 (regular) / 8 (co-op) full-time terms, Mathematics co-op. Each major page adds
 * its course requirements and a minimum of math units, plus 5.0 non-math units.
 */
import type { SequenceId } from '@/domain/plan'
import type { DepthRule, LevelFloor, Major, Program, Section, SpecId } from '@/domain/requirements'
import { CALENDAR_BASE } from './helpers'
import type { BMathCommunication } from './math-faculty'
import {
  COMM_LIST_1,
  MATH_COURSES,
  MATH_REQUISITE_TOKENS,
  MATH_SEQUENCES,
  NON_MATH,
  bmathCommunication,
  mathCoop,
  withListA,
} from './math-faculty'

export interface BMathMajorSpec {
  id: string
  /** Kuali program pid. */
  pid: string
  name: string
  shortName: string
  enrolmentCode: string
  /** "Complete a minimum of X units of math courses." */
  mathUnits: number
  sections: Section[]
  levelFloors?: LevelFloor[]
  /** Total units when not 20.0 (Math/CPA: 20.5). */
  totalUnits?: number
  /** List A applies unless exempt (Mathematical Studies, Math/CPA). */
  listA?: boolean
  communication?: BMathCommunication
  /** Sequences offered; defaults to SEQ 1–4 and regular. */
  sequences?: SequenceId[]
  /** PD 10 is one of the additional PD courses (Computer Science). */
  pd10?: boolean
  /** Minimum credited work terms (4 for Math/CPA and Math/Teaching). */
  workTerms?: number
  /** CS specializations open to this major (Computer Science). */
  specs?: SpecId[]
  /** Further unit minimums that may reuse courses from other requirements (e.g. upper-year math units). */
  extraTotals?: NonNullable<Program['totals']>
  /** One-subject rule such as a subject concentration; may reuse courses from other requirements. */
  depth?: DepthRule
  notes?: string[]
}

export function bmathMajor(spec: BMathMajorSpec): Major {
  const listA = spec.listA ?? true
  const communication = spec.communication ?? 'standard'
  const core: Program = {
    id: 'core',
    kind: 'core',
    name: spec.name,
    shortName: spec.shortName,
    calendarUrl: `${CALENDAR_BASE}/${spec.pid}`,
    enrolmentCode: spec.enrolmentCode,
    sections: listA ? withListA(spec.sections) : spec.sections,
    ...(spec.levelFloors && { levelFloors: spec.levelFloors }),
    ...(spec.depth && { depth: spec.depth }),
    totals: [
      { id: 'total', label: 'Total units', units: spec.totalUnits ?? 20 },
      { id: 'math', label: 'Math units', units: spec.mathUnits, from: MATH_COURSES },
      { id: 'nonmath', label: 'Non-math units', units: 5, from: NON_MATH },
      ...(spec.extraTotals ?? []),
    ],
    notes: [
      ...(spec.notes ?? []),
      'Minimum cumulative overall and major averages are not checked here.',
    ],
  }
  const programs = [core, bmathCommunication(communication)]
  return {
    id: spec.id,
    name: spec.name,
    shortName: spec.shortName,
    degree: 'bmath',
    pid: spec.pid,
    enrolmentCode: spec.enrolmentCode,
    requisiteTokens: MATH_REQUISITE_TOKENS,
    sequences: spec.sequences ?? MATH_SEQUENCES,
    fullTimeTerms: { coop: 8, regular: 7 },
    specs: spec.specs ?? [],
    breadthRuleChoice: false,
    programs: () => programs,
    list1: () => (communication === 'cpa' ? [] : COMM_LIST_1),
    coop: mathCoop({
      degreePid: 'rJj6aXDk6',
      pd10: spec.pd10 ?? false,
      extra: spec.pd10 ? 2 : 3,
      workTerms: spec.workTerms ?? 5,
    }),
  }
}
