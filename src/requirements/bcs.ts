/**
 * Bachelor of Computer Science (Honours). Course requirements follow the 2026/27
 * calendar; the non-math elective rule can be the 2026/27 Elective Requirement or the
 * Breadth & Depth requirement of the 2025/26 and earlier calendars.
 * Sources: Kuali programs r1y1WO5ka (degree) and SJPJkCAih (major); CS checklists
 * 2026-present-bcs-final1.pdf and 2025-2026-bcs.pdf; CS "Breadth and depth requirements"
 * page (subject lists current as of August 2025). Raw program pages:
 * data/raw/kuali/programs (pnpm data:kuali).
 */
import type { BreadthRule } from '@/domain/plan'
import type { CourseSet, LevelFloor, Major, Program, Section } from '@/domain/requirements'
import type { CourseCode } from '@/domain/types'
import { CALENDAR_BASE, CHECKLIST_BASE, oneOf, pick } from './helpers'
import {
  COMM_LIST_1,
  COMM_LIST_2,
  MATH_COURSES,
  MATH_REQUISITE_TOKENS,
  MATH_SEQUENCES,
  NON_MATH,
  NON_MATH_SUBJECTS,
  mathCoop,
  notMathCrossListed,
} from './math-faculty'
import { SPEC_IDS } from './specs'

/**
 * Communication lists. ENGL 119 is a List 2 course in the calendar; the CS checklist
 * moves it to List 1 from 2026/27 (the calendar catches up in 2027/28).
 */
export function commLists(rule: BreadthRule): { list1: CourseCode[]; list2: CourseCode[] } {
  return rule === 'elective'
    ? { list1: [...COMM_LIST_1, 'ENGL119'], list2: COMM_LIST_2.filter((c) => c !== 'ENGL119') }
    : { list1: COMM_LIST_1, list2: COMM_LIST_2 }
}

export function communicationSection(rule: BreadthRule): Section {
  const { list1, list2 } = commLists(rule)
  return {
    id: 'communication',
    label: 'Undergraduate Communication Requirement',
    slots: [
      pick('comm1', 'Communication List 1', 1, { list: list1 }, {
        kind: 'required',
        note:
          rule === 'elective'
            ? 'Needs at least 60% and should be completed before 2A. ENGL 119 counts as List 1 from 2026/27 (CS checklist).'
            : 'Needs at least 60% and should be completed before 2A.',
      }),
      pick('comm2', 'Communication List 1 or List 2', 1, { list: [...list1, ...list2] }, { kind: 'required' }),
    ],
  }
}

export const BREADTH_ARTS: CourseSet = notMathCrossListed({
  union: [{ faculty: ['ART'] }, { subject: NON_MATH_SUBJECTS }],
})
export const BREADTH_SCIENCE: CourseSet = notMathCrossListed({ faculty: ['ENV', 'AHS', 'SCI'] })
export const BREADTH_ANY: CourseSet = { union: [BREADTH_ARTS, BREADTH_SCIENCE] }

/** BCS Elective Requirement (2026/27): 4.0 units by faculty, 1.0 unit of them at the 200-level or higher. */
export const ELECTIVE_SECTION: Section = {
  id: 'breadth',
  label: 'Elective (breadth) requirement — 4.0 units',
  slots: [
    pick('breadthA', 'Arts, or BET / BUS / COMM / STV', 2, BREADTH_ARTS),
    pick('breadthB', 'Environment, Health, or Science', 2, BREADTH_SCIENCE),
    pick('breadthC', 'Any of the above', 4, BREADTH_ANY, {
      note: 'Courses used for the Communication Requirement and courses cross-listed with a math course do not count.',
    }),
  ],
}

export const ELECTIVE_FLOOR: LevelFloor = {
  id: 'breadth200',
  label: 'At least 1.0 unit of the breadth courses at the 200-level or higher',
  slots: ['breadthA', 'breadthB', 'breadthC'],
  units: 1,
  level: 200,
  absorbingSlot: 'breadthC',
}

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
    communicationSection('elective'),
    ELECTIVE_SECTION,
  ],
  levelFloors: [ELECTIVE_FLOOR],
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

/** Breadth & Depth subject lists (CS breadth and depth page, current as of August 2025). */
const HUMANITIES = [
  'CHINA', 'CLAS', 'CMW', 'COMMST', 'CROAT', 'DAC', 'DUTCH', 'EASIA', 'ENGL', 'FINE', 'FR', 'GER', 'GRK',
  'HIST', 'HUMSC', 'ITAL', 'ITALST', 'JAPAN', 'JS', 'KOREA', 'LAT', 'MEDVL', 'MUSIC', 'PHIL', 'PORT', 'RCS',
  'REES', 'RUSS', 'SI', 'SPAN', 'THPERF', 'VCULT',
]
const SOCIAL_SCIENCES = [
  'AFM', 'ANTH', 'APPLS', 'ARBUS', 'BET', 'BUS', 'COMM', 'ECON', 'ENBUS', 'GEOG', 'GSJ', 'HRM', 'INDEV',
  'INDG', 'INTST', 'LS', 'MSE', 'PACS', 'PSCI', 'PSYCH', 'REC', 'SDS', 'SRF', 'SOC', 'SOCWK', 'STV',
]
const PURE_SCIENCES = ['BIOL', 'CHEM', 'EARTH', 'PHYS', 'SCI']
const PURE_APPLIED_SCIENCES = [...PURE_SCIENCES, 'ENVS', 'ERS', 'HEALTH', 'KIN', 'MNS', 'PLAN']

/** Course requirements under the 2025/26-and-earlier rule: no Elective Requirement section. */
export const bcsCoreBreadthDepth: Program = {
  ...bcsCore,
  checklistUrl: `${CHECKLIST_BASE}/2025-2026-bcs.pdf`,
  sections: bcsCore.sections
    .filter((s) => s.id !== 'breadth')
    .map((s) => (s.id === 'communication' ? communicationSection('breadth-depth') : s)),
  levelFloors: [],
}

/**
 * Breadth & Depth as its own allocation group: a List 2 COMMST/ENGL course may count
 * for both the Communication Requirement and Humanities, while List 1 courses never
 * count as Humanities — so sharing with the core group is exactly the calendar rule.
 */
export const breadthDepthProgram: Program = {
  id: 'breadth',
  kind: 'breadth',
  name: 'Breadth and Depth requirement (2025/26 and earlier calendars)',
  shortName: 'Breadth & depth',
  calendarUrl: 'https://uwaterloo.ca/computer-science/current-undergraduate-students/majors/breadth-and-depth-requirements',
  checklistUrl: `${CHECKLIST_BASE}/2025-2026-bcs.pdf`,
  sections: [
    {
      id: 'breadth',
      label: 'Breadth — 3.0 units',
      slots: [
        pick('humanities', 'Humanities', 2, notMathCrossListed({ minus: [{ subject: HUMANITIES }, { list: COMM_LIST_1 }] }), {
          note: 'Communication List 1 courses do not count; COMMST/ENGL courses only on List 2 may count here and for communication.',
        }),
        pick('socialSciences', 'Social Sciences', 2, notMathCrossListed({ subject: SOCIAL_SCIENCES })),
        pick('pureSciences', 'Pure Sciences', 1, notMathCrossListed({ subject: PURE_SCIENCES })),
        pick('pureAppliedSciences', 'Pure or Applied Sciences', 1, notMathCrossListed({ subject: PURE_APPLIED_SCIENCES })),
      ],
    },
  ],
  depth: {
    id: 'depth',
    name: 'Depth',
    label: 'Depth: 1.5 units in one subject, with 0.5 unit at the 300-level or a prerequisite chain of three',
    from: NON_MATH,
    units: 1.5,
    upperLevel: 300,
    chainLength: 3,
  },
  notes: [
    'No course can satisfy more than one breadth category; breadth courses may also be used for depth.',
    'Courses with substantial math or computer science content do not count, whatever their subject — check with a CS advisor.',
  ],
}

/** Core programs for a non-math elective rule. */
export function corePrograms(rule: BreadthRule): Program[] {
  return rule === 'elective' ? [bcsCore] : [bcsCoreBreadthDepth, breadthDepthProgram]
}

const BCS_COOP = mathCoop({ degreePid: 'r1y1WO5ka', pd10: true, extra: 2 })

/** Fields every BCS major shares (degree-level requirements in r1y1WO5ka). */
const BCS_DEGREE = {
  degree: 'bcs',
  requisiteTokens: MATH_REQUISITE_TOKENS,
  sequences: MATH_SEQUENCES,
  fullTimeTerms: { coop: 8, regular: 7 },
  coop: BCS_COOP,
} satisfies Partial<Major>

export const bcsMajor: Major = {
  ...BCS_DEGREE,
  id: 'bcs',
  name: bcsCore.name,
  shortName: 'BCS',
  pid: 'SJPJkCAih',
  enrolmentCode: 'H-Computer Science (BCS)',
  specs: SPEC_IDS,
  breadthRuleChoice: true,
  programs: corePrograms,
  list1: (rule) => commLists(rule).list1,
}

/**
 * Another BCS major (Data Science): its own course requirements plus the BCS
 * communication and Elective Requirements, 20.0 units, and its math-unit minimum.
 */
export function bcsDegreeMajor(spec: {
  id: string
  pid: string
  name: string
  shortName: string
  enrolmentCode: string
  mathUnits: number
  sections: Section[]
  notes?: string[]
}): Major {
  const core: Program = {
    id: 'core',
    kind: 'core',
    name: spec.name,
    shortName: spec.shortName,
    calendarUrl: `${CALENDAR_BASE}/${spec.pid}`,
    enrolmentCode: spec.enrolmentCode,
    sections: [...spec.sections, communicationSection('elective'), ELECTIVE_SECTION],
    levelFloors: [ELECTIVE_FLOOR],
    totals: [
      { id: 'total', label: 'Total units', units: 20 },
      { id: 'math', label: 'Math units', units: spec.mathUnits, from: MATH_COURSES },
      { id: 'nonmath', label: 'Non-math units', units: 5, from: NON_MATH },
    ],
    notes: spec.notes,
  }
  return {
    ...BCS_DEGREE,
    id: spec.id,
    name: spec.name,
    shortName: spec.shortName,
    pid: spec.pid,
    enrolmentCode: spec.enrolmentCode,
    specs: [],
    breadthRuleChoice: false,
    programs: () => [core],
    list1: () => commLists('elective').list1,
  }
}
