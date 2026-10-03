import { type SortingState, type Updater, useTable } from '@tanstack/react-table'
import { useWindowVirtualizer } from '@tanstack/react-virtual'
import { ArrowDown, ArrowUp, ArrowUpDown, SearchX } from 'lucide-react'
import { useLayoutEffect, useRef, useState } from 'react'
import { useOpenCourse } from '@/components/course/CourseLink'
import { cn } from '@/lib/utils'
import { GRID, columns, features } from './columns'
import type { CourseRow } from './search'

const ROW_HEIGHT = 44

export function CourseTable({
  rows,
  sorting,
  onSortingChange,
}: {
  rows: CourseRow[]
  sorting: SortingState
  onSortingChange: (sorting: SortingState) => void
}) {
  const openCourse = useOpenCourse()
  const table = useTable({
    features,
    columns,
    data: rows,
    getRowId: (r) => r.course.code,
    state: { sorting },
    onSortingChange: (updater: Updater<SortingState>) =>
      onSortingChange(typeof updater === 'function' ? updater(sorting) : updater),
    enableSortingRemoval: false,
    enableMultiSort: false,
  })
  const sortedRows = table.getRowModel().rows

  const bodyRef = useRef<HTMLDivElement>(null)
  const [scrollMargin, setScrollMargin] = useState(0)
  useLayoutEffect(() => {
    const el = bodyRef.current
    if (!el) return
    const measure = () => setScrollMargin(el.getBoundingClientRect().top + window.scrollY)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(document.body)
    return () => observer.disconnect()
  }, [])

  const virtualizer = useWindowVirtualizer({
    count: sortedRows.length,
    estimateSize: () => ROW_HEIGHT,
    overscan: 12,
    scrollMargin,
    getItemKey: (i) => sortedRows[i].id,
  })

  return (
    <div role="table" aria-rowcount={sortedRows.length + 1} className="rounded-xl border bg-card text-sm shadow-sm">
      <div role="rowgroup" className="sticky top-14 z-10 rounded-t-xl border-b bg-card/95 backdrop-blur">
        {table.getHeaderGroups().map((group) => (
          <div key={group.id} role="row" className={cn(GRID, 'h-10 items-center px-3 text-xs font-medium text-muted-foreground')}>
            {group.headers.map((header) => {
              const canSort = header.column.getCanSort()
              const dir = header.column.getIsSorted()
              const Icon = dir === 'asc' ? ArrowUp : dir === 'desc' ? ArrowDown : ArrowUpDown
              return (
                <div
                  key={header.id}
                  role="columnheader"
                  aria-sort={dir === 'asc' ? 'ascending' : dir === 'desc' ? 'descending' : undefined}
                  className={cn('flex min-w-0 items-center', header.column.columnDef.meta?.className)}
                >
                  {canSort ? (
                    <button
                      type="button"
                      onClick={header.column.getToggleSortingHandler()}
                      className={cn('-mx-1 inline-flex items-center gap-1 rounded px-1 py-0.5 hover:text-foreground', dir && 'text-foreground')}
                    >
                      <table.FlexRender header={header} />
                      <Icon className={cn('size-3', !dir && 'opacity-40')} aria-hidden />
                    </button>
                  ) : (
                    <table.FlexRender header={header} />
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>

      <div ref={bodyRef} role="rowgroup" className="relative" style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map((item) => {
          const row = sortedRows[item.index]
          return (
            <div
              key={row.id}
              role="row"
              aria-rowindex={item.index + 2}
              onClick={() => openCourse(row.original.course.code)}
              className={cn(
                GRID,
                'absolute inset-x-0 top-0 cursor-pointer items-center border-b px-3 transition-colors last:border-b-0 hover:bg-secondary/60',
                row.original.status === 'blocked' && 'text-muted-foreground',
              )}
              style={{ height: ROW_HEIGHT, transform: `translateY(${item.start - virtualizer.options.scrollMargin}px)` }}
            >
              {row.getAllCells().map((cell) => (
                <div
                  key={cell.id}
                  role="cell"
                  className={cn('flex min-w-0 items-center', cell.column.columnDef.meta?.className)}
                >
                  <table.FlexRender cell={cell} />
                </div>
              ))}
            </div>
          )
        })}
      </div>

      {sortedRows.length === 0 && (
        <div className="flex flex-col items-center gap-2 px-4 py-16 text-center text-muted-foreground">
          <SearchX className="size-8" aria-hidden />
          <p className="font-medium text-foreground">No courses match these filters</p>
          <p className="text-sm">Try clearing a filter or a preset.</p>
        </div>
      )}
    </div>
  )
}
