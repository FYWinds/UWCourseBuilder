import { formatUnits } from '@/components/audit/units'
import type { AuditResult, DepthResult, ProgramAudit } from '@/engine'
import type { Analysis } from '@/lib/data'

export interface SummaryRow {
  id: string
  label: string
  need: number
  /** Completed courses only. */
  taken: number
  /** Completed + planned. */
  total: number
  satisfied: boolean
  unit: 'units' | 'terms'
  hint?: string
}

const coreOf = (audit: AuditResult) => audit.programs.find((p) => p.program.id === 'core')

function sectionProgress(pa: ProgramAudit | undefined, sectionId: string) {
  const ids = new Set(pa?.program.sections.find((s) => s.id === sectionId)?.slots.map((s) => s.id))
  const slots = pa?.allocation.slots.filter((s) => ids.has(s.slot.id)) ?? []
  return {
    have: slots.reduce((s, x) => s + x.filled, 0),
    need: slots.reduce((s, x) => s + x.slot.units, 0),
    satisfied: slots.every((x) => x.satisfied),
  }
}

function programProgress(pa: ProgramAudit | undefined) {
  const need = pa?.allocation.slots.reduce((s, x) => s + x.slot.units, 0) ?? 0
  return { have: need - (pa?.allocation.deficit ?? 0), need, satisfied: pa ? pa.allocation.satisfied : false }
}

export function depthHint(depth: DepthResult): string {
  if (depth.satisfied) return `Depth: ${depth.subject} (${depth.via === 'chain' ? 'prerequisite chain' : '300-level course'})`
  if (!depth.subject) return 'Depth: no subject started yet'
  return `Depth: ${depth.subject} ${formatUnits(depth.units)} / ${formatUnits(depth.rule.units)} — needs a 300-level course or a prerequisite chain of three`
}

const CORE_SECTIONS: { id: string; label: string }[] = [
  { id: 'communication', label: 'Communication' },
  { id: 'cs-required', label: 'Required CS' },
  { id: 'math-required', label: 'Required math' },
  { id: 'cs-upper', label: 'Upper-year CS' },
]

export function summaryRows({ audit, takenAudit }: Analysis): SummaryRow[] {
  const core = coreOf(audit)
  const takenCore = coreOf(takenAudit)
  const rows: SummaryRow[] = []

  for (const id of ['total', 'nonmath']) {
    const t = core?.totals.find((x) => x.id === id)
    if (!t) continue
    const taken = takenCore?.totals.find((x) => x.id === id)?.have ?? 0
    rows.push({
      id,
      label: id === 'total' ? 'Total units' : 'Non-math units',
      need: t.units,
      taken,
      total: t.have,
      satisfied: t.satisfied,
      unit: 'units',
    })
  }

  for (const s of CORE_SECTIONS) {
    const all = sectionProgress(core, s.id)
    if (all.need === 0) continue
    rows.push({ id: s.id, label: s.label, need: all.need, taken: sectionProgress(takenCore, s.id).have, total: all.have, satisfied: all.satisfied, unit: 'units' })
  }

  const breadth = sectionProgress(core, 'breadth')
  if (breadth.need > 0) {
    const floor = core?.allocation.floors.find((f) => f.floor.id === 'breadth200')
    rows.push({
      id: 'breadth',
      label: 'Breadth',
      need: breadth.need,
      taken: sectionProgress(takenCore, 'breadth').have,
      total: breadth.have,
      satisfied: breadth.satisfied && (floor?.satisfied ?? true),
      unit: 'units',
      hint: floor ? `${formatUnits(floor.units)} / ${formatUnits(floor.floor.units)} units at the 200-level or higher` : undefined,
    })
  }

  const takenFullTime = takenAudit.fullTimeTerms.have
  rows.push({
    id: 'fulltime',
    label: 'Full-time terms',
    need: audit.fullTimeTerms.need,
    taken: takenFullTime,
    total: audit.fullTimeTerms.have,
    satisfied: audit.fullTimeTerms.have >= audit.fullTimeTerms.need,
    unit: 'terms',
    hint: '≥ 3 courses and ≥ 1.5 units in a study term',
  })

  for (const pa of audit.programs) {
    if (pa.program.id === 'core') continue
    const all = programProgress(pa)
    const taken = programProgress(takenAudit.programs.find((p) => p.program.id === pa.program.id))
    const depth = pa.allocation.depth
    rows.push({
      id: pa.program.id,
      label: pa.program.kind === 'spec' ? `${pa.program.shortName} spec.` : pa.program.shortName,
      need: all.need,
      taken: taken.have,
      total: all.have,
      satisfied: all.satisfied,
      unit: 'units',
      ...(depth && { hint: depthHint(depth) }),
    })
  }
  return rows
}

/** Unmet slots, level floors, unit totals and the full-time term requirement. */
export function remainingRequirements(audit: AuditResult): number {
  const perProgram = audit.programs.reduce(
    (n, pa) =>
      n +
      pa.allocation.slots.filter((s) => !s.satisfied).length +
      pa.allocation.floors.filter((f) => !f.satisfied).length +
      (pa.allocation.depth && !pa.allocation.depth.satisfied ? 1 : 0) +
      pa.totals.filter((t) => !t.satisfied).length,
    0,
  )
  return perProgram + (audit.fullTimeTerms.have < audit.fullTimeTerms.need ? 1 : 0)
}
