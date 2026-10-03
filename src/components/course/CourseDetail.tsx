import { CalendarCheck, ExternalLink, SearchX } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { TRANSFER_TERM_ID } from '@/domain/plan'
import type { CourseCode } from '@/domain/types'
import { type CatalogIndex, type ClassifyResult, STATUS_ORDER, formatCode } from '@/engine'
import { useAnalysis } from '@/lib/data'
import { AddToTermMenu } from './AddToTermMenu'
import { CourseFills } from './CourseFills'
import { CourseLink } from './CourseLink'
import { CourseSection } from './CourseSection'
import { FACULTY_LABEL } from './labels'
import { OfferingHistory } from './OfferingHistory'
import { RequisiteTree, RequisiteVerdict, planRequisiteContext } from './RequisiteTree'
import { STATUS_META } from './status'
import { StatusBadge } from './StatusBadge'

const UNLOCK_PREVIEW = 40

export function CourseDetail({ code }: { code: CourseCode }) {
  const analysis = useAnalysis()
  const { idx, plan, audit, classification } = analysis
  const reqContext = useMemo(() => planRequisiteContext(analysis), [analysis])
  const course = idx.byCode.get(code)
  if (!course) return <NotFound code={code} />

  const cl = classification.byCode.get(code)
  const termId = Object.entries(plan.placements).find(([, codes]) => codes.includes(code))?.[0]
  const term = audit.terms.find((t) => t.id === termId)
  const termLabel = termId === TRANSFER_TERM_ID ? 'Transfer / AP credit' : term ? `${term.label} · ${term.name}` : null
  const hasAnti = course.antireq.length > 0 || (course.antireqText?.length ?? 0) > 0

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <SheetHeader className="gap-3 border-b bg-card/60 p-6 pr-12">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="font-mono text-2xl font-semibold tracking-tight">{formatCode(code)}</span>
          <SheetDescription>
            {course.units.toFixed(2)} units · {FACULTY_LABEL[course.faculty]}
          </SheetDescription>
        </div>
        <SheetTitle className="text-xl leading-snug">{course.title}</SheetTitle>
        {cl && (
          <div className="flex flex-wrap items-start gap-2">
            <StatusBadge status={cl.status} />
            {cl.reasons.length > 0 && (
              <ul className="min-w-0 flex-1 space-y-0.5 text-xs text-muted-foreground">
                {cl.reasons.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            )}
          </div>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <AddToTermMenu code={code} />
          {termLabel && (
            <span className="inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs">
              <CalendarCheck className="size-3.5 text-muted-foreground" aria-hidden />
              {termLabel}
            </span>
          )}
          <Button variant="ghost" size="sm" asChild className="ml-auto">
            <a
              href={`https://uwaterloo.ca/academic-calendar/undergraduate-studies/catalog#/courses?search=${encodeURIComponent(code)}`}
              target="_blank"
              rel="noreferrer"
            >
              <ExternalLink />
              View in calendar
            </a>
          </Button>
        </div>
      </SheetHeader>

      <div className="space-y-7 p-6">
        <div className="space-y-2">
          <p className="text-sm leading-relaxed whitespace-pre-line">{course.description || 'No description in the calendar.'}</p>
          {course.notes && <p className="text-xs leading-relaxed text-muted-foreground">{course.notes}</p>}
        </div>

        <CourseSection title="Fills">
          <CourseFills code={code} audit={audit} classification={classification} />
        </CourseSection>

        <CourseSection title="Prerequisites">
          {course.prereq ? (
            <div className="space-y-2">
              <RequisiteVerdict req={course.prereq} context={reqContext} />
              <RequisiteTree req={course.prereq} context={reqContext} className="rounded-lg border bg-card p-3" />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">None.</p>
          )}
        </CourseSection>

        {course.coreq && (
          <CourseSection title="Corequisites">
            <div className="space-y-2">
              <RequisiteVerdict req={course.coreq} context={reqContext} asCoreq />
              <RequisiteTree req={course.coreq} context={reqContext} asCoreq className="rounded-lg border bg-card p-3" />
            </div>
          </CourseSection>
        )}

        {(hasAnti || course.crossListed.length > 0) && (
          <CourseSection title="Antirequisites & cross-listings">
            <div className="space-y-2 text-sm">
              {hasAnti && (
                <div className="space-y-1">
                  {course.antireq.length > 0 && <CodeList label="Antirequisites" codes={course.antireq} idx={idx} />}
                  {course.antireqText?.map((t) => (
                    <p key={t} className="text-xs text-muted-foreground">
                      {t}
                    </p>
                  ))}
                </div>
              )}
              {course.crossListed.length > 0 && <CodeList label="Cross-listed as" codes={course.crossListed} idx={idx} />}
            </div>
          </CourseSection>
        )}

        <Unlocks code={code} idx={idx} classification={classification} />

        <CourseSection title="Offering history">
          <OfferingHistory course={course} meta={idx.meta} />
        </CourseSection>
      </div>
    </div>
  )
}

function CodeList({ label, codes, idx }: { label: string; codes: CourseCode[]; idx: CatalogIndex }) {
  return (
    <p className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
      <span className="text-muted-foreground">{label}</span>
      {codes.map((c) =>
        idx.byCode.has(c) ? (
          <CourseLink key={c} code={c} />
        ) : (
          <span key={c} className="font-mono text-[0.85em] text-muted-foreground">
            {formatCode(c)}
          </span>
        ),
      )}
    </p>
  )
}

function Unlocks({ code, idx, classification }: { code: CourseCode; idx: CatalogIndex; classification: ClassifyResult }) {
  const [showAll, setShowAll] = useState(false)
  const rank = (c: CourseCode) => STATUS_ORDER.indexOf(classification.byCode.get(c)?.status ?? 'blocked')
  const codes = [...(idx.unlocks.get(code) ?? [])].sort((a, b) => rank(a) - rank(b) || a.localeCompare(b))
  if (codes.length === 0) return null
  const shown = showAll ? codes : codes.slice(0, UNLOCK_PREVIEW)

  return (
    <CourseSection title="Unlocks" aside={`${codes.length} course${codes.length === 1 ? '' : 's'} mention it as a requisite`}>
      <div className="flex flex-wrap gap-1.5">
        {shown.map((c) => {
          const status = classification.byCode.get(c)?.status
          return (
            <span
              key={c}
              title={`${idx.byCode.get(c)?.title ?? ''}${status ? ` — ${STATUS_META[status].label}` : ''}`}
              className="inline-flex items-center gap-1.5 rounded-md border bg-card px-2 py-0.5"
            >
              {status && (
                <span className="size-1.5 rounded-full" style={{ backgroundColor: STATUS_META[status].color }} aria-hidden />
              )}
              <CourseLink code={c} />
            </span>
          )
        })}
        {codes.length > UNLOCK_PREVIEW && (
          <Button variant="ghost" size="xs" onClick={() => setShowAll((v) => !v)}>
            {showAll ? 'Show fewer' : `Show all ${codes.length}`}
          </Button>
        )}
      </div>
    </CourseSection>
  )
}

function NotFound({ code }: { code: CourseCode }) {
  return (
    <SheetHeader className="items-start gap-3 p-6 pr-12">
      <SearchX className="size-8 text-muted-foreground" aria-hidden />
      <SheetTitle className="text-xl">Course not found in the 2026/27 calendar</SheetTitle>
      <SheetDescription>
        <span className="font-mono">{formatCode(code)}</span> isn't listed in the current Undergraduate Calendar. It may have been
        renamed, retired, or mistyped.
      </SheetDescription>
    </SheetHeader>
  )
}
