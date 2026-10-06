/**
 * Mathematics/Business Administration (Bachelor of Mathematics - Honours).
 * Drafted by scripts/gen-program.ts from Kuali BJ4CkJ0Cs3, then reviewed against the calendar.
 */
import type { Major } from '@/domain/requirements'
import { bmathMajor } from '../bmath'
import { oneOf, pick } from '../helpers'

export const major: Major = bmathMajor({
  id: 'mathbus',
  pid: 'BJ4CkJ0Cs3',
  name: 'Mathematics/Business Administration (Bachelor of Mathematics - Honours)',
  shortName: 'Mathematics/Business Administration',
  enrolmentCode: 'H-Mathematics/Business Administration',
  mathUnits: 10.5,
  sections: [
    {
      id: 'required-courses',
      label: 'Required Courses',
      slots: [
        oneOf('afm101', ['AFM101']),
        oneOf('afm102', ['AFM102']),
        oneOf('bus111w', ['BUS111W']),
        oneOf('bus121w', ['BUS121W']),
        oneOf('bus381w', ['BUS381W']),
        oneOf('co370', ['CO370']),
        oneOf('cs330', ['CS330']),
        oneOf('cs338', ['CS338']),
        oneOf('econ101', ['ECON101']),
        oneOf('econ102', ['ECON102']),
        oneOf('hrm200', ['HRM200']),
        oneOf('matbus371', ['MATBUS371']),
        oneOf('stat371', ['STAT371']),
        oneOf('stat372', ['STAT372']),
        oneOf('actsc221', ['ACTSC221', 'ACTSC231']),
        oneOf('afm231', ['AFM231', 'LS283']),
        oneOf('arbus302', ['ARBUS302', 'BUS252W', 'MGMT244']),
        oneOf('co250', ['CO250', 'CO255']),
        oneOf('math237', ['MATH237', 'MATH247']),
        oneOf('mse211', ['MSE211', 'PSYCH238']),
        pick('ethics-or-business', 'One of ARBUS202 / COMM400 / LS271 / LS319 / PACS202 / PACS323 / PHIL215 / PSYCH339, or 1 AFM, BUS, COMM, ECON, HRM, MSE, PSCI, or STV course', 1, { union: [{ list: ['ARBUS202', 'COMM400', 'LS271', 'LS319', 'PACS202', 'PACS323', 'PHIL215', 'PSYCH339'] }, { subject: ['AFM', 'BUS', 'COMM', 'ECON', 'HRM', 'MSE', 'PSCI', 'STV'] }] }),
        pick('math-electives', '3 additional math courses (ACTSC, AMATH, CO, CS, MATBUS, MATH, PMATH, STAT)', 3, { subject: ['ACTSC', 'AMATH', 'CO', 'CS', 'MATBUS', 'MATH', 'PMATH', 'STAT'] }),
        pick('comm-upper', '1 COMM course at the 300- or 400-level', 1, { range: { subject: 'COMM', from: 300, to: 499 } }),
        pick('bus-comm-upper', '1 BUS or COMM course at the 300- or 400-level', 1, { union: [{ range: { subject: 'BUS', from: 300, to: 499 } }, { range: { subject: 'COMM', from: 300, to: 499 } }] }),
        pick('additional-courses', '1.5 units of additional courses (any subject)', 3, { minus: [{ faculty: ['MAT', 'ENG', 'ART', 'ENV', 'AHS', 'SCI', 'OTHER'] }, { subject: ['PD'] }] }),
      ],
    },
  ],
  notes: [
    'Students may only complete one course from any cross-listed set.',
  ],
})
