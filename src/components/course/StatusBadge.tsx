import { Badge } from '@/components/ui/badge'
import type { CourseStatus } from '@/engine'
import { cn } from '@/lib/utils'
import { STATUS_META } from './status'

export function StatusBadge({ status, className }: { status: CourseStatus; className?: string }) {
  const meta = STATUS_META[status]
  const Icon = meta.icon
  return (
    <Badge variant="outline" title={meta.description} className={cn('gap-1 font-medium', meta.className, className)}>
      <Icon className="size-3" aria-hidden />
      {meta.label}
    </Badge>
  )
}
