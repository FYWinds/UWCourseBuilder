import { createFileRoute } from '@tanstack/react-router'
import { CircleAlert, Printer } from 'lucide-react'
import { useMemo, useState } from 'react'
import { NotCountedCard } from '@/components/audit/NotCountedCard'
import { type PlacedStatus, ProgramCard } from '@/components/audit/ProgramCard'
import { STATUS_META } from '@/components/course/status'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { useAnalysis } from '@/lib/data'
import { MAJORS } from '@/requirements/majors'

export const Route = createFileRoute('/audit')({ component: AuditPage })

type Scope = 'taken' | 'all'

function Legend() {
  return (
    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
      {(['taken', 'planned'] as const).map((s) => (
        <span key={s} className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-full" style={{ background: STATUS_META[s].color }} aria-hidden />
          {STATUS_META[s].label}
        </span>
      ))}
    </div>
  )
}

function AuditPage() {
  const { idx, plan, audit, takenAudit, classification } = useAnalysis()
  const [scope, setScope] = useState<Scope>('all')
  const shown = scope === 'all' ? audit : takenAudit
  const placedStatus: PlacedStatus = useMemo(() => new Map(audit.placed.map((p) => [p.code, p.status])), [audit.placed])
  const takenById = useMemo(() => new Map(takenAudit.programs.map((p) => [p.program.id, p])), [takenAudit.programs])

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl">Degree audit</h1>
          <p className="text-sm text-muted-foreground">
            {MAJORS[plan.major].name}, 2026/27 calendar — laid out like the official checklist.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 print:hidden">
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            value={scope}
            onValueChange={(v) => v && setScope(v as Scope)}
            aria-label="Courses counted"
          >
            <ToggleGroupItem value="taken" className="px-3">
              Completed only
            </ToggleGroupItem>
            <ToggleGroupItem value="all" className="px-3">
              With plan
            </ToggleGroupItem>
          </ToggleGroup>
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer />
            Print
          </Button>
        </div>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card px-4 py-3 text-sm shadow-sm">
        <p>
          {shown.satisfied ? (
            <span className="font-medium text-status-taken">All graduation requirements are met</span>
          ) : (
            <span className="font-medium">Requirements still open</span>
          )}
          <span className="text-muted-foreground">
            {' '}
            — counting {scope === 'all' ? 'completed and planned courses' : 'completed courses only'} ({shown.usable.length}{' '}
            courses)
          </span>
        </p>
        <Legend />
      </div>

      {scope === 'all' && classification.impossible.length > 0 && (
        <Alert variant="destructive">
          <CircleAlert />
          <AlertTitle>Cannot be completed</AlertTitle>
          <AlertDescription>
            Even with every available course, these programs cannot be satisfied:{' '}
            {classification.impossible.map((p) => p.programName).join(', ')}.
          </AlertDescription>
        </Alert>
      )}

      {shown.programs.map((pa) => (
        <ProgramCard
          key={pa.program.id}
          audit={pa}
          takenAudit={takenById.get(pa.program.id)}
          placedStatus={placedStatus}
          classification={classification}
          idx={idx}
        />
      ))}

      <NotCountedCard audit={shown} idx={idx} />
    </div>
  )
}
