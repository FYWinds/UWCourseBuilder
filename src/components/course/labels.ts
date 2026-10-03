import type { Faculty, Season } from '@/domain/types'
import { parseTermCode } from '@/engine'

export const FACULTY_LABEL: Record<Faculty, string> = {
  MAT: 'Mathematics',
  ENG: 'Engineering',
  ART: 'Arts',
  ENV: 'Environment',
  AHS: 'Health',
  SCI: 'Science',
  OTHER: 'Other',
}

export const SEASONS: Season[] = ['F', 'W', 'S']

export const SEASON_LABEL: Record<Season, string> = { F: 'Fall', W: 'Winter', S: 'Spring' }

/** "1239" → "F23". */
export function shortTermName(code: string): string {
  const { year, season } = parseTermCode(code)
  return `${season}${String(year).slice(-2)}`
}
