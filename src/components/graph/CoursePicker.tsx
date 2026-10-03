import { ChevronsUpDown } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import type { Course, CourseCode } from '@/domain/types'
import { formatCode } from '@/engine'

const MAX_MATCHES = 30

interface CoursePickerProps {
  courses: Course[]
  value: CourseCode
  onSelect: (code: CourseCode) => void
}

/** Prefix search on course codes ("cs 34" → CS341, CS343, …). */
export function CoursePicker({ courses, value, onSelect }: CoursePickerProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')

  const matches = useMemo(() => {
    const prefix = query.toUpperCase().replace(/\s+/g, '')
    if (!prefix) return []
    return courses
      .filter((c) => c.code.startsWith(prefix))
      .sort((a, b) => a.code.length - b.code.length || a.code.localeCompare(b.code))
      .slice(0, MAX_MATCHES)
  }, [courses, query])

  const choose = (code: CourseCode) => {
    onSelect(code)
    setOpen(false)
    setQuery('')
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label={`Focus course: ${formatCode(value)}`}
          className="w-36 justify-between font-mono"
        >
          {formatCode(value)}
          <ChevronsUpDown className="size-4 opacity-50" aria-hidden />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80 p-0">
        <Command shouldFilter={false}>
          <CommandInput value={query} onValueChange={setQuery} placeholder="Course code, e.g. CS 341" />
          <CommandList>
            <CommandEmpty>{query.trim() ? 'No course code starts with that.' : 'Type a course code.'}</CommandEmpty>
            {matches.length > 0 && (
              <CommandGroup>
                {matches.map((course) => (
                  <CommandItem key={course.code} value={course.code} onSelect={() => choose(course.code)}>
                    <span className="w-20 shrink-0 font-mono text-xs font-medium">{formatCode(course.code)}</span>
                    <span className="truncate text-muted-foreground">{course.title}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
