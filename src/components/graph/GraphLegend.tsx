import { STATUS_META } from '@/components/course/status'
import { STATUS_ORDER } from '@/engine'

const EDGE_LEGEND = [
  { label: 'Required', dash: undefined },
  { label: 'Corequisite', dash: '6 4' },
  { label: 'One of several', dash: '2 4' },
]

function EdgeSample({ dash }: { dash?: string }) {
  return (
    <svg width="28" height="8" viewBox="0 0 28 8" aria-hidden className="text-muted-foreground">
      <line x1="0" y1="4" x2="22" y2="4" stroke="currentColor" strokeWidth="1.5" strokeDasharray={dash} />
      <path d="M22 1 L28 4 L22 7 Z" fill="currentColor" />
    </svg>
  )
}

export function GraphLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
      <ul className="flex flex-wrap items-center gap-x-3 gap-y-1" aria-label="Course status colors">
        {STATUS_ORDER.map((status) => (
          <li key={status} className="flex items-center gap-1.5" title={STATUS_META[status].description}>
            <span aria-hidden className="size-2.5 rounded-full" style={{ background: STATUS_META[status].color }} />
            {STATUS_META[status].label}
          </li>
        ))}
      </ul>
      <span aria-hidden className="hidden h-4 w-px bg-border md:block" />
      <ul className="flex flex-wrap items-center gap-x-3 gap-y-1" aria-label="Edge styles">
        {EDGE_LEGEND.map((item) => (
          <li key={item.label} className="flex items-center gap-1.5">
            <EdgeSample dash={item.dash} />
            {item.label}
          </li>
        ))}
        <li className="flex items-center gap-1.5">
          <span className="rounded-full border border-primary/50 bg-primary/10 px-1.5 text-[10px] leading-4 text-foreground">
            one of
          </span>
          Choose among the inputs
        </li>
      </ul>
    </div>
  )
}
