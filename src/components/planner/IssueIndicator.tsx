import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { Issue, Severity } from '@/engine'
import { cn } from '@/lib/utils'
import { SEVERITY_META } from './severity'

const SEVERITIES: Severity[] = ['error', 'warning', 'info']

/** Compact per-severity icons with counts; hovering or focusing lists every message. */
export function IssueIndicator({ issues, className }: { issues: Issue[]; className?: string }) {
  if (issues.length === 0) return null
  const present = SEVERITIES.map((severity) => ({ severity, count: issues.filter((i) => i.severity === severity).length })).filter(
    (s) => s.count > 0,
  )
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={`${issues.length} issue${issues.length > 1 ? 's' : ''}: ${issues.map((i) => i.message).join('; ')}`}
          className={cn('inline-flex items-center gap-1.5 rounded-sm text-xs focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none', className)}
        >
          {present.map(({ severity, count }) => {
            const { icon: Icon, className: tone } = SEVERITY_META[severity]
            return (
              <span key={severity} className={cn('inline-flex items-center gap-0.5', tone)}>
                <Icon className="size-3.5" aria-hidden />
                {count > 1 && <span className="tabular-nums">{count}</span>}
              </span>
            )
          })}
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-72">
        <ul className="space-y-1">
          {issues.map((issue, i) => {
            const { icon: Icon, label } = SEVERITY_META[issue.severity]
            return (
              <li key={i} className="flex gap-1.5">
                <Icon className="mt-0.5 size-3 shrink-0" aria-label={label} />
                <span>{issue.message}</span>
              </li>
            )
          })}
        </ul>
      </TooltipContent>
    </Tooltip>
  )
}
