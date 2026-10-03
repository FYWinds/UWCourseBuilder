/** Normalized course code without spaces, e.g. "CS341", "BIOL130L", "CS240E". */
export type CourseCode = string

/** Faculty that owns a course; drives breadth (elective) and math/non-math rules. */
export type Faculty = 'MAT' | 'ENG' | 'ART' | 'ENV' | 'AHS' | 'SCI' | 'OTHER'

export type Season = 'F' | 'W' | 'S'

export const TERM_LEVELS = ['1A', '1B', '2A', '2B', '3A', '3B', '4A', '4B'] as const
export type TermLevel = (typeof TERM_LEVELS)[number]

export type Requisite =
  | { kind: 'all'; of: Requisite[] }
  | { kind: 'atLeast'; n: number; of: Requisite[] }
  | { kind: 'course'; code: CourseCode; minGrade?: number; concurrentOk?: boolean }
  | { kind: 'level'; min: TermLevel; exact?: boolean }
  | { kind: 'program'; mode: 'in' | 'notIn'; programs: string[] }
  | { kind: 'average'; min: number }
  | { kind: 'units'; min: number; subject: string; minLevel?: number; maxLevel?: number }
  | { kind: 'text'; raw: string }

export interface Course {
  code: CourseCode
  subject: string
  /** Catalog number including suffix, e.g. "240E". */
  number: string
  title: string
  units: number
  /** 100, 200, … derived from the catalog number. */
  level: number
  faculty: Faculty
  description: string
  prereq?: Requisite
  coreq?: Requisite
  antireq: CourseCode[]
  /** Free-text antirequisite clauses that could not be structured. */
  antireqText?: string[]
  crossListed: CourseCode[]
  /** Seasons this course was scheduled in over the sampled terms. */
  offered: Season[]
  /** Sampled term codes in which the course was scheduled. */
  offeredTerms: string[]
  /** Had an online (ONLN) lecture section in a recently scanned term. */
  online: boolean
  notes?: string
}

export interface CatalogMeta {
  calendar: string
  catalogId: string
  fetchedAt: string
  offeringTerms: string[]
  onlineScanTerms: string[]
  courseCount: number
}

export interface Catalog {
  meta: CatalogMeta
  courses: Course[]
}
