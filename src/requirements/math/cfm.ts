/**
 * Computing and Financial Management (Bachelor of Computing and Financial Management - Honours).
 * Drafted by scripts/gen-program.ts from Kuali B1gPkyRAo2, then reviewed against the calendar.
 * Its own degree (BCFM): 20.25 units, no List A or math-unit minimum, the communication
 * courses sit inside the major, co-op only.
 */
import type { Major, Program } from '@/domain/requirements'
import { CALENDAR_BASE, oneOf, pick } from '../helpers'
import { MATH_REQUISITE_TOKENS, mathCoop } from '../math-faculty'

const PID = 'B1gPkyRAo2'
const NAME = 'Computing and Financial Management (Bachelor of Computing and Financial Management - Honours)'
const SHORT_NAME = 'Computing & Financial Management'
const ENROLMENT_CODE = 'H-Computing & Financial Management'

const AFM_UPPER = { range: { subject: 'AFM', from: 300, to: 499 } }

const core: Program = {
  id: 'core',
  kind: 'core',
  name: NAME,
  shortName: SHORT_NAME,
  calendarUrl: `${CALENDAR_BASE}/${PID}`,
  enrolmentCode: ENROLMENT_CODE,
  sections: [
    {
      id: 'business-required',
      label: 'Required business and economics courses',
      slots: [
        oneOf('afm132', ['AFM132']),
        oneOf('afm191', ['AFM191']),
        oneOf('afm274', ['AFM274']),
        oneOf('afm322', ['AFM322']),
        oneOf('afm425', ['AFM425']),
        oneOf('afm427', ['AFM427']),
        oneOf('cfm101', ['CFM101']),
        oneOf('cfm301', ['CFM301']),
        oneOf('afm272', ['ACTSC291', 'AFM272']),
        oneOf('econ101', ['ECON101']),
        oneOf('econ102', ['ECON102']),
      ],
    },
    {
      id: 'business-options',
      label: 'Business options',
      slots: [
        pick(
          'business2',
          '2 of AFM 291, ARBUS 202, ARBUS 302, CFM 401, ECON 201, 206, 207, 231, 332, MGMT 244, PHIL 215, or AFM at the 300-level or above',
          2,
          {
            union: [
              {
                list: [
                  'AFM291', 'ARBUS202', 'ARBUS302', 'CFM401', 'ECON201', 'ECON206', 'ECON207', 'ECON231', 'ECON332',
                  'MGMT244', 'PHIL215',
                ],
              },
              AFM_UPPER,
            ],
          },
          { kind: 'required' },
        ),
        pick('afm-upper', '1.5 units of AFM courses at the 300-level or above (CFM 401 may replace one)', 3, {
          union: [AFM_UPPER, { list: ['CFM401'] }],
        }, { kind: 'required' }),
      ],
    },
    {
      id: 'communication',
      label: 'Communication courses',
      slots: [
        oneOf(
          'comm-oral',
          ['AFM111', 'COMMST100', 'COMMST223', 'COMMST225', 'COMMST227', 'COMMST228', 'EMLS101'],
          0.5,
          'Needs at least 65% before enrolling in 4A (Undergraduate Communication Requirement).',
        ),
        oneOf(
          'comm-written',
          ['EMLS129', 'ENGL101B', 'ENGL109', 'ENGL119', 'ENGL129', 'ENGL209', 'ENGL210E', 'ENGL210F'],
          0.5,
          'Needs at least 65% before enrolling in 4A (Undergraduate Communication Requirement).',
        ),
      ],
    },
    {
      id: 'cs-required',
      label: 'Required CS courses',
      slots: [
        oneOf('cs1x5', ['CS115', 'CS135', 'CS145']),
        oneOf('cs1x6', ['CS136', 'CS146']),
        oneOf('cs136l', ['CS136L'], 0.25),
        oneOf('cs240', ['CS240', 'CS240E']),
        oneOf('cs241', ['CS241', 'CS241E']),
        oneOf('cs245', ['CS245', 'CS245E']),
        oneOf('cs246', ['CS246', 'CS246E']),
        oneOf('cs341', ['CS341']),
      ],
    },
    {
      id: 'cs-upper',
      label: 'Upper-year CS courses',
      slots: [
        pick('cs4', '1 course from CS 440–498, or CO 487', 1, {
          union: [{ range: { subject: 'CS', from: 440, to: 498 } }, { list: ['CO487'] }],
        }, { kind: 'required' }),
        pick('cs3or4', '2 courses from CO 487, CS 251/251E, CS 340–398, 440–498', 2, {
          union: [
            { list: ['CO487', 'CS251', 'CS251E'] },
            { range: { subject: 'CS', from: 340, to: 398 } },
            { range: { subject: 'CS', from: 440, to: 498 } },
          ],
        }),
      ],
    },
    {
      id: 'math-required',
      label: 'Required math courses',
      slots: [
        oneOf('math1x7', ['MATH127', 'MATH137', 'MATH147']),
        oneOf('math1x8', ['MATH128', 'MATH138', 'MATH148']),
        oneOf('math1x5', ['MATH135', 'MATH145']),
        oneOf('math1x6', ['MATH136', 'MATH146']),
        oneOf('math2x9', ['MATH239', 'MATH249']),
        oneOf('stat2x0', ['STAT230', 'STAT240']),
        oneOf('stat2x1', ['STAT231', 'STAT241']),
        oneOf('stat373', ['STAT373']),
      ],
    },
  ],
  totals: [{ id: 'total', label: 'Total units', units: 20.25 }],
  notes: [
    'Check manually: the calendar asks for either 1.0 unit of AFM at the 300-level or above plus CFM 401 (if CFM 401 was not used for the business options), or 1.5 units of AFM at the 300-level or above. Here 1.5 units from AFM 300+ and CFM 401 are always required, so a student who used CFM 401 for the business options may need only 1.0 unit of AFM.',
    'Co-op only; Sequence 1 (the calendar study/work chart) is the recommended sequence.',
    'Includes 2.0 units of free electives (counted in the 20.25-unit total).',
    'Only one course from any cross-listed set may be used.',
    'Students who start in CS 115 and earn less than 90% must take CS 116 before CS 136; CS 116 then counts as an elective.',
    'Cannot be combined with any plan, minor, or specialization of the Cheriton School of Computer Science or the School of Accounting and Finance; consult a BCFM advisor before adding others.',
    'Minimum cumulative averages are not checked here.',
  ],
}

export const major: Major = {
  id: 'cfm',
  name: NAME,
  shortName: SHORT_NAME,
  degree: 'bcfm',
  pid: PID,
  enrolmentCode: ENROLMENT_CODE,
  requisiteTokens: MATH_REQUISITE_TOKENS,
  sequences: ['coop1', 'coop2', 'coop3', 'coop4'],
  fullTimeTerms: { coop: 8, regular: 8 },
  specs: [],
  breadthRuleChoice: false,
  programs: () => [core],
  list1: () => [],
  coop: mathCoop({ degreePid: PID, pd10: false, extra: 3 }),
}
