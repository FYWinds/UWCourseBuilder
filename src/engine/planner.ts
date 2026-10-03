import { type Plan, type PlanTerm, SEQUENCES, TRANSFER_TERM_ID, resolveBreadthRule } from '@/domain/plan'
import type { CourseCode, TermLevel } from '@/domain/types'
import { commLists } from '@/requirements/bcs'
import { type CatalogIndex, countsTowardDegree, formatCode } from './catalog'
import { enrolmentTokens } from './classify'
import { type RequisiteContext, evaluate, manualChecks, programAllows } from './requisites'
import { buildTerms } from './terms'

export type Severity = 'error' | 'warning' | 'info'

export interface Issue {
  severity: Severity
  kind:
    | 'unknown'
    | 'prereq'
    | 'coreq'
    | 'antireq'
    | 'program'
    | 'level'
    | 'season'
    | 'online'
    | 'manual'
    | 'load'
    | 'off'
    | 'communication'
    | 'pd'
  message: string
}

export interface PlanValidation {
  terms: PlanTerm[]
  /** `${termId}:${code}` → issues for that placement. */
  byPlacement: Map<string, Issue[]>
  /** Term id → term-level issues (load, off-term courses). */
  byTerm: Map<string, Issue[]>
  /** Whole-plan issues (communication timing, PD order). */
  plan: Issue[]
}

export const placementKey = (termId: string, code: CourseCode) => `${termId}:${code}`

/** Work-term course limits exclude co-op/PD/work-report courses (Math co-op regulations). */
const WT_EXEMPT = new Set(['PD', 'COOP', 'WKRPT'])
const MAX_STUDY_UNITS = 2.75

export function validatePlan(plan: Plan, idx: CatalogIndex): PlanValidation {
  const terms = buildTerms(plan)
  const programs = enrolmentTokens(plan)
  const coop = SEQUENCES[plan.sequence].coop
  const byPlacement = new Map<string, Issue[]>()
  const byTerm = new Map<string, Issue[]>()
  const planIssues: Issue[] = []
  const hasOnlineData = idx.meta.onlineScanTerms.length > 0

  const allPlaced = new Map<CourseCode, string>()
  for (const [termId, codes] of Object.entries(plan.placements)) codes.forEach((c) => allPlaced.set(c, termId))

  const before = new Set<CourseCode>(plan.placements[TRANSFER_TERM_ID] ?? [])
  let lastLevel: TermLevel | null = null

  // Transfer credit: only existence/antirequisite checks make sense.
  for (const code of plan.placements[TRANSFER_TERM_ID] ?? []) {
    byPlacement.set(placementKey(TRANSFER_TERM_ID, code), commonIssues(code, allPlaced, idx, programs))
  }

  for (const term of terms) {
    const codes = plan.placements[term.id] ?? []
    const same = new Set(codes)
    const level = term.kind === 'study' ? (term.level ?? null) : lastLevel
    const ctx: RequisiteContext = { idx, before, same, level, programs }

    for (const code of codes) {
      const issues = commonIssues(code, allPlaced, idx, programs)
      const c = idx.byCode.get(code)
      if (c) {
        if (c.prereq) {
          const v = evaluate(c.prereq, ctx)
          if (v === 'unmet') {
            // Distinguish level-only failures during work terms (Quest level semantics vary).
            const withoutLevel = evaluate(c.prereq, { ...ctx, level: null })
            if (term.kind !== 'study' && withoutLevel !== 'unmet') {
              issues.push({ severity: 'warning', kind: 'level', message: 'Level requirement may not be met during this term' })
            } else {
              issues.push({ severity: 'error', kind: 'prereq', message: 'Prerequisites not met by earlier terms' })
            }
          }
        }
        if (c.coreq && evaluate(c.coreq, ctx, true) === 'unmet') {
          issues.push({ severity: 'error', kind: 'coreq', message: 'Corequisites not taken earlier or in this term' })
        }
        const manual = [...manualChecks(c.prereq), ...manualChecks(c.coreq)]
        if (manual.length) issues.push({ severity: 'info', kind: 'manual', message: `Check manually: ${manual.join('; ')}` })
        if (c.offered.length === 0) {
          issues.push({ severity: 'info', kind: 'season', message: 'Not scheduled in any sampled term' })
        } else if (!c.offered.includes(term.season)) {
          issues.push({ severity: 'warning', kind: 'season', message: `Usually offered in ${c.offered.join('/')} only` })
        }
        if (term.kind === 'work' && hasOnlineData && !c.online && !WT_EXEMPT.has(c.subject)) {
          issues.push({ severity: 'warning', kind: 'online', message: 'No online section in recently scanned terms' })
        }
      }
      byPlacement.set(placementKey(term.id, code), issues)
    }

    const termIssues: Issue[] = []
    const academic = codes.map((code) => idx.byCode.get(code)).filter((c) => c && !WT_EXEMPT.has(c.subject))
    if (term.kind === 'work' && academic.length > plan.wtLimit) {
      termIssues.push({
        severity: 'error',
        kind: 'load',
        message: `Work terms allow ${plan.wtLimit} course${plan.wtLimit > 1 ? 's' : ''} (${plan.wtLimit === 1 ? '2 with written employer support' : 'with employer support'})`,
      })
    }
    if (term.kind === 'study') {
      const units = academic.reduce((s, c) => s + (c && countsTowardDegree(c) ? c.units : 0), 0)
      if (units > MAX_STUDY_UNITS) {
        termIssues.push({ severity: 'warning', kind: 'load', message: `${units.toFixed(2)} units exceeds a normal load (2.5)` })
      }
    }
    if (term.kind === 'off' && codes.length) {
      termIssues.push({ severity: 'info', kind: 'off', message: 'Courses in an off term' })
    }
    byTerm.set(term.id, termIssues)

    codes.forEach((c) => before.add(c))
    if (term.kind === 'study') lastLevel = term.level ?? lastLevel
  }

  // Communication: the first List 1 course should be done before 2A.
  const firstTwoA = terms.find((t) => t.level === '2A')
  const list1Terms = commLists(resolveBreadthRule(plan)).list1.flatMap((code) => {
    const termId = allPlaced.get(code)
    if (termId === undefined) return []
    return [termId === TRANSFER_TERM_ID ? -1 : Number(termId.slice(1))]
  })
  if (firstTwoA && !list1Terms.some((i) => i < firstTwoA.index)) {
    planIssues.push({
      severity: 'warning',
      kind: 'communication',
      message: 'Complete a Communication List 1 course (≥60%) before 2A',
    })
  }

  if (coop) {
    const firstWork = terms.find((t) => t.kind === 'work')
    const termOf = (code: string) => {
      const id = allPlaced.get(code)
      return id === undefined ? undefined : id === TRANSFER_TERM_ID ? -1 : Number(id.slice(1))
    }
    const pd1 = termOf('PD1')
    const pd11 = termOf('PD11')
    if (firstWork && pd1 !== undefined && pd1 >= firstWork.index) {
      planIssues.push({ severity: 'warning', kind: 'pd', message: 'PD 1 must be taken in an academic term before the first work term' })
    }
    if (firstWork && pd11 !== undefined && pd11 !== firstWork.index) {
      planIssues.push({ severity: 'warning', kind: 'pd', message: 'PD 11 must be taken during the first work term' })
    }
  }

  return { terms, byPlacement, byTerm, plan: planIssues }
}

function commonIssues(
  code: CourseCode,
  allPlaced: Map<CourseCode, string>,
  idx: CatalogIndex,
  programs: Set<string>,
): Issue[] {
  const c = idx.byCode.get(code)
  if (!c) return [{ severity: 'error', kind: 'unknown', message: 'Not in the 2026/27 calendar' }]
  const issues: Issue[] = []
  const clashes = [...allPlaced.keys()].filter(
    (other) => other !== code && (c.antireq.includes(other) || idx.byCode.get(other)?.antireq.includes(code) || c.crossListed.includes(other)),
  )
  if (clashes.length) {
    issues.push({ severity: 'error', kind: 'antireq', message: `Antirequisite / cross-listed with ${clashes.map(formatCode).join(', ')}` })
  }
  if (!programAllows(c.prereq, programs) || !programAllows(c.coreq, programs)) {
    issues.push({ severity: 'error', kind: 'program', message: 'Restricted to students in other programs' })
  }
  return issues
}
