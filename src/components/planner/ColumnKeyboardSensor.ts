import {
  type Activators,
  KeyboardSensor,
  type KeyboardSensorOptions,
  type SensorInstance,
  type SensorProps,
  type Translate,
} from '@dnd-kit/core'

const DEFAULT_CODES = { start: ['Space', 'Enter'], cancel: ['Escape'], end: ['Space', 'Enter'] }
const EDGE = 8

/**
 * Keyboard dragging between term columns: Left/Right jump to the neighbouring column.
 * dnd-kit's KeyboardSensor scrolls the board instead of moving whenever the target lies in
 * the far half of a scroll container, so the target column is scrolled into view here and
 * the overlay is moved onto it directly.
 */
export class ColumnKeyboardSensor implements SensorInstance {
  static activators: Activators<KeyboardSensorOptions> = KeyboardSensor.activators

  autoScrollEnabled = false
  private props: SensorProps<KeyboardSensorOptions>
  private translate: Translate = { x: 0, y: 0 }
  private doc: Document
  private attachTimer: number

  constructor(props: SensorProps<KeyboardSensorOptions>) {
    this.props = props
    this.doc = (props.event.target as Node | null)?.ownerDocument ?? document
    this.onKeyDown = this.onKeyDown.bind(this)
    this.onAbort = this.onAbort.bind(this)
    props.onStart(this.translate)
    // Deferred so the key press that activated the drag is not handled as a drop.
    this.attachTimer = window.setTimeout(() => this.doc.addEventListener('keydown', this.onKeyDown))
    window.addEventListener('resize', this.onAbort)
    this.doc.addEventListener('visibilitychange', this.onAbort)
  }

  private onKeyDown(event: KeyboardEvent) {
    const codes = this.props.options.keyboardCodes ?? DEFAULT_CODES
    if (codes.end.includes(event.code)) {
      event.preventDefault()
      this.detach()
      this.props.onEnd()
    } else if (codes.cancel.includes(event.code)) {
      event.preventDefault()
      this.detach()
      this.props.onCancel()
    } else if (event.code === 'ArrowRight' || event.code === 'ArrowLeft') {
      event.preventDefault()
      this.move(event.code === 'ArrowRight' ? 1 : -1)
    } else if (event.code === 'ArrowUp' || event.code === 'ArrowDown') {
      event.preventDefault()
    }
  }

  private onAbort() {
    this.detach()
    this.props.onCancel()
  }

  private move(dir: 1 | -1) {
    const ctx = this.props.context.current
    const dragged = ctx.draggingNode ?? ctx.activeNode
    if (!dragged) return
    const columns = ctx.droppableContainers
      .getEnabled()
      .flatMap((c) => (c.node.current ? [{ id: c.id, node: c.node.current, rect: c.node.current.getBoundingClientRect() }] : []))
      .sort((a, b) => a.rect.left - b.rect.left)
    const from = dragged.getBoundingClientRect()
    const fromCenter = from.left + from.width / 2
    const overIndex = ctx.over ? columns.findIndex((c) => c.id === ctx.over?.id) : -1
    const target =
      overIndex >= 0
        ? columns[overIndex + dir]
        : dir > 0
          ? columns.find((c) => c.rect.left + c.rect.width / 2 > fromCenter)
          : columns.findLast((c) => c.rect.left + c.rect.width / 2 < fromCenter)
    if (!target) return

    target.node.scrollIntoView({ block: 'nearest', inline: 'nearest' })
    const to = target.node.getBoundingClientRect()
    const top = Math.min(Math.max(from.top, to.top + EDGE), Math.max(to.top + EDGE, to.bottom - from.height - EDGE))
    this.translate = {
      x: this.translate.x + to.left + to.width / 2 - fromCenter,
      y: this.translate.y + top - from.top,
    }
    this.props.onMove(this.translate)
  }

  private detach() {
    window.clearTimeout(this.attachTimer)
    this.doc.removeEventListener('keydown', this.onKeyDown)
    window.removeEventListener('resize', this.onAbort)
    this.doc.removeEventListener('visibilitychange', this.onAbort)
  }
}
