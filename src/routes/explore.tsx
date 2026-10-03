import type { SortingState } from '@tanstack/react-table'
import { createFileRoute } from '@tanstack/react-router'
import { useCallback, useDeferredValue, useMemo } from 'react'
import { CourseTable } from '@/components/explore/CourseTable'
import { ExploreToolbar } from '@/components/explore/ExploreToolbar'
import { Presets } from '@/components/explore/Presets'
import { type ExploreSearch, buildRows, filterRows, slotMatcher, validateExploreSearch } from '@/components/explore/search'
import { useAnalysis } from '@/lib/data'

export const Route = createFileRoute('/explore')({
  validateSearch: validateExploreSearch,
  component: ExplorePage,
})

function ExplorePage() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const { idx, audit, classification } = useAnalysis()

  const update = useCallback(
    (patch: Partial<ExploreSearch>) => navigate({ search: (prev) => ({ ...prev, ...patch }), replace: true }),
    [navigate],
  )

  const deferred = useDeferredValue(search)
  const rows = useMemo(() => buildRows(idx, audit, classification), [idx, audit, classification])
  const inSlot = useMemo(
    () => (deferred.slot ? slotMatcher(deferred.slot, idx, audit, classification) : null),
    [deferred.slot, idx, audit, classification],
  )
  const filtered = useMemo(() => filterRows(rows, deferred, inSlot), [rows, deferred, inSlot])

  const sort = search.sort ?? 'status'
  const sorting = useMemo<SortingState>(() => [{ id: sort.replace(/^-/, ''), desc: sort.startsWith('-') }], [sort])
  const onSortingChange = useCallback(
    (next: SortingState) => {
      const first = next.at(0)
      const isDefault = !first || (first.id === 'status' && !first.desc)
      update({ sort: isDefault ? undefined : `${first.desc ? '-' : ''}${first.id}` })
    },
    [update],
  )

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight">Explore courses</h1>
          <p className="text-sm text-muted-foreground">
            Every course in the 2026/27 calendar, ranked by what your plan still needs. Click a row for details.
          </p>
        </div>
        <p className="text-sm text-muted-foreground" aria-live="polite">
          <span className="font-medium text-foreground tabular-nums">{filtered.length.toLocaleString()}</span> of{' '}
          {rows.length.toLocaleString()} courses
        </p>
      </div>
      <Presets search={search} onApply={update} />
      <ExploreToolbar search={search} onChange={update} idx={idx} audit={audit} />
      <CourseTable rows={filtered} sorting={sorting} onSortingChange={onSortingChange} />
    </div>
  )
}
