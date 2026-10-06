/**
 * Data Science (Bachelor of Mathematics - Honours).
 * Drafted by scripts/gen-program.ts from Kuali HymD11R0j3, then reviewed against the calendar.
 */
import type { Choice, Major } from '@/domain/requirements'
import { bmathMajor } from '../bmath'
import { oneOf, pick } from '../helpers'

/** "Complete 2 of" these course pairs: a first course from `first` with a second from `second`. */
const PAIRS = [
  { id: 'computing', label: 'Computing', first: ['AMATH242', 'CS335', 'CS370', 'CS371'], second: ['AMATH449', 'CS479'] },
  { id: 'stat330', label: 'STAT 330', first: ['STAT330'], second: ['STAT431', 'STAT440'] },
  { id: 'stat332', label: 'STAT 332', first: ['STAT332'], second: ['STAT430', 'STAT454'], note: 'Some business-related plans may substitute STAT 372 for STAT 332.' },
]

const PAIR_CHOICE: Choice = {
  id: 'pairs',
  label: '2 course pairs',
  options: [[0, 1], [0, 2], [1, 2]].map((picked) => {
    const pairs = picked.map((i) => PAIRS[i])
    const id = pairs.map((p) => p.id).join('-')
    return {
      id,
      label: `${pairs[0].label} and ${pairs[1].label} pairs`,
      slots: pairs.flatMap((p) => [
        oneOf(`${id}-${p.id}-first`, p.first, 0.5, p.note),
        oneOf(`${id}-${p.id}-second`, p.second),
      ]),
    }
  }),
}

export const major: Major = bmathMajor({
  id: 'ds-bmath',
  pid: 'HymD11R0j3',
  name: 'Data Science (Bachelor of Mathematics - Honours)',
  shortName: 'Data Science (BMath)',
  enrolmentCode: 'H-Data Science (BMath)',
  mathUnits: 14.25,
  communication: 'stat',
  sections: [
    {
      id: 'required-courses',
      label: 'Required Courses',
      slots: [
        oneOf('cs136l', ['CS136L'], 0.25),
        oneOf('cs230', ['CS230']),
        oneOf('cs231', ['CS231']),
        oneOf('cs234', ['CS234']),
        oneOf('cs338', ['CS338']),
        oneOf('cs431', ['CS431']),
        oneOf('datsc401', ['DATSC401']),
        oneOf('engl378', ['ENGL378']),
        oneOf('phil228', ['PHIL228']),
        oneOf('stat331', ['STAT331'], 0.5, 'Some business-related plans may substitute STAT 371; STAT 373 is not acceptable.'),
        oneOf('stat341', ['STAT341']),
        oneOf('stat442', ['STAT442']),
        oneOf('amath231', ['AMATH231', 'AMATH250', 'AMATH251']),
        oneOf('co250', ['CO250', 'CO255']),
        oneOf('cs136', ['CS136', 'CS146']),
        oneOf('math237', ['MATH237', 'MATH247']),
        pick('modelling', '2 of AMATH 345 / 391, CO 353 / 365 / 367 / 370', 2, {
          list: ['AMATH345', 'AMATH391', 'CO353', 'CO365', 'CO367', 'CO370'],
        }, { kind: 'required' }),
        pick('learning', '2 of AMATH 445, STAT 441 / 443 / 444', 2, {
          list: ['AMATH445', 'STAT441', 'STAT443', 'STAT444'],
        }, { kind: 'required' }),
      ],
      choices: [PAIR_CHOICE],
    },
  ],
  notes: [
    'Students may only complete one course from any cross-listed set, and no course may fulfil more than one requirement within the major.',
    'Students currently or previously in Business Administration and Mathematics double degree, Mathematics/Business Administration, Mathematics/Financial Analysis and Risk Management, Information Technology Management, or Mathematical Optimization – Business Specialization may substitute STAT 371 for STAT 331 and STAT 372 for STAT 332.',
    'STAT 334 is not an acceptable substitute for STAT 330; STAT 373 is not an acceptable substitute for STAT 331.',
    'Business Administration and Mathematics double degree students may substitute BUS 362W for ENGL 378.',
    'Check manually: co-op students in Data Science should have their 4B term in a Fall or Winter term (Co-op Sequence 3 ends in Spring).',
  ],
})
