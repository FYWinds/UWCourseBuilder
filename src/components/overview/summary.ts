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
  const { name, upperLevel, chainLength } = depth.rule
  if (depth.satisfied) {
    return `${name}: ${depth.subject}${depth.via === 'chain' ? ' (prerequisite chain)' : upperLevel > 100 ? ` (${upperLevel}-level course)` : ''}`
  }
  if (!depth.subject) return `${name}: no subject started yet`
  const need = [upperLevel > 100 && `a ${upperLevel}-level course`, chainLength !== null && `a prerequisite chain of ${chainLength}`]
    .filter(Boolean)
    .join(' or ')
  return `${name}: ${depth.subject} ${formatUnits(depth.units)} / ${formatUnits(depth.rule.units)}${need ? ` — needs ${need}` : ''}`
}

/** Short labels for the overview; other sections use their audit label. */
const SECTION_LABEL: Record<string, string> = {
  'list-a': 'List A',
  communication: 'Communication',
  'cs-required': 'Required CS',
  'math-required': 'Required math',
  'cs-upper': 'Upper-year CS',
}
const TOTAL_LABEL: Record<string, string> = { total: 'Total units', math: 'Math units', nonmath: 'Non-math units' }

export function summaryRows({ audit, takenAudit }: Analysis): SummaryRow[] {
  const core = coreOf(audit)
  const takenCore = coreOf(takenAudit)
  const rows: SummaryRow[] = []

  for (const t of core?.totals ?? []) {
    rows.push({
      id: t.id,
      label: TOTAL_LABEL[t.id] ?? t.label,
      need: t.units,
      taken: takenCore?.totals.find((x) => x.id === t.id)?.have ?? 0,
      total: t.have,
      satisfied: t.satisfied,
      unit: 'units',
    })
  }

  for (const s of core?.program.sections ?? []) {
    if (s.id === 'breadth') continue
    const all = sectionProgress(core, s.id)
    if (all.need === 0) continue
    rows.push({
      id: s.id,
      label: SECTION_LABEL[s.id] ?? s.label,
      need: all.need,
      taken: sectionProgress(takenCore, s.id).have,
      total: all.have,
      satisfied: all.satisfied,
      unit: 'units',
    })
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

  const coreDepth = core?.allocation.depth
  if (coreDepth) {
    rows.push({
      id: coreDepth.rule.id,
      label: coreDepth.rule.name,
      need: coreDepth.rule.units,
      taken: Math.min(takenCore?.allocation.depth?.units ?? 0, coreDepth.units),
      total: coreDepth.units,
      satisfied: coreDepth.satisfied,
      unit: 'units',
      hint: depthHint(coreDepth),
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
