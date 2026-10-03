import { CalendarPlus, Check, Trash2 } from 'lucide-react'
import type { ReactNode } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { TRANSFER_TERM_ID } from '@/domain/plan'
import type { CourseCode } from '@/domain/types'
import { buildTerms, formatCode } from '@/engine'
import { usePlanStore } from '@/store/plan'

/**
 * Dropdown to place a course into a term (or transfer credit), move it, or remove it.
 * Pass `children` to customize the trigger; defaults to a small outline button.
 */
export function AddToTermMenu({ code, children }: { code: CourseCode; children?: ReactNode }) {
  const plan = usePlanStore((s) => s.plan)
  const placeCourse = usePlanStore((s) => s.placeCourse)
  const removeCourse = usePlanStore((s) => s.removeCourse)
  const terms = buildTerms(plan)
  const current = Object.entries(plan.placements).find(([, codes]) => codes.includes(code))?.[0]
  const place = (termId: string, label: string) => {
    placeCourse(termId, code)
    toast.success(`${formatCode(code)} → ${label}`)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {children ?? (
          <Button variant="outline" size="sm">
            <CalendarPlus />
            {current ? 'Move' : 'Add to plan'}
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="max-h-80 w-56 overflow-y-auto">
        <DropdownMenuLabel className="font-mono">{formatCode(code)}</DropdownMenuLabel>
        <DropdownMenuItem onSelect={() => place(TRANSFER_TERM_ID, 'Transfer credit')}>
          {current === TRANSFER_TERM_ID && <Check />}
          <span className={current === TRANSFER_TERM_ID ? '' : 'pl-6'}>Transfer / AP credit</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {terms.map((t) => (
          <DropdownMenuItem key={t.id} onSelect={() => place(t.id, `${t.label} (${t.name})`)}>
            {current === t.id && <Check />}
            <span className={current === t.id ? '' : 'pl-6'}>
              <span className="inline-block w-12 font-medium">{t.label}</span>
              <span className="text-muted-foreground">{t.name}</span>
            </span>
          </DropdownMenuItem>
        ))}
        {current && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onSelect={() => {
                removeCourse(code)
                toast(`${formatCode(code)} removed`)
              }}
            >
              <Trash2 />
              Remove from plan
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
