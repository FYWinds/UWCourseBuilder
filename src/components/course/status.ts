import { Ban, CheckCircle2, CircleDashed, CircleDot, Flame, ListChecks, Sparkles, type LucideIcon } from 'lucide-react'
import type { CourseStatus } from '@/engine'

export interface StatusMeta {
  label: string
  description: string
  icon: LucideIcon
  /** Badge / chip classes (background + foreground + border). */
  className: string
  /** Solid color for dots, graph nodes and progress bars. */
  color: string
}

export const STATUS_META: Record<CourseStatus, StatusMeta> = {
  must: {
    label: 'Must take',
    description: 'No alternative: without it a requirement cannot be met',
    icon: Flame,
    className: 'bg-status-must text-status-must-foreground border-transparent',
    color: 'var(--status-must)',
  },
  required: {
    label: 'Required (one of)',
    description: 'One of interchangeable variants of a mandatory requirement',
    icon: ListChecks,
    className: 'bg-status-required/15 text-status-required border-status-required/40',
    color: 'var(--status-required)',
  },
  counts: {
    label: 'Counts toward',
    description: 'Fills an unmet elective requirement',
    icon: Sparkles,
    className: 'bg-status-counts text-status-counts-foreground border-transparent',
    color: 'var(--status-planned)',
  },
  planned: {
    label: 'Planned',
    description: 'In a future term of your plan',
    icon: CircleDot,
    className: 'bg-transparent text-status-planned border-status-planned',
    color: 'var(--status-planned)',
  },
  taken: {
    label: 'Taken',
    description: 'Completed (transfer credit or completed term)',
    icon: CheckCircle2,
    className: 'bg-status-taken text-status-taken-foreground border-transparent',
    color: 'var(--status-taken)',
  },
  free: {
    label: 'Free elective',
    description: 'Only counts toward the 20.0-unit total',
    icon: CircleDashed,
    className: 'bg-status-free text-status-free-foreground border-transparent',
    color: 'var(--status-free-foreground)',
  },
  blocked: {
    label: 'Blocked',
    description: 'Antirequisite conflict or restricted to other programs',
    icon: Ban,
    className: 'bg-transparent text-status-blocked border-status-blocked/50 line-through decoration-1',
    color: 'var(--status-blocked)',
  },
}
