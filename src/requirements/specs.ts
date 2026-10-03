/**
 * The eight CS specializations available to BCS students, 2026/27 calendar.
 * Within a specialization a course fulfils at most one requirement; courses may
 * also count toward the BCS major. See docs/research/bcs-calendar-2026-27.md.
 */
import type { Program, SpecId } from '@/domain/requirements'
import { CALENDAR_BASE, CHECKLIST_BASE, oneOf, pick } from './helpers'

const AI_LIST = [
  'AMATH449', 'BIOL487', 'CO367', 'CO456', 'CO463', 'CO466', 'CS452', 'CS479', 'CS480', 'CS484',
  'CS485', 'ECE380', 'ECE423', 'ECE457C', 'ECE481', 'ECE486', 'ECE488', 'ECE495', 'MTE544',
  'SE380', 'STAT341', 'STAT440', 'STAT441', 'STAT444', 'SYDE552', 'SYDE556', 'SYDE572',
]

const BUS_APPROVED = [
  'ACTSC231', 'ACTSC372', 'AFM101', 'AFM102', 'BUS121W', 'BUS362W', 'BUS381W', 'BUS491W',
  'COMM101', 'COMM400', 'COMM432', 'ECON101', 'ECON102', 'HRM200', 'MGMT220', 'MSE311',
  'AFM131', 'ARBUS101', 'BUS111W', 'MSE211', 'PSYCH238',
]

const HCI_SOCIAL = [
  'BET360', 'CS492', 'GSJ205', 'MSE442', 'PACS315', 'SOC232', 'STV202', 'STV205', 'STV208',
  'STV210', 'STV302', 'STV304', 'STV305', 'STV306',
]
const HCI_HUMAN = [
  'ENGL108D', 'ENGL293', 'ENGL295', 'FINE100', 'FINE150', 'INTEG121', 'INTEG251', 'KIN320',
  'PSYCH207', 'PSYCH261', 'STAT332', 'STAT430', 'VCULT257',
]
const HCI_CS = [
  'CS454', 'CS480', 'CS484', 'CS486', 'CS488', 'CS445', 'ECE451', 'SE463', 'CS446', 'ECE452',
  'SE464', 'CS447', 'ECE453', 'SE465', 'CS453', 'CS459',
]

const SE_SOCIAL = [
  'BET360', 'BET420', 'CS492', 'ENVS205', 'GEOG207', 'GEOG306', 'GSJ205', 'MSE422', 'MSE442',
  'PACS315', 'SCI205', 'SOC232', 'SOC324', 'STV202', 'STV205', 'STV306',
]
const SE_ADVANCED = [
  'CS442', 'CS444', 'CS448', 'CS449', 'CS450', 'CS451', 'CS452', 'CS453', 'CS454', 'CS456',
  'CS457', 'CS459', 'CS480', 'CS484', 'CS486', 'CS488',
]

function spec(
  id: SpecId,
  name: string,
  pid: string,
  rest: Omit<Program, 'id' | 'kind' | 'name' | 'shortName' | 'calendarUrl' | 'checklistUrl' | 'enrolmentCode'>,
): Program {
  return {
    id,
    kind: 'spec',
    name: `${name} Specialization`,
    shortName: name,
    calendarUrl: `${CALENDAR_BASE}/${pid}`,
    checklistUrl: `${CHECKLIST_BASE}/2026-present-bcs-${id}1.pdf`,
    enrolmentCode: `CS-${name} Specialization`,
    ...rest,
  }
}

export const SPECS: Record<SpecId, Program> = {
  ai: spec('ai', 'Artificial Intelligence', 'H1vJJCCj3', {
    sections: [
      {
        id: 'ai-core',
        label: 'Required courses',
        slots: [
          oneOf('ai-cs486', ['CS486']),
          oneOf('ai-cs492', ['CS492'], 0.5, 'CS 497 may be substituted for CS 492 depending on the topic (advisor approval).'),
          oneOf('ai-ml', ['CS480', 'CS485']),
        ],
      },
      {
        id: 'ai-list',
        label: '4 courses from the AI list (≥1 Math, ≥1 Engineering)',
        slots: [
          pick('ai-list-math', 'One Faculty of Mathematics course from the AI list', 1, {
            intersect: [{ list: AI_LIST }, { faculty: ['MAT'] }],
          }),
          pick('ai-list-eng', 'One Faculty of Engineering course from the AI list', 1, {
            intersect: [{ list: AI_LIST }, { faculty: ['ENG'] }],
          }),
          pick('ai-list-any', 'Two more courses from the AI list', 2, { list: AI_LIST }),
        ],
      },
    ],
    notes: ['Only one course from any cross-listed set may be used.'],
  }),

  bio: spec('bio', 'Bioinformatics', 'r17wJ10As2', {
    sections: [
      {
        id: 'bio-required',
        label: 'Required courses',
        slots: [
          oneOf('bio-biol130', ['BIOL130']),
          oneOf('bio-biol130l', ['BIOL130L'], 0.25),
          oneOf('bio-biol239', ['BIOL239']),
          oneOf('bio-biol240', ['BIOL240']),
          oneOf('bio-biol240l', ['BIOL240L'], 0.25),
          oneOf('bio-biol308', ['BIOL308']),
          oneOf('bio-biol365', ['BIOL365']),
          oneOf('bio-biol465', ['BIOL465']),
          oneOf('bio-chem120', ['CHEM120']),
          oneOf('bio-chem120l', ['CHEM120L'], 0.25),
          oneOf('bio-chem123', ['CHEM123']),
          oneOf('bio-chem123l', ['CHEM123L'], 0.25),
          oneOf('bio-cs482', ['CS482']),
        ],
      },
    ],
  }),

  bus: spec('bus', 'Business', 'S1eD1J0Aj2', {
    sections: [
      {
        id: 'bus-core',
        label: 'Required courses',
        slots: [
          pick('bus-two', '2 of ACTSC 447 / CS 348 / CS 476 / CS 490', 2, {
            list: ['ACTSC447', 'CS348', 'CS476', 'CS490'],
          }, {
            maxFrom: [{ set: { list: ['ACTSC447', 'CS476'] }, max: 1, label: 'ACTSC 447 and CS 476 are cross-listed' }],
          }),
          {
            id: 'bus-approved',
            label: '2.5 units from the approved business list',
            units: 2.5,
            from: { list: BUS_APPROVED },
            kind: 'elective',
            maxFrom: [
              { set: { list: ['AFM131', 'ARBUS101', 'BUS111W'] }, max: 1, label: 'At most one of AFM 131 / ARBUS 101 / BUS 111W' },
              { set: { list: ['MSE211', 'PSYCH238'] }, max: 1, label: 'At most one of MSE 211 / PSYCH 238' },
            ],
          },
        ],
      },
    ],
    levelFloors: [
      {
        id: 'bus-200',
        label: 'At least two approved-list courses at the 200-level or higher',
        slots: ['bus-approved'],
        units: 1,
        level: 200,
        absorbingSlot: 'bus-approved',
      },
    ],
    notes: ['Only one course from any cross-listed set may be used.'],
  }),

  cfa: spec('cfa', 'Computational Fine Art', 'SkLD1kC0jh', {
    sections: [
      {
        id: 'cfa-required',
        label: 'Required courses',
        slots: [
          oneOf('cfa-cs349', ['CS349']),
          oneOf('cfa-cs488', ['CS488']),
          oneOf('cfa-383', ['CS383', 'FINE383']),
          oneOf('cfa-fine1', ['FINE100', 'FINE130']),
          oneOf('cfa-fine2', ['FINE228', 'FINE247']),
          oneOf('cfa-vcult', ['VCULT200', 'VCULT257']),
        ],
      },
    ],
  }),

  dhw: spec('dhw', 'Digital Hardware', 'H1Svy1R0jh', {
    sections: [
      {
        id: 'dhw-required',
        label: 'Required courses',
        slots: [
          oneOf('dhw-ece124', ['ECE124']),
          oneOf('dhw-ece222', ['ECE222']),
          oneOf('dhw-ece327', ['ECE327']),
          oneOf('dhw-ece423', ['ECE423']),
          oneOf('dhw-arch', ['CS450', 'ECE320']),
          pick('dhw-sys', '2 of CS 452 / 454 / 456 / 457', 2, { list: ['CS452', 'CS454', 'CS456', 'CS457'] }),
          oneOf('dhw-micro', ['ECE224', 'MTE325']),
          oneOf('dhw-circuits', ['GENE123', 'MTE120']),
        ],
      },
    ],
    coreOverrides: [{ slot: 'cs251', add: ['ECE222'], note: 'Digital Hardware: ECE 222 replaces the CS 251 requirement.' }],
    notes: [
      'Apply during 1A with a minimum cumulative average of 75%; enrolment is limited.',
      'Does not qualify for the professional engineering designation.',
    ],
  }),

  gd: spec('gd', 'Game Design', 'HkTtesszA', {
    sections: [
      {
        id: 'gd-required',
        label: 'Required courses',
        slots: [
          oneOf('gd-dac204', ['DAC204']),
          oneOf('gd-dac305', ['DAC305']),
          pick('gd-design', '1 design course', 1, {
            list: ['COMMST149', 'DAC209', 'DAC302', 'DAC309', 'ENGL392A', 'ENGL392B', 'ENGL408C', 'FINE247', 'THPERF149'],
          }),
          pick('gd-media', '1 media & culture course', 1, {
            list: ['COMMST210', 'COMMST339', 'COMMST430', 'COMMST435', 'ENGL293', 'GSJ205', 'SOC324'],
          }),
          oneOf('gd-games', ['COMMST235', 'ENGL294']),
          pick('gd-cs', '2 of CS 449 / 454 / 488', 2, { list: ['CS449', 'CS454', 'CS488'] }),
        ],
      },
    ],
  }),

  hci: spec('hci', 'Human-Computer Interaction', 'rkP1y00ih', {
    sections: [
      {
        id: 'hci-required',
        label: 'Required courses',
        slots: [
          oneOf('hci-cs349', ['CS349']),
          oneOf('hci-cs449', ['CS449']),
          pick('hci-social', '1 technology & society course', 1, { list: HCI_SOCIAL }),
          pick('hci-human', '2 human-factors / design courses', 2, { list: HCI_HUMAN }),
          pick('hci-cs', '2 advanced CS / software courses', 2, { list: HCI_CS }, {
            maxFrom: [
              { set: { list: ['CS445', 'ECE451', 'SE463'] }, max: 1, label: 'At most one of CS 445 / ECE 451 / SE 463' },
              { set: { list: ['CS446', 'ECE452', 'SE464'] }, max: 1, label: 'At most one of CS 446 / ECE 452 / SE 464' },
              { set: { list: ['CS447', 'ECE453', 'SE465'] }, max: 1, label: 'At most one of CS 447 / ECE 453 / SE 465' },
              { set: { list: ['CS453', 'CS459'] }, max: 1, label: 'At most one of CS 453 / CS 459' },
            ],
          }),
        ],
      },
    ],
    notes: ['Only one course from any cross-listed set may be used.'],
  }),

  se: spec('se', 'Software Engineering', 'S1v11A0sn', {
    sections: [
      {
        id: 'se-required',
        label: 'Required courses',
        slots: [
          pick('se-social', '1 technology & society course', 1, { list: SE_SOCIAL }),
          pick('se-systems', '2 of CS 343 / 346 / 348 / 349', 2, { list: ['CS343', 'CS346', 'CS348', 'CS349'] }),
          pick('se-advanced', '2 advanced CS courses', 2, { list: SE_ADVANCED }, {
            maxFrom: [{ set: { list: ['CS453', 'CS459'] }, max: 1, label: 'At most one of CS 453 / CS 459' }],
          }),
          oneOf('se-req', ['CS445', 'ECE451']),
          oneOf('se-design', ['CS446', 'ECE452']),
          oneOf('se-test', ['CS447', 'ECE453']),
        ],
      },
    ],
    notes: ['Does not qualify for the professional engineering designation.'],
  }),
}

export const SPEC_IDS = Object.keys(SPECS) as SpecId[]
