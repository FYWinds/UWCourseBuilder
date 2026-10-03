import { Check, ChevronsUpDown } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import type { Course } from '@/domain/types'
import { cn } from '@/lib/utils'

export function SubjectPicker({
  courses,
  value,
  onChange,
}: {
  courses: Course[]
  value: string | undefined
  onChange: (subject: string | undefined) => void
}) {
  const [open, setOpen] = useState(false)
  const subjects = useMemo(() => {
    const counts = new Map<string, number>()
    for (const c of courses) counts.set(c.subject, (counts.get(c.subject) ?? 0) + 1)
    return [...counts].sort(([a], [b]) => a.localeCompare(b))
  }, [courses])

  const select = (subject: string | undefined) => {
    onChange(subject)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" role="combobox" aria-expanded={open} className="w-32 justify-between font-normal">
          <span className={cn('truncate', value ? 'font-mono' : 'text-muted-foreground')}>{value ?? 'Subject'}</span>
          <ChevronsUpDown className="opacity-50" aria-hidden />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-60 p-0" align="start">
        <Command>
          <CommandInput placeholder="Find subject…" />
          <CommandList>
            <CommandEmpty>No subject.</CommandEmpty>
            <CommandItem value="__all" onSelect={() => select(undefined)}>
              <Check className={cn(value ? 'opacity-0' : 'opacity-100')} aria-hidden />
              All subjects
            </CommandItem>
            {subjects.map(([subject, count]) => (
              <CommandItem key={subject} value={subject} onSelect={() => select(subject)}>
                <Check className={cn(value === subject ? 'opacity-100' : 'opacity-0')} aria-hidden />
                <span className="font-mono">{subject}</span>
                <span className="ml-auto text-xs text-muted-foreground tabular-nums">{count}</span>
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
