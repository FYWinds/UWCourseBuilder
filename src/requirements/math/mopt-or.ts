/**
 * Mathematical Optimization - Operations Research Specialization (Bachelor of Mathematics - Honours).
 * Drafted by scripts/gen-program.ts from Kuali Sy0ky0Rsn, then reviewed against the calendar.
 */
import type { Major } from '@/domain/requirements'
import { bmathMajor } from '../bmath'
import { oneOf, pick } from '../helpers'

export const major: Major = bmathMajor({
  id: 'mopt-or',
  pid: 'Sy0ky0Rsn',
  name: 'Mathematical Optimization - Operations Research Specialization (Bachelor of Mathematics - Honours)',
  shortName: 'Math Optimization (Operations Research)',
  enrolmentCode: 'H-Mathematical Optimization - Operations Research Specialization',
  mathUnits: 13,
  sections: [
    {
      id: 'required-courses',
      label: 'Required Courses',
      slots: [
        oneOf('afm101', ['AFM101']),
        oneOf('co370', ['CO370']),
        oneOf('econ101', ['ECON101']),
        oneOf('mse211', ['MSE211']),
        oneOf('stat340', ['STAT340']),
        oneOf('amath242', ['AMATH242', 'CS370', 'CS371']),
        oneOf('co250', ['CO250', 'CO255']),
        pick('co-3', '3 optimization courses (CO342–CO471 list)', 3, { list: ['CO342', 'CO351', 'CO353', 'CO367', 'CO372', 'CO450', 'CO452', 'CO454', 'CO456', 'CO463', 'CO466', 'CO471'] }, { kind: 'required' }),
        oneOf('cs330', ['CS330', 'CS490']),
        oneOf('math237', ['MATH237', 'MATH247']),
        oneOf('math239', ['MATH239', 'MATH249']),
      ],
    },
    {
      id: 'or-specialization',
      label: 'Operations Research Specialization',
      slots: [
        oneOf('cs234', ['CS234']),
        oneOf('stat331', ['STAT331']),
        oneOf('stat333', ['STAT333']),
        pick('or-business-2', '2 of AFM102, ECON102, MSE311, MSE432', 2, { list: ['AFM102', 'ECON102', 'MSE311', 'MSE432'] }, { kind: 'required' }),
        pick('or-elective-1', '1 operations research elective', 1, {
          list: ['AMATH250', 'AMATH251', 'CO487', 'CS338', 'CS430', 'STAT332', 'STAT433', 'STAT435', 'STAT443'],
        }, { kind: 'required' }),
        oneOf(
          'co351',
          ['CO351', 'CO353', 'CO450', 'CO452', 'CO454', 'CO456', 'CO459', 'CO463', 'CO466', 'CO471'],
          0.5,
          'Check manually: CO 450, 452, 454, 456, 459, 463, 466 and 471 replace CO 351 / CO 353 only for students who took CO 255.',
        ),
        pick('or-math-2', '2 math courses (ACTSC, AMATH, CO, CS, MATBUS, MATH, PMATH, STAT)', 2, {
          subject: ['ACTSC', 'AMATH', 'CO', 'CS', 'MATBUS', 'MATH', 'PMATH', 'STAT'],
        }),
      ],
    },
  ],
  notes: [
    'No course used for the Required Courses can also satisfy an Operations Research Specialization requirement.',
    'Students may replace the listed Computer Science courses with the corresponding courses available to Computer Science major students.',
    'BBA/BMath and BBA/BCS double degree students may substitute BUS127W/BUS227W for AFM101, BUS247W for AFM102, ECON120W for ECON101, ECON140W for ECON102, BUS288W for MSE211, and STAT371 and STAT372 for STAT331 and STAT332.',
  ],
})
