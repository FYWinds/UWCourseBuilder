import type { Program } from '../../src/domain/requirements.ts'
import { CALENDAR_BASE } from '../../src/requirements/helpers.ts'
import { DEGREE_PAGES, MAJORS } from '../../src/requirements/majors.ts'
import { SPECS } from '../../src/requirements/specs.ts'

/** A Kuali program page and the DSL programs that must cover every course it links. */
export interface CalendarCheck {
  key: string
  pid: string
  programs: Program[]
}

const pidOf = (program: Program) => program.calendarUrl.slice(`${CALENDAR_BASE}/`.length)

/** Every program a major can activate, under both elective rules when it offers the choice. */
function majorPrograms(id: string): Program[] {
  const major = MAJORS[id]
  const rules = major.breadthRuleChoice ? (['elective', 'breadth-depth'] as const) : (['elective'] as const)
  return [...new Set([...rules.flatMap((r) => major.programs(r)), major.coop])]
}

/** Major pages, degree-level pages (all majors of the degree), and specialization pages. */
export function calendarChecks(): CalendarCheck[] {
  const majors = Object.values(MAJORS)
  const degreeChecks = Object.entries(DEGREE_PAGES).flatMap(([degree, pid]) =>
    pid
      ? [{ key: `${degree}-degree`, pid, programs: majors.filter((m) => m.degree === degree).flatMap((m) => majorPrograms(m.id)) }]
      : [],
  )
  return [
    ...majors.map((m) => ({ key: m.id, pid: m.pid, programs: majorPrograms(m.id) })),
    ...degreeChecks,
    ...Object.entries(SPECS).map(([id, p]) => ({ key: `spec-${id}`, pid: pidOf(p), programs: [p] })),
  ]
}
