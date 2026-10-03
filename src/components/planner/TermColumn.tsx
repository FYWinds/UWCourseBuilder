import { useDroppable } from '@dnd-kit/core'
import { Briefcase, CheckCheck, CircleCheck, EllipsisVertical, Eraser } from 'lucide-react'
import { memo } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { TermKind } from '@/domain/plan'
import type { Course, CourseCode } from '@/domain/types'
import { type Issue, countsTowardDegree, formatCode, placementKey } from '@/engine'
import { cn } from '@/lib/utils'
import { usePlanStore } from '@/store/plan'
import { formatUnits } from './format'
import { SEVERITY_META } from './severity'
import { PlannedCourseCard } from './PlannedCourseCard'

export interface PlannerColumn {
  id: string
  /** -1 for transfer credit. */
  index: number
  kind: TermKind | 'transfer'
  label: string
  name: string
}

const NO_ISSUES: Issue[] = []

interface TermColumnProps {
  column: PlannerColumn
  codes: CourseCode[]
  byCode: Map<CourseCode, Course>
  byPlacement: Map<string, Issue[]>
  termIssues: Issue[]
  completed: boolean
  hasCompleted: boolean
  wtLimit: number
}

export const TermColumn = memo(function TermColumn({
  column,
  codes,
  byCode,
  byPlacement,
  termIssues,
  completed,
  hasCompleted,
  wtLimit,
}: TermColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id })
  const courses = codes.map((code) => ({ code, course: byCode.get(code) }))
  const academicUnits = courses.reduce((sum, { course }) => sum + (course && countsTowardDegree(course) ? course.units : 0), 0)
  const nonAcademic = courses.filter(({ course }) => course && !countsTowardDegree(course)).map(({ code }) => formatCode(code))
  const academicCount = courses.length - nonAcademic.length

  return (
    <section
      ref={setNodeRef}
      aria-label={`${column.label}, ${column.name}`}
      className={cn(
        'flex w-60 shrink-0 flex-col rounded-xl border transition-[box-shadow,background-color]',
        column.kind === 'study' && 'bg-card shadow-sm',
        column.kind === 'work' && 'border-2 border-dashed bg-card/50',
        column.kind === 'off' && 'bg-muted/50 text-muted-foreground',
        column.kind === 'transfer' && 'bg-secondary/50',
        isOver && 'bg-primary/5 ring-2 ring-primary/60',
      )}
    >
      <header className="flex items-start gap-2 border-b px-3 pt-2.5 pb-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            {column.kind === 'work' && <Briefcase className="size-4 text-muted-foreground" aria-hidden />}
            <h2 className={cn('leading-none font-semibold', column.kind === 'transfer' ? 'text-base' : 'text-xl')}>{column.label}</h2>
          </div>
          <p className="mt-1 truncate text-xs text-muted-foreground">{column.name}</p>
          {(completed || column.kind === 'work') && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {completed && (
                <Badge variant="outline" className="border-status-taken/50 text-status-taken">
                  <CircleCheck aria-hidden />
                  Completed
                </Badge>
              )}
              {column.kind === 'work' && (
                <Badge
                  variant="outline"
                  title="Co-op regulations limit courses during a work term; PD, COOP and WKRPT courses do not count"
                  className={cn(academicCount > wtLimit && 'border-destructive/50 text-destructive')}
                >
                  max {wtLimit} course{wtLimit > 1 ? 's' : ''}
                </Badge>
              )}
            </div>
          )}
        </div>
        {column.index >= 0 && <ColumnMenu column={column} hasCompleted={hasCompleted} />}
      </header>

      <div className="flex min-h-36 flex-1 flex-col gap-2 p-2">
        {courses.map(({ code, course }) => (
          <PlannedCourseCard
            key={code}
            code={code}
            termId={column.id}
            course={course}
            completed={completed}
            issues={byPlacement.get(placementKey(column.id, code)) ?? NO_ISSUES}
          />
        ))}
        {courses.length === 0 && (
          <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed p-3 text-center text-xs text-muted-foreground">
            {column.kind === 'transfer' ? 'Drop AP / IB / transfer credit here' : 'Drop courses here'}
          </div>
        )}
      </div>

      <footer className="space-y-1 border-t px-3 py-2 text-xs">
        <div className="flex items-baseline justify-between gap-2 text-muted-foreground">
          <span>
            <span className="font-medium text-foreground tabular-nums">{formatUnits(academicUnits)}</span> units
          </span>
          <span className="tabular-nums">
            {academicCount} course{academicCount === 1 ? '' : 's'}
          </span>
        </div>
        {nonAcademic.length > 0 && <p className="text-muted-foreground">+ {nonAcademic.join(', ')} (not counted in units)</p>}
        {termIssues.map((issue, i) => {
          const { icon: Icon, className, label } = SEVERITY_META[issue.severity]
          return (
            <p key={i} className={cn('flex gap-1', className)}>
              <Icon className="mt-px size-3.5 shrink-0" aria-label={label} />
              <span>{issue.message}</span>
            </p>
          )
        })}
      </footer>
    </section>
  )
})

function ColumnMenu({ column, hasCompleted }: { column: PlannerColumn; hasCompleted: boolean }) {
  const setCompletedThrough = usePlanStore((s) => s.setCompletedThrough)
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-xs" aria-label={`Options for ${column.label}`} className="-mr-1 text-muted-foreground">
          <EllipsisVertical />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel>
          {column.label} · {column.name}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => setCompletedThrough(column.index)}>
          <CheckCheck />
          Mark completed through here
        </DropdownMenuItem>
        {hasCompleted && (
          <DropdownMenuItem onSelect={() => setCompletedThrough(-1)}>
            <Eraser />
            Clear completed terms
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
