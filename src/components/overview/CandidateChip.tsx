import { CalendarPlus } from 'lucide-react'
import { AddToTermMenu } from '@/components/course/AddToTermMenu'
import { CourseLink } from '@/components/course/CourseLink'
import { STATUS_META } from '@/components/course/status'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { Course } from '@/domain/types'
import { type Classification, formatCode } from '@/engine'
import { cn } from '@/lib/utils'

/** Course chip with status color, an explanatory tooltip and a quick "add to term" menu. */
export function CandidateChip({ course, info }: { course: Course; info: Classification | undefined }) {
  const status = info?.status ?? 'free'
  const meta = STATUS_META[status]
  const Icon = meta.icon
  const fills = [...new Set(info?.slots.map((s) => `${s.slotLabel} (${s.programName})`))]
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-md border py-0.5 pr-0.5 pl-1.5 text-xs', meta.className)}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex items-center gap-1">
            <Icon className="size-3" aria-label={meta.label} />
            <CourseLink code={course.code} />
          </span>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs space-y-1 text-left">
          <p className="font-medium">
            {formatCode(course.code)} — {course.title}
          </p>
          {info?.reasons.map((r) => <p key={r}>{r}</p>)}
          {info && info.prereqFor.length > 0 && (
            <p>Prerequisite for {info.prereqFor.map(formatCode).join(', ')}</p>
          )}
          {fills.length > 0 && <p>Fills: {fills.join('; ')}</p>}
        </TooltipContent>
      </Tooltip>
      <AddToTermMenu code={course.code}>
        <Button
          variant="ghost"
          size="icon"
          className="size-5 rounded-sm hover:bg-background/40"
          aria-label={`Add ${formatCode(course.code)} to a term`}
        >
          <CalendarPlus className="size-3" />
        </Button>
      </AddToTermMenu>
    </span>
  )
}
