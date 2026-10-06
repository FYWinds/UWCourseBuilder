/**
 * Mathematics/Teaching (Bachelor of Mathematics - Honours).
 * Drafted by scripts/gen-program.ts from Kuali Byl0k1ACin, then reviewed against the calendar.
 */
import type { Major } from '@/domain/requirements'
import { bmathMajor } from '../bmath'
import { oneOf } from '../helpers'

export const major: Major = bmathMajor({
  id: 'mathteach',
  pid: 'Byl0k1ACin',
  name: 'Mathematics/Teaching (Bachelor of Mathematics - Honours)',
  shortName: 'Mathematics/Teaching',
  enrolmentCode: 'H-Mathematics/Teaching',
  mathUnits: 12,
  sequences: ['coop1', 'coop2', 'coop3', 'coop4'],
  workTerms: 4,
  extraTotals: [
    {
      id: 'upper-math',
      label: '8 math courses at the 300- or 400-level (including those used above)',
      units: 4,
      from: {
        union: ['ACTSC', 'AMATH', 'CO', 'CS', 'MATBUS', 'MATH', 'PMATH', 'STAT'].map((subject) => ({
          range: { subject, from: 300, to: 499 },
        })),
      },
    },
  ],
  sections: [
    {
      id: 'required-courses',
      label: 'Required Courses',
      slots: [
        oneOf('actsc221', ['ACTSC221']),
        oneOf('cs234', ['CS234']),
        oneOf('mthel206', ['MTHEL206']),
        oneOf('amath250', ['AMATH250', 'AMATH251', 'AMATH343']),
        oneOf('amath331', ['AMATH331', 'AMATH332', 'PMATH331', 'PMATH332', 'PMATH333', 'PMATH351', 'PMATH352']),
        oneOf('co250', ['CO250', 'CO255']),
        oneOf('co380', ['CO380', 'CO480']),
        oneOf('cs230', ['CS230', 'CS330', 'CS338', 'CS370', 'CS371', 'CS430', 'CS436']),
        oneOf('math237', ['MATH237', 'MATH247']),
        oneOf('math239', ['MATH239', 'MATH249']),
        oneOf('pmath320', ['PMATH320', 'PMATH321', 'PMATH330', 'PMATH340', 'PMATH432', 'PMATH440']),
        oneOf('pmath334', ['PMATH334', 'PMATH336', 'PMATH347', 'PMATH348']),
        oneOf('psych101', ['PSYCH101', 'PSYCH101R']),
        oneOf('psych211', ['PSYCH211', 'PSYCH212', 'PSYCH212R']),
        oneOf('stat331', ['STAT331', 'STAT332', 'STAT333']),
      ],
    },
  ],
  notes: [
    'Students may only complete one course from any cross-listed set.',
    'Check manually: courses must include a second teaching subject, chosen from the subjects offered at Ontario faculties of education in consultation with the Mathematics/Teaching academic advisors.',
    'Check manually: work-term arrangements differ from other Mathematics co-op plans and are set with the plan advisors/co-ordinator; Co-op Sequences 1–4 are shown as an approximation.',
  ],
})
