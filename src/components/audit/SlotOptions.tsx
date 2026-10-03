import { CalendarPlus, ListFilter } from 'lucide-react'
import { useMemo, useState } from 'react'
import { AddToTermMenu } from '@/components/course/AddToTermMenu'
import { CourseLink } from '@/components/course/CourseLink'
import { StatusBadge } from '@/components/course/StatusBadge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import type { Slot } from '@/domain/requirements'
import type { Course } from '@/domain/types'
import {
  type CatalogIndex,
  type ClassifyResult,
  STATUS_ORDER,
  formatCode,
  ruleCandidates,
  slotCandidates,
} from '@/engine'

const LIST_CAP = 60

/** An unmet slot, or a program-level rule (e.g. depth) whose candidates classify tagged. */
export type OptionsTarget = { slot: Slot } | { programId: string; ruleId: string; label: string }

function sortedCandidates(target: OptionsTarget, classification: ClassifyResult, idx: CatalogIndex): Course[] {
  const rank = (c: Course) => STATUS_ORDER.indexOf(classification.byCode.get(c.code)?.status ?? 'free')
  const courses =
    'slot' in target
      ? slotCandidates(target.slot, classification, idx)
      : ruleCandidates(target.programId, target.ruleId, classification, idx)
  return courses.sort((a, b) => rank(a) - rank(b) || a.code.localeCompare(b.code))
}

function matches(course: Course, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  const compact = q.replace(/\s+/g, '')
  return course.code.toLowerCase().includes(compact) || course.title.toLowerCase().includes(q)
}

/** "Show options" popover: courses that could still fill an unmet slot or rule. */
export function SlotOptions({
  target,
  classification,
  idx,
}: {
  target: OptionsTarget
  classification: ClassifyResult
  idx: CatalogIndex
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const candidates = useMemo(
    () => (open ? sortedCandidates(target, classification, idx) : []),
    [open, target, classification, idx],
  )
  const filtered = useMemo(() => candidates.filter((c) => matches(c, query)), [candidates, query])
  const shown = filtered.slice(0, LIST_CAP)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 px-2 text-xs print:hidden">
          <ListFilter />
          Show options
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[30rem] max-w-[calc(100vw-2rem)] p-0">
        <div className="border-b px-3 py-2">
          <p className="text-sm font-medium">{'slot' in target ? target.slot.label : target.label}</p>
          <p className="text-xs text-muted-foreground">
            {candidates.length} available course{candidates.length === 1 ? '' : 's'}, most useful first
          </p>
          {candidates.length > LIST_CAP && (
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter by code or title…"
              aria-label="Filter options"
              className="mt-2 h-8"
            />
          )}
        </div>
        <ul className="max-h-80 divide-y overflow-y-auto">
          {shown.map((course) => (
            <li key={course.code} className="flex items-center gap-2 px-3 py-1.5">
              <StatusBadge status={classification.byCode.get(course.code)?.status ?? 'free'} className="shrink-0" />
              <CourseLink code={course.code} className="shrink-0" />
              <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground" title={course.title}>
                {course.title}
              </span>
              <AddToTermMenu code={course.code}>
                <Button variant="ghost" size="icon" className="size-7 shrink-0" aria-label={`Add ${formatCode(course.code)} to a term`}>
                  <CalendarPlus />
                </Button>
              </AddToTermMenu>
            </li>
          ))}
          {shown.length === 0 && (
            <li className="px-3 py-4 text-center text-sm text-muted-foreground">
              {candidates.length === 0 ? 'No available course can fill this requirement.' : 'No course matches the filter.'}
            </li>
          )}
        </ul>
        {filtered.length > LIST_CAP && (
          <p className="border-t px-3 py-1.5 text-xs text-muted-foreground">
            Showing {LIST_CAP} of {filtered.length}; refine the filter to see more.
          </p>
        )}
      </PopoverContent>
    </Popover>
  )
}
