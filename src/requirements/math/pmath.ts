/**
 * Pure Mathematics (Bachelor of Mathematics - Honours).
 * Drafted by scripts/gen-program.ts from Kuali S1eexkCAo2, then reviewed against the calendar.
 */
import type { Major } from '@/domain/requirements'
import { bmathMajor } from '../bmath'
import { oneOf, pick } from '../helpers'

const MATH_400_SUBJECTS = ['ACTSC', 'AMATH', 'CO', 'CS', 'MATBUS', 'MATH', 'PMATH', 'STAT']

export const major: Major = bmathMajor({
  id: 'pmath',
  pid: 'S1eexkCAo2',
  name: 'Pure Mathematics (Bachelor of Mathematics - Honours)',
  shortName: 'Pure Mathematics',
  enrolmentCode: 'H-Pure Mathematics',
  mathUnits: 13,
  sections: [
    {
      id: 'required-courses',
      label: 'Required Courses',
      slots: [
        oneOf('pmath347', ['PMATH347']),
        oneOf('pmath348', ['PMATH348']),
        oneOf('pmath351', ['PMATH351']),
        oneOf('pmath352', ['PMATH352']),
        oneOf('pmath450', ['PMATH450']),
        oneOf('math237', ['MATH237', 'MATH247']),
        oneOf('math239', ['MATH239', 'MATH249']),
        oneOf('pmath365', ['PMATH365', 'PMATH367']),
        pick('pmath4', '3 additional PMATH courses at the 400-level', 3, {
          range: { subject: 'PMATH', from: 400, to: 499 },
        }),
        pick(
          'math4',
          '2 additional math courses at the 400-level (ACTSC, AMATH, CO, CS, MATBUS, MATH, PMATH, STAT)',
          2,
          { union: MATH_400_SUBJECTS.map((subject) => ({ range: { subject, from: 400, to: 499 } })) },
        ),
      ],
    },
  ],
})
