import { ListFilter, Search, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { FACULTY_LABEL, SEASON_LABEL, SEASONS } from '@/components/course/labels'
import { STATUS_META } from '@/components/course/status'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import type { Faculty, Season } from '@/domain/types'
import { type AuditResult, type CatalogIndex, STATUS_ORDER } from '@/engine'
import { CLEARED_FILTERS, type ExploreSearch, FILTER_KEYS, LEVELS, slotLabel } from './search'
import { SubjectPicker } from './SubjectPicker'

const ANY = 'any'

export function ExploreToolbar({
  search,
  onChange,
  idx,
  audit,
}: {
  search: ExploreSearch
  onChange: (patch: Partial<ExploreSearch>) => void
  idx: CatalogIndex
  audit: AuditResult
}) {
  const active = FILTER_KEYS.some((k) => search[k] !== undefined)

  return (
    <div className="flex flex-wrap items-center gap-2">
      <SearchInput value={search.q} onChange={(q) => onChange({ q })} />
      <StatusMenu value={search.status} onChange={(status) => onChange({ status })} />
      <SubjectPicker courses={idx.courses} value={search.subject} onChange={(subject) => onChange({ subject })} />
      <Select
        value={search.level ? String(search.level) : ANY}
        onValueChange={(v) => onChange({ level: v === ANY ? undefined : Number(v) })}
      >
        <SelectTrigger size="sm" className="w-28" aria-label="Level">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ANY}>Any level</SelectItem>
          {LEVELS.map((l) => (
            <SelectItem key={l} value={String(l)}>
              {l === 400 ? '400+' : l}-level
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={search.faculty ?? ANY}
        onValueChange={(v) => onChange({ faculty: v === ANY ? undefined : (v as Faculty) })}
      >
        <SelectTrigger size="sm" className="w-34" aria-label="Faculty">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ANY}>Any faculty</SelectItem>
          {Object.entries(FACULTY_LABEL).map(([id, label]) => (
            <SelectItem key={id} value={id}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={search.season ?? ANY}
        onValueChange={(v) => onChange({ season: v === ANY ? undefined : (v as Season) })}
      >
        <SelectTrigger size="sm" className="w-32" aria-label="Season offered">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ANY}>Any season</SelectItem>
          {SEASONS.map((s) => (
            <SelectItem key={s} value={s}>
              Offered in {SEASON_LABEL[s]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <SlotSelect value={search.slot} audit={audit} onChange={(slot) => onChange({ slot })} />
      <div className="flex items-center gap-2 px-1">
        <Switch
          id="explore-online"
          checked={!!search.onlineOnly}
          onCheckedChange={(on) => onChange({ onlineOnly: on || undefined })}
        />
        <Label htmlFor="explore-online" className="text-sm font-normal">
          Online only
        </Label>
      </div>
      {active && (
        <Button variant="ghost" size="sm" onClick={() => onChange(CLEARED_FILTERS)}>
          <X />
          Clear filters
        </Button>
      )}
    </div>
  )
}

function SearchInput({ value, onChange }: { value: string | undefined; onChange: (q: string | undefined) => void }) {
  const [text, setText] = useState(value ?? '')
  // Adopt URL changes made elsewhere (presets, clear) without clobbering in-progress typing.
  const [synced, setSynced] = useState(value)
  if (value !== synced) {
    setSynced(value)
    if ((value ?? '') !== text.trim()) setText(value ?? '')
  }

  useEffect(() => {
    const next = text.trim() || undefined
    if (next === value) return
    const timer = setTimeout(() => onChange(next), 200)
    return () => clearTimeout(timer)
  }, [text, value, onChange])

  return (
    <div className="relative w-full sm:w-64">
      <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
      <Input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Code or title…"
        aria-label="Search by code or title"
        className="h-8 pl-8"
      />
    </div>
  )
}

function StatusMenu({
  value,
  onChange,
}: {
  value: ExploreSearch['status']
  onChange: (status: ExploreSearch['status']) => void
}) {
  const selected = new Set(value ?? [])
  const toggle = (status: (typeof STATUS_ORDER)[number], on: boolean) => {
    const next = STATUS_ORDER.filter((s) => (s === status ? on : selected.has(s)))
    onChange(next.length ? next : undefined)
  }
  const summary =
    selected.size === 0 ? 'All statuses' : selected.size === 1 ? STATUS_META[[...selected][0]].label : `${selected.size} statuses`

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className={selected.size ? 'border-primary/60' : 'font-normal'}>
          <ListFilter />
          {summary}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-60">
        {STATUS_ORDER.map((s) => {
          const meta = STATUS_META[s]
          const Icon = meta.icon
          return (
            <DropdownMenuCheckboxItem
              key={s}
              checked={selected.has(s)}
              onCheckedChange={(on) => toggle(s, on)}
              onSelect={(e) => e.preventDefault()}
            >
              <Icon style={{ color: meta.color }} aria-hidden />
              {meta.label}
            </DropdownMenuCheckboxItem>
          )
        })}
        {selected.size > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => onChange(undefined)}>Show all statuses</DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function SlotSelect({
  value,
  audit,
  onChange,
}: {
  value: string | undefined
  audit: AuditResult
  onChange: (slot: string | undefined) => void
}) {
  const groups = audit.programs
    .map((pa) => ({
      id: pa.program.id,
      name: pa.program.shortName,
      options: [
        ...pa.allocation.slots.filter((s) => !s.satisfied).map((s) => ({ id: s.slot.id, label: s.slot.label })),
        ...pa.allocation.floors.filter((f) => !f.satisfied).map((f) => ({ id: f.floor.id, label: f.floor.label })),
      ],
    }))
    .filter((g) => g.options.length > 0)
  const listed = groups.some((g) => g.options.some((o) => `${g.id}:${o.id}` === value))
  const extraLabel = value && !listed ? (slotLabel(value, audit) ?? value) : null

  return (
    <Select value={value ?? ANY} onValueChange={(v) => onChange(v === ANY ? undefined : v)}>
      <SelectTrigger size="sm" className="w-56" aria-label="Requirement">
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="max-w-sm">
        <SelectItem value={ANY}>Any requirement</SelectItem>
        {extraLabel && value && <SelectItem value={value}>{extraLabel}</SelectItem>}
        {groups.map((g) => (
          <SelectGroup key={g.id}>
            <SelectLabel>{g.name} — unmet</SelectLabel>
            {g.options.map((o) => (
              <SelectItem key={o.id} value={`${g.id}:${o.id}`}>
                {o.label}
              </SelectItem>
            ))}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  )
}
