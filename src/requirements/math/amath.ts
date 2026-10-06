/**
 * Applied Mathematics (Bachelor of Mathematics - Honours).
 * Drafted by scripts/gen-program.ts from Kuali r1lByy00sh, then reviewed against the calendar.
 */
import type { Major } from '@/domain/requirements'
import { bmathMajor } from '../bmath'
import { oneOf, pick } from '../helpers'

const AMATH_300_OPTIONS = [
  'AMATH333', 'AMATH343', 'AMATH345', 'AMATH361', 'AMATH362', 'AMATH373', 'AMATH382', 'AMATH383',
  'AMATH390', 'AMATH391', 'PMATH343',
]

const AMATH_400_OPTIONS = [
  'AMATH442', 'AMATH445', 'AMATH446', 'AMATH449', 'AMATH451', 'AMATH453', 'AMATH455', 'AMATH456',
  'AMATH462', 'AMATH463', 'AMATH473', 'AMATH474', 'AMATH475', 'AMATH477', 'AMATH490', 'AMATH495',
  'AMATH499', 'CS479',
]

const CONCENTRATION_SUBJECTS = [
  'AE', 'BIOL', 'BME', 'SYDE', 'CHE', 'CHEM', 'CIVE', 'EARTH', 'ECE', 'ECON', 'ENVE', 'GEOE', 'GEOG',
  'ME', 'MTE', 'MNS', 'MSE', 'NE', 'PHYS',
]

export const major: Major = bmathMajor({
  id: 'amath',
  pid: 'r1lByy00sh',
  name: 'Applied Mathematics (Bachelor of Mathematics - Honours)',
  shortName: 'Applied Mathematics',
  enrolmentCode: 'H-Applied Mathematics',
  mathUnits: 13,
  sequences: ['coop1', 'coop2', 'coop3', 'coop4', 'amath', 'regular'],
  sections: [
    {
      id: 'required-courses',
      label: 'Required Courses',
      slots: [
        oneOf('amath231', ['AMATH231']),
        oneOf('amath342', ['AMATH342']),
        oneOf('amath353', ['AMATH353']),
        oneOf('amath242', ['AMATH242', 'CS371']),
        oneOf('amath250', ['AMATH250', 'AMATH251']),
        pick(
          'amath271-or-300',
          'AMATH 271, or 1 of AMATH 333, 343, 345, 361, 362, 373, 382, 383, 390, 391, PMATH 343',
          1,
          { list: ['AMATH271', ...AMATH_300_OPTIONS] },
          { kind: 'required' },
        ),
        oneOf('analysis', ['AMATH331', 'AMATH332', 'PMATH331', 'PMATH332', 'PMATH333', 'PMATH351', 'PMATH352']),
        pick('amath400', '3 courses from the 400-level AMATH list (incl. CS 479)', 3, { list: AMATH_400_OPTIONS }, {
          kind: 'required',
        }),
        oneOf('math237', ['MATH237', 'MATH247']),
        pick('amath3or4', '1 additional AMATH course at the 300- or 400-level', 1, {
          range: { subject: 'AMATH', from: 300, to: 499 },
        }),
      ],
    },
  ],
  depth: {
    id: 'concentration',
    name: 'Subject concentration',
    label: '4 courses all from one of AE, BIOL, BME/SYDE, CHE, CHEM, CIVE, EARTH, ECE, ECON, ENVE, GEOE, GEOG, ME/MTE, MNS, MSE, NE, PHYS',
    from: { subject: CONCENTRATION_SUBJECTS },
    units: 2,
    upperLevel: 100,
    chainLength: null,
  },
  notes: [
    'Students may only complete one course from any cross-listed set.',
    'Subject concentration: the 4 courses are in addition to the other required courses. A set of four courses from another academic unit may be eligible, subject to approval by the Applied Mathematics academic advisor.',
    'Check manually: BME/SYDE and ME/MTE each count as one subject for the subject concentration; the audit groups courses by subject code, so a mix of BME and SYDE (or ME and MTE) courses is not recognized.',
    'Co-op students may follow the Applied Mathematics preferred sequence in addition to Sequences 1–4.',
  ],
})
