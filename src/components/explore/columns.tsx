import {
  createColumnHelper,
  createSortedRowModel,
  metaHelper,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_basic,
  sortFn_text,
  tableFeatures,
} from '@tanstack/react-table'
import { CalendarCheck, CalendarPlus, CheckCircle2 } from 'lucide-react'
import { AddToTermMenu } from '@/components/course/AddToTermMenu'
import { CourseLink } from '@/components/course/CourseLink'
import { FACULTY_LABEL, SEASON_LABEL, SEASONS } from '@/components/course/labels'
import { StatusBadge } from '@/components/course/StatusBadge'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { formatCode } from '@/engine'
import { cn } from '@/lib/utils'
import type { CourseRow } from './search'

export const features = tableFeatures({
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  columnMeta: metaHelper<{ className?: string }>(),
})

/** Shared grid template for header and rows; faculty and "counts toward" appear from lg. */
export const GRID =
  'grid grid-cols-[8.75rem_5.75rem_minmax(0,1fr)_3rem_5.5rem_2.5rem] lg:grid-cols-[8.75rem_5.75rem_minmax(0,1fr)_3rem_6rem_5.5rem_13rem_2.5rem] xl:grid-cols-[8.75rem_5.75rem_minmax(0,1fr)_3rem_6rem_5.5rem_18rem_2.5rem] gap-x-3'

const helper = createColumnHelper<typeof features, CourseRow>()

export const columns = helper.columns([
  helper.accessor((r) => r.rank, {
    id: 'status',
    header: 'Status',
    sortFn: (a, b) => a.original.rank - b.original.rank || a.original.course.code.localeCompare(b.original.course.code),
    cell: ({ row }) => <StatusBadge status={row.original.status} className="text-[0.7rem]" />,
  }),
  helper.accessor((r) => r.course.code, {
    id: 'code',
    header: 'Code',
    sortFn: sortFn_alphanumeric,
    cell: ({ row }) => <CourseLink code={row.original.course.code} className="truncate" />,
  }),
  helper.accessor((r) => r.course.title, {
    id: 'title',
    header: 'Title',
    sortFn: sortFn_text,
    cell: ({ row }) => (
      <span className="truncate" title={row.original.course.title}>
        {row.original.course.title}
      </span>
    ),
  }),
  helper.accessor((r) => r.course.units, {
    id: 'units',
    header: 'Units',
    sortFn: sortFn_basic,
    meta: { className: 'justify-end' },
    cell: ({ row }) => <span className="font-mono text-xs tabular-nums">{row.original.course.units.toFixed(2)}</span>,
  }),
  helper.accessor((r) => r.course.faculty, {
    id: 'faculty',
    header: 'Faculty',
    sortFn: sortFn_text,
    meta: { className: 'hidden lg:flex' },
    cell: ({ row }) => <span className="truncate text-muted-foreground">{FACULTY_LABEL[row.original.course.faculty]}</span>,
  }),
  helper.display({
    id: 'offered',
    header: 'Offered',
    cell: ({ row }) => <OfferedPills row={row.original} />,
  }),
  helper.display({
    id: 'counts',
    header: 'Counts toward',
    meta: { className: 'hidden lg:flex' },
    cell: ({ row }) => <CountsToward row={row.original} />,
  }),
  helper.display({
    id: 'actions',
    header: () => <span className="sr-only">Actions</span>,
    meta: { className: 'justify-end' },
    cell: ({ row }) => <RowActions row={row.original} />,
  }),
])

function OfferedPills({ row }: { row: CourseRow }) {
  const { offered } = row.course
  const label = `Offered: ${offered.length ? offered.map((s) => SEASON_LABEL[s]).join(', ') : 'no recent offerings'}`
  return (
    <span className="flex items-center gap-0.5" aria-label={label} title={label}>
      {SEASONS.map((s) => (
        <span
          key={s}
          aria-hidden
          className={cn(
            'inline-flex size-5 items-center justify-center rounded border font-mono text-[0.65rem] font-medium',
            offered.includes(s) ? 'border-primary/50 bg-primary/20 text-foreground' : 'border-dashed text-muted-foreground/50',
          )}
        >
          {s}
        </span>
      ))}
    </span>
  )
}

function CountsToward({ row }: { row: CourseRow }) {
  const placed = row.status === 'taken' || row.status === 'planned'
  const labels = placed ? row.allocated : row.fills
  if (labels.length === 0) return <span className="text-muted-foreground/60">—</span>
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="flex min-w-0 items-center gap-1 text-xs">
          {placed && <CheckCircle2 className="size-3.5 shrink-0 text-status-taken" aria-label="Allocated" />}
          <span className="truncate">{labels[0]}</span>
          {labels.length > 1 && <span className="shrink-0 text-muted-foreground">+{labels.length - 1}</span>}
        </span>
      </TooltipTrigger>
      <TooltipContent side="left" className="max-w-xs">
        <p className="mb-1 font-medium">{placed ? 'Allocated to' : 'Can fill'}</p>
        <ul className="space-y-0.5">
          {labels.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
      </TooltipContent>
    </Tooltip>
  )
}

function RowActions({ row }: { row: CourseRow }) {
  const { code } = row.course
  const placed = row.status === 'taken' || row.status === 'planned'
  return (
    // Keep menu clicks (including portalled items) from opening the row's course sheet.
    <span onClick={(e) => e.stopPropagation()}>
      <AddToTermMenu code={code}>
        <Button variant="ghost" size="icon-sm" aria-label={`${placed ? 'Move' : 'Add'} ${formatCode(code)} in plan`}>
          {placed ? <CalendarCheck className="text-status-taken" /> : <CalendarPlus />}
        </Button>
      </AddToTermMenu>
    </span>
  )
}
