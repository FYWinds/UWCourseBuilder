import type { CourseSet } from '@/domain/requirements'
import type { Catalog, Course, CourseCode } from '@/domain/types'

/** Subjects whose courses never count toward degree units (co-op, PD, work reports). */
const NON_ACADEMIC_SUBJECTS = new Set(['PD', 'COOP', 'WKRPT'])

export interface CatalogIndex {
  meta: Catalog['meta']
  courses: Course[]
  byCode: Map<CourseCode, Course>
  /** Courses cross-listed with a Faculty of Mathematics course. */
  crossListedWithMath: Set<CourseCode>
  /** Reverse prerequisite edges: course → courses that mention it in prereq/coreq. */
  unlocks: Map<CourseCode, CourseCode[]>
  setCache: WeakMap<CourseSet, Set<CourseCode>>
}

export function numericPart(number: string): number {
  return Number(number.match(/^\d+/)?.[0] ?? Number.NaN)
}

export function countsTowardDegree(course: Course): boolean {
  return !NON_ACADEMIC_SUBJECTS.has(course.subject) && course.units > 0
}

/** "CS341" → "CS 341". */
export function formatCode(code: CourseCode): string {
  return code.replace(/^([A-Z]+)(\d)/, '$1 $2')
}

export function buildIndex(catalog: Catalog): CatalogIndex {
  const byCode = new Map(catalog.courses.map((c) => [c.code, c]))
  const crossListedWithMath = new Set<CourseCode>()
  for (const c of catalog.courses) {
    if (c.crossListed.some((x) => byCode.get(x)?.faculty === 'MAT') && c.faculty !== 'MAT') {
      crossListedWithMath.add(c.code)
    }
  }
  const unlocks = new Map<CourseCode, CourseCode[]>()
  for (const c of catalog.courses) {
    const seen = new Set<CourseCode>()
    collectCourses(c.prereq, seen)
    collectCourses(c.coreq, seen)
    for (const code of seen) {
      const list = unlocks.get(code) ?? []
      list.push(c.code)
      unlocks.set(code, list)
    }
  }
  return {
    meta: catalog.meta,
    courses: catalog.courses,
    byCode,
    crossListedWithMath,
    unlocks,
    setCache: new WeakMap(),
  }
}

export function collectCourses(req: Course['prereq'], out: Set<CourseCode>): Set<CourseCode> {
  if (!req) return out
  if (req.kind === 'course') out.add(req.code)
  else if (req.kind === 'all' || req.kind === 'atLeast') req.of.forEach((r) => collectCourses(r, out))
  return out
}

function matches(set: CourseSet, c: Course, idx: CatalogIndex): boolean {
  if ('list' in set) return set.list.includes(c.code)
  if ('range' in set) {
    const n = numericPart(c.number)
    return c.subject === set.range.subject && n >= set.range.from && n <= set.range.to
  }
  if ('faculty' in set) return set.faculty.includes(c.faculty)
  if ('subject' in set) return set.subject.includes(c.subject)
  if ('union' in set) return set.union.some((s) => matches(s, c, idx))
  if ('intersect' in set) return set.intersect.every((s) => matches(s, c, idx))
  if ('minus' in set) return matches(set.minus[0], c, idx) && !matches(set.minus[1], c, idx)
  return idx.crossListedWithMath.has(c.code)
}

/** Materialize a CourseSet against the catalog (memoized per set object). */
export function expandSet(set: CourseSet, idx: CatalogIndex): Set<CourseCode> {
  let result = idx.setCache.get(set)
  if (!result) {
    result = new Set(
      'list' in set
        ? set.list.filter((code) => idx.byCode.has(code))
        : idx.courses.filter((c) => countsTowardDegree(c) || c.subject === 'PD').filter((c) => matches(set, c, idx)).map((c) => c.code),
    )
    idx.setCache.set(set, result)
  }
  return result
}
