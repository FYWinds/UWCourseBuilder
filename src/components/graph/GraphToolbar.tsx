import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import type { Course, CourseCode } from '@/domain/types'
import { DIRECTIONS, type Direction } from './build'
import { CoursePicker } from './CoursePicker'

export const MIN_DEPTH = 1
export const MAX_DEPTH = 6

const DEPTHS = Array.from({ length: MAX_DEPTH - MIN_DEPTH + 1 }, (_, i) => MIN_DEPTH + i)

const DIRECTION_LABEL: Record<Direction, { label: string; description: string }> = {
  ancestors: { label: 'Prerequisites', description: 'Courses needed before the focus course' },
  descendants: { label: 'Unlocks', description: 'Courses that list the focus course as a requisite' },
  both: { label: 'Both', description: 'Prerequisites and unlocked courses' },
}

export interface GraphSettings {
  focus: CourseCode
  depth: number
  direction: Direction
  mustOnly: boolean
}

interface GraphToolbarProps {
  settings: GraphSettings
  courses: Course[]
  onChange: (patch: Partial<GraphSettings>) => void
}

export function GraphToolbar({ settings, courses, onChange }: GraphToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-3 rounded-xl border bg-card px-4 py-3 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Focus</span>
        <CoursePicker courses={courses} value={settings.focus} onSelect={(focus) => onChange({ focus })} />
      </div>

      <div className="flex items-center gap-2">
        <Label htmlFor="graph-depth" className="font-normal text-muted-foreground">
          Depth
        </Label>
        <Select value={String(settings.depth)} onValueChange={(value) => onChange({ depth: Number(value) })}>
          <SelectTrigger id="graph-depth" size="sm" className="w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DEPTHS.map((d) => (
              <SelectItem key={d} value={String(d)}>
                {d} {d === 1 ? 'level' : 'levels'}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <ToggleGroup
        type="single"
        variant="outline"
        size="sm"
        value={settings.direction}
        onValueChange={(value) => {
          if (value) onChange({ direction: value as Direction })
        }}
        aria-label="Graph direction"
      >
        {DIRECTIONS.map((direction) => (
          <ToggleGroupItem key={direction} value={direction} title={DIRECTION_LABEL[direction].description}>
            {DIRECTION_LABEL[direction].label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>

      <div className="flex items-center gap-2">
        <Switch
          id="graph-must-only"
          checked={settings.mustOnly}
          onCheckedChange={(mustOnly) => onChange({ mustOnly })}
        />
        <Label htmlFor="graph-must-only" className="font-normal">
          Must/required only
        </Label>
      </div>
    </div>
  )
}
