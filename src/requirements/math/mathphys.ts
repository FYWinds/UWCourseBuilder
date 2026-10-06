/**
 * Mathematical Physics (Bachelor of Mathematics - Honours).
 * Drafted by scripts/gen-program.ts from Kuali ByzRyy0Rj2, then reviewed against the calendar.
 */
import type { Major } from '@/domain/requirements'
import { bmathMajor } from '../bmath'
import { oneOf, pick } from '../helpers'

export const major: Major = bmathMajor({
  id: 'mathphys',
  pid: 'ByzRyy0Rj2',
  name: 'Mathematical Physics (Bachelor of Mathematics - Honours)',
  shortName: 'Mathematical Physics',
  enrolmentCode: 'H-Mathematical Physics (BMath)',
  mathUnits: 10,
  sequences: ['coop1', 'coop2', 'coop3', 'coop4', 'amath', 'regular'],
  sections: [
    {
      id: 'required-courses',
      label: 'Required Courses',
      slots: [
        oneOf('amath231', ['AMATH231']),
        oneOf('amath271', ['AMATH271']),
        oneOf('amath353', ['AMATH353']),
        oneOf('amath361', ['AMATH361']),
        oneOf('amath473', ['AMATH473']),
        oneOf('phys122', ['PHYS122']),
        oneOf('phys223', ['PHYS223']),
        oneOf('phys234', ['PHYS234']),
        oneOf('phys242', ['PHYS242']),
        oneOf('computational', ['AMATH242', 'AMATH345', 'AMATH391', 'AMATH445', 'CS371']),
        oneOf('amath250', ['AMATH250', 'AMATH251']),
        oneOf('real-analysis', ['AMATH331', 'PMATH331', 'PMATH333', 'PMATH351']),
        oneOf('complex-analysis', ['AMATH332', 'PMATH332', 'PMATH352']),
        pick('upper-core', '4 of AMATH 333, AMATH 474, PHYS 342, PHYS 357, PHYS 363', 4, {
          list: ['AMATH333', 'AMATH474', 'PHYS342', 'PHYS357', 'PHYS363'],
        }, { kind: 'required' }),
        oneOf('amath475', ['AMATH475', 'PHYS476']),
        oneOf('math237', ['MATH237', 'MATH247']),
      ],
    },
    {
      id: 'amath-phys-electives',
      label: 'Additional AMATH or PHYS courses',
      slots: [
        pick('amath-phys-upper', '1.0 unit of AMATH or PHYS at the 300- or 400-level', 2, {
          union: [
            { range: { subject: 'AMATH', from: 300, to: 499 } },
            { range: { subject: 'PHYS', from: 300, to: 499 } },
          ],
        }),
        pick('amath-phys-any', '1.0 unit of any AMATH or PHYS courses', 2, { subject: ['AMATH', 'PHYS'] }),
      ],
    },
  ],
  notes: [
    'Students may only complete one course from any cross-listed set.',
    'Additional AMATH or PHYS courses: 2.0 units beyond the required courses, at least 1.0 unit of them at the 300- or 400-level.',
    'Co-op students may follow the Applied Mathematics preferred sequence in addition to Sequences 1–4.',
  ],
})
