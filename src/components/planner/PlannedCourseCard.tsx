import { useDraggable } from '@dnd-kit/core'
import { X } from 'lucide-react'
import { type KeyboardEvent, type ReactNode, memo } from 'react'
import { CourseLink, useOpenCourse } from '@/components/course/CourseLink'
import { Button } from '@/components/ui/button'
import type { Course, CourseCode } from '@/domain/types'
import { type Issue, formatCode } from '@/engine'
import { cn } from '@/lib/utils'
import { usePlanStore } from '@/store/plan'
import { type DragCourse, dragId } from './dnd'
import { formatUnits } from './format'
import { IssueIndicator } from './IssueIndicator'

interface PlannedCourseCardProps {
  code: CourseCode
  termId: string
  course: Course | undefined
  completed: boolean
  issues: Issue[]
}

function sameIssues(a: Issue[], b: Issue[]) {
  return a === b || (a.length === b.length && a.every((x, i) => x.severity === b[i].severity && x.message === b[i].message))
}

/** A placed course: drag to move, click to open details, × to remove. */
export const PlannedCourseCard = memo(
  function PlannedCourseCard({ code, termId, course, completed, issues }: PlannedCourseCardProps) {
    const data: DragCourse = { code, from: termId }
    const { attributes, listeners, setNodeRef, setActivatorNodeRef, isDragging } = useDraggable({ id: dragId('placed', code), data })
    const open = useOpenCourse()
    const removeCourse = usePlanStore((s) => s.removeCourse)
    const hasError = issues.some((i) => i.severity === 'error')

    const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
      listeners?.onKeyDown?.(e)
      if (e.key === 'Enter' && e.target === e.currentTarget && !isDragging) open(code)
    }

    return (
      <div
        ref={(node) => {
          setNodeRef(node)
          setActivatorNodeRef(node)
        }}
        {...attributes}
        {...listeners}
        onKeyDown={onKeyDown}
        onClick={() => open(code)}
        aria-label={`${formatCode(code)}${course ? ` ${course.title}` : ''}`}
        className={cn(
          'group relative cursor-grab touch-none rounded-lg border border-l-4 bg-card px-2.5 py-2 text-sm shadow-xs transition-colors select-none',
          'hover:bg-secondary/60 focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:outline-none',
          completed ? 'border-l-status-taken' : 'border-l-status-planned',
          hasError && 'border-y-destructive/40 border-r-destructive/40',
          isDragging && 'opacity-40',
        )}
      >
        <CourseCardBody code={code} course={course}>
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label={`Remove ${formatCode(code)} from plan`}
            className="-mt-0.5 -mr-1 text-muted-foreground hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation()
              removeCourse(code)
            }}
          >
            <X />
          </Button>
        </CourseCardBody>
        <IssueIndicator issues={issues} className="mt-1" />
      </div>
    )
  },
  (a, b) =>
    a.code === b.code &&
    a.termId === b.termId &&
    a.course === b.course &&
    a.completed === b.completed &&
    sameIssues(a.issues, b.issues),
)

function CourseCardBody({ code, course, children }: { code: CourseCode; course: Course | undefined; children?: ReactNode }) {
  return (
    <>
      <div className="flex items-start gap-1.5">
        <CourseLink code={code} className="text-sm" />
        <span className="ml-auto pt-0.5 text-[0.7rem] text-muted-foreground tabular-nums">
          {course ? formatUnits(course.units) : '?'}
        </span>
        {children}
      </div>
      <p className="line-clamp-2 text-xs leading-snug text-muted-foreground">{course?.title ?? 'Unknown course'}</p>
    </>
  )
}

/** Floating copy rendered by DragOverlay while a course is being dragged. */
export function CourseDragPreview({ code, course }: { code: CourseCode; course: Course | undefined }) {
  return (
    <div className="w-56 cursor-grabbing rounded-lg border border-l-4 border-l-primary bg-card px-2.5 py-2 text-sm shadow-lg ring-1 ring-primary/30">
      <CourseCardBody code={code} course={course} />
    </div>
  )
}
