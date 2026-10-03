import { ChevronDown, Flame, ListChecks, Search } from 'lucide-react'
import { type ReactNode, useDeferredValue, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Course, CourseCode } from '@/domain/types'
import { STATUS_ORDER, formatCode, slotCandidates } from '@/engine'
import type { Analysis } from '@/lib/data'
import { cn } from '@/lib/utils'
import { SidebarCourse } from './SidebarCourse'

const SEARCH_LIMIT = 30
const GROUP_PREVIEW = 6

interface PlannerSidebarProps {
  analysis: Analysis
  /** Live placements (ahead of the deferred analysis) so dropped courses vanish immediately. */
  placed: Set<CourseCode>
}

export function PlannerSidebar({ analysis, placed }: PlannerSidebarProps) {
  const [open, setOpen] = useState(false)
  return (
    <aside
      aria-label="Course palette"
      className="rounded-xl border bg-card shadow-sm lg:sticky lg:top-20 lg:max-h-[calc(100svh-6rem)] lg:w-72 lg:shrink-0 lg:overflow-y-auto"
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium lg:hidden"
      >
        Course palette
        <ChevronDown className={cn('size-4 transition-transform', open && 'rotate-180')} aria-hidden />
      </button>
      <div className={cn('divide-y lg:block', open ? 'block border-t' : 'hidden')}>
        <MustSection analysis={analysis} placed={placed} />
        <RequiredSection analysis={analysis} placed={placed} />
        <SearchSection analysis={analysis} placed={placed} />
      </div>
    </aside>
  )
}

function SidebarSection({ icon, title, description, children }: { icon: ReactNode; title: string; description: string; children: ReactNode }) {
  return (
    <section className="px-3 py-3">
      <h2 className="flex items-center gap-1.5 px-1.5 font-sans text-sm font-semibold tracking-normal">
        {icon}
        {title}
      </h2>
      <p className="mb-1.5 px-1.5 text-xs text-muted-foreground">{description}</p>
      {children}
    </section>
  )
}

function EmptyLine({ children }: { children: ReactNode }) {
  return <p className="px-1.5 py-1 text-xs text-muted-foreground italic">{children}</p>
}

function MustSection({ analysis, placed }: PlannerSidebarProps) {
  const { classification, idx } = analysis
  const items = useMemo(
    () =>
      [...classification.byCode]
        .filter(([code, cl]) => cl.status === 'must' && !placed.has(code))
        .flatMap(([code, cl]) => {
          const course = idx.byCode.get(code)
          if (!course) return []
          // The newest reason is the one that made it 'must'; earlier ones are stale defaults.
          const hint = cl.prereqFor.length ? `Prereq for ${cl.prereqFor.map(formatCode).join(', ')}` : cl.reasons.at(-1)
          return [{ course, hint }]
        })
        .sort((a, b) => a.course.level - b.course.level || a.course.code.localeCompare(b.course.code)),
    [classification, idx, placed],
  )
  return (
    <SidebarSection
      icon={<Flame className="size-4 text-status-must" aria-hidden />}
      title="Must take"
      description="No alternative exists for these courses."
    >
      {items.length ? (
        <ul>
          {items.map(({ course, hint }) => (
            <SidebarCourse key={course.code} source="must" course={course} hint={hint} />
          ))}
        </ul>
      ) : (
        <EmptyLine>Every must-take course is in your plan.</EmptyLine>
      )}
    </SidebarSection>
  )
}

function RequiredSection({ analysis, placed }: PlannerSidebarProps) {
  const { audit, classification, idx } = analysis
  const groups = useMemo(
    () =>
      audit.programs.flatMap((pa) =>
        pa.allocation.slots
          .filter((s) => !s.satisfied && s.slot.kind === 'required')
          .map((s) => ({
            key: `${pa.program.id}:${s.slot.id}`,
            label: s.slot.label,
            program: pa.program.kind === 'core' ? null : pa.program.shortName,
            candidates: slotCandidates(s.slot, classification, idx)
              .filter((c) => !placed.has(c.code))
              .sort((a, b) => a.code.localeCompare(b.code)),
          }))
          .filter((g) => g.candidates.length > 0),
      ),
    [audit, classification, idx, placed],
  )
  return (
    <SidebarSection
      icon={<ListChecks className="size-4 text-status-required" aria-hidden />}
      title="Required — pick one"
      description="Each requirement needs one of these interchangeable courses."
    >
      {groups.length ? (
        <div className="space-y-2">
          {groups.map((g) => (
            <RequiredGroup key={g.key} label={g.label} program={g.program} candidates={g.candidates} source={g.key} />
          ))}
        </div>
      ) : (
        <EmptyLine>All required choices are covered.</EmptyLine>
      )}
    </SidebarSection>
  )
}

function RequiredGroup({ label, program, candidates, source }: { label: string; program: string | null; candidates: Course[]; source: string }) {
  const [expanded, setExpanded] = useState(false)
  const shown = expanded ? candidates : candidates.slice(0, GROUP_PREVIEW)
  return (
    <div>
      <p className="px-1.5 text-xs font-medium">
        {program && <span className="text-muted-foreground">{program} · </span>}
        {label}
      </p>
      <ul>
        {shown.map((course) => (
          <SidebarCourse key={course.code} source={source} course={course} />
        ))}
      </ul>
      {candidates.length > GROUP_PREVIEW && (
        <Button variant="link" size="xs" className="h-5 px-1.5 text-xs" onClick={() => setExpanded((e) => !e)}>
          {expanded ? 'Show fewer' : `Show ${candidates.length - GROUP_PREVIEW} more`}
        </Button>
      )}
    </div>
  )
}

function SearchSection({ analysis, placed }: PlannerSidebarProps) {
  const { classification, idx } = analysis
  const [query, setQuery] = useState('')
  const deferredQuery = useDeferredValue(query)

  const { results, total } = useMemo(() => {
    const text = deferredQuery.trim().toLowerCase()
    const compact = text.replace(/\s+/g, '')
    const rank = (c: Course) => STATUS_ORDER.indexOf(classification.byCode.get(c.code)?.status ?? 'free')
    const matches = idx.courses.filter((c) => {
      if (placed.has(c.code)) return false
      if (!text) return classification.byCode.get(c.code)?.status === 'counts'
      return c.code.toLowerCase().includes(compact) || c.title.toLowerCase().includes(text)
    })
    const prefix = (c: Course) => (compact && c.code.toLowerCase().startsWith(compact) ? 0 : 1)
    matches.sort((a, b) => prefix(a) - prefix(b) || rank(a) - rank(b) || a.code.localeCompare(b.code))
    return { results: matches.slice(0, SEARCH_LIMIT), total: matches.length }
  }, [deferredQuery, classification, idx, placed])

  return (
    <SidebarSection
      icon={<Search className="size-4 text-status-planned" aria-hidden />}
      title="Counts toward"
      description="Electives that fill an open requirement, or search any course."
    >
      <Input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search code or title…"
        aria-label="Search courses"
        className="mb-1.5 h-8 text-sm"
      />
      {results.length ? (
        <>
          <ul>
            {results.map((course) => (
              <SidebarCourse
                key={course.code}
                source="search"
                course={course}
                status={classification.byCode.get(course.code)?.status}
              />
            ))}
          </ul>
          {total > results.length && (
            <p className="px-1.5 pt-1 text-xs text-muted-foreground">
              Showing {results.length} of {total} — refine the search to see more.
            </p>
          )}
        </>
      ) : (
        <EmptyLine>{deferredQuery.trim() ? 'No matching courses.' : 'No open elective requirements.'}</EmptyLine>
      )}
    </SidebarSection>
  )
}
