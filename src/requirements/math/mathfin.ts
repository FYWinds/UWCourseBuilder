/**
 * Mathematical Finance (Bachelor of Mathematics - Honours).
 * Drafted by scripts/gen-program.ts from Kuali ryAkJARjn, then reviewed against the calendar.
 */
import type { Major } from '@/domain/requirements'
import { bmathMajor } from '../bmath'
import { oneOf } from '../helpers'

export const major: Major = bmathMajor({
  id: 'mathfin',
  pid: 'ryAkJARjn',
  name: 'Mathematical Finance (Bachelor of Mathematics - Honours)',
  shortName: 'Mathematical Finance',
  enrolmentCode: 'H-Mathematical Finance',
  mathUnits: 13,
  sections: [
    {
      id: 'required-courses',
      label: 'Required Courses',
      slots: [
        oneOf('actsc231', ['ACTSC231']),
        oneOf('actsc372', ['ACTSC372']),
        oneOf('actsc445', ['ACTSC445']),
        oneOf('actsc446', ['ACTSC446']),
        oneOf('pmath351', ['PMATH351']),
        oneOf('pmath450', ['PMATH450']),
        oneOf('stat330', ['STAT330']),
        oneOf('stat331', ['STAT331']),
        oneOf('stat333', ['STAT333']),
        oneOf('stat443', ['STAT443']),
        oneOf('afm101', ['AFM101'], 0.5, 'Laurier BUS 127W is also accepted.'),
        oneOf('afm102', ['AFM102'], 0.5, 'Laurier BUS 247W is also accepted.'),
        oneOf('afm131', ['AFM131', 'ARBUS101'], 0.5, 'Laurier BUS 111W is also accepted.'),
        oneOf('computational', ['AMATH242', 'CS335', 'CS371']),
        oneOf('differential-equations', ['AMATH250', 'AMATH251', 'AMATH350']),
        oneOf('ode-optimization', ['AMATH351', 'CO250', 'CO255', 'PMATH352']),
        oneOf('advanced-finance-math', ['ACTSC447', 'AMATH353', 'CO372', 'CS476', 'PMATH453']),
        oneOf('econ101', ['ECON101'], 0.5, 'Laurier ECON 120W is also accepted.'),
        oneOf('econ102', ['ECON102'], 0.5, 'Laurier ECON 140W is also accepted.'),
        oneOf('econ201', ['ECON201'], 0.5, 'Laurier ECON 260W is also accepted.'),
      ],
      choices: [
        {
          id: 'calculus-3',
          label: 'Calculus 3',
          options: [
            { id: 'math247', label: 'MATH 247', slots: [oneOf('math247', ['MATH247'])] },
            {
              id: 'math237-pmath333',
              label: 'MATH 237 and PMATH 333',
              slots: [oneOf('math237', ['MATH237']), oneOf('pmath333', ['PMATH333'])],
            },
          ],
        },
      ],
    },
  ],
  notes: [
    'Laurier courses BUS 127W, BUS 247W, BUS 111W, ECON 120W, ECON 140W and ECON 260W may replace AFM 101, AFM 102, AFM 131, ECON 101, ECON 102 and ECON 201 respectively; they are not in the catalog and are not checked here.',
    'Students may only complete one course from any cross-listed set.',
    'Business Administration and Mathematics double degree students may substitute BUS 393W for ACTSC 372 and are exempt from STAT 443 (STAT 443 may then count toward the AMATH 353 / CO 372 / CS 476 / PMATH 453 requirement).',
    'Students currently or previously in Business Administration and Mathematics double degree, Mathematics/Business Administration, Mathematics/Financial Analysis and Risk Management, Information Technology Management, or Mathematical Optimization – Business Specialization may substitute STAT 371 for STAT 331.',
  ],
})
