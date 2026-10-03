import { Link } from '@tanstack/react-router'
import { useMemo } from 'react'
import { LinkedText } from '@/components/audit/LinkedText'
import { formatUnits } from '@/components/audit/units'
import { StatusBadge } from '@/components/course/StatusBadge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { Course } from '@/domain/types'
import { slotCandidates } from '@/engine'
import type { Analysis } from '@/lib/data'
import { CandidateChip } from './CandidateChip'

interface ChoiceGroup {
  key: string
  programName: string
  slotLabel: string
  missing: number
  candidates: Course[]
}

export function MustTakePanel({ analysis }: { analysis: Analysis }) {
  const { audit, classification, idx } = analysis

  const musts = useMemo(
    () =>
      [...classification.byCode]
        .filter(([, c]) => c.status === 'must')
        .map(([code]) => idx.byCode.get(code))
        .filter((c): c is Course => !!c)
        .sort((a, b) => a.code.localeCompare(b.code)),
    [classification, idx],
  )

  const groups = useMemo(() => {
    const mustCodes = new Set(musts.map((c) => c.code))
    const out: ChoiceGroup[] = []
    for (const pa of audit.programs) {
      for (const sa of pa.allocation.slots) {
        if (sa.satisfied || sa.slot.kind !== 'required') continue
        const candidates = slotCandidates(sa.slot, classification, idx).sort((a, b) => a.code.localeCompare(b.code))
        if (candidates.length > 0 && candidates.every((c) => mustCodes.has(c.code))) continue
        out.push({
          key: `${pa.program.id}:${sa.slot.id}`,
          programName: pa.program.shortName,
          slotLabel: sa.slot.label,
          missing: sa.slot.units - sa.filled,
          candidates,
        })
      }
    }
    return out
  }, [audit.programs, classification, idx, musts])

  const empty = musts.length === 0 && groups.length === 0

  return (
    <Card className="gap-4">
      <CardHeader>
        <CardTitle className="font-serif text-lg">What you still must take</CardTitle>
        <CardDescription>
          Strictly mandatory: without these courses some requirement can no longer be met. Hover a course for the reason.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {empty && (
          <p className="text-sm text-muted-foreground">
            Nothing is strictly mandatory beyond your plan. Remaining requirements (if any) are open electives — see the{' '}
            <Link to="/audit" search={(prev) => prev} className="underline underline-offset-2">
              audit
            </Link>
            .
          </p>
        )}

        {musts.length > 0 && (
          <section className="space-y-2">
            <div className="flex items-center gap-2">
              <StatusBadge status="must" />
              <span className="text-xs text-muted-foreground">
                {musts.length} course{musts.length === 1 ? '' : 's'}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {musts.map((course) => (
                <CandidateChip key={course.code} course={course} info={classification.byCode.get(course.code)} />
              ))}
            </div>
          </section>
        )}

        {groups.length > 0 && (
          <section className="space-y-2">
            <div className="flex items-center gap-2">
              <StatusBadge status="required" />
              <span className="text-xs text-muted-foreground">take one variant of each</span>
            </div>
            <ul className="divide-y divide-dashed">
              {groups.map((g) => (
                <li key={g.key} className="grid gap-1.5 py-2 sm:grid-cols-[minmax(0,14rem)_minmax(0,1fr)] sm:gap-3">
                  <div className="min-w-0 text-sm">
                    <p className="font-medium">
                      <LinkedText text={g.slotLabel} idx={idx} />
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {g.programName} · {formatUnits(g.missing)} units missing
                    </p>
                  </div>
                  <div className="flex flex-wrap items-start gap-1.5">
                    {g.candidates.length === 0 ? (
                      <span className="text-xs text-destructive">No available course can fill this requirement.</span>
                    ) : (
                      g.candidates.map((course) => (
                        <CandidateChip key={course.code} course={course} info={classification.byCode.get(course.code)} />
                      ))
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}
      </CardContent>
    </Card>
  )
}
