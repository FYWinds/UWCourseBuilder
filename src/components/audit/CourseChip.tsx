import { CourseLink } from '@/components/course/CourseLink'
import { STATUS_META } from '@/components/course/status'
import type { CourseCode } from '@/domain/types'
import { cn } from '@/lib/utils'

/** Allocated course, colored as taken (teal) or planned (amber outline). */
export function CourseChip({ code, status }: { code: CourseCode; status: 'taken' | 'planned' }) {
  const meta = STATUS_META[status]
  const Icon = meta.icon
  return (
    <span
      title={meta.label}
      className={cn('inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-xs', meta.className)}
    >
      <Icon className="size-3" aria-label={meta.label} />
      <CourseLink code={code} />
    </span>
  )
}
