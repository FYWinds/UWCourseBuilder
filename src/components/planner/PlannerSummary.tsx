import { Link } from '@tanstack/react-router'
import { CircleAlert, MousePointerClick, TriangleAlert } from 'lucide-react'
import { SEQUENCES } from '@/domain/plan'
import { termName } from '@/engine'
import type { Analysis } from '@/lib/data'
import { cn } from '@/lib/utils'
import { formatUnits } from './format'
import { SEVERITY_META } from './severity'

/** Page title, unit progress and issue counts. */
export function PlannerHeader({ analysis }: { analysis: Analysis }) {
  const { audit, validation, plan } = analysis
  const total = audit.programs.find((p) => p.program.kind === 'core')?.totals.find((t) => t.id === 'total')
  const all = [...validation.byPlacement.values(), ...validation.byTerm.values(), validation.plan].flat()
  const errors = all.filter((i) => i.severity === 'error').length
  const warnings = all.filter((i) => i.severity === 'warning').length

  return (
    <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
      <div>
        <h1 className="text-3xl font-semibold">Term planner</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {SEQUENCES[plan.sequence].label} · 1A in {termName(plan.startTerm)}
          {SEQUENCES[plan.sequence].coop && ` · work terms allow ${plan.wtLimit} course${plan.wtLimit > 1 ? 's' : ''}`} ·{' '}
          <Link to="/" search={(prev) => prev} className="underline underline-offset-2 hover:text-foreground">
            change settings
          </Link>
        </p>
      </div>
      <dl className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm">
        {total && (
          <div className="flex items-baseline gap-1.5">
            <dt className="text-muted-foreground">Planned</dt>
            <dd>
              <span className="font-semibold tabular-nums">{formatUnits(total.have)}</span>
              <span className="text-muted-foreground"> / {formatUnits(total.units)} units</span>
            </dd>
          </div>
        )}
        <div className="flex items-baseline gap-1.5">
          <dt className="text-muted-foreground">Full-time terms</dt>
          <dd className="tabular-nums">
            {audit.fullTimeTerms.have} / {audit.fullTimeTerms.need}
          </dd>
        </div>
        <div className={cn('flex items-center gap-1', errors ? 'text-destructive' : 'text-muted-foreground')}>
          <CircleAlert className="size-4" aria-hidden />
          <dt className="sr-only">Errors</dt>
          <dd className="tabular-nums">
            {errors} error{errors === 1 ? '' : 's'}
          </dd>
        </div>
        <div className={cn('flex items-center gap-1', warnings ? 'text-status-planned' : 'text-muted-foreground')}>
          <TriangleAlert className="size-4" aria-hidden />
          <dt className="sr-only">Warnings</dt>
          <dd className="tabular-nums">
            {warnings} warning{warnings === 1 ? '' : 's'}
          </dd>
        </div>
      </dl>
    </div>
  )
}

/** Whole-plan issues (communication timing, PD order). */
export function PlanIssueStrip({ analysis }: { analysis: Analysis }) {
  const issues = analysis.validation.plan
  if (issues.length === 0) return null
  return (
    <ul role="status" className="space-y-1 rounded-xl border bg-card px-4 py-2.5 text-sm shadow-sm">
      {issues.map((issue, i) => {
        const { icon: Icon, className, label } = SEVERITY_META[issue.severity]
        return (
          <li key={i} className="flex items-start gap-2">
            <Icon className={cn('mt-0.5 size-4 shrink-0', className)} aria-label={label} />
            <span>{issue.message}</span>
          </li>
        )
      })}
    </ul>
  )
}

export function EmptyPlanHint() {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-dashed bg-card/60 px-4 py-3 text-sm text-muted-foreground">
      <MousePointerClick className="size-4 shrink-0 text-primary" aria-hidden />
      Drag courses from the left, or use “Add to plan” anywhere.
    </div>
  )
}
