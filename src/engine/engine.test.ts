import { readFileSync } from 'node:fs'
import { beforeAll, describe, expect, it } from 'vitest'
import type { Plan } from '@/domain/plan'
import type { Program } from '@/domain/requirements'
import type { Catalog } from '@/domain/types'
import { oneOf } from '@/requirements/helpers'
import { normalizePlan, parsePlanJson } from '@/store/plan'
import { type CatalogIndex, allocate, auditPlan, buildIndex, classify, detectMajor, placementKey, validatePlan } from './index'

let idx: CatalogIndex
beforeAll(() => {
  const catalog = JSON.parse(readFileSync('public/data/catalog.json', 'utf8')) as Catalog
  idx = buildIndex(catalog)
})

/** A complete BCS (co-op sequence 1) plan: 20.0+ units, all core requirements. */
const FULL: Record<string, string[]> = {
  t0: ['CS135', 'MATH135', 'MATH137', 'ENGL109', 'PSYCH101', 'PD1'],
  t1: ['CS136', 'CS136L', 'MATH136', 'MATH138', 'ECON101'],
  t2: ['PD11'],
  t3: ['CS245', 'CS246', 'MATH239', 'STAT230', 'EARTH121'],
  t4: ['PD10'],
  t5: ['CS240', 'CS241', 'CS251', 'STAT231', 'COMMST223'],
  t6: ['PD3'],
  t7: ['CS341', 'CS350', 'CS343', 'CS348', 'GEOG101'],
  t8: ['PD4'],
  t9: ['CS349', 'CS442', 'CS486', 'PHIL145', 'EARTH122'],
  t11: ['CS444', 'CS456', 'CS451', 'PSYCH207', 'ECON102'],
  t13: ['CS480', 'CS454', 'CS488', 'SOC101', 'SOC201', 'MUSIC140'],
}

function plan(overrides: Partial<Plan> = {}): Plan {
  return {
    version: 2,
    major: 'bcs',
    sequence: 'coop1',
    startTerm: '1259',
    specs: [],
    wtLimit: 1,
    placements: structuredClone(FULL),
    completedThrough: -1,
    breadthRule: 'elective',
    ...overrides,
  }
}

const core = (p: Plan) => auditPlan(p, idx).programs.find((x) => x.program.id === 'core')!
const slot = (p: Plan, id: string) => core(p).allocation.slots.find((s) => s.slot.id === id)!

describe('audit', () => {
  it('accepts a complete BCS plan', () => {
    const a = auditPlan(plan(), idx)
    const failing = a.programs.flatMap((p) => [
      ...p.allocation.slots.filter((s) => !s.satisfied).map((s) => `${p.program.id}:${s.slot.id}`),
      ...p.allocation.floors.filter((f) => !f.satisfied).map((f) => f.floor.id),
      ...p.totals.filter((t) => !t.satisfied).map((t) => `${t.id} ${t.have}`),
    ])
    expect(failing).toEqual([])
  })

  it('flags a missing required course', () => {
    const p = plan()
    p.placements.t7 = p.placements.t7.filter((c) => c !== 'CS350')
    expect(slot(p, 'cs350').satisfied).toBe(false)
    expect(classify(p, auditPlan(p, idx), idx).byCode.get('CS350')?.status).toBe('must')
  })

  it('counts only one of an antirequisite pair (CS 240 / CS 240E)', () => {
    const p = plan()
    p.placements.t9 = [...p.placements.t9, 'CS240E']
    const a = auditPlan(p, idx)
    expect(a.excluded.map((e) => e.code)).toContain('CS240E')
  })

  it('keeps communication courses out of breadth', () => {
    const p = plan({ placements: { t0: ['ENGL109', 'COMMST223'] } })
    expect(slot(p, 'comm1').satisfied).toBe(true)
    expect(slot(p, 'comm2').satisfied).toBe(true)
    expect(slot(p, 'breadthA').filled).toBe(0)
  })

  it('requires 1.0 breadth unit at the 200-level or higher', () => {
    const p = plan()
    p.placements.t11 = p.placements.t11.map((c) => (c === 'PSYCH207' ? 'PSYCH101R' : c))
    const floor = core(p).allocation.floors.find((f) => f.floor.id === 'breadth200')!
    expect(floor.satisfied).toBe(false)
  })

  it('lets ECE 222 replace CS 251 under Digital Hardware', () => {
    const p = plan({ specs: ['dhw'] })
    p.placements.t5 = p.placements.t5.map((c) => (c === 'CS251' ? 'ECE222' : c))
    expect(slot(p, 'cs251').satisfied).toBe(true)
    expect(slot(plan({}), 'cs251').satisfied).toBe(true)
    const noSpec = plan()
    noSpec.placements.t5 = noSpec.placements.t5.map((c) => (c === 'CS251' ? 'ECE222' : c))
    expect(slot(noSpec, 'cs251').satisfied).toBe(false)
  })

  it('enforces "at most one of" groups (HCI)', () => {
    const p = plan({ specs: ['hci'] })
    p.placements.t13 = [...p.placements.t13, 'CS445', 'SE463']
    const hci = auditPlan(p, idx).programs.find((x) => x.program.id === 'hci')!
    const s = hci.allocation.slots.find((x) => x.slot.id === 'hci-cs')!
    // CS 480 + CS 454 already fill it; the cap only matters for the 445/463 pair.
    expect(s.courses.filter((c) => c === 'CS445' || c === 'SE463').length).toBeLessThanOrEqual(1)
  })

  it('needs an Engineering course in the AI list', () => {
    const p = plan({ specs: ['ai'] })
    p.placements.t13 = [...p.placements.t13, 'CS492', 'CS485', 'CS484', 'STAT441', 'CO367']
    const ai = auditPlan(p, idx).programs.find((x) => x.program.id === 'ai')!
    expect(ai.allocation.slots.find((s) => s.slot.id === 'ai-list-eng')?.satisfied).toBe(false)
    expect(ai.allocation.slots.find((s) => s.slot.id === 'ai-list-math')?.satisfied).toBe(true)
  })
})

describe('breadth & depth rule (2025/26 and earlier)', () => {
  const legacy = (overrides: Partial<Plan> = {}) => plan({ breadthRule: 'breadth-depth', ...overrides })
  const breadth = (p: Plan) => auditPlan(p, idx).programs.find((x) => x.program.id === 'breadth')!
  const legacySlot = (p: Plan, id: string) => breadth(p).allocation.slots.find((s) => s.slot.id === id)!

  it('defaults to breadth & depth for 1A terms before Fall 2026', () => {
    const ids = (p: Plan) => auditPlan(p, idx).programs.map((x) => x.program.id)
    expect(ids(plan({ breadthRule: undefined, startTerm: '1239' }))).toContain('breadth')
    expect(ids(plan({ breadthRule: undefined, startTerm: '1269' }))).not.toContain('breadth')
    expect(ids(plan({ breadthRule: 'elective', startTerm: '1239' }))).not.toContain('breadth')
  })

  it('fills the four breadth categories by subject and drops the elective section', () => {
    const p = legacy()
    expect(breadth(p).allocation.slots.every((s) => s.satisfied)).toBe(true)
    expect(core(p).allocation.slots.some((s) => s.slot.id.startsWith('breadth'))).toBe(false)
    const sciences = ['pureSciences', 'pureAppliedSciences'].flatMap((id) => legacySlot(p, id).courses)
    expect(sciences.sort()).toEqual(['EARTH121', 'EARTH122'])
  })

  it('ignores PD and other non-degree courses for depth', () => {
    const p = legacy({ placements: { t0: ['PD1'], t2: ['PD11'], t4: ['PD10'] } })
    expect(breadth(p).allocation.depth).toMatchObject({ satisfied: false, units: 0 })
  })

  it('keeps List 1 courses out of Humanities but lets a List 2 ENGL course count twice', () => {
    const p = legacy({ placements: { t0: ['ENGL109', 'COMMST223'] } })
    expect(legacySlot(p, 'humanities').filled).toBe(0)
    const withList2 = legacy({ placements: { t0: ['ENGL109', 'ENGL119'] } })
    expect(slot(withList2, 'comm2').courses).toEqual(['ENGL119'])
    expect(legacySlot(withList2, 'humanities').courses).toEqual(['ENGL119'])
    // Under the 2026/27 rule ENGL 119 is a List 1 course instead.
    expect(slot(plan({ placements: { t0: ['ENGL109', 'ENGL119'] } }), 'comm1').satisfied).toBe(true)
  })

  it('requires depth: 1.5 units in one subject with a 300-level course or a chain of three', () => {
    const p = legacy()
    expect(breadth(p).allocation.depth?.satisfied).toBe(false)
    expect(breadth(p).allocation.satisfied).toBe(false)

    const upper = legacy()
    upper.placements.t13 = [...upper.placements.t13, 'PSYCH312']
    expect(breadth(upper).allocation.depth).toMatchObject({ satisfied: true, subject: 'PSYCH', via: 'upper' })

    const chain = legacy({ placements: { t0: ['PHYS111'], t1: ['PHYS112'], t3: ['PHYS256'] } })
    expect(breadth(chain).allocation.depth).toMatchObject({
      satisfied: true,
      subject: 'PHYS',
      via: 'chain',
      courses: ['PHYS111', 'PHYS112', 'PHYS256'],
    })
  })

  it('marks courses that advance depth in subjects already started', () => {
    const p = legacy({ placements: { t0: ['PHYS111'], t1: ['PHYS112'] } })
    const r = classify(p, auditPlan(p, idx), idx).byCode
    expect(r.get('PHYS256')?.slots.some((s) => s.slotId === 'depth')).toBe(true)
    expect(r.get('PSYCH312')?.slots.some((s) => s.slotId === 'depth')).toBe(false)
  })
})

describe('choices between course groups', () => {
  const program: Program = {
    id: 'core',
    kind: 'core',
    name: 'Test',
    shortName: 'Test',
    calendarUrl: '',
    sections: [
      {
        id: 'analysis',
        label: 'Analysis',
        slots: [oneOf('stat230', ['STAT230'])],
        choices: [
          {
            id: 'calc',
            label: 'Calculus path',
            options: [
              { id: 'adv', label: 'MATH 247', slots: [oneOf('math247', ['MATH247'])] },
              { id: 'reg', label: 'MATH 237 and PMATH 333', slots: [oneOf('math237', ['MATH237']), oneOf('pmath333', ['PMATH333'])] },
            ],
          },
        ],
      },
    ],
  }

  it('counts whichever option is complete', () => {
    const a = allocate(program, ['STAT230', 'MATH237', 'PMATH333'], idx)
    expect(a.satisfied).toBe(true)
    expect(a.choices.map((c) => [c.option.id, c.satisfied])).toEqual([['reg', true]])
    expect(allocate(program, ['STAT230', 'MATH247'], idx).choices[0]).toMatchObject({ satisfied: true, option: { id: 'adv' } })
  })

  it('stays unmet while no single option is complete', () => {
    const a = allocate(program, ['STAT230', 'MATH237'], idx)
    expect(a.satisfied).toBe(false)
    expect(a.deficit).toBe(0.5)
  })

  it('lets one course meet List A and every option of a choice (Mathematical Finance)', () => {
    const p = plan({ major: 'mathfin', breadthRule: undefined, placements: { t0: ['MATH237', 'PMATH333'] } })
    const core = auditPlan(p, idx).programs.find((x) => x.program.id === 'core')!
    expect(core.allocation.choices.find((c) => c.choice.id === 'calculus-3')).toMatchObject({
      satisfied: true,
      option: { id: 'math237-pmath333' },
    })
  })

  it('treats options as alternatives, not as must-take courses', () => {
    const p = plan({ major: 'mathfin', breadthRule: undefined, placements: {} })
    const r = classify(p, auditPlan(p, idx), idx).byCode
    expect(r.get('MATH247')?.status).toBe('counts')
    expect(r.get('PMATH333')?.status).toBe('counts')
  })
})

describe('Faculty of Mathematics majors', () => {
  const LIST_A_COURSES = ['CS135', 'CS136', 'MATH135', 'MATH136', 'MATH137', 'MATH138', 'MATH235', 'STAT230', 'STAT231']
  const stat = (placements: Record<string, string[]>) =>
    plan({ major: 'stat', breadthRule: undefined, placements })

  it('lets one course meet a List A requirement and a narrower major requirement', () => {
    const a = auditPlan(stat({ t0: [...LIST_A_COURSES, 'MATH237'] }), idx)
    const core = a.programs.find((p) => p.program.id === 'core')!
    const listA = new Set(core.program.sections.find((s) => s.id === 'list-a')!.slots.map((s) => s.id))
    expect(core.allocation.slots.filter((s) => listA.has(s.slot.id) && !s.satisfied)).toEqual([])
    expect(core.allocation.slots.find((s) => s.slot.id === 'math237')?.satisfied).toBe(true)
  })

  it('counts ENGL 378 for both the Statistics major and the communication requirement', () => {
    const a = auditPlan(stat({ t0: ['ENGL109', 'ENGL378'] }), idx)
    const core = a.programs.find((p) => p.program.id === 'core')!
    const communication = a.programs.find((p) => p.program.id === 'communication')!
    expect(core.allocation.slots.find((s) => s.slot.id === 'engl378')?.courses).toEqual(['ENGL378'])
    expect(communication.allocation.satisfied).toBe(true)
  })

  it('applies the 2026/27 calendar to non-BCS majors whatever the 1A term', () => {
    const ids = (p: Plan) => auditPlan(p, idx).programs.map((x) => x.program.id)
    expect(ids(plan({ major: 'stat', breadthRule: undefined, startTerm: '1239' }))).not.toContain('breadth')
    expect(ids(plan({ breadthRule: undefined, startTerm: '1239' }))).toContain('breadth')
  })

  it('reads the major from the transcript program line', () => {
    expect(detectMajor('Statistics, Honours, Co-operative Program', 'bcs')).toBe('stat')
    expect(detectMajor('Computer Science/Artificial Intelligence Specialization, Honours', 'cs-bmath')).toBe('cs-bmath')
    expect(detectMajor('Computer Science, Honours, Co-operative Program', 'stat')).toBe('bcs')
    expect(detectMajor('Honours Science, Regular Program', 'stat')).toBeNull()
  })
})

describe('stored plans', () => {
  it('migrates version 1 plans to BCS and keeps settings valid for the major', () => {
    const v1 = { version: 1, sequence: 'coop4', startTerm: '1239', specs: ['ai'], placements: { t0: ['CS135'] } }
    expect(parsePlanJson(JSON.stringify(v1))).toMatchObject({ version: 2, major: 'bcs', sequence: 'coop4', specs: ['ai'] })
    const cpa = normalizePlan({ ...v1, major: 'mathcpa', breadthRule: 'breadth-depth' } as Partial<Plan>)
    expect(cpa).toMatchObject({ major: 'mathcpa', sequence: 'cpa', specs: [] })
    expect(cpa.breadthRule).toBeUndefined()
    expect(normalizePlan({ major: 'removed-major' }).major).toBe('bcs')
  })
})

describe('classify', () => {
  it('marks unique requirements as must and variant groups as required on an empty plan', () => {
    const p = plan({ placements: {} })
    const r = classify(p, auditPlan(p, idx), idx).byCode
    expect(r.get('CS341')?.status).toBe('must')
    expect(r.get('CS136L')?.status).toBe('must')
    expect(r.get('CS240')?.status).toBe('required')
    expect(r.get('CS240E')?.status).toBe('required')
    expect(r.get('CS486')?.status).toBe('counts')
  })

  it('promotes unavoidable prerequisites of must courses', () => {
    const p = plan({ specs: ['ai'], placements: {} })
    const r = classify(p, auditPlan(p, idx), idx).byCode
    expect(r.get('CS486')?.status).toBe('must')
  })

  it('blocks antirequisites of placed courses', () => {
    const p = plan({ placements: { t3: ['CS240'] } })
    const r = classify(p, auditPlan(p, idx), idx).byCode
    expect(r.get('CS240E')?.status).toBe('blocked')
  })
})

describe('validatePlan', () => {
  it('flags prerequisites placed too early', () => {
    const p = plan({ placements: { t0: ['CS341'] } })
    const v = validatePlan(p, idx)
    expect(v.byPlacement.get(placementKey('t0', 'CS341'))?.some((i) => i.kind === 'prereq')).toBe(true)
  })

  it('limits work-term course load', () => {
    const p = plan({ placements: { t2: ['PSYCH101', 'ECON101', 'PD11'] } })
    expect(validatePlan(p, idx).byTerm.get('t2')?.some((i) => i.kind === 'load')).toBe(true)
    expect(validatePlan({ ...p, wtLimit: 2 }, idx).byTerm.get('t2')?.some((i) => i.kind === 'load')).toBe(false)
  })
})
