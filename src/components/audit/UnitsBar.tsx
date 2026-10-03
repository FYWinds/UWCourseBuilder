import { cn } from '@/lib/utils'

const pct = (value: number, need: number) => (need > 0 ? Math.min(100, Math.max(0, (value / need) * 100)) : 100)

/**
 * Stacked progress bar: teal for completed units, amber for planned ones.
 * `total` is the value including the plan, so the planned segment is `total - taken`.
 */
export function UnitsBar({
  taken,
  total,
  need,
  label,
  className,
}: {
  taken: number
  total: number
  need: number
  label: string
  className?: string
}) {
  const takenPct = pct(taken, need)
  const plannedPct = Math.min(100 - takenPct, pct(Math.max(0, total - taken), need))
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={need}
      aria-valuenow={total}
      className={cn('flex h-2 w-full overflow-hidden rounded-full bg-muted print:border', className)}
    >
      <div className="h-full bg-status-taken transition-[width]" style={{ width: `${takenPct}%` }} />
      <div className="h-full bg-status-planned transition-[width]" style={{ width: `${plannedPct}%` }} />
    </div>
  )
}
