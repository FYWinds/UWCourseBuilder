import { AlertTriangle, CheckCircle2, CircleDot } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { CourseCode } from '@/domain/types'
import type { AuditResult, ClassifyResult } from '@/engine'
import { CourseLink } from './CourseLink'

/** Requirement slots the course can fill, or is allocated to when already in the plan. */
export function CourseFills({
  code,
  audit,
  classification,
}: {
  code: CourseCode
  audit: AuditResult
  classification: ClassifyResult
}) {
  const cl = classification.byCode.get(code)
  const placed = cl?.status === 'taken' || cl?.status === 'planned'
  const allocated = audit.programs.flatMap((pa) => {
    const slotId = pa.allocation.assignment.get(code)
    const slot = slotId ? pa.allocation.slots.find((s) => s.slot.id === slotId) : undefined
    return slot ? [{ programId: pa.program.id, program: pa.program.shortName, label: slot.slot.label }] : []
  })
  const excluded = audit.excluded.find((e) => e.code === code)
  const PlacedIcon = cl?.status === 'taken' ? CheckCircle2 : CircleDot

  return (
    <div className="space-y-3 text-sm">
      {allocated.length > 0 && (
        <ul className="space-y-1">
          {allocated.map((a) => (
            <li key={a.programId} className="flex items-start gap-2">
              <PlacedIcon
                className={cl?.status === 'taken' ? 'mt-0.5 size-4 shrink-0 text-status-taken' : 'mt-0.5 size-4 shrink-0 text-status-planned'}
                aria-label={cl?.status === 'taken' ? 'Allocated (taken)' : 'Allocated (planned)'}
              />
              <span>
                <Badge variant="outline" className="mr-1.5">{a.program}</Badge>
                {a.label}
              </span>
            </li>
          ))}
        </ul>
      )}
      {excluded && (
        <p className="flex items-start gap-2 text-destructive">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
          Doesn't count in your plan: {excluded.reason}
        </p>
      )}
      {placed && !excluded && allocated.length === 0 && (
        <p className="text-muted-foreground">In your plan; counts toward the 20.0-unit total only (free elective).</p>
      )}
      {cl && cl.slots.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Can fill</p>
          <ul className="space-y-1">
            {cl.slots.map((s) => (
              <li key={`${s.programId}:${s.slotId}`} className="flex items-start gap-2">
                <Badge variant="outline" className="shrink-0">{s.programName}</Badge>
                <span>{s.slotLabel}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {!placed && cl && cl.slots.length === 0 && (
        <p className="text-muted-foreground">
          {cl.status === 'blocked'
            ? "Can't count toward your degree (see above)."
            : cl.status === 'must'
              ? 'Needed as a prerequisite rather than to fill a requirement itself.'
              : 'No unmet requirement left for this course; it counts toward the 20.0-unit total only.'}
        </p>
      )}
      {cl && cl.prereqFor.length > 0 && (
        <p className="flex flex-wrap items-baseline gap-x-1.5 gap-y-1">
          <span className="text-muted-foreground">Unavoidable prerequisite for</span>
          {cl.prereqFor.map((c) => (
            <CourseLink key={c} code={c} />
          ))}
        </p>
      )}
    </div>
  )
}
