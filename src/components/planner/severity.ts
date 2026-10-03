import { CircleAlert, Info, type LucideIcon, TriangleAlert } from 'lucide-react'
import type { Severity } from '@/engine'

export const SEVERITY_META: Record<Severity, { icon: LucideIcon; className: string; label: string }> = {
  error: { icon: CircleAlert, className: 'text-destructive', label: 'Error' },
  warning: { icon: TriangleAlert, className: 'text-status-planned', label: 'Warning' },
  info: { icon: Info, className: 'text-muted-foreground', label: 'Note' },
}
