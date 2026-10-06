/**
 * Computer Science (Bachelor of Mathematics - Honours).
 * Drafted by scripts/gen-program.ts from Kuali HkxPJk0Cj3, then reviewed against the calendar.
 * Upper-year CS rules mirror the BCS major (bcsCore).
 */
import type { CourseSet, Major, Section } from '@/domain/requirements'
import { ELECTIVE_FLOOR, ELECTIVE_SECTION } from '../bcs'
import { bmathMajor } from '../bmath'
import { oneOf, pick } from '../helpers'
import { COMM_LIST_1, COMM_LIST_2 } from '../math-faculty'
import { SPEC_IDS } from '../specs'

/** "The following cannot be used towards this academic plan." */
const EXCLUDED: CourseSet = { list: ['ACTSC221', 'CO353', 'CO380', 'CO480'] }

/**
 * Math courses excluded from the "3 additional courses" rule: cross-listed with CS,
 * listed as alternatives to CS courses (AMATH 242 for CS 370/371), readings and topics courses.
 */
const NOT_FOR_MATH3: CourseSet = {
  list: [
    'ACTSC447', 'AMATH242', 'AMATH449', 'CO481',
    'ACTSC423', 'ACTSC468', 'ACTSC469', 'ACTSC489', 'AMATH490', 'AMATH495', 'CO439', 'CO440', 'CO459',
    'CO486', 'CO499', 'PMATH399', 'PMATH499', 'STAT464', 'STAT466', 'STAT467', 'STAT468', 'STAT469',
  ],
}

/** The BMath communication courses form their own allocation group, so keep them out of the electives. */
const ELECTIVES: Section = {
  ...ELECTIVE_SECTION,
  slots: ELECTIVE_SECTION.slots.map((slot) => ({
    ...slot,
    from: { minus: [slot.from, { list: [...COMM_LIST_1, ...COMM_LIST_2] }] },
  })),
}

export const major: Major = bmathMajor({
  id: 'cs-bmath',
  pid: 'HkxPJk0Cj3',
  name: 'Computer Science (Bachelor of Mathematics - Honours)',
  shortName: 'Computer Science (BMath)',
  enrolmentCode: 'H-Computer Science (BMath)',
  mathUnits: 13.75,
  pd10: true,
  specs: SPEC_IDS,
  sections: [
    {
      id: 'cs-required',
      label: 'Required CS courses',
      slots: [
        oneOf('cs136l', ['CS136L'], 0.25),
        oneOf('cs240', ['CS240', 'CS240E']),
        oneOf('cs241', ['CS241', 'CS241E']),
        oneOf('cs245', ['CS245', 'CS245E']),
        oneOf('cs246', ['CS246', 'CS246E']),
        oneOf('cs251', ['CS251', 'CS251E']),
        oneOf('cs341', ['CS341']),
        oneOf('cs350', ['CS350']),
        oneOf('cs360', ['CS360', 'CS365']),
        oneOf('cs370', ['AMATH242', 'CS370', 'CS371']),
      ],
    },
    {
      id: 'math-required',
      label: 'Required math courses',
      slots: [
        oneOf('math2x7', ['MATH237', 'MATH247']),
        oneOf('math2x9', ['MATH239', 'MATH249']),
      ],
    },
    {
      id: 'cs-upper',
      label: 'Upper-year CS courses',
      slots: [
        pick('cs3or4', '1 course from CS 340–398, 440–489', 1, {
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
          { note: 'CS 600/700-level courses only when no equivalent 400-level course exists, with instructor and CS advisor permission.' },
        ),
      ],
    },
    {
      id: 'math-upper',
      label: 'Additional math courses',
      slots: [
        pick(
          'math3',
          '3 courses from ACTSC, AMATH, CO, PMATH, STAT',
          3,
          { minus: [{ subject: ['ACTSC', 'AMATH', 'CO', 'PMATH', 'STAT'] }, { union: [NOT_FOR_MATH3, EXCLUDED] }] },
          {
            note: 'Excludes courses cross-listed with CS, AMATH 242, readings and topics courses, and ACTSC 221, CO 353, CO 380 and CO 480 (not usable towards this plan).',
          },
        ),
      ],
    },
    ELECTIVES,
  ],
  levelFloors: [ELECTIVE_FLOOR],
  notes: [
    'ACTSC 221, CO 353, CO 380 and CO 480 cannot be used towards this plan.',
    'Check manually: the 3 ACTSC/AMATH/CO/PMATH/STAT courses also exclude courses whose requisites normally exclude Honours Computer Science students.',
    'Check manually: communication courses (List 1 and List 2) are kept out of the Elective Requirement here; one not used for the Communication Requirement may in fact count as an elective.',
  ],
})
