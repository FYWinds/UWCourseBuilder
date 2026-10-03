import { type CollisionDetection, pointerWithin, rectIntersection } from '@dnd-kit/core'
import type { CourseCode } from '@/domain/types'

/** Payload attached to every draggable course; `from` is the term id it currently sits in. */
export interface DragCourse {
  code: CourseCode
  from: string | null
}

/** Draggable ids must be unique; the same course can appear in several sidebar sections. */
export const dragId = (source: string, code: CourseCode) => `${source}:${code}`

/** Pointer drags target the column under the cursor; keyboard drags fall back to overlap. */
export const boardCollision: CollisionDetection = (args) => {
  const hits = pointerWithin(args)
  return hits.length ? hits : rectIntersection(args)
}
