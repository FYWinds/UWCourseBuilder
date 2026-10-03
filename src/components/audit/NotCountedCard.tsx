import { CheckCircle2, CircleAlert } from 'lucide-react'
import { CourseLink } from '@/components/course/CourseLink'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { AuditResult, CatalogIndex } from '@/engine'
import { LinkedText } from './LinkedText'

/** Placed courses that do not count, plus the full-time term requirement. */
export function NotCountedCard({ audit, idx }: { audit: AuditResult; idx: CatalogIndex }) {
  const { have, need } = audit.fullTimeTerms
  const fullTimeOk = have >= need
  return (
    <Card className="gap-4 break-inside-avoid print:shadow-none">
      <CardHeader>
        <CardTitle className="font-serif text-xl">Not counted &amp; term load</CardTitle>
        <CardDescription>Repeats, cross-listed twins and antirequisite pairs count only once (the earlier course wins).</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {audit.excluded.length === 0 ? (
          <p className="text-sm text-muted-foreground">Every placed course counts toward the degree.</p>
        ) : (
          <ul className="divide-y divide-dashed">
            {audit.excluded.map((e, i) => (
              <li key={`${e.code}-${i}`} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 py-2 text-sm">
                <CourseLink code={e.code} className="text-destructive line-through decoration-1" />
                <span className="text-muted-foreground">
                  <LinkedText text={e.reason} idx={idx} />
                </span>
              </li>
            ))}
          </ul>
        )}
        <div className="flex items-start gap-3 rounded-lg border bg-muted/40 px-3 py-2.5 text-sm">
          {fullTimeOk ? (
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-status-taken" aria-label="Satisfied" />
          ) : (
            <CircleAlert className="mt-0.5 size-4 shrink-0 text-destructive" aria-label="Not yet satisfied" />
          )}
          <div>
            <p className="font-medium">
              Full-time terms: <span className="font-mono tabular-nums">{have} / {need}</span>
            </p>
            <p className="text-xs text-muted-foreground">
              A full-time term has at least three courses totalling 1.5 units; {need === 8 ? 'co-op' : 'regular'} students need {need}.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
