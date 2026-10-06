import { readFileSync } from 'node:fs'
import { beforeAll, describe, expect, it } from 'vitest'
import type { Plan } from '@/domain/plan'
import type { Catalog } from '@/domain/types'
import { bcsCore } from '@/requirements/bcs'
import { MAJORS } from '@/requirements/majors'
import { SPECS } from '@/requirements/specs'
import { type CatalogIndex, buildIndex } from './catalog'
import { defaultEquivalences, inferSequence, parseTranscript, planFromTranscript } from './transcript'

let idx: CatalogIndex
beforeAll(() => {
  idx = buildIndex(JSON.parse(readFileSync('public/data/catalog.json', 'utf8')) as Catalog)
})

/** Synthetic transcript in the layout pdf.js lines produce (two-space column joins). */
const TRANSCRIPT = `University of Waterloo  Page 1 of 2
Undergraduate Unofficial Transcript
Name:  Doe, Jane
Student ID:  20000000
Beginning of Undergraduate Record
Fall 2025
Program:  Computer Science, Honours, Co-operative Program
Level:  1A  Load: Full-Time  Form Of Study: Enrolment
Course  Description  Attempted  Earned  Grade
CS  135  Designing Functional Programs  0.50  0.50  88
MATH  135  Algebra for Honours Mathematics  0.50  0.50  71
MATH  137  Calculus 1 for Honours Mathematics  0.50  0.50  45
SPCOM  223  Public Speaking  0.50  0.50  80
ECON  101  Introduction to Microeconomics  0.50  0.00  WD
In GPA  Earned
Term GPA  70.00  Term Totals  2.50  2.00
Winter 2026
Program:  Computer Science/Artificial Intelligence Specialization, Honours, Co-operative Program
Level:  1B  Load: Full-Time  Form Of Study: Enrolment
Course  Description  Attempted  Earned  Grade
CS  136  Elementary Algorithm Design and Data Abstraction  0.50  0.50  90
MATH  137  Calculus 1 for Honours Mathematics  0.50  0.50  65
PD  1  Career Fundamentals  0.50  0.00  CR
ECE 105=PHYS 121, SE 101 + COOP1 = PD1
Spring 2026
Level:  1B  Load: Part-Time  Form Of Study: Co-op Work Term
Course  Description  Attempted  Earned  Grade
COOP  1  Co-operative Work Term  0.50  0.00  CR
PD  11  Processes for Technical Report Writing  0.50  0.00  CR
Fall 2026
Level:  2A  Load: Full-Time  Form Of Study: Enrolment
Course  Description  Attempted  Earned  Grade
CS  245  Logic and Computation
MATH  239  Introduction to Combinatorics
STAT  230  Probability
ECE  105  Classical Mechanics  0.50  0.50  80
Milestones
Date Completed  Description  Status
Transfer Credits
Transfer Credit from IB
Course  Nbr  Description  Earned
CHEM  120  General Chemistry 1  0.50
MATH  1XX  MATH Transfer Credit  0.50
End of Undergraduate Unofficial Transcript`

const BASE: Plan = {
  version: 2,
  major: 'bcs',
  sequence: 'coop2',
  startTerm: '1269',
  specs: [],
  wtLimit: 1,
  placements: {},
  completedThrough: -1,
}

describe('parseTranscript', () => {
  const s = parseTranscript(TRANSCRIPT)

  it('reads terms, levels, work terms and the latest program', () => {
    expect(s.terms.map((t) => [t.termCode, t.level, t.workTerm])).toEqual([
      ['1259', '1A', false],
      ['1261', '1B', false],
      ['1265', '1B', true],
      ['1269', '2A', false],
    ])
    expect(s.program).toMatch(/Artificial Intelligence Specialization/)
  })

  it('classifies grades: failing and withdrawn rows earn no credit, CR passes, ungraded is in progress', () => {
    const status = Object.fromEntries(s.terms.flatMap((t) => t.courses.map((c) => [`${t.termCode}:${c.code}`, c.status])))
    expect(status['1259:MATH137']).toBe('failed')
    expect(status['1259:ECON101']).toBe('failed')
    expect(status['1261:PD1']).toBe('passed')
    expect(status['1269:CS245']).toBe('in-progress')
    expect(status['1269:ECE105']).toBe('passed')
  })

  it('collects transfer credits and only one-to-one equivalence notes', () => {
    expect(s.transfer.map((c) => c.code)).toEqual(['CHEM120', 'MATH1XX'])
    expect(s.equivalences).toEqual([{ from: 'ECE105', to: 'PHYS121' }])
  })

  it('never keeps identifying lines', () => {
    expect(JSON.stringify(s)).not.toMatch(/Jane|20000000/)
  })
})

describe('planFromTranscript', () => {
  it('places courses by term offset, skips no-credit rows and sets completed terms', () => {
    const s = parseTranscript(TRANSCRIPT)
    // Consistent with the user's co-op sequence → kept; the regular sequence has no work terms → replaced.
    const sequences = MAJORS.bcs.sequences
    const sequence = inferSequence(s, 'coop2', sequences)
    expect(sequence).toBe('coop2')
    expect(inferSequence(s, 'regular', sequences)).not.toBe('regular')
    const { plan, skipped } = planFromTranscript(BASE, s, idx, {
      major: 'bcs',
      sequence,
      specs: ['ai'],
      equivalences: ['ECE105'],
    })
    expect(plan.startTerm).toBe('1259')
    expect(plan.placements).toEqual({
      transfer: ['CHEM120'],
      t0: ['CS135', 'MATH135', 'COMMST223'],
      t1: ['CS136', 'MATH137', 'PD1'],
      t2: ['PD11'],
      t3: ['CS245', 'MATH239', 'STAT230', 'PHYS121'],
    })
    expect(plan.completedThrough).toBe(2)
    expect(plan.specs).toEqual(['ai'])
    expect(Object.fromEntries(skipped.map((x) => [`${x.termCode ?? 'transfer'}:${x.code}`, x.reason]))).toMatchObject({
      '1259:MATH137': expect.stringMatching(/No credit/),
      '1259:ECON101': expect.stringMatching(/No credit \(WD\)/),
      'transfer:MATH1XX': expect.stringMatching(/Unspecified/),
      '1265:COOP1': expect.stringMatching(/Co-op/),
    })
  })

  it('keeps later planned terms only when the 1A term is unchanged', () => {
    const s = parseTranscript(TRANSCRIPT)
    const existing: Plan = { ...BASE, startTerm: '1259', placements: { t3: ['CS245', 'CS246'], t5: ['CS341'] } }
    const { plan } = planFromTranscript(existing, s, idx, { major: 'bcs', sequence: 'coop2', specs: [], equivalences: [] })
    expect(plan.placements.t5).toEqual(['CS341'])
    expect(plan.placements.t3).not.toContain('CS246')
  })
})

/** Current Quest "Unofficial Grade Report": newest term first, grade-only column, SEQ row. */
const GRADE_REPORT = `UNIVERSITY OF WATERLOO
UNOFFICIAL GRADE REPORT
3A  Computer Science, Honours, Co-operative Program
Winter 2025
CS  251  Computer Organization & Design  83
CS  240E  Data Structure & Mgmt (Enrich)  WD
PHYS  111  Physics 1  95
EMLS  129R  Written Academic English  88
Term Average:  86.5  Decision:  Excellent Standing
Fall 2025
CS  240  Data Structures & Data Mgmt
PHYS  112  Physics 2
Fall 2024
PD  11  Technical Report Writing  CR
COOP  1  Co-operative Work Term  CR
Fall 2023
CS  135  Designing Functional Programs  94
SEQ  4  Co-op Sequence 4
Page 1 of 1`

describe('grade report format', () => {
  const s = parseTranscript(GRADE_REPORT)

  it('orders terms, reads the stated sequence and keeps titles ending in digits intact', () => {
    expect(s.terms.map((t) => t.termCode)).toEqual(['1239', '1249', '1251', '1259'])
    expect(s.sequenceHint).toBe('coop4')
    expect(inferSequence(s, 'coop1', MAJORS.bcs.sequences)).toBe('coop4')
    expect(s.program).toBe('Computer Science, Honours, Co-operative Program')
    const fall25 = s.terms.at(-1)?.courses
    expect(fall25?.map((c) => [c.code, c.title, c.status])).toEqual([
      ['CS240', 'Data Structures & Data Mgmt', 'in-progress'],
      ['PHYS112', 'Physics 2', 'in-progress'],
    ])
  })

  it('maps old "R" codes, skips withdrawn courses and stops completed terms at the current one', () => {
    const { plan, skipped } = planFromTranscript(BASE, s, idx, { major: 'bcs', sequence: 'coop4', specs: [], equivalences: [] })
    expect(plan.placements.t4).toEqual(['CS251', 'PHYS111', 'EMLS129'])
    expect(plan.placements.t6).toEqual(['CS240', 'PHYS112'])
    expect(plan.completedThrough).toBe(5)
    expect(skipped.map((x) => x.code)).toEqual(['COOP1', 'CS240E'])
  })
})

describe('defaultEquivalences', () => {
  it('skips equivalences whose original course already fills a selected requirement', () => {
    const s = parseTranscript('Fall 2025\nLevel: 2A\nECE 222=CS 251, CS 137=CS 135')
    expect(defaultEquivalences(s, [bcsCore], idx)).toEqual(['ECE222', 'CS137'])
    expect(defaultEquivalences(s, [bcsCore, SPECS.dhw], idx)).toEqual(['CS137'])
  })
})
