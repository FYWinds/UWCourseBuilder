import { type Plan, type PlanTerm, SEQUENCES, TRANSFER_TERM_ID } from '@/domain/plan'
import type { CourseCode, Season, TermLevel } from '@/domain/types'

const SEASON_BY_MONTH: Record<string, Season> = { '1': 'W', '5': 'S', '9': 'F' }
const SEASON_NAME: Record<Season, string> = { W: 'Winter', S: 'Spring', F: 'Fall' }

/** "1269" → { year: 2026, season: 'F' }. */
export function parseTermCode(code: string): { year: number; season: Season } {
  return { year: 1900 + Number(code.slice(0, 3)), season: SEASON_BY_MONTH[code[3]] }
}

export function nextTermCode(code: string): string {
  const { year } = parseTermCode(code)
  const month = code[3]
  if (month === '9') return `${year + 1 - 1900}1`
  return `${year - 1900}${month === '1' ? '5' : '9'}`
}

export function termName(code: string): string {
  const { year, season } = parseTermCode(code)
  return `${SEASON_NAME[season]} ${year}`
}

export function buildTerms(plan: Pick<Plan, 'sequence' | 'startTerm'>): PlanTerm[] {
  const pattern = SEQUENCES[plan.sequence].pattern
  let code = plan.startTerm
  let wt = 0
  return pattern.map((p, index) => {
    const termCode = code
    code = nextTermCode(code)
    const kind = p === 'WT' ? 'work' : p === 'off' ? 'off' : 'study'
    if (kind === 'work') wt++
    return {
      id: `t${index}`,
      index,
      kind,
      ...(kind === 'study' && { level: p as TermLevel }),
      termCode,
      season: parseTermCode(termCode).season,
      name: termName(termCode),
      label: kind === 'work' ? `WT ${wt}` : kind === 'off' ? 'Off' : p,
    }
  })
}

export interface PlacedCourse {
  code: CourseCode
  /** -1 for transfer credit. */
  termIndex: number
  status: 'taken' | 'planned'
}

/** Flatten placements in chronological order (transfer credit first). */
export function placedCourses(plan: Plan, terms: PlanTerm[]): PlacedCourse[] {
  const out: PlacedCourse[] = (plan.placements[TRANSFER_TERM_ID] ?? []).map((code) => ({
    code,
    termIndex: -1,
    status: 'taken',
  }))
  for (const t of terms) {
    for (const code of plan.placements[t.id] ?? []) {
      out.push({ code, termIndex: t.index, status: t.index <= plan.completedThrough ? 'taken' : 'planned' })
    }
  }
  return out
}
