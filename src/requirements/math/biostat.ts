/**
 * Biostatistics (Bachelor of Mathematics - Honours).
 * Drafted by scripts/gen-program.ts from Kuali SkUkJR0oh, then reviewed against the calendar.
 */
import type { CourseSet, Major } from '@/domain/requirements'
import { bmathMajor } from '../bmath'
import { oneOf, pick } from '../helpers'

const MATH_SUBJECTS = ['ACTSC', 'AMATH', 'CO', 'CS', 'MATBUS', 'MATH', 'PMATH', 'STAT']
const UPPER_MATH: CourseSet = { union: MATH_SUBJECTS.map((subject) => ({ range: { subject, from: 300, to: 499 } })) }

export const major: Major = bmathMajor({
  id: 'biostat',
  pid: 'SkUkJR0oh',
  name: 'Biostatistics (Bachelor of Mathematics - Honours)',
  shortName: 'Biostatistics',
  enrolmentCode: 'H-Biostatistics',
  mathUnits: 13,
  communication: 'stat',
  sections: [
    {
      id: 'required-courses',
      label: 'Required Courses',
      slots: [
        oneOf('engl378', ['ENGL378']),
        oneOf('stat330', ['STAT330']),
        oneOf('stat331', ['STAT331'], 0.5, 'Some business-related plans may substitute STAT 371; STAT 373 and STAT 374 are not acceptable.'),
        oneOf('stat332', ['STAT332'], 0.5, 'Some business-related plans may substitute STAT 372.'),
        oneOf('stat333', ['STAT333']),
        oneOf('stat337', ['STAT337']),
        oneOf('stat431', ['STAT431']),
        oneOf('stat437', ['STAT437']),
        oneOf('stat438', ['STAT438']),
        oneOf('amath231', ['AMATH231', 'AMATH242', 'AMATH250', 'AMATH251', 'AMATH350', 'CS371', 'MATH239', 'MATH249']),
        oneOf('biol239', ['BIOL239', 'HLTH101']),
        oneOf('math237', ['MATH237', 'MATH247']),
        pick('stat-upper', '2 additional STAT courses at the 300- or 400-level', 2, { range: { subject: 'STAT', from: 300, to: 499 } }),
        pick('math-upper', '2 additional math courses at the 300- or 400-level', 2, UPPER_MATH),
        pick('math-any', '3 additional math courses', 3, { subject: MATH_SUBJECTS }),
      ],
    },
  ],
  notes: [
    'Math courses here are ACTSC, AMATH, CO, CS, MATBUS, MATH, PMATH, or STAT courses.',
    'Students currently or previously in Business Administration and Mathematics double degree, Mathematics/Business Administration, Mathematics/Financial Analysis and Risk Management, Information Technology Management, or Mathematical Optimization - Business Specialization may substitute STAT 371 for STAT 331 and STAT 372 for STAT 332.',
    'STAT 334 is not an acceptable substitute for STAT 330 or STAT 333; STAT 373 and STAT 374 are not acceptable substitutes for STAT 331.',
    'Business Administration and Mathematics double degree students may substitute BUS 362W for ENGL 378.',
    'Check manually: co-op students in Biostatistics should have their 4B term in a Winter term (Co-op Sequence 3 ends in Spring).',
  ],
})
