import {
  Background,
  BackgroundVariant,
  Controls,
  type Edge,
  type FitViewOptions,
  MarkerType,
  MiniMap,
  type NodeMouseHandler,
  type NodeTypes,
  ReactFlow,
} from '@xyflow/react'
import { AlertTriangle, Loader2 } from 'lucide-react'
import { type CSSProperties, type KeyboardEvent, useEffect, useMemo, useRef, useState } from 'react'
import { STATUS_META } from '@/components/course/status'
import { Skeleton } from '@/components/ui/skeleton'
import type { CourseCode } from '@/domain/types'
import { type CatalogIndex, type ClassifyResult, formatCode } from '@/engine'
import { useResolvedTheme } from '@/store/theme'
import { type EdgeKind, type GraphModel, MAX_COURSE_NODES } from './build'
import { COURSE_NODE_SIZE, JUNCTION_NODE_SIZE, type Positions, layoutGraph } from './layout'
import { CourseNode, type GraphFlowNode, JunctionNode } from './nodes'

const NODE_TYPES: NodeTypes = { course: CourseNode, junction: JunctionNode }

const EDGE_STYLE: Record<EdgeKind, CSSProperties> = {
  prereq: { strokeWidth: 1.5 },
  coreq: { strokeWidth: 1.5, strokeDasharray: '6 4' },
  option: { strokeWidth: 1.25, opacity: 0.65 },
  alternative: { strokeWidth: 1.25, strokeDasharray: '2 4' },
}

const ARROW = { type: MarkerType.ArrowClosed, color: 'var(--muted-foreground)', width: 14, height: 14 }

/** Delay before a click opens the sheet, so a double-click can refocus instead. */
const CLICK_DELAY_MS = 220

/** Above this many nodes the initial viewport frames the focus and its direct neighbours only. */
const FIT_ALL_LIMIT = 60

type LaidOut = { model: GraphModel; version: number } & ({ positions: Positions } | { error: string })

interface PrereqGraphProps {
  model: GraphModel
  idx: CatalogIndex
  classification: ClassifyResult
  emptyMessage: string
  onOpen: (code: CourseCode) => void
  onFocus: (code: CourseCode) => void
}

export function PrereqGraph({ model, idx, classification, emptyMessage, onOpen, onFocus }: PrereqGraphProps) {
  const colorMode = useResolvedTheme()
  const [laid, setLaid] = useState<LaidOut | null>(null)
  const clickTimer = useRef<number | undefined>(undefined)

  useEffect(() => {
    let cancelled = false
    layoutGraph(model).then(
      (positions) => {
        if (!cancelled) setLaid((prev) => ({ model, positions, version: (prev?.version ?? 0) + 1 }))
      },
      (error: unknown) => {
        if (!cancelled) {
          setLaid((prev) => ({
            model,
            error: error instanceof Error ? error.message : String(error),
            version: (prev?.version ?? 0) + 1,
          }))
        }
      },
    )
    return () => {
      cancelled = true
    }
  }, [model])

  useEffect(() => () => window.clearTimeout(clickTimer.current), [])

  const positions = laid && 'positions' in laid ? laid.positions : null
  const shown = laid?.model

  const nodes = useMemo<GraphFlowNode[]>(() => {
    if (!positions || !shown) return []
    return shown.nodes.map((node): GraphFlowNode => {
      const position = positions.get(node.id) ?? { x: 0, y: 0 }
      if (node.kind === 'junction') {
        return {
          id: node.id,
          type: 'junction',
          position,
          ...JUNCTION_NODE_SIZE,
          data: { label: node.label, choice: node.choice },
          focusable: false,
        }
      }
      const course = idx.byCode.get(node.id)
      const status = course ? (classification.byCode.get(node.id)?.status ?? null) : null
      const title = course?.title ?? 'Not in the current calendar'
      return {
        id: node.id,
        type: 'course',
        position,
        ...COURSE_NODE_SIZE,
        data: { code: node.id, title, status, focus: node.id === shown.focus },
        ariaLabel: `${formatCode(node.id)}, ${title}${status ? `, ${STATUS_META[status].label}` : ''}`,
      }
    })
  }, [positions, shown, idx, classification])

  const edges = useMemo<Edge[]>(
    () =>
      (shown?.edges ?? []).map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        style: EDGE_STYLE[edge.kind],
        markerEnd: edge.kind === 'option' ? undefined : ARROW,
        focusable: false,
      })),
    [shown],
  )

  const fitViewOptions = useMemo<FitViewOptions>(() => {
    if (!shown || shown.nodes.length <= FIT_ALL_LIMIT) return { padding: 0.12, maxZoom: 1.1 }
    const near = new Set(shown.nodes.filter((n) => n.kind === 'course' && n.depth <= 1).map((n) => n.id))
    for (const edge of shown.edges) if (edge.target === shown.focus) near.add(edge.source)
    return { padding: 0.08, minZoom: 0.3, maxZoom: 1.1, nodes: [...near].map((id) => ({ id })) }
  }, [shown])

  if (!laid) return <Skeleton className="size-full rounded-none" />

  if ('error' in laid) {
    return (
      <div className="flex size-full items-center justify-center p-6 text-center text-sm text-destructive">
        <AlertTriangle className="mr-2 size-4" aria-hidden />
        Could not lay out the graph: {laid.error}
      </div>
    )
  }

  const pending = laid.model !== model

  const onNodeClick: NodeMouseHandler<GraphFlowNode> = (_, node) => {
    if (node.type !== 'course') return
    window.clearTimeout(clickTimer.current)
    clickTimer.current = window.setTimeout(() => onOpen(node.id), CLICK_DELAY_MS)
  }

  const onNodeDoubleClick: NodeMouseHandler<GraphFlowNode> = (_, node) => {
    window.clearTimeout(clickTimer.current)
    if (node.type === 'course') onFocus(node.id)
  }

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Enter') return
    const id = (event.target as HTMLElement).closest<HTMLElement>('.react-flow__node-course')?.dataset.id
    if (!id) return
    event.preventDefault()
    if (event.shiftKey) onFocus(id)
    else onOpen(id)
  }

  return (
    <div className="relative size-full">
      <ReactFlow<GraphFlowNode, Edge>
        key={laid.version}
        className={pending ? 'uwcb-graph opacity-60 transition-opacity' : 'uwcb-graph transition-opacity'}
        nodes={nodes}
        edges={edges}
        nodeTypes={NODE_TYPES}
        colorMode={colorMode}
        fitView
        fitViewOptions={fitViewOptions}
        minZoom={0.05}
        maxZoom={2}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        zoomOnDoubleClick={false}
        onNodeClick={onNodeClick}
        onNodeDoubleClick={onNodeDoubleClick}
        onKeyDown={onKeyDown}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1.4}
          color="color-mix(in oklab, var(--muted-foreground) 35%, transparent)"
        />
        <Controls showInteractive={false} aria-label="Zoom controls" />
        <MiniMap<GraphFlowNode>
          pannable
          zoomable
          ariaLabel="Graph overview"
          nodeStrokeWidth={0}
          nodeBorderRadius={6}
          nodeColor={(node) =>
            node.type === 'course'
              ? node.data.status
                ? STATUS_META[node.data.status].color
                : 'var(--border)'
              : 'var(--muted-foreground)'
          }
        />
      </ReactFlow>

      <div className="pointer-events-none absolute inset-x-0 top-3 flex flex-col items-center gap-2 px-3">
        {pending && (
          <span className="flex items-center gap-1.5 rounded-full border bg-card px-3 py-1 text-xs text-muted-foreground shadow-sm">
            <Loader2 className="size-3.5 animate-spin" aria-hidden />
            Laying out…
          </span>
        )}
        {!pending && laid.model.omitted > 0 && (
          <span
            role="status"
            className="flex max-w-xl items-center gap-1.5 rounded-lg border border-destructive/30 bg-card px-3 py-1.5 text-center text-xs shadow-sm"
          >
            <AlertTriangle className="size-3.5 shrink-0 text-destructive" aria-hidden />
            Showing the nearest {MAX_COURSE_NODES} courses; {laid.model.omitted} more are hidden. Lower the depth or
            turn on “Must/required only”.
          </span>
        )}
        {!pending && laid.model.edges.length === 0 && (
          <span role="status" className="rounded-lg border bg-card px-3 py-1.5 text-xs text-muted-foreground shadow-sm">
            {emptyMessage}
          </span>
        )}
      </div>
    </div>
  )
}
