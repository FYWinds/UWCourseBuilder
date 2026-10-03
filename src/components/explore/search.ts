import type { BreadthRule } from '@/domain/plan'
import type { Course, CourseCode, Faculty, Season } from '@/domain/types'
import { type AuditResult, type CatalogIndex, type ClassifyResult, type CourseStatus, STATUS_ORDER, expandSet } from '@/engine'
import { FACULTY_LABEL, SEASONS } from '@/components/course/labels'

/** Explore filters, persisted in the URL. */
export interface ExploreSearch {
  q?: string
  status?: CourseStatus[]
  subject?: string
  /** 100, 200, 300, or 400 (= 400 and above). */
  level?: number
  faculty?: Faculty
  season?: Season
  /** "programId:slotId". */
  slot?: string
  /** Column id, prefixed with "-" for descending. Absent = status order. */
  sort?: string
}

export const FILTER_KEYS = ['q', 'status', 'subject', 'level', 'faculty', 'season', 'slot'] as const
/** Patch that removes every filter (sort is kept). */
export const CLEARED_FILTERS: Partial<ExploreSearch> = {
  q: undefined,
  status: undefined,
  subject: undefined,
  level: undefined,
  faculty: undefined,
  season: undefined,
  slot: undefined,
}

export const LEVELS = [100, 200, 300, 400]
export const SORT_IDS = ['status', 'code', 'title', 'units', 'faculty']

const text = (v: unknown) => (typeof v === 'string' ? v.trim() : typeof v === 'number' ? String(v) : '')

export function validateExploreSearch(raw: Record<string, unknown>): ExploreSearch {
  const out: ExploreSearch = {}
  const q = text(raw.q)
  if (q) out.q = q
  const statusList = Array.isArray(raw.status) ? raw.status : text(raw.status).split(',')
  const status = STATUS_ORDER.filter((s) => statusList.includes(s))
  if (status.length) out.status = status
  const subject = text(raw.subject).toUpperCase()
  if (subject) out.subject = subject
  const level = Number(raw.level)
  if (LEVELS.includes(level)) out.level = level
  const faculty = text(raw.faculty)
  if (faculty in FACULTY_LABEL) out.faculty = faculty as Faculty
  const season = SEASONS.find((s) => s === raw.season)
  if (season) out.season = season
  const slot = text(raw.slot)
  if (slot.includes(':')) out.slot = slot
  const sort = text(raw.sort)
  if (SORT_IDS.includes(sort.replace(/^-/, ''))) out.sort = sort
  return out
}

type Preset = { id: string; label: string; search: Partial<ExploreSearch> }

const COMMON_PRESETS: Preset[] = [
  { id: 'must', label: 'Must & required', search: { status: ['must', 'required'] } },
  { id: 'counts', label: 'Counts toward a requirement', search: { status: ['must', 'required', 'counts'] } },
]

const BREADTH_PRESETS: Record<BreadthRule, Preset[]> = {
  elective: [
    { id: 'breadthA', label: 'Breadth: Arts', search: { slot: 'core:breadthA' } },
    { id: 'breadthB', label: 'Breadth: Env/Health/Science', search: { slot: 'core:breadthB' } },
  ],
  'breadth-depth': [
    { id: 'humanities', label: 'Breadth: Humanities', search: { slot: 'breadth:humanities' } },
    { id: 'social', label: 'Breadth: Social Sciences', search: { slot: 'breadth:socialSciences' } },
    { id: 'depth', label: 'Depth', search: { slot: 'breadth:depth' } },
  ],
}

export function presetsFor(rule: BreadthRule): Preset[] {
  return [...COMMON_PRESETS, ...BREADTH_PRESETS[rule]]
}

/** Whether the current filters are exactly the preset's (search text aside). */
export function presetActive(search: ExploreSearch, preset: Partial<ExploreSearch>): boolean {
  return FILTER_KEYS.every((key) => key === 'q' || String(search[key] ?? '') === String(preset[key] ?? ''))
}

export interface CourseRow {
  course: Course
  status: CourseStatus
  /** Index in STATUS_ORDER. */
  rank: number
  /** Unmet slots this course can fill, "Program · Slot". */
  fills: string[]
  /** Slots a placed course is allocated to, "Program · Slot". */
  allocated: string[]
}

export function buildRows(idx: CatalogIndex, audit: AuditResult, classification: ClassifyResult): CourseRow[] {
  const allocated = new Map<CourseCode, string[]>()
  for (const pa of audit.programs) {
    const labels = new Map(pa.allocation.slots.map((s) => [s.slot.id, s.slot.label]))
    for (const [code, slotId] of pa.allocation.assignment) {
      const list = allocated.get(code) ?? []
      list.push(`${pa.program.shortName} · ${labels.get(slotId) ?? slotId}`)
      allocated.set(code, list)
    }
  }
  return idx.courses.map((course) => {
    const cl = classification.byCode.get(course.code)
    const status = cl?.status ?? 'free'
    return {
      course,
      status,
      rank: STATUS_ORDER.indexOf(status),
      fills: cl?.slots.map((s) => `${s.programName} · ${s.slotLabel}`) ?? [],
      allocated: allocated.get(course.code) ?? [],
    }
  })
}

/**
 * Membership test for a "programId:slotId" filter: every course eligible for the
 * slot (taken ones included), or — for level floors, which are not slots — every
 * course the classifier says can fill it.
 */
export function slotMatcher(
  slot: string,
  idx: CatalogIndex,
  audit: AuditResult,
  classification: ClassifyResult,
): (code: CourseCode) => boolean {
  const [programId, slotId] = slot.split(':')
  const found = audit.programs
    .find((p) => p.program.id === programId)
    ?.allocation.slots.find((s) => s.slot.id === slotId)
  if (found) {
    const set = expandSet(found.slot.from, idx)
    return (code) => set.has(code)
  }
  return (code) =>
    classification.byCode.get(code)?.slots.some((r) => r.programId === programId && r.slotId === slotId) ?? false
}

/** Human label for a slot filter value, or null when the program is not active. */
export function slotLabel(slot: string, audit: AuditResult): string | null {
  const [programId, slotId] = slot.split(':')
  const pa = audit.programs.find((p) => p.program.id === programId)
  if (!pa) return null
  const label =
    pa.allocation.slots.find((s) => s.slot.id === slotId)?.slot.label ??
    pa.allocation.floors.find((f) => f.floor.id === slotId)?.floor.label ??
    (pa.allocation.depth?.rule.id === slotId ? 'Depth' : undefined)
  return label ? `${pa.program.shortName} · ${label}` : null
}

export function filterRows(
  rows: CourseRow[],
  search: ExploreSearch,
  inSlot: ((code: CourseCode) => boolean) | null,
): CourseRow[] {
  const codeQuery = search.q?.toUpperCase().replace(/\s+/g, '')
  const titleQuery = search.q?.toLowerCase()
  const statuses = search.status ? new Set(search.status) : null
  return rows.filter(({ course: c, status }) => {
    if (statuses && !statuses.has(status)) return false
    if (search.subject && c.subject !== search.subject) return false
    if (search.level && (search.level === 400 ? c.level < 400 : c.level !== search.level)) return false
    if (search.faculty && c.faculty !== search.faculty) return false
    if (search.season && !c.offered.includes(search.season)) return false
    if (inSlot && !inSlot(c.code)) return false
    if (codeQuery && titleQuery && !c.code.includes(codeQuery) && !c.title.toLowerCase().includes(titleQuery)) return false
    return true
  })
}
