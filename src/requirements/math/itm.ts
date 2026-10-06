/**
 * Information Technology Management (Bachelor of Mathematics - Honours).
 * Drafted by scripts/gen-program.ts from Kuali BJx01yRCin, then reviewed against the calendar.
 * The final "3 additional courses" names no pool; the ITM checklist lists them as free electives.
 */
import type { Major } from '@/domain/requirements'
import { bmathMajor } from '../bmath'
import { oneOf, pick } from '../helpers'

export const major: Major = bmathMajor({
  id: 'itm',
  pid: 'BJx01yRCin',
  name: 'Information Technology Management (Bachelor of Mathematics - Honours)',
  shortName: 'Information Technology Management',
  enrolmentCode: 'H-Information Technology Management',
  mathUnits: 10,
  sections: [
    {
      id: 'math-required',
      label: 'Required math and CS courses',
      slots: [
        oneOf('actsc2x1', ['ACTSC221', 'ACTSC231']),
        oneOf('co25x', ['CO250', 'CO255']),
        oneOf('math2x9', ['MATH239', 'MATH249']),
        oneOf('stat371', ['STAT371']),
        oneOf('stat372', ['STAT372']),
        oneOf('cs230', ['CS230']),
        oneOf('cs330', ['CS330']),
        oneOf('cs338', ['CS338']),
        oneOf('cs430', ['CS430']),
        oneOf('cs436', ['CS436']),
        pick('math-upper', '1 course at the 300- or 400-level from ACTSC, AMATH, CO, CS, MATBUS, MATH, PMATH, STAT', 1, {
          union: ['ACTSC', 'AMATH', 'CO', 'CS', 'MATBUS', 'MATH', 'PMATH', 'STAT'].map((subject) => ({
            range: { subject, from: 300, to: 499 },
          })),
        }),
      ],
    },
    {
      id: 'business-required',
      label: 'Required business courses',
      slots: [
        oneOf('afm101', ['AFM101']),
        oneOf('afm102', ['AFM102']),
        oneOf('business-law', ['AFM231', 'LS283']),
        oneOf('bus111w', ['BUS111W']),
        oneOf('bus121w', ['BUS121W']),
        oneOf('marketing', ['ARBUS302', 'BUS252W', 'MGMT244']),
        oneOf('bus381w', ['BUS381W']),
        oneOf('comm431', ['COMM431']),
        oneOf('comm432', ['COMM432']),
        oneOf('econ101', ['ECON101']),
        oneOf('econ102', ['ECON102']),
        oneOf('mse211', ['MSE211']),
        oneOf('mse311', ['MSE311']),
        oneOf('stv202', ['STV202']),
        oneOf('stv-upper', ['STV302', 'STV304', 'STV305', 'STV306', 'STV400', 'STV401']),
      ],
    },
    {
      id: 'electives',
      label: 'Additional courses',
      slots: [
        pick('electives', '3 additional courses (any subject)', 3, {
          minus: [
            { faculty: ['MAT', 'ENG', 'ART', 'ENV', 'AHS', 'SCI', 'OTHER'] },
            { subject: ['PD', 'COOP', 'WKRPT'] },
          ],
        }),
      ],
    },
  ],
  notes: [
    'Minimum cumulative special major average of 60% in all BUS, COMM, MSE and STV courses (not checked here).',
  ],
})
