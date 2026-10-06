/**
 * Combinatorics and Optimization (Bachelor of Mathematics - Honours).
 * Drafted by scripts/gen-program.ts from Kuali SyeD110Co2, then reviewed against the calendar.
 */
import type { CourseSet, Major, Slot } from '@/domain/requirements'
import { bmathMajor } from '../bmath'
import { oneOf, pick } from '../helpers'

const MATH_SUBJECTS_NO_CO = ['ACTSC', 'AMATH', 'CS', 'MATBUS', 'MATH', 'PMATH', 'STAT']
const MATH_SUBJECTS = [...MATH_SUBJECTS_NO_CO, 'CO']

const upper = (subjects: string[]): CourseSet => ({
  union: subjects.map((subject) => ({ range: { subject, from: 300, to: 499 } })),
})

/** "No more than 1 from …" groups that limit the additional math courses. */
const ADDITIONAL_CAPS: NonNullable<Slot['maxFrom']> = [
  ['AMATH331', 'PMATH331', 'PMATH333', 'PMATH351'],
  ['AMATH332', 'PMATH332', 'PMATH352'],
  ['MATH237', 'MATH247'],
  ['PMATH334', 'PMATH348'],
  ['PMATH340', 'PMATH440', 'PMATH441'],
].map((list) => ({ set: { list }, max: 1, label: `At most 1 of ${list.join(', ')}` }))

export const major: Major = bmathMajor({
  id: 'co',
  pid: 'SyeD110Co2',
  name: 'Combinatorics and Optimization (Bachelor of Mathematics - Honours)',
  shortName: 'Combinatorics & Optimization',
  enrolmentCode: 'H-Combinatorics & Optimization',
  mathUnits: 13,
  sections: [
    {
      id: 'required-courses',
      label: 'Required Courses',
      slots: [
        oneOf('co250', ['CO250', 'CO255']),
        oneOf('co330', ['CO330', 'CO342']),
        oneOf(
          'co351',
          ['CO351', 'CO353', 'CO367'],
          0.5,
          'Check manually: students who took CO255 may instead use one of CO450, CO452, CO454, CO456, CO459, CO463, CO466, CO471.',
        ),
        oneOf('math239', ['MATH239', 'MATH249']),
        oneOf('pmath336', ['PMATH336', 'PMATH347']),
        pick('co-3', '3 CO courses from the C&O list', 3, {
          list: [
            'CO330', 'CO331', 'CO342', 'CO351', 'CO353', 'CO367', 'CO430', 'CO431', 'CO432', 'CO434',
            'CO439', 'CO440', 'CO442', 'CO444', 'CO446', 'CO450', 'CO452', 'CO454', 'CO456', 'CO459',
            'CO463', 'CO466', 'CO471', 'CO481', 'CO485', 'CO486', 'CO487', 'CS467', 'PHYS467',
          ],
        }, { kind: 'required' }),
        pick(
          'upper-non-co-2',
          '2 300-/400-level ACTSC, AMATH, CS, MATBUS, MATH, PMATH or STAT courses (not cross-listed with CO)',
          2,
          { minus: [upper(MATH_SUBJECTS_NO_CO), { list: ['CS467'] }] },
          { maxFrom: ADDITIONAL_CAPS },
        ),
        pick('upper-math-1', '1 300-/400-level math course (ACTSC, AMATH, CO, CS, MATBUS, MATH, PMATH, STAT)', 1, upper(MATH_SUBJECTS), {
          maxFrom: ADDITIONAL_CAPS,
        }),
        pick(
          'math-3',
          '3 math courses (ACTSC, AMATH, CO, CS, MATBUS, MATH, PMATH, STAT)',
          3,
          { union: [{ subject: MATH_SUBJECTS }, { list: ['CS462', 'CS466', 'CS487'] }] },
          { maxFrom: ADDITIONAL_CAPS },
        ),
      ],
    },
  ],
  notes: [
    'Students may only complete one course from any cross-listed set.',
    'No one course may fulfil more than one requirement within the major.',
    'The 400-level CS courses are only open to Computer Science majors; CS462, CS466 and CS487 are named choices for the 3 additional courses.',
    'Check manually: the "no more than 1" limits (AMATH331/PMATH331/PMATH333/PMATH351; AMATH332/PMATH332/PMATH352; MATH237/MATH247; PMATH334/PMATH348; PMATH340/PMATH440/PMATH441) apply across all six additional courses, not just within each requirement.',
  ],
})
