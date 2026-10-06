/**
 * Data Science (Bachelor of Mathematics - Honours).
 * Drafted by scripts/gen-program.ts from Kuali HymD11R0j3, then reviewed against the calendar.
 */
import type { Major } from '@/domain/requirements'
import { bmathMajor } from '../bmath'
import { oneOf, pick } from '../helpers'

/** "2 of" these course pairs: a first course from `first` with a second from `second`. */
const PAIRS = [
  { first: ['AMATH242', 'CS335', 'CS370', 'CS371'], second: ['AMATH449', 'CS479'], label: 'AMATH 242 / CS 335 / 370 / 371 with AMATH 449 / CS 479' },
  { first: ['STAT330'], second: ['STAT431', 'STAT440'], label: 'STAT 330 with STAT 431 / 440' },
  { first: ['STAT332'], second: ['STAT430', 'STAT454'], label: 'STAT 332 with STAT 430 / 454' },
]

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
        pick('pairs-first', 'First courses of 2 pairs: AMATH 242 / CS 335 / 370 / 371, STAT 330, STAT 332', 2, {
          list: PAIRS.flatMap((p) => p.first),
        }, {
          kind: 'required',
          maxFrom: [{ set: { list: PAIRS[0].first }, max: 1, label: 'At most one of AMATH 242 / CS 335 / 370 / 371' }],
          note: 'STAT 332: some business-related plans may substitute STAT 372. STAT 334 is not an acceptable substitute for STAT 330.',
        }),
        pick('pairs-second', 'Second courses of the same 2 pairs: AMATH 449 / CS 479, STAT 431 / 440, STAT 430 / 454', 2, {
          list: PAIRS.flatMap((p) => p.second),
        }, {
          kind: 'required',
          maxFrom: PAIRS.map((p) => ({ set: { list: p.second }, max: 1, label: `At most one of ${p.second.join(' / ')}` })),
        }),
      ],
    },
  ],
  notes: [
    `Check manually: complete 2 of these pairs: ${PAIRS.map((p) => p.label).join('; ')}. The audit checks two first courses and two second courses but not that they come from the same two pairs.`,
    'Students may only complete one course from any cross-listed set, and no course may fulfil more than one requirement within the major.',
    'Students currently or previously in Business Administration and Mathematics double degree, Mathematics/Business Administration, Mathematics/Financial Analysis and Risk Management, Information Technology Management, or Mathematical Optimization – Business Specialization may substitute STAT 371 for STAT 331 and STAT 372 for STAT 332.',
    'STAT 334 is not an acceptable substitute for STAT 330; STAT 373 is not an acceptable substitute for STAT 331.',
    'Business Administration and Mathematics double degree students may substitute BUS 362W for ENGL 378.',
    'Check manually: co-op students in Data Science should have their 4B term in a Fall or Winter term (Co-op Sequence 3 ends in Spring).',
  ],
})
