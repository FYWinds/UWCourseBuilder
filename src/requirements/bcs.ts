/**
 * Bachelor of Computer Science (Honours), 2026/27 calendar.
 * Sources: Kuali programs r1y1WO5ka (degree) and SJPJkCAih (major);
 * CS checklist 2026-present-bcs-final1.pdf. Raw program pages: data/raw/kuali/programs (pnpm data:kuali).
 */
import type { CourseSet, Program } from '@/domain/requirements'
import { CALENDAR_BASE, CHECKLIST_BASE, oneOf, pick } from './helpers'

/**
 * Communication List 1. ENGL 119 is listed under List 2 in the 2026/27 calendar,
 * but the CS checklist moves it to List 1 starting 2026/27.
 */
export const COMM_LIST_1 = ['COMMST100', 'COMMST223', 'EMLS101', 'EMLS102', 'EMLS129', 'ENGL109', 'ENGL129', 'ENGL119']
export const COMM_LIST_2 = [
  'COMMST225', 'COMMST227', 'COMMST228', 'EMLS103', 'EMLS104', 'EMLS110', 'ENGL101B',
  'ENGL108B', 'ENGL108D', 'ENGL208B', 'ENGL209', 'ENGL210E', 'ENGL210F', 'ENGL378',
]

/** Subjects the calendar groups with Arts for the breadth (elective) requirement. */
export const BREADTH_EXTRA_SUBJECTS = ['BET', 'BUS', 'COMM', 'STV']

const notMathCrossListed = (set: CourseSet): CourseSet => ({
  minus: [set, { predicate: 'crossListedWithMath' }],
})

export const BREADTH_ARTS: CourseSet = notMathCrossListed({
  union: [{ faculty: ['ART'] }, { subject: BREADTH_EXTRA_SUBJECTS }],
})
export const BREADTH_SCIENCE: CourseSet = notMathCrossListed({ faculty: ['ENV', 'AHS', 'SCI'] })
export const BREADTH_ANY: CourseSet = { union: [BREADTH_ARTS, BREADTH_SCIENCE] }

/** Non-math courses: outside the Faculty of Mathematics, plus the breadth subjects. */
export const NON_MATH: CourseSet = notMathCrossListed({
  union: [{ faculty: ['ART', 'ENG', 'ENV', 'AHS', 'SCI', 'OTHER'] }, { subject: BREADTH_EXTRA_SUBJECTS }],
})

export const bcsCore: Program = {
  id: 'core',
  kind: 'core',
  name: 'Computer Science (Bachelor of Computer Science - Honours)',
  shortName: 'BCS',
  calendarUrl: `${CALENDAR_BASE}/SJPJkCAih`,
  checklistUrl: `${CHECKLIST_BASE}/2026-present-bcs-final1.pdf`,
  enrolmentCode: 'H-Computer Science (BCS)',
  sections: [
    {
      id: 'cs-required',
      label: 'Required CS courses',
      slots: [
        oneOf('cs1x5', ['CS115', 'CS135', 'CS145']),
        oneOf('cs1x6', ['CS136', 'CS146']),
        oneOf('cs136l', ['CS136L'], 0.25),
        oneOf('cs240', ['CS240', 'CS240E']),
        oneOf('cs241', ['CS241', 'CS241E']),
        oneOf('cs245', ['CS245', 'CS245E']),
        oneOf('cs246', ['CS246', 'CS246E']),
        oneOf('cs251', ['CS251', 'CS251E']),
        oneOf('cs341', ['CS341']),
        oneOf('cs350', ['CS350']),
      ],
    },
    {
      id: 'math-required',
      label: 'Required math courses',
      slots: [
        oneOf('math1x7', ['MATH127', 'MATH137', 'MATH147']),
        oneOf('math1x8', ['MATH128', 'MATH138', 'MATH148']),
        oneOf('math1x5', ['MATH135', 'MATH145']),
        oneOf('math1x6', ['MATH136', 'MATH146']),
        oneOf('math2x9', ['MATH239', 'MATH249']),
        oneOf('stat2x0', ['STAT230', 'STAT240']),
        oneOf('stat2x1', ['STAT231', 'STAT241']),
      ],
    },
    {
      id: 'cs-upper',
      label: 'Upper-year CS courses',
      slots: [
        pick('cs3or4', '3 courses from CS 340–398, 440–489', 3, {
          union: [
            { range: { subject: 'CS', from: 340, to: 398 } },
            { range: { subject: 'CS', from: 440, to: 489 } },
          ],
        }),
        pick('cs4', '2 courses from CS 440–489', 2, { range: { subject: 'CS', from: 440, to: 489 } }),
        pick(
          'cs4extra',
          '1 course from CS 440–498, CS 600/700-level, CO 487, CS 499T, STAT 440',
          1,
          {
            union: [
              { range: { subject: 'CS', from: 440, to: 498 } },
              { range: { subject: 'CS', from: 600, to: 799 } },
              { list: ['CO487', 'CS499T', 'STAT440'] },
            ],
          },
          { note: 'CS 600-level courses are not allowed when an equivalent 400-level course exists; CS 700-level courses need instructor and advisor permission.' },
        ),
      ],
    },
    {
      id: 'communication',
      label: 'Undergraduate Communication Requirement',
      slots: [
        pick('comm1', 'Communication List 1', 1, { list: COMM_LIST_1 }, {
          kind: 'required',
          note: 'Needs at least 60% and should be completed before 2A. ENGL 119 counts as List 1 from 2026/27 (CS checklist).',
        }),
        pick('comm2', 'Communication List 1 or List 2', 1, { list: [...COMM_LIST_1, ...COMM_LIST_2] }, {
          kind: 'required',
        }),
      ],
    },
    {
      id: 'breadth',
      label: 'Elective (breadth) requirement — 4.0 units',
      slots: [
        pick('breadthA', 'Arts, or BET / BUS / COMM / STV', 2, BREADTH_ARTS),
        pick('breadthB', 'Environment, Health, or Science', 2, BREADTH_SCIENCE),
        pick('breadthC', 'Any of the above', 4, BREADTH_ANY, {
          note: 'Courses used for the Communication Requirement and courses cross-listed with a math course do not count.',
        }),
      ],
    },
  ],
  levelFloors: [
    {
      id: 'breadth200',
      label: 'At least 1.0 unit of the breadth courses at the 200-level or higher',
      slots: ['breadthA', 'breadthB', 'breadthC'],
      units: 1,
      level: 200,
      absorbingSlot: 'breadthC',
    },
  ],
  totals: [
    { id: 'total', label: 'Total units (40+ unique courses)', units: 20 },
    { id: 'nonmath', label: 'Non-math units', units: 5, from: NON_MATH },
  ],
  notes: [
    'Minimum cumulative overall average 60% and CS major average 60% (not checked here).',
    'No more than 2.0 units of failed courses and 5.0 units of unusable attempts (not checked here).',
    'Seven (regular) or eight (co-op) terms with at least three courses totalling 1.5 units.',
  ],
}

export const coopProgram: Program = {
  id: 'coop',
  kind: 'coop',
  name: 'Co-operative education requirements',
  shortName: 'Co-op',
  calendarUrl: `${CALENDAR_BASE}/r1y1WO5ka`,
  checklistUrl: `${CHECKLIST_BASE}/2026-present-bcs-final1.pdf`,
  enrolmentCode: 'Co-operative',
  sections: [
    {
      id: 'pd',
      label: 'Professional Development (PD)',
      slots: [
        oneOf('pd1', ['PD1'], 0.5, 'Take in an academic term before the first work term.'),
        oneOf('pd11', ['PD11'], 0.5, 'Take during the first work term.'),
        oneOf('pd10', ['PD10'], 0.5, 'Should be taken during a work term.'),
        pick('pdOther', 'Two additional PD courses', 2, { subject: ['PD'] }),
      ],
    },
  ],
  notes: ['Minimum of five credited work terms, at least three of them standard work terms.'],
}
