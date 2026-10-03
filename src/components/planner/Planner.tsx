import {
  type Announcements,
  DndContext,
  type DragEndEvent,
  type DragStartEvent,
  DragOverlay,
  PointerSensor,
  type UniqueIdentifier,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { useMemo, useState } from 'react'
import { TRANSFER_TERM_ID } from '@/domain/plan'
import type { CourseCode } from '@/domain/types'
import { type Issue, buildTerms, formatCode } from '@/engine'
import { useAnalysis } from '@/lib/data'
import { usePlanStore } from '@/store/plan'
import { ColumnKeyboardSensor } from './ColumnKeyboardSensor'
import { type DragCourse, boardCollision } from './dnd'
import { CourseDragPreview } from './PlannedCourseCard'
import { PlannerSidebar } from './PlannerSidebar'
import { EmptyPlanHint, PlanIssueStrip, PlannerHeader } from './PlannerSummary'
import { type PlannerColumn, TermColumn } from './TermColumn'

const NO_CODES: CourseCode[] = []
const NO_ISSUES: Issue[] = []

export function Planner() {
  const analysis = useAnalysis()
  const plan = usePlanStore((s) => s.plan)
  const placeCourse = usePlanStore((s) => s.placeCourse)
  const [dragging, setDragging] = useState<DragCourse | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(ColumnKeyboardSensor, { keyboardCodes: { start: ['Space'], cancel: ['Escape'], end: ['Space', 'Enter'] } }),
  )

  const columns = useMemo<PlannerColumn[]>(
    () => [
      { id: TRANSFER_TERM_ID, index: -1, kind: 'transfer', label: 'Transfer / AP credit', name: 'Counts as completed' },
      ...buildTerms({ sequence: plan.sequence, startTerm: plan.startTerm }).map((t) => ({
        id: t.id,
        index: t.index,
        kind: t.kind,
        label: t.label,
        name: t.name,
      })),
    ],
    [plan.sequence, plan.startTerm],
  )

  const placed = useMemo(() => new Set(Object.values(plan.placements).flat()), [plan.placements])

  const announcements = useMemo<Announcements>(() => {
    const columnName = (id: UniqueIdentifier | undefined) => {
      const col = columns.find((c) => c.id === id)
      return col ? `${col.label}${col.index >= 0 ? `, ${col.name}` : ''}` : 'no term'
    }
    const courseOf = (data: unknown) => formatCode((data as DragCourse | undefined)?.code ?? '')
    return {
      onDragStart: ({ active }) => `Picked up ${courseOf(active.data.current)}. Use left and right arrows to choose a term.`,
      onDragOver: ({ active, over }) => `${courseOf(active.data.current)} is over ${columnName(over?.id)}.`,
      onDragEnd: ({ active, over }) =>
        over ? `${courseOf(active.data.current)} placed in ${columnName(over.id)}.` : `${courseOf(active.data.current)} dropped outside the plan.`,
      onDragCancel: ({ active }) => `Moving ${courseOf(active.data.current)} cancelled.`,
    }
  }, [columns])

  const onDragStart = ({ active }: DragStartEvent) => setDragging((active.data.current as DragCourse | undefined) ?? null)

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    setDragging(null)
    const data = active.data.current as DragCourse | undefined
    if (!data || !over || over.id === data.from) return
    placeCourse(String(over.id), data.code)
  }

  const { idx, validation } = analysis
  const isEmpty = placed.size === 0

  return (
    <div className="space-y-4">
      <PlannerHeader analysis={analysis} />
      <PlanIssueStrip analysis={analysis} />
      {isEmpty && <EmptyPlanHint />}
      <DndContext
        sensors={sensors}
        collisionDetection={boardCollision}
        accessibility={{
          announcements,
          screenReaderInstructions: {
            draggable:
              'Press Space to pick up the course, Left and Right arrows to move between terms, Space or Enter to drop, Escape to cancel. Press Enter to open course details.',
          },
        }}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragCancel={() => setDragging(null)}
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
          <PlannerSidebar analysis={analysis} placed={placed} />
          <div className="min-w-0 flex-1 overflow-x-auto pb-3" role="region" aria-label="Terms" tabIndex={-1}>
            <div className="flex w-max items-stretch gap-3">
              {columns.map((column) => (
                <TermColumn
                  key={column.id}
                  column={column}
                  codes={plan.placements[column.id] ?? NO_CODES}
                  byCode={idx.byCode}
                  byPlacement={validation.byPlacement}
                  termIssues={validation.byTerm.get(column.id) ?? NO_ISSUES}
                  completed={column.kind === 'transfer' || column.index <= plan.completedThrough}
                  hasCompleted={plan.completedThrough >= 0}
                  wtLimit={plan.wtLimit}
                />
              ))}
            </div>
          </div>
        </div>
        <DragOverlay dropAnimation={null}>
          {dragging && <CourseDragPreview code={dragging.code} course={idx.byCode.get(dragging.code)} />}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
