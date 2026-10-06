import { Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { activePrograms } from '@/engine'
import { resolveBreadthRule } from '@/requirements/majors'
import { usePlanStore } from '@/store/plan'
import { CLEARED_FILTERS, type ExploreSearch, presetActive, presetsFor } from './search'

/** One-click filter sets; they replace other filters but keep the search text. */
export function Presets({ search, onApply }: { search: ExploreSearch; onApply: (patch: Partial<ExploreSearch>) => void }) {
  const plan = usePlanStore((s) => s.plan)
  const presets = presetsFor(resolveBreadthRule(plan), activePrograms(plan))
  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Quick filters">
      <span className="flex items-center gap-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">
        <Sparkles className="size-3.5" aria-hidden />
        Quick filters
      </span>
      {presets.map((p) => {
        const active = presetActive(search, p.search)
        return (
          <Button
            key={p.id}
            variant={active ? 'default' : 'outline'}
            size="xs"
            aria-pressed={active}
            className="rounded-full px-3"
            onClick={() => onApply({ ...CLEARED_FILTERS, q: search.q, ...(active ? {} : p.search) })}
          >
            {p.label}
          </Button>
        )
      })}
    </div>
  )
}
