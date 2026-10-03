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

export type ProgramKind = 'core' | 'breadth' | 'coop' | 'spec'

/**
 * "Depth": `units` in one subject from `from`, where either at least 0.5 unit is at
 * `upperLevel` or above, or `chainLength` courses form a prerequisite chain.
 * Not a slot: depth may reuse courses that already fill other requirements.
 */
export interface DepthRule {
  id: string
  label: string
  from: CourseSet
  units: number
  upperLevel: number
  chainLength: number
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
  checklistUrl: string
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
