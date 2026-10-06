/**
 * Computational Mathematics (Bachelor of Mathematics - Honours).
 * Drafted by scripts/gen-program.ts from Kuali rkDkJCAj2, then reviewed against the calendar.
 */
import type { CourseCode } from '@/domain/types'
import type { Major } from '@/domain/requirements'
import { bmathMajor } from '../bmath'
import { oneOf, pick } from '../helpers'

/** List 1 groups: two courses from two different groups (and different subject codes). */
const LIST_1_GROUPS: CourseCode[][] = [
  ['AMATH250', 'AMATH251', 'AMATH350'],
  ['CO250', 'CO255'],
  ['CS245', 'CS245E', 'PMATH330', 'PMATH432'],
  ['CS246', 'CS246E'],
]

const LIST_2: CourseCode[] = ['AMATH342', 'CS475', 'PMATH370', 'CO353', 'CO367', 'STAT340', 'STAT341']

const LIST_3: CourseCode[] = [
  'ACTSC447', 'AMATH343', 'AMATH382', 'AMATH383', 'AMATH391', 'AMATH442', 'AMATH449', 'AMATH455',
  'AMATH477', 'BIOL382', 'CO351', 'CO370', 'CO372', 'CO450', 'CO452', 'CO454', 'CO456', 'CO463',
  'CO466', 'CO471', 'CO485', 'CO487', 'CS341', 'CS431', 'CS451', 'CS466', 'CS476', 'CS479', 'CS480',
  'CS482', 'CS485', 'CS487', 'STAT440', 'STAT441', 'STAT442', 'STAT444',
]

const NON_MATH_SUBJECTS = [
  'AE', 'BIOL', 'BME', 'CHE', 'CHEM', 'CIVE', 'EARTH', 'ECE', 'ECON', 'ENVE', 'GEOE', 'ME', 'MNS',
  'MSE', 'MTE', 'NE', 'PHYS', 'SYDE',
]

/** "At least two different subject codes" among 4 courses = at most 3 from any one subject. */
const SUBJECT_CAPS = [
  { label: 'AMATH (incl. BIOL382)', set: { union: [{ subject: ['AMATH'] }, { list: ['BIOL382'] }] } },
  { label: 'CO', set: { subject: ['CO'] } },
  { label: 'CS', set: { subject: ['CS'] } },
  { label: 'PMATH', set: { subject: ['PMATH'] } },
  { label: 'STAT', set: { subject: ['STAT'] } },
].map(({ label, set }) => ({ set, max: 3, label: `At most 3 ${label} courses (two subject codes required)` }))

export const major: Major = bmathMajor({
  id: 'cm',
  pid: 'rkDkJCAj2',
  name: 'Computational Mathematics (Bachelor of Mathematics - Honours)',
  shortName: 'Computational Mathematics',
  enrolmentCode: 'H-Computational Mathematics',
  mathUnits: 13,
  sections: [
    {
      id: 'required-courses',
      label: 'Required Courses',
      slots: [
        oneOf('cs230', ['CS230'], 0.5, 'Students currently or previously enrolled in Computer Science may substitute CS241 or CS241E.'),
        oneOf('cs234', ['CS234'], 0.5, 'Students currently or previously enrolled in Computer Science may substitute CS240 or CS240E.'),
        oneOf('amath242', ['AMATH242', 'CS371']),
        oneOf('math237', ['MATH237', 'MATH247']),
        oneOf('math239', ['MATH239', 'MATH249']),
      ],
    },
    {
      id: 'list-1',
      label: 'List 1',
      slots: [
        pick('list-1', '2 courses from different List 1 groups', 2, { list: LIST_1_GROUPS.flat() }, {
          kind: 'required',
          maxFrom: [
            ...LIST_1_GROUPS.map((list) => ({ set: { list }, max: 1, label: `At most 1 of ${list.join(', ')}` })),
            { set: { subject: ['CS'] }, max: 1, label: 'The two courses must be in different subject codes' },
          ],
        }),
      ],
    },
    {
      id: 'list-2',
      label: 'List 2',
      slots: [
        pick('list-2', '2 List 2 courses', 2, { list: LIST_2 }, {
          kind: 'required',
          maxFrom: [
            { set: { list: ['CO353', 'CO367'] }, max: 1, label: 'At most 1 of CO353, CO367' },
            { set: { list: ['STAT340', 'STAT341'] }, max: 1, label: 'At most 1 of STAT340, STAT341' },
          ],
          note: 'Check manually: students who take CO255 may take CO450 or CO466 instead of CO353 or CO367.',
        }),
      ],
    },
    {
      id: 'additional',
      label: 'Additional List 2 / List 3 Courses',
      slots: [
        pick('list-2-3', '4 additional List 2 or List 3 courses in at least two subject codes', 4, { list: [...LIST_2, ...LIST_3] }, {
          maxFrom: [
            ...SUBJECT_CAPS,
            { set: { list: ['CS431', 'CS451'] }, max: 1, label: 'At most 1 of CS431, CS451' },
          ],
        }),
      ],
    },
  ],
  levelFloors: [
    {
      id: 'list-2-3-400',
      label: '2 of the additional List 2 / List 3 courses at the 400-level',
      slots: ['list-2-3'],
      units: 1,
      level: 400,
      absorbingSlot: 'list-2-3',
    },
  ],
  depth: {
    id: 'non-math-concentration',
    name: 'Subject concentration',
    label: `3 non-math courses from one subject (≥1 at the 200-level or above): ${NON_MATH_SUBJECTS.join(', ')}`,
    from: { subject: NON_MATH_SUBJECTS },
    units: 1.5,
    upperLevel: 200,
    chainLength: null,
  },
  notes: [
    'For the non-math course requirement, other course concentrations may be eligible subject to approval by a Computational Mathematics academic advisor.',
    'In List 3, BIOL382 counts as an AMATH course for the "at least two different subject codes" requirement.',
    'Students may only complete one course from any cross-listed set.',
  ],
})
