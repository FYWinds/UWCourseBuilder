/**
 * Applied Mathematics with Scientific Computing and Scientific Machine Learning (Bachelor of Mathematics - Honours).
 * Drafted by scripts/gen-program.ts from Kuali ByBkJCRs2, then reviewed against the calendar.
 */
import type { Major } from '@/domain/requirements'
import { bmathMajor } from '../bmath'
import { oneOf, pick } from '../helpers'

/** List 1 of the calendar page. */
const LIST_1 = [
  'AMATH342', 'AMATH345', 'AMATH391', 'AMATH442', 'AMATH446', 'AMATH449', 'AMATH477', 'CO367', 'CO466',
  'CO481', 'CS231', 'CS467', 'CS475', 'CS479', 'PHYS467', 'PMATH343', 'STAT331', 'STAT341', 'STAT441',
  'STAT444',
]

export const major: Major = bmathMajor({
  id: 'amath-sc',
  pid: 'ByBkJCRs2',
  name: 'Applied Mathematics with Scientific Computing and Scientific Machine Learning (Bachelor of Mathematics - Honours)',
  shortName: 'Applied Math (SciComp & SciML)',
  enrolmentCode: 'H-Applied Mathematics with Scientific Computing & Scientific Machine Learning',
  mathUnits: 13,
  sequences: ['coop1', 'coop2', 'coop3', 'coop4', 'amath', 'regular'],
  sections: [
    {
      id: 'required-courses',
      label: 'Required Courses',
      slots: [
        oneOf('amath231', ['AMATH231']),
        oneOf('amath445', ['AMATH445']),
        oneOf('cs234', ['CS234']),
        oneOf('amath242', ['AMATH242', 'CS371']),
        oneOf('amath250', ['AMATH250', 'AMATH251']),
        oneOf('amath342', ['AMATH342', 'AMATH345', 'AMATH449', 'CS479']),
        oneOf('co250', ['CO250', 'CO255']),
        oneOf('math237', ['MATH237', 'MATH247']),
        pick('amath3or4', '2 additional AMATH courses at the 300- or 400-level', 2, {
          range: { subject: 'AMATH', from: 300, to: 499 },
        }),
        pick('amath4', '1 additional AMATH course at the 400-level', 1, {
          range: { subject: 'AMATH', from: 400, to: 499 },
        }),
      ],
    },
    {
      id: 'list-1',
      label: 'List 1',
      slots: [
        pick('list1', '4 courses from List 1', 4, { list: LIST_1 }, {
          kind: 'required',
          note: 'Courses used for the core requirements above cannot also count here.',
        }),
      ],
    },
  ],
  notes: [
    'Students may only complete one course from any cross-listed set.',
    'Co-op students may follow the Applied Mathematics preferred sequence in addition to Sequences 1–4.',
  ],
})
