/**
 * Mathematics/Chartered Professional Accountancy (Bachelor of Mathematics - Honours).
 * Drafted by scripts/gen-program.ts from Kuali BybCJk0Ri2, then reviewed against the calendar.
 */
import type { Major } from '@/domain/requirements'
import { bmathMajor } from '../bmath'
import { oneOf, pick } from '../helpers'

export const major: Major = bmathMajor({
  id: 'mathcpa',
  pid: 'BybCJk0Ri2',
  name: 'Mathematics/Chartered Professional Accountancy (Bachelor of Mathematics - Honours)',
  shortName: 'Mathematics/CPA',
  enrolmentCode: 'H-Mathematics/Chartered Professional Accountancy',
  mathUnits: 9.5,
  totalUnits: 20.5,
  listA: false,
  communication: 'cpa',
  sequences: ['cpa'],
  workTerms: 4,
  sections: [
    {
      id: 'required-courses',
      label: 'Required Courses',
      slots: [
        oneOf('afm111', ['AFM111']),
        oneOf('afm182', ['AFM182']),
        oneOf('afm191', ['AFM191']),
        oneOf('afm206', ['AFM206'], 0.25),
        oneOf('afm208', ['AFM208'], 0.25),
        oneOf('afm274', ['AFM274']),
        oneOf('afm285', ['AFM285']),
        oneOf('afm291', ['AFM291']),
        oneOf('afm311', ['AFM311']),
        oneOf('afm321', ['AFM321']),
        oneOf('afm335', ['AFM335']),
        oneOf('afm341', ['AFM341']),
        oneOf('afm362', ['AFM362']),
        oneOf('afm373', ['AFM373']),
        oneOf('afm382', ['AFM382']),
        oneOf('afm391', ['AFM391']),
        oneOf('afm433', ['AFM433']),
        oneOf('afm451', ['AFM451']),
        oneOf('afm462', ['AFM462']),
        oneOf('afm482', ['AFM482']),
        oneOf('afm491', ['AFM491']),
        oneOf('commst111', ['COMMST111']),
        oneOf('actsc127', ['ACTSC127', 'AFM127']),
        oneOf('actsc291', ['ACTSC291', 'AFM272']),
        oneOf('actsc423', ['ACTSC423', 'AFM423']),
        oneOf('afm323', ['AFM323', 'STAT371', 'STAT374']),
        oneOf('cs115', ['CS115', 'CS135', 'CS145']),
        oneOf('cs116', ['CS116', 'CS136', 'CS146']),
        oneOf('math127', ['MATH127', 'MATH137', 'MATH147']),
        oneOf('math128', ['MATH128', 'MATH138', 'MATH148']),
        oneOf('math135', ['MATH135', 'MATH145']),
        oneOf('math136', ['MATH136', 'MATH146']),
        oneOf('math237', ['MATH237', 'MATH247']),
        oneOf('stat230', ['STAT230', 'STAT240']),
        oneOf('stat231', ['STAT231', 'STAT241']),
        pick('math-electives', '6 additional math courses (ACTSC, AMATH, CO, CS, MATBUS, MATH, PMATH, STAT)', 6, { subject: ['ACTSC', 'AMATH', 'CO', 'CS', 'MATBUS', 'MATH', 'PMATH', 'STAT'] }),
      ],
      choices: [
        {
          id: 'economics',
          label: 'Economics',
          options: [
            { id: 'comm103-econ100', label: 'COMM 103 or ECON 100', slots: [oneOf('comm103', ['COMM103', 'ECON100'])] },
            {
              id: 'econ101-102',
              label: 'ECON 101 and ECON 102',
              slots: [oneOf('econ101', ['ECON101']), oneOf('econ102', ['ECON102'])],
            },
          ],
        },
      ],
    },
  ],
  notes: [
    'Students may only complete one course from any cross-listed set.',
    'AFM462, AFM482, and AFM491 may be substituted with an acceptable 300-/400-level AFM elective, with the understanding that any such substitution would forfeit Master of Accounting (MAcc) admission eligibility and will impact the path to a Chartered Professional Accountancy (CPA) designation pursued through CPA Ontario.',
    'AFM courses graded 60% or higher may not be repeated; AFM courses graded 50-59% may be repeated once, with School of Accounting and Finance approval.',
    'Exempt from List A. Four co-op work terms; the first is in the winter term after the fall 2A term.',
  ],
})
