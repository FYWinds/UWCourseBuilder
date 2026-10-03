import { CheckCircle2, Circle, CircleAlert, PartyPopper } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { formatUnits } from '@/components/audit/units'
import { UnitsBar } from '@/components/audit/UnitsBar'
import { STATUS_META } from '@/components/course/status'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { Analysis } from '@/lib/data'
import { remainingRequirements, summaryRows, type SummaryRow } from './summary'

const fmt = (row: SummaryRow, v: number) => (row.unit === 'terms' ? String(v) : formatUnits(v))

export function VerdictBanner({ analysis }: { analysis: Analysis }) {
  const { audit, classification } = analysis
  const remaining = remainingRequirements(audit)
  return (
    <div className="space-y-3">
      {audit.satisfied ? (
        <Alert className="border-status-taken/50 bg-status-taken/10">
          <PartyPopper className="text-status-taken" />
          <AlertTitle>Plan satisfies all requirements</AlertTitle>
          <AlertDescription>
            Every core, co-op and specialization requirement is covered by completed and planned courses.
          </AlertDescription>
        </Alert>
      ) : (
        <Alert className="border-primary/50 bg-primary/10">
          <CircleAlert className="text-primary" />
          <AlertTitle>
            {remaining} requirement{remaining === 1 ? '' : 's'} still open
          </AlertTitle>
          <AlertDescription>
            Counting completed and planned courses. See the audit for the exact slots, or add the courses listed below.
          </AlertDescription>
        </Alert>
      )}
      {classification.impossible.length > 0 && (
        <Alert variant="destructive">
          <CircleAlert />
          <AlertTitle>Some programs can no longer be completed</AlertTitle>
          <AlertDescription>
            <ul className="list-disc pl-4">
              {classification.impossible.map((p) => (
                <li key={p.programId}>{p.programName}</li>
              ))}
            </ul>
            <p>Even with every available course these requirements cannot be met — check antirequisite conflicts in your plan.</p>
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}

function SummaryLine({ row }: { row: SummaryRow }) {
  const planned = Math.max(0, row.total - row.taken)
  return (
    <li className="grid grid-cols-[1rem_minmax(0,9rem)_minmax(0,1fr)] items-center gap-x-3 gap-y-1 py-2 sm:grid-cols-[1rem_minmax(0,10rem)_minmax(0,1fr)_9.5rem]">
      {row.satisfied ? (
        <CheckCircle2 className="size-4 text-status-taken" aria-label="Satisfied" />
      ) : (
        <Circle className="size-4 text-muted-foreground/60" aria-label="Not yet satisfied" />
      )}
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{row.label}</p>
        {row.hint && <p className="truncate text-xs text-muted-foreground" title={row.hint}>{row.hint}</p>}
      </div>
      <UnitsBar taken={row.taken} total={row.total} need={row.need} label={row.label} />
      <p className="col-start-3 text-xs text-muted-foreground tabular-nums sm:col-start-auto sm:text-right">
        <span className="font-mono text-status-taken">{fmt(row, row.taken)}</span>
        {planned > 0 && <span className="font-mono"> + {fmt(row, planned)}</span>}
        <span className="font-mono text-foreground"> / {fmt(row, row.need)}</span>
        {row.unit === 'terms' ? ' terms' : ''}
      </p>
    </li>
  )
}

export function ProgressSummary({ analysis }: { analysis: Analysis }) {
  const rows = summaryRows(analysis)
  return (
    <Card className="gap-4">
      <CardHeader>
        <CardTitle className="font-serif text-lg">Progress</CardTitle>
        <CardDescription className="flex flex-wrap gap-x-4 gap-y-1">
          {(['taken', 'planned'] as const).map((s) => (
            <span key={s} className="inline-flex items-center gap-1.5">
              <span className="size-2.5 rounded-full" style={{ background: STATUS_META[s].color }} aria-hidden />
              {s === 'taken' ? 'Completed' : 'With plan'}
            </span>
          ))}
        </CardDescription>
        <CardAction>
          <Button asChild variant="outline" size="sm">
            <Link to="/audit" search={(prev) => prev}>
              Full audit
            </Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <ul className="divide-y divide-dashed">
          {rows.map((row) => (
            <SummaryLine key={row.id} row={row} />
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
