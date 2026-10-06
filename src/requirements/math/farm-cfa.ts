/**
 * Mathematics/Financial Analysis and Risk Management - Chartered Financial Analyst Specialization (Bachelor of Mathematics - Honours).
 * Drafted by scripts/gen-program.ts from Kuali SkgAy1R0jh, then reviewed against the calendar.
 */
import type { CourseSet, Major } from '@/domain/requirements'
import { bmathMajor } from '../bmath'
import { oneOf, pick } from '../helpers'
import { MATH_COURSES, NON_MATH } from '../math-faculty'

const UPPER_MATH: CourseSet = {
  union: ['ACTSC', 'AMATH', 'CO', 'CS', 'MATBUS', 'MATH', 'PMATH', 'STAT'].map((subject) => ({
    range: { subject, from: 300, to: 499 },
  })),
}

const ANY_COURSE: CourseSet = { union: [MATH_COURSES, NON_MATH] }

export const major: Major = bmathMajor({
  id: 'farm-cfa',
  pid: 'SkgAy1R0jh',
  name: 'Mathematics/Financial Analysis and Risk Management - Chartered Financial Analyst Specialization (Bachelor of Mathematics - Honours)',
  shortName: 'Math/FARM (CFA)',
  enrolmentCode: 'H-Math/FARM - Chartered Financial Analyst Spec',
  mathUnits: 11.5,
  sections: [
    {
      id: 'required-courses',
      label: 'Required Courses',
      slots: [
        oneOf('actsc231', ['ACTSC231']),
        oneOf('actsc372', ['ACTSC372']),
        oneOf('afm101', ['AFM101']),
        oneOf('afm102', ['AFM102']),
        oneOf('afm131', ['AFM131']),
        oneOf('amath350', ['AMATH350']),
        oneOf('co372', ['CO372']),
        oneOf('comm101', ['COMM101']),
        oneOf('cs330', ['CS330']),
        oneOf('econ101', ['ECON101']),
        oneOf('econ102', ['ECON102']),
        oneOf('matbus471', ['MATBUS471']),
        oneOf('stat371', ['STAT371']),
        oneOf('actsc446', ['ACTSC446', 'MATBUS470']),
        oneOf('afm231', ['AFM231', 'LS283']),
        oneOf('co250', ['CO250', 'CO255']),
        oneOf('cs335', ['CS335', 'CS476']),
        oneOf('math237', ['MATH237', 'MATH247']),
        oneOf('stat330-or-334', ['STAT330', 'STAT334']),
        oneOf('stat333', ['STAT333']),
        pick('upper-math', '1 math course at the 300- or 400-level', 1, UPPER_MATH),
      ],
    },
    {
      id: 'specialization',
      label: 'Chartered Financial Analyst Specialization',
      slots: [
        oneOf('comm321', ['COMM321']),
        oneOf('comm421', ['COMM421']),
        oneOf('comm433', ['COMM433']),
        oneOf('marketing', ['ARBUS302', 'MGMT244']),
        oneOf('econ-cfa', ['ECON206', 'ECON207', 'ECON290']),
        oneOf('organizational-behaviour', ['HRM200', 'MSE211', 'PSYCH238']),
        pick('spec-additional', '2 additional courses', 2, ANY_COURSE),
      ],
    },
  ],
  notes: [
    'Students may only complete one course from any cross-listed set.',
    'Check manually: the calendar does not say whether a course may count toward both the major and the specialization; here each course counts once.',
    'Check manually: the specialization rule "1.0 unit of additional courses" names no pool; any course is accepted here.',
    'Check manually: four academic trading milestones (virtual brokerage portfolio deliverables) are also required.',
    'Check manually: the calendar requires either STAT 330, STAT 333 and 1 more 300- or 400-level math course, or STAT 334 and 2 more 300- or 400-level math courses (ACTSC, AMATH, CO, CS, MATBUS, MATH, PMATH, STAT). STAT 333 is required here on both paths.',
  ],
})
