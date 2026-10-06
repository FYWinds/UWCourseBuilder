/**
 * Actuarial Science (Bachelor of Mathematics - Honours).
 * Drafted by scripts/gen-program.ts from Kuali HkeH1JRCjh, then reviewed against the calendar.
 */
import type { CourseSet, Major } from '@/domain/requirements'
import { bmathMajor } from '../bmath'
import { oneOf, pick } from '../helpers'

const MATH_SUBJECTS = ['ACTSC', 'AMATH', 'CO', 'CS', 'MATBUS', 'MATH', 'PMATH', 'STAT']
const UPPER_MATH: CourseSet = { union: MATH_SUBJECTS.map((subject) => ({ range: { subject, from: 300, to: 499 } })) }

export const major: Major = bmathMajor({
  id: 'actsci',
  pid: 'HkeH1JRCjh',
  name: 'Actuarial Science (Bachelor of Mathematics - Honours)',
  shortName: 'Actuarial Science',
  enrolmentCode: 'H-Actuarial Science',
  mathUnits: 13,
  communication: 'stat',
  sections: [
    {
      id: 'required-courses',
      label: 'Required Courses',
      slots: [
        oneOf('actsc231', ['ACTSC231']),
        oneOf('actsc232', ['ACTSC232']),
        oneOf('actsc331', ['ACTSC331']),
        oneOf('actsc363', ['ACTSC363']),
        oneOf('actsc372', ['ACTSC372']),
        oneOf('actsc431', ['ACTSC431']),
        oneOf('actsc446', ['ACTSC446']),
        oneOf('afm101', ['AFM101']),
        oneOf('econ101', ['ECON101'], 0.5, 'Students previously in Mathematics/CPA may substitute ECON 100/COMM 103.'),
        oneOf('econ102', ['ECON102']),
        oneOf('engl378', ['ENGL378']),
        oneOf('mthel131', ['MTHEL131']),
        oneOf('stat330', ['STAT330']),
        oneOf('stat331', ['STAT331'], 0.5, 'Some business-related plans may substitute STAT 371; STAT 373 and STAT 374 are not acceptable.'),
        oneOf('stat333', ['STAT333']),
        oneOf('stat341', ['STAT341']),
        oneOf('amath250', ['AMATH250', 'AMATH251', 'AMATH350']),
        oneOf('math237', ['MATH237', 'MATH247']),
        pick('actsc-400', '2 additional ACTSC courses at the 400-level', 2, { range: { subject: 'ACTSC', from: 400, to: 499 } }),
        pick('math-upper', '1 additional math course at the 300- or 400-level', 1, UPPER_MATH),
        pick('actsc-or-list', '2 additional ACTSC courses at the 300- or 400-level, or AFM 424 / STAT 431 / 433 / 440 / 441 / 443 / 444', 2, {
          union: [
            { range: { subject: 'ACTSC', from: 300, to: 499 } },
            { list: ['AFM424', 'STAT431', 'STAT433', 'STAT440', 'STAT441', 'STAT443', 'STAT444'] },
          ],
        }),
      ],
    },
  ],
  notes: [
    'Math courses here are ACTSC, AMATH, CO, CS, MATBUS, MATH, PMATH, or STAT courses.',
    'Business Administration and Mathematics double degree students may substitute BUS 121W for MTHEL 131, BUS 127W for AFM 101, BUS 362W for ENGL 378, BUS 393W for ACTSC 372, BUS 473W for AFM 424, ECON 120W for ECON 101, and ECON 140W for ECON 102.',
    'Students currently or previously in Business Administration and Mathematics double degree, Mathematics/Business Administration, Mathematics/Financial Analysis and Risk Management, Information Technology Management, or Mathematical Optimization – Business Specialization may substitute STAT 371 for STAT 331.',
    'STAT 334 is not an acceptable substitute for STAT 330 or STAT 333; STAT 373 and STAT 374 are not acceptable substitutes for STAT 331.',
    'Check manually: co-op students in Actuarial Science are expected to follow Co-op Sequence 1.',
  ],
})
