/**
 * Mathematical Studies (Bachelor of Mathematics - Honours).
 * Drafted by scripts/gen-program.ts from Kuali H1z0kJR0in, then reviewed against the calendar.
 */
import type { Major } from '@/domain/requirements'
import { bmathMajor } from '../bmath'
import { oneOf, pick } from '../helpers'

export const major: Major = bmathMajor({
  id: 'mathstudies',
  pid: 'H1z0kJR0in',
  name: 'Mathematical Studies (Bachelor of Mathematics - Honours)',
  shortName: 'Mathematical Studies',
  enrolmentCode: 'H-Mathematical Studies',
  mathUnits: 13,
  listA: false,
  sections: [
    {
      id: 'required-courses',
      label: 'Required Courses',
      slots: [
        oneOf('cs115', ['CS115', 'CS135', 'CS145']),
        oneOf('cs116', ['CS116', 'CS136', 'CS146']),
        oneOf('math106', ['MATH106', 'MATH136', 'MATH146']),
        oneOf('math127', ['MATH127', 'MATH137', 'MATH147']),
        oneOf('math128', ['MATH128', 'MATH138', 'MATH148']),
        oneOf('math135', ['MATH135', 'MATH145']),
        oneOf('math207', ['MATH207', 'MATH229', 'MATH237', 'MATH239', 'MATH247', 'MATH249']),
        oneOf('math225', ['MATH225', 'MATH235', 'MATH245']),
        oneOf('stat220', ['STAT220', 'STAT230', 'STAT240']),
        oneOf('stat221', ['STAT221', 'STAT231', 'STAT241']),
        pick('upper-math', '10 math courses at the 300- or 400-level (ACTSC, AMATH, CO, CS, MATBUS, MATH, PMATH, STAT)', 10, {
          union: ['ACTSC', 'AMATH', 'CO', 'CS', 'MATBUS', 'MATH', 'PMATH', 'STAT'].map((subject) => ({
            range: { subject, from: 300, to: 499 },
          })),
        }),
      ],
    },
  ],
  notes: [
    'Exempt from List A.',
    'Check manually: with the MS-Business Specialization, or a minor or joint honours plan outside the Faculty of Mathematics, only 12.0 math units are required (13.0 checked here).',
  ],
})
