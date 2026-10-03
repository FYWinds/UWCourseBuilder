import '@xyflow/react/dist/style.css'
import '@/components/graph/graph.css'
import { createFileRoute } from '@tanstack/react-router'
import { useMemo } from 'react'
import { useOpenCourse } from '@/components/course/CourseLink'
import { DIRECTIONS, type Direction, buildGraph } from '@/components/graph/build'
import { GraphLegend } from '@/components/graph/GraphLegend'
import { type GraphSettings, GraphToolbar, MAX_DEPTH, MIN_DEPTH } from '@/components/graph/GraphToolbar'
import { PrereqGraph } from '@/components/graph/PrereqGraph'
import type { CourseCode } from '@/domain/types'
import { formatCode } from '@/engine'
import { useAnalysis } from '@/lib/data'

const DEFAULTS: GraphSettings = { focus: 'CS486', depth: 3, direction: 'ancestors', mustOnly: false }

type GraphSearch = Partial<GraphSettings>

function validateSearch(search: Record<string, unknown>): GraphSearch {
  const focus = typeof search.focus === 'string' ? search.focus.toUpperCase().replace(/\s+/g, '') : ''
  const depth = Math.round(Number(search.depth))
  return {
    focus: focus || undefined,
    depth: depth >= MIN_DEPTH && depth <= MAX_DEPTH ? depth : undefined,
    direction: DIRECTIONS.find((d) => d === search.direction),
    mustOnly: search.mustOnly === true || search.mustOnly === 'true' || undefined,
  }
}

export const Route = createFileRoute('/graph')({ component: GraphPage, validateSearch })

const EMPTY_MESSAGE: Record<Direction, (code: CourseCode) => string> = {
  ancestors: (code) => `${formatCode(code)} has no course prerequisites to show.`,
  descendants: (code) => `No course lists ${formatCode(code)} as a requisite.`,
  both: (code) => `${formatCode(code)} has no linked courses to show.`,
}

function GraphPage() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const openCourse = useOpenCourse()
  const { idx, classification } = useAnalysis()

  const settings: GraphSettings = {
    focus: search.focus ?? DEFAULTS.focus,
    depth: search.depth ?? DEFAULTS.depth,
    direction: search.direction ?? DEFAULTS.direction,
    mustOnly: search.mustOnly ?? DEFAULTS.mustOnly,
  }
  const { focus, depth, direction, mustOnly } = settings
  const filter = mustOnly ? classification : null

  const model = useMemo(() => {
    const include = (code: CourseCode) => {
      if (!filter) return true
      const status = filter.byCode.get(code)?.status
      return status === 'must' || status === 'required'
    }
    return buildGraph(idx, { focus, depth, direction, include })
  }, [idx, focus, depth, direction, filter])

  const update = (patch: Partial<GraphSettings>) =>
    navigate({
      search: (prev) => ({
        ...prev,
        ...patch,
        ...(patch.mustOnly === false ? { mustOnly: undefined } : {}),
      }),
    })

  const focusCourse = idx.byCode.get(focus)
  const courseCount = model.nodes.filter((n) => n.kind === 'course').length

  return (
    <div className="flex h-[calc(100svh-10rem)] min-h-[520px] flex-col gap-3">
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Prerequisite graph</h1>
          <p className="text-sm text-muted-foreground">
            Click a course for details, double-click (or Shift+Enter) to make it the focus.
          </p>
        </div>
        <p className="text-sm text-muted-foreground">
          <span className="font-mono font-medium text-foreground">{formatCode(focus)}</span>
          {focusCourse ? ` · ${focusCourse.title}` : ' · not in the current calendar'} · {courseCount}{' '}
          {courseCount === 1 ? 'course' : 'courses'}
        </p>
      </div>

      <GraphToolbar settings={settings} courses={idx.courses} onChange={update} />
      <GraphLegend />

      <div className="relative min-h-0 flex-1 overflow-hidden rounded-xl border bg-card/60 shadow-sm">
        <PrereqGraph
          model={model}
          idx={idx}
          classification={classification}
          emptyMessage={
            mustOnly ? 'No must-take or required courses are linked to this course.' : EMPTY_MESSAGE[direction](focus)
          }
          onOpen={openCourse}
          onFocus={(code) => update({ focus: code })}
        />
      </div>
    </div>
  )
}
