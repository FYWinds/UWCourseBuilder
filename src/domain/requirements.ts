import type { BreadthRule, SequenceId } from './plan'
import type { CourseCode, Faculty } from './types'

/** Declarative description of a set of courses. */
export type CourseSet =
  | { list: CourseCode[] }
  /** Catalog-number range on the numeric part, inclusive: CS 340–398 includes CS 341E. */
  | { range: { subject: string; from: number; to: number } }
  | { faculty: Faculty[] }
  | { subject: string[] }
  | { union: CourseSet[] }
  | { intersect: CourseSet[] }
  | { minus: [CourseSet, CourseSet] }
  /** Courses cross-listed with a Faculty of Mathematics course (catalog-derived). */
  | { predicate: 'crossListedWithMath' }

/**
 * One allocatable slot. Every slot is measured in units (0.5 = one regular course);
 * a course fills at most one slot within the same program (allocation group).
 */
export interface Slot {
  id: string
  label: string
  units: number
  from: CourseSet
  /**
   * 'required': the listed courses are interchangeable variants of one requirement
   * (e.g. CS 240 / CS 240E) — taking one of them is mandatory.
   * 'elective': choose from a pool.
   */
  kind: 'required' | 'elective'
  /** "No more than `max` courses from `set`" within this slot. */
  maxFrom?: { set: CourseSet; max: number; label: string }[]
  /** Explanatory note shown in the audit (calendar nuance, overrides). */
  note?: string
}

/** Constraint across several slots that the flow model cannot express directly. */
export interface LevelFloor {
  id: string
  label: string
  /** Slots whose allocated courses are inspected. */
  slots: string[]
  /** Minimum units at or above `level` among allocated courses. */
  units: number
  level: number
  /** Slot that accepts every course of the other slots; used to swap in higher-level courses. */
  absorbingSlot: string
}

export interface Section {
  id: string
  label: string
  slots: Slot[]
}

/** core: the major (one allocation group); degree: degree-level group such as communication. */
export type ProgramKind = 'core' | 'degree' | 'breadth' | 'coop' | 'spec'

/**
 * "Depth" / "subject concentration": `units` in one subject from `from`, where either at
 * least 0.5 unit is at `upperLevel` or above, or `chainLength` courses form a prerequisite
 * chain (when set). Not a slot: it may reuse courses that already fill other requirements.
 */
export interface DepthRule {
  id: string
  /** Short name for hints and pickers ("Depth", "Subject concentration"). */
  name: string
  label: string
  from: CourseSet
  units: number
  upperLevel: number
  chainLength: number | null
}

export type SpecId = 'ai' | 'bio' | 'bus' | 'cfa' | 'dhw' | 'gd' | 'hci' | 'se'

/**
 * A program is one allocation group: within it a course fills at most one slot.
 * Different programs (core vs. each specialization) may share courses.
 */
export interface Program {
  id: string
  kind: ProgramKind
  name: string
  shortName: string
  calendarUrl: string
  /** Official checklist PDF, when the department publishes one. */
  checklistUrl?: string
  /** Program/specialization code as it appears in requisite "Enrolled in …" rules. */
  enrolmentCode?: string
  sections: Section[]
  levelFloors?: LevelFloor[]
  depth?: DepthRule
  /** Unit totals over all countable courses (optionally filtered), e.g. 20.0 units. */
  totals?: { id: string; label: string; units: number; from?: CourseSet }[]
  /** Changes this specialization makes to core slots (e.g. DHW: ECE 222 replaces CS 251). */
  coreOverrides?: { slot: string; add: CourseCode[]; note: string }[]
  notes?: string[]
}

export type DegreeId = 'bcs' | 'bmath' | 'bcfm'

export const DEGREE_LABEL: Record<DegreeId, string> = {
  bcs: 'Bachelor of Computer Science',
  bmath: 'Bachelor of Mathematics',
  bcfm: 'Bachelor of Computing and Financial Management',
}

/** An academic major (Honours plan) and the degree-level rules that come with it. */
export interface Major {
  /** Registry key stored in plans. */
  id: string
  /** Calendar title, e.g. "Statistics (Bachelor of Mathematics - Honours)". */
  name: string
  shortName: string
  degree: DegreeId
  /** Kuali program pid (calendar page, drift validation). */
  pid: string
  /** Program code used by "Enrolled in …" requisites, e.g. "H-Statistics". */
  enrolmentCode: string
  /** Further requisite tokens implied by the major ("Honours", "Faculty of Mathematics", …). */
  requisiteTokens: string[]
  /** Study/work sequences offered; the first is the default. */
  sequences: SequenceId[]
  /** Full-time study terms required, by system of study. */
  fullTimeTerms: { coop: number; regular: number }
  /** CS specializations that may be added to this major. */
  specs: SpecId[]
  /** Whether the 2025/26 Breadth & Depth rule can replace the Elective Requirement. */
  breadthRuleChoice: boolean
  /** Allocation groups other than co-op and specializations, core first. */
  programs: (rule: BreadthRule) => Program[]
  /** Communication List 1 courses (the first must be completed before 2A); empty when not applicable. */
  list1: (rule: BreadthRule) => CourseCode[]
  coop: Program
}
