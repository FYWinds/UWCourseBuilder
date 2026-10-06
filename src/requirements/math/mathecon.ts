/**
 * Mathematical Economics (Bachelor of Mathematics - Honours).
 * Drafted by scripts/gen-program.ts from Kuali r1gAJJ0Cin, then reviewed against the calendar.
 */
import type { CourseSet, Major } from '@/domain/requirements'
import { bmathMajor } from '../bmath'
import { oneOf, pick } from '../helpers'

const MATH_SUBJECTS: CourseSet = { subject: ['ACTSC', 'AMATH', 'CO', 'CS', 'MATBUS', 'MATH', 'PMATH', 'STAT'] }

export const major: Major = bmathMajor({
  id: 'mathecon',
  pid: 'r1gAJJ0Cin',
  name: 'Mathematical Economics (Bachelor of Mathematics - Honours)',
  shortName: 'Mathematical Economics',
  enrolmentCode: 'H-Mathematical Economics (BMath)',
  mathUnits: 11,
  sections: [
    {
      id: 'required-courses',
      label: 'Required Courses',
      slots: [
        oneOf('econ101', ['ECON101']),
        oneOf('econ102', ['ECON102']),
        oneOf('econ290', ['ECON290']),
        oneOf('econ306', ['ECON306']),
        oneOf('econ391', ['ECON391']),
        oneOf('econ393', ['ECON393']),
        oneOf('econ472', ['ECON472']),
        oneOf('econ491', ['ECON491']),
        oneOf('econ496', ['ECON496']),
        oneOf('econ406', ['ECON406', 'ECON407', 'ECON408', 'ECON409']),
        pick('econ-upper', '4 additional ECON courses at the 300- or 400-level', 4, { range: { subject: 'ECON', from: 300, to: 499 } }),
        oneOf('amath350', ['AMATH350']),
        oneOf('stat331', ['STAT331']),
        oneOf('stat443', ['STAT443']),
        oneOf('real-analysis', ['AMATH331', 'PMATH331', 'PMATH333', 'PMATH351']),
        oneOf('co250', ['CO250', 'CO255']),
        oneOf('math237', ['MATH237', 'MATH247']),
        pick('math-electives', '7 additional math courses', 7, MATH_SUBJECTS),
        pick('math-group-extra', '2 additional courses', 2, { union: [MATH_SUBJECTS, { subject: ['ECON'] }] }),
      ],
    },
  ],
  extraTotals: [
    { id: 'actsc372-econ371', label: 'ACTSC 372 or ECON 371', units: 0.5, from: { list: ['ACTSC372', 'ECON371'] } },
  ],
  notes: [
    'Check manually: the ECON courses above (ECON 101 through the 4 additional ECON courses) need a cumulative average of at least 70%.',
    'Check manually: the math courses above (AMATH 350 through the 2 additional courses) need a cumulative average of at least 60%.',
    'Check manually: the calendar lists "2 additional courses" in the math group without naming a pool; any math or ECON course is accepted here.',
    'In their elective choices, students must take ACTSC 372 or ECON 371, as well as STAT 331 or ECON 421. ACTSC 372 or STAT 331 counts as a math group choice; ECON 371 or ECON 421 counts as an economics group choice.',
  ],
})
