import { Search } from 'lucide-react'
import { Suspense, useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import type { Course } from '@/domain/types'
import { formatCode } from '@/engine'
import { useAnalysis } from '@/lib/data'
import { useOpenCourse } from './CourseLink'
import { StatusBadge } from './StatusBadge'

const MAX_RESULTS = 50
const IS_MAC = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.userAgent)

export function CommandSearch() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((o) => !o)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        aria-label="Search courses"
        className="gap-2 text-muted-foreground lg:w-56 lg:justify-start"
      >
        <Search />
        <span className="hidden lg:inline">Search courses</span>
        <kbd className="pointer-events-none ml-auto hidden rounded border bg-muted px-1.5 font-mono text-[0.7rem] font-medium sm:inline-block">
          {IS_MAC ? '⌘K' : 'Ctrl K'}
        </kbd>
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-xl" showCloseButton={false}>
          <DialogTitle className="sr-only">Search courses</DialogTitle>
          <DialogDescription className="sr-only">Search the 2026/27 calendar by course code or title.</DialogDescription>
          <Suspense fallback={<p className="p-6 text-center text-sm text-muted-foreground">Loading courses…</p>}>
            <SearchPalette onDone={() => setOpen(false)} />
          </Suspense>
        </DialogContent>
      </Dialog>
    </>
  )
}

/** Code-prefix matches first, then number-prefix, then title substring. */
function searchCourses(courses: Course[], query: string): Course[] {
  const code = query.toUpperCase().replace(/\s+/g, '')
  const title = query.trim().toLowerCase()
  const byCode: Course[] = []
  const byNumber: Course[] = []
  const byTitle: Course[] = []
  for (const c of courses) {
    if (c.code.startsWith(code)) byCode.push(c)
    else if (c.number.startsWith(code)) byNumber.push(c)
    else if (c.title.toLowerCase().includes(title)) byTitle.push(c)
    if (byCode.length >= MAX_RESULTS) break
  }
  return [...byCode, ...byNumber, ...byTitle].slice(0, MAX_RESULTS)
}

function SearchPalette({ onDone }: { onDone: () => void }) {
  const { idx, classification } = useAnalysis()
  const openCourse = useOpenCourse()
  const [query, setQuery] = useState('')
  const trimmed = query.trim()

  const suggested = useMemo(
    () => idx.courses.filter((c) => classification.byCode.get(c.code)?.status === 'must').slice(0, MAX_RESULTS),
    [idx, classification],
  )
  const results = useMemo(() => (trimmed ? searchCourses(idx.courses, trimmed) : suggested), [idx, trimmed, suggested])

  return (
    <Command
      shouldFilter={false}
      className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground"
    >
      <CommandInput
        value={query}
        onValueChange={setQuery}
        placeholder="Course code or title, e.g. CS 341 or algorithms"
        className="h-12"
      />
      <CommandList className="max-h-[min(60vh,420px)]">
        <CommandEmpty>No courses match “{trimmed}”.</CommandEmpty>
        {results.length > 0 && (
          <CommandGroup heading={trimmed ? `${results.length === MAX_RESULTS ? 'Top 50' : results.length} results` : 'Must take'}>
            {results.map((c) => {
              const status = classification.byCode.get(c.code)?.status
              return (
                <CommandItem
                  key={c.code}
                  value={c.code}
                  onSelect={() => {
                    onDone()
                    openCourse(c.code)
                  }}
                  className="gap-3 py-2"
                >
                  <span className="w-20 shrink-0 font-mono text-[0.85em] font-medium">{formatCode(c.code)}</span>
                  <span className="min-w-0 flex-1 truncate">{c.title}</span>
                  {status && <StatusBadge status={status} className="shrink-0 text-[0.7rem]" />}
                </CommandItem>
              )
            })}
          </CommandGroup>
        )}
      </CommandList>
    </Command>
  )
}
