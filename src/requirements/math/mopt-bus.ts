/**
 * Mathematical Optimization - Business Specialization (Bachelor of Mathematics - Honours).
 * Drafted by scripts/gen-program.ts from Kuali H1gRk1ARih, then reviewed against the calendar.
 */
import type { Major } from '@/domain/requirements'
import { bmathMajor } from '../bmath'
import { oneOf, pick } from '../helpers'

export const major: Major = bmathMajor({
  id: 'mopt-bus',
  pid: 'H1gRk1ARih',
  name: 'Mathematical Optimization - Business Specialization (Bachelor of Mathematics - Honours)',
  shortName: 'Math Optimization (Business)',
  enrolmentCode: 'H-Mathematical Optimization - Business Specialization',
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
      id: 'business-specialization',
      label: 'Business Specialization',
      slots: [
        oneOf('actsc231', ['ACTSC231']),
        oneOf('afm102', ['AFM102']),
        oneOf('bus111w', ['BUS111W']),
        oneOf('bus121w', ['BUS121W']),
        oneOf('bus252w', ['BUS252W']),
        oneOf('bus381w', ['BUS381W']),
        oneOf('cs338', ['CS338']),
        oneOf('econ102', ['ECON102']),
        oneOf('mse432', ['MSE432']),
        oneOf('stat371', ['STAT371']),
        oneOf('stat372', ['STAT372']),
        pick('business-2', '2 business specialization electives', 2, {
          list: [
            'AMATH350', 'BUS435W', 'BUS445W', 'BUS455W', 'BUS485W', 'CS230', 'CS234', 'MSE311', 'MSE436',
            'STAT440', 'STAT442', 'STAT444',
          ],
        }, { kind: 'required' }),
      ],
    },
  ],
  notes: [
    'No course used for the Required Courses can also satisfy a Business Specialization requirement.',
    'Students may replace the listed Computer Science courses with the corresponding courses available to Computer Science major students.',
  ],
})
