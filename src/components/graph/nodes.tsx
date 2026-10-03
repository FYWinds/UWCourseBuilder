import { Handle, type Node, type NodeProps, Position } from '@xyflow/react'
import { memo } from 'react'
import { STATUS_META } from '@/components/course/status'
import type { CourseCode } from '@/domain/types'
import { type CourseStatus, formatCode } from '@/engine'
import { cn } from '@/lib/utils'
import { COURSE_NODE_SIZE, JUNCTION_NODE_SIZE } from './layout'

export type CourseNodeData = {
  code: CourseCode
  title: string
  /** Null for codes that are not in the current calendar. */
  status: CourseStatus | null
  focus: boolean
}

export type JunctionNodeData = {
  label: string
  choice: boolean
}

export type CourseFlowNode = Node<CourseNodeData, 'course'>
export type JunctionFlowNode = Node<JunctionNodeData, 'junction'>
export type GraphFlowNode = CourseFlowNode | JunctionFlowNode

export const CourseNode = memo(function CourseNode({ data }: NodeProps<CourseFlowNode>) {
  const meta = data.status ? STATUS_META[data.status] : null
  return (
    <div
      style={COURSE_NODE_SIZE}
      title={`${formatCode(data.code)} · ${data.title}${meta ? `\n${meta.label}: ${meta.description}` : ''}`}
      className={cn(
        'flex cursor-pointer overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm transition-shadow hover:shadow-md',
        data.focus && 'ring-2 ring-primary ring-offset-2 ring-offset-background',
        data.status === 'blocked' && 'opacity-50',
        !meta && 'border-dashed',
      )}
    >
      <Handle type="target" position={Position.Left} isConnectable={false} />
      <span aria-hidden className="w-1.5 shrink-0" style={{ background: meta?.color ?? 'var(--border)' }} />
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5 px-2">
        <div className="flex items-center gap-1">
          <span className={cn('font-mono text-xs font-semibold', data.status === 'blocked' && 'line-through')}>
            {formatCode(data.code)}
          </span>
          {meta && <meta.icon aria-hidden className="ml-auto size-3 shrink-0" style={{ color: meta.color }} />}
        </div>
        <span className="line-clamp-2 text-[10.5px] leading-tight text-muted-foreground">{data.title}</span>
      </div>
      <Handle type="source" position={Position.Right} isConnectable={false} />
    </div>
  )
})

export const JunctionNode = memo(function JunctionNode({ data }: NodeProps<JunctionFlowNode>) {
  return (
    <div
      style={JUNCTION_NODE_SIZE}
      className={cn(
        'flex items-center justify-center rounded-full border text-[10px] font-medium whitespace-nowrap shadow-xs',
        data.choice ? 'border-primary/50 bg-primary/10 text-foreground' : 'bg-secondary text-secondary-foreground',
      )}
    >
      <Handle type="target" position={Position.Left} isConnectable={false} />
      {data.label}
      <Handle type="source" position={Position.Right} isConnectable={false} />
    </div>
  )
})
