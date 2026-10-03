import { describe, expect, it } from 'vitest'
import fixtures from '../__fixtures__/requisites.json'
import { parseAntirequisites, parseRequisite } from './requisites'

const html = fixtures as Record<string, string>

describe('parseRequisite', () => {
  it('parses a nested all-of with course alternatives and a program rule (CS 341)', () => {
    const r = parseRequisite(html['CS341.prerequisites'])
    expect(r?.kind).toBe('all')
    if (r?.kind !== 'all') return
    expect(r.of[0]).toEqual({
      kind: 'atLeast',
      n: 1,
      of: [
        { kind: 'course', code: 'CS240' },
        { kind: 'course', code: 'CS240E' },
      ],
    })
    const program = r.of.find((x) => x.kind === 'program')
    expect(program).toMatchObject({ kind: 'program', mode: 'in' })
    expect(program?.kind === 'program' && program.programs).toContain('H-Computer Science (BCS)')
  })

  it('keeps minimum grades on course leaves (CS 136)', () => {
    const r = parseRequisite(html['CS136.prerequisites'])
    expect(r).toMatchObject({ kind: 'atLeast', n: 1 })
    expect(JSON.stringify(r)).toContain('"code":"CS135","minGrade":60')
  })

  it('reads plain-text course lists wrapped in a div (BUS 247W)', () => {
    const r = parseRequisite(html['BUS247W.prerequisites'])
    expect(r).toEqual({
      kind: 'atLeast',
      n: 1,
      of: [
        { kind: 'course', code: 'AFM101' },
        { kind: 'course', code: 'BUS127W' },
      ],
    })
  })

  it('maps "Honours" enrolment phrases to program tokens (CS 245, AMATH 382)', () => {
    expect(JSON.stringify(parseRequisite(html['CS245.prerequisites']))).toContain('"programs":["Honours Mathematics"]')
    const r = parseRequisite(html['AMATH382.prerequisites'])
    expect(r?.kind === 'all' && r.of.slice(1)).toEqual([
      { kind: 'level', min: '3A' },
      { kind: 'program', mode: 'in', programs: ['Honours'] },
    ])
    // "Must have completed: SYDE112" (no "the following") is still a course leaf.
    expect(JSON.stringify(r)).toContain('{"kind":"course","code":"SYDE112"}')
  })

  it('descends into div-wrapped nested groups (MATH 239)', () => {
    const r = parseRequisite(html['MATH239.prerequisites'])
    expect(r).toMatchObject({ kind: 'atLeast', n: 1 })
    const json = JSON.stringify(r)
    expect(json).toContain('{"kind":"course","code":"MATH135","minGrade":60}')
    expect(json).toContain('{"kind":"program","mode":"in","programs":["Honours Mathematics"]}')
    expect(json).toContain('{"kind":"level","min":"2A"}')
  })
  it('parses unit-count rules (COMMST 329)', () => {
    expect(JSON.stringify(parseRequisite(html['COMMST329.prerequisites']))).toContain(
      '{"kind":"units","min":0.5,"subject":"DAC"}',
    )
  })
})

describe('parseAntirequisites', () => {
  it('collects linked antirequisite courses (CS 341)', () => {
    expect(parseAntirequisites(html['CS341.antirequisites'])).toEqual({ codes: ['CS231', 'ECE406'], text: [] })
  })
})
