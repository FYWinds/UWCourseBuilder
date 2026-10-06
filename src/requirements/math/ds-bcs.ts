/**
 * Data Science (Bachelor of Computer Science - Honours).
 * Drafted by scripts/gen-program.ts from Kuali rkgPyyC0o2, then reviewed against the calendar.
 * bcsDegreeMajor adds the BCS Communication and Elective Requirements.
 */
import type { Major } from '@/domain/requirements'
import { bcsDegreeMajor } from '../bcs'
import { oneOf, pick } from '../helpers'

export const major: Major = bcsDegreeMajor({
  id: 'ds-bcs',
  pid: 'rkgPyyC0o2',
  name: 'Data Science (Bachelor of Computer Science - Honours)',
  shortName: 'Data Science (BCS)',
  enrolmentCode: 'H-Data Science (BCS)',
  mathUnits: 14.75,
  sections: [
    {
      id: 'cs-required',
      label: 'Required CS courses',
      slots: [
        oneOf('cs1x5', ['CS115', 'CS135', 'CS145']),
        oneOf('cs1x6', ['CS136', 'CS146']),
        oneOf('cs136l', ['CS136L'], 0.25),
        oneOf('cs240', ['CS240', 'CS240E']),
        oneOf('cs241', ['CS241', 'CS241E']),
        oneOf('cs245', ['CS245', 'CS245E']),
        oneOf('cs246', ['CS246', 'CS246E']),
        oneOf('cs251', ['CS251', 'CS251E']),
        oneOf('cs341', ['CS341']),
        oneOf('cs348', ['CS348']),
        oneOf('cs350', ['CS350']),
        oneOf('cs451', ['CS451']),
      ],
    },
    {
      id: 'math-required',
      label: 'Required math courses',
      slots: [
        oneOf('math1x7', ['MATH127', 'MATH137', 'MATH147']),
        oneOf('math1x8', ['MATH128', 'MATH138', 'MATH148']),
        oneOf('math1x5', ['MATH135', 'MATH145']),
        oneOf('math1x6', ['MATH136', 'MATH146']),
        oneOf('math2x5', ['MATH235', 'MATH245']),
        oneOf('math2x7', ['MATH237', 'MATH247']),
        oneOf('math2x9', ['MATH239', 'MATH249']),
        oneOf('stat2x0', ['STAT230', 'STAT240']),
        oneOf('stat2x1', ['STAT231', 'STAT241']),
        oneOf('stat330', ['STAT330']),
        oneOf('stat331', ['STAT331']),
        oneOf('stat341', ['STAT341']),
        pick('stat4', '2 of STAT 431, 440, 441, 442, 443, 444', 2, {
          list: ['STAT431', 'STAT440', 'STAT441', 'STAT442', 'STAT443', 'STAT444'],
        }, { kind: 'required' }),
      ],
    },
    {
      id: 'cs-upper',
      label: 'Upper-year CS courses',
      slots: [
        oneOf('ds-ml', ['CS480', 'CS485', 'CS486']),
        pick('ds-systems', '1 more of CS 448, 454, 480, 484, 485, 486', 1, {
          list: ['CS448', 'CS454', 'CS480', 'CS484', 'CS485', 'CS486'],
        }, { kind: 'required' }),
        pick('cs3or4', '1 course from CS 340–398, 440–489', 1, {
          union: [
            { range: { subject: 'CS', from: 340, to: 398 } },
            { range: { subject: 'CS', from: 440, to: 489 } },
          ],
        }),
        pick(
          'cs4extra',
          '1 course from CS 440–498, CS 600/700-level, CO 487, CS 499T, STAT 440',
          1,
          {
            union: [
              { range: { subject: 'CS', from: 440, to: 498 } },
              { range: { subject: 'CS', from: 600, to: 799 } },
              { list: ['CO487', 'CS499T', 'STAT440'] },
            ],
          },
          { note: 'CS 600-level courses are not allowed when an equivalent 400-level course exists; CS 700-level courses need instructor and advisor permission.' },
        ),
      ],
    },
  ],
})
