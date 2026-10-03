import { useNavigate } from '@tanstack/react-router'
import { useCallback } from 'react'
import type { CourseCode } from '@/domain/types'
import { formatCode } from '@/engine'
import { cn } from '@/lib/utils'

/** Opens the global course detail sheet (root search param `course`). */
export function useOpenCourse() {
  const navigate = useNavigate()
  return useCallback(
    (code: CourseCode | undefined) =>
      navigate({ to: '.', search: (prev: Record<string, unknown>) => ({ ...prev, course: code }) }),
    [navigate],
  )
}

/** Monospace course code that opens the detail sheet. */
export function CourseLink({ code, className }: { code: CourseCode; className?: string }) {
  const open = useOpenCourse()
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        open(code)
      }}
      className={cn('font-mono text-[0.85em] font-medium underline-offset-2 hover:underline focus-visible:underline', className)}
    >
      {formatCode(code)}
    </button>
  )
}
