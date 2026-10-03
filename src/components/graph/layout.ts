import ELK from 'elkjs/lib/elk-api.js'
import elkWorkerUrl from 'elkjs/lib/elk-worker.min.js?url'
import type { GraphModel } from './build'

export const COURSE_NODE_SIZE = { width: 176, height: 56 }
export const JUNCTION_NODE_SIZE = { width: 64, height: 24 }

export type Positions = Map<string, { x: number; y: number }>

// Layout runs in a worker: keeps the 1.4 MB ELK engine off the main bundle and thread.
const elk = new ELK({ workerUrl: elkWorkerUrl })

const LAYOUT_OPTIONS = {
  'elk.algorithm': 'layered',
  'elk.direction': 'RIGHT',
  'elk.spacing.nodeNode': '22',
  'elk.layered.spacing.nodeNodeBetweenLayers': '64',
  'elk.layered.spacing.edgeNodeBetweenLayers': '24',
  'elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX',
  'elk.layered.considerModelOrder.strategy': 'NODES_AND_EDGES',
}

export async function layoutGraph(model: GraphModel): Promise<Positions> {
  const result = await elk.layout({
    id: 'root',
    layoutOptions: LAYOUT_OPTIONS,
    children: model.nodes.map((node) => ({
      id: node.id,
      ...(node.kind === 'course' ? COURSE_NODE_SIZE : JUNCTION_NODE_SIZE),
    })),
    edges: model.edges.map((edge) => ({ id: edge.id, sources: [edge.source], targets: [edge.target] })),
  })
  return new Map((result.children ?? []).map((child) => [child.id, { x: child.x ?? 0, y: child.y ?? 0 }]))
}
