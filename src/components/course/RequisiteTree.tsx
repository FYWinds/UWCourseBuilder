import { AlertTriangle, CheckCircle2, Circle, CircleDot, CircleHelp, XCircle } from 'lucide-react'
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import type { CourseCode, Requisite } from '@/domain/types'
import { type Verdict, enrolmentTokens, evaluate, formatCode, manualChecks } from '@/engine'
import type { RequisiteContext } from '@/engine/requisites'
import type { Analysis } from '@/lib/data'
import { cn } from '@/lib/utils'
import { CourseLink } from './CourseLink'

/** What a requisite tree is evaluated against, plus per-course plan state for leaf icons. */
export interface RequisiteTreeContext {
  ctx: RequisiteContext
  placed: Map<CourseCode, 'taken' | 'planned'>
}

interface TreeState extends RequisiteTreeContext {
  asCoreq: boolean
}

/**
 * Context for "is this satisfied by the whole plan": every placed course counts as
 * before, level unknown, programs from the plan's enrolment tokens. Memoize per analysis.
 */
export function planRequisiteContext({ idx, plan, audit }: Pick<Analysis, 'idx' | 'plan' | 'audit'>): RequisiteTreeContext {
  const placed = new Map(audit.placed.map((p) => [p.code, p.status]))
  return {
    ctx: { idx, before: new Set(placed.keys()), same: new Set(), level: null, programs: enrolmentTokens(plan) },
    placed,
  }
}

/** One-line verdict for a whole prerequisite/corequisite tree against the plan. */
export function RequisiteVerdict({
  req,
  context,
  asCoreq = false,
}: {
  req: Requisite
  context: RequisiteTreeContext
  asCoreq?: boolean
}) {
  const verdict = evaluate(req, context.ctx, asCoreq)
  const noun = asCoreq ? 'Corequisites' : 'Prerequisites'
  const checks = verdict === 'unknown' ? manualChecks(req) : []
  const Icon = verdict === 'met' ? CheckCircle2 : verdict === 'unmet' ? XCircle : AlertTriangle
  return (
    <div className="space-y-1">
      <p
        className={cn(
          'flex items-center gap-1.5 text-sm font-medium',
          verdict === 'met' && 'text-status-taken',
          verdict === 'unmet' && 'text-destructive',
          verdict === 'unknown' && 'text-status-required',
        )}
      >
        <Icon className="size-4" aria-hidden />
        {verdict === 'met'
          ? `${noun} satisfied by your plan`
          : verdict === 'unmet'
            ? `Missing ${noun.toLowerCase()}`
            : 'Needs manual check'}
      </p>
      {checks.length > 0 && (
        <ul className="list-disc space-y-0.5 pl-10 text-xs text-muted-foreground">
          {checks.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
      )}
    </div>
  )
}

/**
 * Recursive requisite tree. Course leaves show whether the plan contains them
 * (taken = teal check, planned = amber dot); groups show their combined verdict.
 */
export function RequisiteTree({
  req,
  context,
  asCoreq = false,
  className,
}: {
  req: Requisite
  context: RequisiteTreeContext
  asCoreq?: boolean
  className?: string
}) {
  const state: TreeState = { ...context, asCoreq }
  return (
    <div className={cn('text-sm', className)}>
      <RequisiteNode req={req} state={state} />
    </div>
  )
}

function RequisiteNode({ req, state }: { req: Requisite; state: TreeState }) {
  if (req.kind === 'all' || req.kind === 'atLeast') {
    const verdict = evaluate(req, state.ctx, state.asCoreq)
    return (
      <div>
        <div className="flex items-center gap-1.5 py-0.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">
          <VerdictIcon verdict={verdict} />
          {req.kind === 'all' ? 'All of' : `At least ${req.n} of`}
        </div>
        <ul className="ml-[0.4375rem] space-y-0.5 border-l pl-3">
          {req.of.map((child, i) => (
            <li key={i}>
              <RequisiteNode req={child} state={state} />
            </li>
          ))}
        </ul>
      </div>
    )
  }
  if (req.kind === 'course') return <CourseLeaf req={req} state={state} />
  return <TextLeaf req={req} state={state} />
}

function VerdictIcon({ verdict }: { verdict: Verdict }) {
  if (verdict === 'met') return <CheckCircle2 className="size-3.5 shrink-0 text-status-taken" aria-label="Satisfied" />
  if (verdict === 'unknown') return <CircleHelp className="size-3.5 shrink-0 text-status-required" aria-label="Needs manual check" />
  return <Circle className="size-3.5 shrink-0 text-muted-foreground" aria-label="Not satisfied" />
}

function CourseLeaf({ req, state }: { req: Extract<Requisite, { kind: 'course' }>; state: TreeState }) {
  const { idx } = state.ctx
  const course = idx.byCode.get(req.code)
  const via = state.placed.has(req.code)
    ? req.code
    : course?.crossListed.find((x) => state.placed.has(x))
  const status = via ? state.placed.get(via) : undefined
  return (
    <div className="flex min-w-0 items-center gap-1.5 py-0.5">
      {status === 'taken' ? (
        <CheckCircle2 className="size-3.5 shrink-0 text-status-taken" aria-label="Taken" />
      ) : status === 'planned' ? (
        <CircleDot className="size-3.5 shrink-0 text-status-planned" aria-label="Planned" />
      ) : (
        <Circle className="size-3.5 shrink-0 text-muted-foreground" aria-label="Not in plan" />
      )}
      {course ? (
        <CourseLink code={req.code} className="shrink-0" />
      ) : (
        <span className="shrink-0 font-mono text-[0.85em] text-muted-foreground">{formatCode(req.code)}</span>
      )}
      <span className="truncate text-muted-foreground">{course ? course.title : 'not in the 2026/27 calendar'}</span>
      {via && via !== req.code && (
        <span className="shrink-0 text-xs text-muted-foreground">via {formatCode(via)}</span>
      )}
      {req.minGrade !== undefined && (
        <Badge variant="outline" className="shrink-0 px-1.5 py-0 text-[0.7rem]">
          ≥ {req.minGrade}%
        </Badge>
      )}
      {req.concurrentOk && (
        <Badge variant="outline" className="shrink-0 px-1.5 py-0 text-[0.7rem]">
          may be concurrent
        </Badge>
      )}
    </div>
  )
}

const PROGRAM_PREVIEW = 4

function TextLeaf({
  req,
  state,
}: {
  req: Exclude<Requisite, { kind: 'all' | 'atLeast' | 'course' }>
  state: TreeState
}) {
  const verdict = evaluate(req, state.ctx, state.asCoreq)
  return (
    <div className="flex items-start gap-1.5 py-0.5">
      <span className="mt-0.5">
        <VerdictIcon verdict={verdict} />
      </span>
      <div className="min-w-0 flex-1">
        {req.kind === 'program' ? <ProgramLeaf req={req} programs={state.ctx.programs} /> : <span>{describe(req)}</span>}
      </div>
    </div>
  )
}

function describe(req: Extract<Requisite, { kind: 'level' | 'units' | 'average' | 'text' }>): string {
  switch (req.kind) {
    case 'level':
      return req.exact ? `Level ${req.min} students only` : `Level ${req.min} or higher`
    case 'units': {
      const range =
        req.minLevel === undefined
          ? ''
          : req.maxLevel === undefined
            ? ` at the ${req.minLevel}-level or higher`
            : ` at the ${req.minLevel}–${req.maxLevel}-level`
      return `At least ${req.min.toFixed(1)} units of ${req.subject}${range}`
    }
    case 'average':
      return `Cumulative average of at least ${req.min}%`
    case 'text':
      return req.raw
  }
}

function ProgramLeaf({ req, programs }: { req: Extract<Requisite, { kind: 'program' }>; programs: Set<string> }) {
  const [expanded, setExpanded] = useState(false)
  const inPrograms = req.programs.some((p) => programs.has(p))
  const allowed = inPrograms === (req.mode === 'in')
  const shown = expanded ? req.programs : req.programs.slice(0, PROGRAM_PREVIEW)
  const hidden = req.programs.length - shown.length
  return (
    <span>
      {req.mode === 'in' ? 'Enrolled in ' : 'Not open to students in '}
      <span className="text-muted-foreground">{shown.join(', ')}</span>
      {hidden > 0 && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="ml-1 text-xs text-primary underline-offset-2 hover:underline"
        >
          +{hidden} more
        </button>
      )}{' '}
      <Badge
        variant="outline"
        className={cn(
          'ml-1 px-1.5 py-0 text-[0.7rem]',
          allowed ? 'border-status-taken/50 text-status-taken' : 'border-destructive/50 text-destructive',
        )}
      >
        {allowed ? 'Your program ✓' : req.mode === 'in' ? 'Other programs only' : 'Excludes your program'}
      </Badge>
    </span>
  )
}
