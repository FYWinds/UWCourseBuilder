import { CheckCircle2, Circle, ExternalLink } from 'lucide-react'
import type { ReactNode } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { CourseCode } from '@/domain/types'
import type { CatalogIndex, ClassifyResult, ProgramAudit, SlotAllocation } from '@/engine'
import { depthHint } from '@/components/overview/summary'
import { cn } from '@/lib/utils'
import { CourseChip } from './CourseChip'
import { LinkedText } from './LinkedText'
import { SlotOptions } from './SlotOptions'
import { UnitsBar } from './UnitsBar'
import { formatUnits } from './units'

export type PlacedStatus = Map<CourseCode, 'taken' | 'planned'>

interface ProgramCardProps {
  audit: ProgramAudit
  /** Same program audited on completed courses only (for the teal bar segment). */
  takenAudit?: ProgramAudit
  placedStatus: PlacedStatus
  classification: ClassifyResult
  idx: CatalogIndex
}

export function programSatisfied(pa: ProgramAudit): boolean {
  return pa.allocation.satisfied && pa.totals.every((t) => t.satisfied)
}

function Check({ ok, label }: { ok: boolean; label: string }) {
  return ok ? (
    <CheckCircle2 className="size-4 text-status-taken" aria-label={`${label}: satisfied`} />
  ) : (
    <Circle className="size-4 text-muted-foreground/60" aria-label={`${label}: not yet satisfied`} />
  )
}

function Row({
  ok,
  label,
  title,
  children,
  progress,
  action,
}: {
  ok: boolean
  label: string
  title: ReactNode
  children?: ReactNode
  progress: ReactNode
  action?: ReactNode
}) {
  return (
    <li className="grid grid-cols-[1rem_minmax(0,1fr)] gap-x-3 py-2.5 break-inside-avoid sm:grid-cols-[1rem_minmax(0,1fr)_9rem_7.5rem]">
      <span className="pt-0.5">
        <Check ok={ok} label={label} />
      </span>
      <div className="min-w-0 space-y-1.5">
        <div className={cn('text-sm', ok && 'text-muted-foreground')}>{title}</div>
        {children}
      </div>
      <div className="col-start-2 pt-1 sm:col-start-auto">{progress}</div>
      <div className="col-start-2 flex justify-start pt-1 sm:col-start-auto sm:justify-end sm:pt-0">{action}</div>
    </li>
  )
}

function Progress({ taken, total, need, label }: { taken: number; total: number; need: number; label: string }) {
  return (
    <div className="space-y-1">
      <UnitsBar taken={taken} total={total} need={need} label={label} />
      <p className="text-right font-mono text-xs text-muted-foreground tabular-nums">
        {formatUnits(Math.min(total, need))} / {formatUnits(need)}
      </p>
    </div>
  )
}

function SlotRow({ sa, placedStatus, classification, idx }: { sa: SlotAllocation } & Omit<ProgramCardProps, 'audit' | 'takenAudit'>) {
  const takenUnits = sa.courses
    .filter((code) => placedStatus.get(code) === 'taken')
    .reduce((s, code) => s + (idx.byCode.get(code)?.units ?? 0), 0)
  return (
    <Row
      ok={sa.satisfied}
      label={sa.slot.label}
      title={<LinkedText text={sa.slot.label} idx={idx} />}
      progress={
        <Progress taken={Math.min(takenUnits, sa.filled)} total={sa.filled} need={sa.slot.units} label={sa.slot.label} />
      }
      action={!sa.satisfied && <SlotOptions target={{ slot: sa.slot }} classification={classification} idx={idx} />}
    >
      {sa.courses.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {sa.courses.map((code) => (
            <CourseChip key={code} code={code} status={placedStatus.get(code) ?? 'planned'} />
          ))}
        </div>
      )}
      {sa.slot.note && (
        <p className="text-xs text-muted-foreground">
          <LinkedText text={sa.slot.note} idx={idx} />
        </p>
      )}
    </Row>
  )
}

export function ProgramCard({ audit: pa, takenAudit, placedStatus, classification, idx }: ProgramCardProps) {
  const { program, allocation, totals } = pa
  const done = programSatisfied(pa)
  const bySlot = new Map(allocation.slots.map((sa) => [sa.slot.id, sa]))

  return (
    <Card className="gap-4 break-inside-avoid-page print:shadow-none">
      <CardHeader>
        <CardTitle className="font-serif text-xl">{program.name}</CardTitle>
        <CardDescription>
          {done ? 'All requirements met' : `${formatUnits(allocation.deficit)} units of course requirements remaining`}
        </CardDescription>
        <CardAction className="flex flex-wrap items-center justify-end gap-1">
          {done ? (
            <Badge className="bg-status-taken text-status-taken-foreground">
              <CheckCircle2 aria-hidden />
              Satisfied
            </Badge>
          ) : (
            <Badge variant="outline">In progress</Badge>
          )}
          <Button asChild variant="ghost" size="sm" className="print:hidden">
            <a href={program.calendarUrl} target="_blank" rel="noreferrer">
              Calendar
              <ExternalLink />
            </a>
          </Button>
          <Button asChild variant="ghost" size="sm" className="print:hidden">
            <a href={program.checklistUrl} target="_blank" rel="noreferrer">
              Checklist
              <ExternalLink />
            </a>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-5">
        {program.sections.map((section) => {
          const rows = section.slots.flatMap((s) => bySlot.get(s.id) ?? [])
          const need = rows.reduce((s, r) => s + r.slot.units, 0)
          const have = rows.reduce((s, r) => s + r.filled, 0)
          return (
            <section key={section.id} className="break-inside-avoid">
              <div className="flex items-baseline justify-between gap-3 border-b pb-1">
                <h3 className="text-base font-semibold">{section.label}</h3>
                <span className="shrink-0 font-mono text-xs text-muted-foreground tabular-nums">
                  {formatUnits(have)} / {formatUnits(need)} units
                </span>
              </div>
              <ul className="divide-y divide-dashed">
                {rows.map((sa) => (
                  <SlotRow key={sa.slot.id} sa={sa} placedStatus={placedStatus} classification={classification} idx={idx} />
                ))}
              </ul>
            </section>
          )
        })}

        {(allocation.floors.length > 0 || totals.length > 0 || allocation.depth) && (
          <section className="break-inside-avoid">
            <h3 className="border-b pb-1 text-base font-semibold">Overall constraints</h3>
            <ul className="divide-y divide-dashed">
              {allocation.floors.map((f) => {
                const takenFloor = takenAudit?.allocation.floors.find((x) => x.floor.id === f.floor.id)
                return (
                  <Row
                    key={f.floor.id}
                    ok={f.satisfied}
                    label={f.floor.label}
                    title={f.floor.label}
                    progress={
                      <Progress taken={Math.min(takenFloor?.units ?? 0, f.units)} total={f.units} need={f.floor.units} label={f.floor.label} />
                    }
                  />
                )
              })}
              {allocation.depth && (
                <Row
                  ok={allocation.depth.satisfied}
                  label={allocation.depth.rule.label}
                  title={allocation.depth.rule.label}
                  progress={
                    <Progress
                      taken={Math.min(takenAudit?.allocation.depth?.units ?? 0, allocation.depth.units)}
                      total={allocation.depth.units}
                      need={allocation.depth.rule.units}
                      label={allocation.depth.rule.label}
                    />
                  }
                  action={
                    !allocation.depth.satisfied && (
                      <SlotOptions
                        target={{ programId: program.id, ruleId: allocation.depth.rule.id, label: 'Depth' }}
                        classification={classification}
                        idx={idx}
                      />
                    )
                  }
                >
                  {allocation.depth.courses.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {allocation.depth.courses.map((code) => (
                        <CourseChip key={code} code={code} status={placedStatus.get(code) ?? 'planned'} />
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">{depthHint(allocation.depth)}</p>
                </Row>
              )}
              {totals.map((t) => {
                const takenTotal = takenAudit?.totals.find((x) => x.id === t.id)
                return (
                  <Row
                    key={t.id}
                    ok={t.satisfied}
                    label={t.label}
                    title={
                      <>
                        {t.label}
                        {t.have > t.units && (
                          <span className="ml-2 font-mono text-xs text-muted-foreground">({formatUnits(t.have)} counted)</span>
                        )}
                      </>
                    }
                    progress={<Progress taken={Math.min(takenTotal?.have ?? 0, t.have)} total={t.have} need={t.units} label={t.label} />}
                  />
                )
              })}
            </ul>
          </section>
        )}

        {program.notes && program.notes.length > 0 && (
          <ul className="list-disc space-y-1 pl-5 text-xs text-muted-foreground">
            {program.notes.map((note) => (
              <li key={note}>
                <LinkedText text={note} idx={idx} />
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
