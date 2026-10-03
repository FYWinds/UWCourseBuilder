import type { CourseSet, Slot } from '@/domain/requirements'
import type { CourseCode } from '@/domain/types'

export const CALENDAR_BASE =
  'https://uwaterloo.ca/academic-calendar/undergraduate-studies/catalog#/programs/view'
export const CHECKLIST_BASE = 'https://uwaterloo.ca/computer-science/sites/default/files/uploads/documents'

/** Mandatory requirement satisfied by any one of interchangeable variants. */
export function oneOf(id: string, codes: CourseCode[], units = 0.5, note?: string): Slot {
  return {
    id,
    label: codes.length === 1 ? codes[0] : `One of ${codes.join(' / ')}`,
    units,
    from: { list: codes },
    kind: 'required',
    ...(note && { note }),
  }
}

/** Choose `count` regular (0.5-unit) courses from a pool. */
export function pick(
  id: string,
  label: string,
  count: number,
  from: CourseSet,
  extra: Partial<Slot> = {},
): Slot {
  return { id, label, units: count * 0.5, from, kind: 'elective', ...extra }
}
