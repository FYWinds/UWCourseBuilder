import { useDraggable } from '@dnd-kit/core'
import { GripVertical, Plus } from 'lucide-react'
import { type KeyboardEvent, memo } from 'react'
import { AddToTermMenu } from '@/components/course/AddToTermMenu'
import { CourseLink, useOpenCourse } from '@/components/course/CourseLink'
import { StatusBadge } from '@/components/course/StatusBadge'
import { Button } from '@/components/ui/button'
import type { Course } from '@/domain/types'
import { type CourseStatus, formatCode } from '@/engine'
import { cn } from '@/lib/utils'
import { type DragCourse, dragId } from './dnd'

interface SidebarCourseProps {
  /** Section id; keeps drag ids unique when a course is listed twice. */
  source: string
  course: Course
  status?: CourseStatus
  hint?: string
}

/** Draggable palette row: drag onto a term, click for details, + for the term menu. */
export const SidebarCourse = memo(function SidebarCourse({ source, course, status, hint }: SidebarCourseProps) {
  const data: DragCourse = { code: course.code, from: null }
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, isDragging } = useDraggable({
    id: dragId(source, course.code),
    data,
  })
  const open = useOpenCourse()

  const onKeyDown = (e: KeyboardEvent<HTMLLIElement>) => {
    listeners?.onKeyDown?.(e)
    if (e.key === 'Enter' && e.target === e.currentTarget && !isDragging) open(course.code)
  }

  return (
    <li
      ref={(node) => {
        setNodeRef(node)
        setActivatorNodeRef(node)
      }}
      {...attributes}
      {...listeners}
      onKeyDown={onKeyDown}
      onClick={() => open(course.code)}
      aria-label={`${formatCode(course.code)} ${course.title}`}
      className={cn(
        'group flex cursor-grab touch-none items-start gap-1.5 rounded-md px-1.5 py-1.5 text-sm select-none',
        'hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:outline-none',
        isDragging && 'opacity-40',
      )}
    >
      <GripVertical className="mt-0.5 size-3.5 shrink-0 text-muted-foreground/60 group-hover:text-muted-foreground" aria-hidden />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <CourseLink code={course.code} />
          {status && <StatusBadge status={status} className="h-4.5 px-1.5 text-[0.65rem]" />}
        </div>
        <p className="truncate text-xs text-muted-foreground" title={course.title}>
          {course.title}
        </p>
        {hint && <p className="text-[0.7rem] leading-snug text-status-required">{hint}</p>}
      </div>
      <span onClick={(e) => e.stopPropagation()} className="contents">
        <AddToTermMenu code={course.code}>
          <Button variant="ghost" size="icon-xs" aria-label={`Add ${formatCode(course.code)} to a term`} className="text-muted-foreground">
            <Plus />
          </Button>
        </AddToTermMenu>
      </span>
    </li>
  )
})
