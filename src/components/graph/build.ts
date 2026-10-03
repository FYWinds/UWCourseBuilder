import type { CourseCode, Requisite } from '@/domain/types'
import { type CatalogIndex, collectCourses } from '@/engine'

export type Direction = 'ancestors' | 'descendants' | 'both'

export const DIRECTIONS: Direction[] = ['ancestors', 'descendants', 'both']

/** Course nodes beyond this are dropped (breadth-first, so the nearest courses survive). */
export const MAX_COURSE_NODES = 250

/**
 * prereq/coreq: the source is required by the target.
 * option: the source is one alternative feeding a junction.
 * alternative: the source is one of several ways to satisfy the target (descendant view,
 * or a lone course alternative to a non-course condition).
 */
export type EdgeKind = 'prereq' | 'coreq' | 'option' | 'alternative'

export interface CourseGraphNode {
  kind: 'course'
  id: CourseCode
  depth: number
}

export interface JunctionGraphNode {
  kind: 'junction'
  id: string
  label: string
  /** True for "N of" choices, false for an "all of" group nested inside a choice. */
  choice: boolean
}

export type GraphNode = CourseGraphNode | JunctionGraphNode

export interface GraphEdge {
  id: string
  source: string
  target: string
  kind: EdgeKind
}

export interface GraphModel {
  focus: CourseCode
  nodes: GraphNode[]
  edges: GraphEdge[]
  /** Distinct courses left out because of MAX_COURSE_NODES. */
  omitted: number
}

export interface GraphOptions {
  focus: CourseCode
  depth: number
  direction: Direction
  /** Courses failing this are neither shown nor expanded (the focus is always kept). */
  include: (code: CourseCode) => boolean
}

function courseLeaves(req: Requisite): number {
  return collectCourses(req, new Set()).size
}

/** True when `code` is needed by every way of satisfying `req`. */
function requiredIn(req: Requisite | undefined, code: CourseCode): boolean {
  if (!req) return false
  if (req.kind === 'course') return req.code === code
  if (req.kind === 'all') return req.of.some((r) => requiredIn(r, code))
  if (req.kind === 'atLeast' && req.n >= req.of.length) return req.of.some((r) => requiredIn(r, code))
  return false
}

export function buildGraph(idx: CatalogIndex, { focus, depth, direction, include }: GraphOptions): GraphModel {
  const nodes = new Map<string, GraphNode>()
  const edges = new Map<string, GraphEdge>()
  const inbound = new Map<string, number>()
  const omitted = new Set<CourseCode>()
  let courseCount = 0
  let junctionCount = 0

  const addEdge = (source: string, target: string, kind: EdgeKind) => {
    const id = `${source}->${target}`
    if (source === target || edges.has(id)) return
    edges.set(id, { id, source, target, kind })
    inbound.set(target, (inbound.get(target) ?? 0) + 1)
  }

  /** Adds the course if room remains; returns whether it is (now) in the graph and whether it is new. */
  const addCourse = (code: CourseCode, d: number): 'existing' | 'added' | 'rejected' => {
    if (nodes.has(code)) return 'existing'
    if (!include(code)) return 'rejected'
    if (courseCount >= MAX_COURSE_NODES) {
      omitted.add(code)
      return 'rejected'
    }
    nodes.set(code, { kind: 'course', id: code, depth: d })
    courseCount++
    return 'added'
  }

  nodes.set(focus, { kind: 'course', id: focus, depth: 0 })
  courseCount++

  if (direction !== 'descendants') {
    let frontier: CourseCode[] = [focus]
    for (let d = 1; d <= depth && frontier.length > 0; d++) {
      const next: CourseCode[] = []

      const attachCourse = (code: CourseCode, target: string, kind: EdgeKind) => {
        const result = addCourse(code, d)
        if (result === 'rejected') return
        if (result === 'added') next.push(code)
        addEdge(code, target, kind)
      }

      const group = (children: Requisite[], target: string, kind: EdgeKind, label: string, choice: boolean) => {
        const id = `junction:${junctionCount++}`
        for (const child of children) link(child, id, choice ? 'option' : 'prereq', choice)
        if (!inbound.has(id)) return
        nodes.set(id, { kind: 'junction', id, label, choice })
        addEdge(id, target, kind)
      }

      const linkAll = (children: Requisite[], target: string, kind: EdgeKind, inChoice: boolean) => {
        const leaves = children.reduce((n, r) => n + courseLeaves(r), 0)
        if (inChoice && leaves > 1) group(children, target, kind, 'all of', false)
        else for (const child of children) link(child, target, kind, inChoice)
      }

      const link = (req: Requisite | undefined, target: string, kind: EdgeKind, inChoice: boolean): void => {
        if (!req) return
        if (req.kind === 'course') attachCourse(req.code, target, kind)
        else if (req.kind === 'all') linkAll(req.of, target, kind, inChoice)
        else if (req.kind === 'atLeast') {
          if (req.n >= req.of.length) return linkAll(req.of, target, kind, inChoice)
          const leaves = courseLeaves(req)
          if (leaves > 1) group(req.of, target, kind, req.n === 1 ? 'one of' : `${req.n} of`, true)
          else if (leaves === 1) for (const child of req.of) link(child, target, inChoice ? kind : 'alternative', inChoice)
        }
      }

      for (const code of frontier) {
        const course = idx.byCode.get(code)
        if (!course) continue
        link(course.prereq, code, 'prereq', false)
        link(course.coreq, code, 'coreq', false)
      }
      frontier = next
    }
  }

  if (direction !== 'ancestors') {
    const order = (a: CourseCode, b: CourseCode) =>
      (idx.byCode.get(a)?.level ?? 0) - (idx.byCode.get(b)?.level ?? 0) || a.localeCompare(b)
    let frontier: CourseCode[] = [focus]
    for (let d = 1; d <= depth && frontier.length > 0; d++) {
      const next: CourseCode[] = []
      for (const code of frontier) {
        for (const dependent of [...(idx.unlocks.get(code) ?? [])].sort(order)) {
          const result = addCourse(dependent, d)
          if (result === 'rejected') continue
          if (result === 'added') next.push(dependent)
          const course = idx.byCode.get(dependent)
          const kind: EdgeKind = requiredIn(course?.prereq, code)
            ? 'prereq'
            : requiredIn(course?.coreq, code)
              ? 'coreq'
              : 'alternative'
          addEdge(code, dependent, kind)
        }
      }
      frontier = next
    }
  }

  return { focus, nodes: [...nodes.values()], edges: [...edges.values()], omitted: omitted.size }
}
