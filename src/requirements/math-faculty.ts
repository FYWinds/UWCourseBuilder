/**
 * Requirement pieces shared by the Faculty of Mathematics degrees (BCS, BMath, BCFM),
 * 2026/27 calendar. Sources: Kuali degree-level programs r1y1WO5ka (BCS) and rJj6aXDk6
 * (BMath); "Course Subjects Offered" for faculty assignment of subject codes.
 */
import type { SequenceId } from '@/domain/plan'
import type { CourseSet, Program, Section, Slot } from '@/domain/requirements'
import type { CourseCode } from '@/domain/types'
import { CALENDAR_BASE, oneOf, pick } from './helpers'

/** Undergraduate Communication Requirement lists as printed in the 2026/27 calendar. */
export const COMM_LIST_1: CourseCode[] = ['COMMST100', 'COMMST223', 'EMLS101', 'EMLS102', 'EMLS129', 'ENGL109', 'ENGL129']
export const COMM_LIST_2: CourseCode[] = [
  'COMMST225', 'COMMST227', 'COMMST228', 'EMLS103', 'EMLS104', 'EMLS110', 'ENGL101B', 'ENGL108B',
  'ENGL108D', 'ENGL119', 'ENGL208B', 'ENGL209', 'ENGL210E', 'ENGL210F', 'ENGL378',
]

/** Subjects the calendar treats as non-math although some are taught in Mathematics. */
export const NON_MATH_SUBJECTS = ['BET', 'BUS', 'COMM', 'STV']

export const notMathCrossListed = (set: CourseSet): CourseSet => ({
  minus: [set, { predicate: 'crossListedWithMath' }],
})

/** Non-math courses: outside the Faculty of Mathematics, plus the subjects above. */
export const NON_MATH: CourseSet = notMathCrossListed({
  union: [{ faculty: ['ART', 'ENG', 'ENV', 'AHS', 'SCI', 'OTHER'] }, { subject: NON_MATH_SUBJECTS }],
})

/** Math courses: Faculty of Mathematics courses and courses cross-listed with them. */
export const MATH_COURSES: CourseSet = {
  minus: [{ union: [{ faculty: ['MAT'] }, { predicate: 'crossListedWithMath' }] }, { subject: NON_MATH_SUBJECTS }],
}

/** Requisite tokens every Honours Mathematics student satisfies. */
export const MATH_REQUISITE_TOKENS = ['Honours', 'Honours Mathematics', 'Faculty of Mathematics']

/** Co-op sequences open to most Mathematics plans (SEQ 1–4) plus the regular system. */
export const MATH_SEQUENCES: SequenceId[] = ['coop1', 'coop2', 'coop3', 'coop4', 'regular']

/** Mathematics co-op: PD 1 before the first work term, PD 11 during it, then further PD courses. */
export function mathCoop({
  degreePid,
  pd10,
  workTerms = 5,
  extra,
}: {
  degreePid: string
  /** PD 10 is one of the additional PD courses (CS majors). */
  pd10: boolean
  workTerms?: number
  /** Additional PD courses beyond PD 1, PD 11 (and PD 10). */
  extra: number
}): Program {
  return {
    id: 'coop',
    kind: 'coop',
    name: 'Co-operative education requirements',
    shortName: 'Co-op',
    calendarUrl: `${CALENDAR_BASE}/${degreePid}`,
    enrolmentCode: 'Co-operative',
    sections: [
      {
        id: 'pd',
        label: 'Professional Development (PD)',
        slots: [
          oneOf('pd1', ['PD1'], 0.5, 'Take in an academic term before the first work term.'),
          oneOf('pd11', ['PD11'], 0.5, 'Take during the first work term.'),
          ...(pd10 ? [oneOf('pd10', ['PD10'], 0.5, 'Should be taken during a work term.')] : []),
          pick('pdOther', `${extra === 2 ? 'Two' : 'Three'} additional PD courses`, extra, { subject: ['PD'] }),
        ],
      },
    ],
    notes: [`Minimum of ${workTerms === 4 ? 'four' : 'five'} credited work terms, at least three of them standard work terms.`],
  }
}

/** BMath List A: ten compulsory mathematics courses (Mathematical Studies and Math/CPA are exempt). */
export const LIST_A: Section = {
  id: 'list-a',
  label: 'List A (Bachelor of Mathematics)',
  slots: [
    oneOf('listA-cs1', ['CS115', 'CS135', 'CS145']),
    oneOf('listA-cs2', ['CS116', 'CS136', 'CS146']),
    oneOf('listA-la1', ['MATH106', 'MATH136', 'MATH146']),
    oneOf('listA-calc1', ['MATH127', 'MATH137', 'MATH147']),
    oneOf('listA-calc2', ['MATH128', 'MATH138', 'MATH148']),
    oneOf('listA-alg', ['MATH135', 'MATH145']),
    oneOf('listA-la2', ['MATH235', 'MATH245']),
    oneOf('listA-calc3', ['MATH237', 'MATH239', 'MATH247', 'MATH249']),
    oneOf('listA-prob', ['STAT230', 'STAT240']),
    oneOf('listA-stat', ['STAT231', 'STAT241']),
  ],
}

const codesOf = (slot: Slot): Set<string> | null =>
  slot.kind === 'required' && 'list' in slot.from ? new Set(slot.from.list) : null

/** Every course of `inner` also satisfies `outer`: taking one course meets both requirements. */
function implies(inner: Slot, outer: Slot): boolean {
  const a = codesOf(inner)
  const b = codesOf(outer)
  return !!a && !!b && inner.units === outer.units && [...a].every((c) => b.has(c))
}

/**
 * List A followed by the major's sections, for one allocation group. A major requirement
 * and a List A requirement met by the same course must not demand two courses: when a
 * major slot is at least as specific as a List A slot (MATH 237/247 vs. MATH 237/239/247/249)
 * the List A slot is dropped — also when every option of a major choice has such a slot;
 * when the List A slot is the more specific one, the major slot is dropped.
 */
export function withListA(sections: Section[]): Section[] {
  const majorSlots = sections.flatMap((s) => s.slots)
  const choices = sections.flatMap((s) => s.choices ?? [])
  const covered = (a: Slot) =>
    majorSlots.some((m) => implies(m, a)) || choices.some((c) => c.options.every((o) => o.slots.some((m) => implies(m, a))))
  const listA = LIST_A.slots.filter((a) => !covered(a))
  const major = sections
    .map((s) => ({ ...s, slots: s.slots.filter((m) => !listA.some((a) => implies(a, m))) }))
    .filter((s) => s.slots.length > 0 || s.choices?.length)
  return [{ ...LIST_A, slots: listA }, ...major]
}

export type BMathCommunication = 'standard' | 'stat' | 'cpa'

/**
 * BMath Undergraduate Communication Requirement as its own allocation group: a
 * communication course may also fill a major requirement (e.g. ENGL 378 for Statistics).
 */
export function bmathCommunication(kind: BMathCommunication): Program {
  const second: Record<BMathCommunication, Slot> = {
    standard: pick('comm2', 'Communication List 1 or List 2', 1, { list: [...COMM_LIST_1, ...COMM_LIST_2] }, { kind: 'required' }),
    stat: oneOf('comm2', ['ENGL378']),
    cpa: oneOf('comm2', ['AFM111']),
  }
  const first =
    kind === 'cpa'
      ? oneOf('comm1', ['COMMST111'])
      : pick('comm1', 'Communication List 1', 1, { list: COMM_LIST_1 }, {
          kind: 'required',
          note: 'Needs at least 60% and should be completed before 2A.',
        })
  return {
    id: 'communication',
    kind: 'degree',
    name: 'Undergraduate Communication Requirement',
    shortName: 'Communication',
    calendarUrl: `${CALENDAR_BASE}/rJj6aXDk6`,
    sections: [{ id: 'communication', label: 'Communication courses', slots: [first, second[kind]] }],
  }
}
