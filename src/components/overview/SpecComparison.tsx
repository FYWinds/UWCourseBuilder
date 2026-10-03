import { Check, Minus, Plus } from 'lucide-react'
import { useMemo } from 'react'
import { formatUnits } from '@/components/audit/units'
import { UnitsBar } from '@/components/audit/UnitsBar'
import { CourseLink } from '@/components/course/CourseLink'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { SpecId } from '@/domain/requirements'
import type { CourseCode } from '@/domain/types'
import { auditCourses } from '@/engine/audit'
import type { Analysis } from '@/lib/data'
import { SPECS, SPEC_IDS } from '@/requirements/specs'
import { usePlanStore } from '@/store/plan'

interface SpecRow {
  id: SpecId
  need: number
  remaining: number
  takenHave: number
  unmet: number
  shared: CourseCode[]
  allocated: number
}

export function SpecComparison({ analysis }: { analysis: Analysis }) {
  const { audit, takenAudit, idx, plan } = analysis
  const toggleSpec = usePlanStore((s) => s.toggleSpec)

  const rows = useMemo(() => {
    const coreCourses = audit.programs.find((p) => p.program.id === 'core')?.allocation.assignment
    return SPEC_IDS.map((id): SpecRow => {
      const [pa] = auditCourses([SPECS[id]], audit.usable, idx)
      const [takenPa] = auditCourses([SPECS[id]], takenAudit.usable, idx)
      const allocated = [...pa.allocation.assignment.keys()]
      const need = pa.allocation.slots.reduce((s, x) => s + x.slot.units, 0)
      return {
        id,
        need,
        remaining: pa.allocation.deficit,
        takenHave: need - takenPa.allocation.deficit,
        unmet:
          pa.allocation.slots.filter((s) => !s.satisfied).length +
          pa.allocation.floors.filter((f) => !f.satisfied).length,
        shared: allocated.filter((code) => coreCourses?.has(code)).sort(),
        allocated: allocated.length,
      }
    }).sort((a, b) => a.remaining - b.remaining || SPECS[a.id].shortName.localeCompare(SPECS[b.id].shortName))
  }, [audit.programs, audit.usable, takenAudit.usable, idx])

  return (
    <Card className="gap-4">
      <CardHeader>
        <CardTitle className="font-serif text-lg">Compare specializations</CardTitle>
        <CardDescription>
          Each specialization audited against your current courses (completed and planned), easiest first.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Specialization</TableHead>
              <TableHead className="w-40">Progress</TableHead>
              <TableHead className="text-right">Remaining</TableHead>
              <TableHead className="hidden md:table-cell">Shared with core</TableHead>
              <TableHead className="sr-only">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => {
              const spec = SPECS[row.id]
              const selected = plan.specs.includes(row.id)
              return (
                <TableRow key={row.id}>
                  <TableCell className="whitespace-normal">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <a
                        href={spec.calendarUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="font-medium underline-offset-2 hover:underline"
                        title={spec.name}
                      >
                        {spec.shortName}
                      </a>
                      {selected && (
                        <Badge variant="secondary" className="gap-1">
                          <Check aria-hidden />
                          Selected
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <UnitsBar taken={row.takenHave} total={row.need - row.remaining} need={row.need} label={`${spec.shortName} progress`} />
                  </TableCell>
                  <TableCell className="text-right">
                    {row.remaining === 0 && row.unmet === 0 ? (
                      <span className="text-sm font-medium text-status-taken">Complete</span>
                    ) : (
                      <>
                        <p className="font-mono text-sm tabular-nums">{formatUnits(row.remaining)} units</p>
                        <p className="text-xs text-muted-foreground">
                          {row.unmet} requirement{row.unmet === 1 ? '' : 's'} open
                        </p>
                      </>
                    )}
                  </TableCell>
                  <TableCell className="hidden whitespace-normal md:table-cell">
                    {row.shared.length === 0 ? (
                      <span className="text-xs text-muted-foreground">
                        {row.allocated === 0 ? '—' : `0 of ${row.allocated}`}
                      </span>
                    ) : (
                      <div className="space-y-0.5">
                        <p className="text-xs text-muted-foreground">
                          {row.shared.length} of {row.allocated} counted courses
                        </p>
                        <div className="flex flex-wrap gap-x-2">
                          {row.shared.map((code) => (
                            <CourseLink key={code} code={code} className="text-xs" />
                          ))}
                        </div>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant={selected ? 'ghost' : 'outline'}
                      size="sm"
                      onClick={() => toggleSpec(row.id)}
                      aria-label={`${selected ? 'Remove' : 'Add'} ${spec.name}`}
                    >
                      {selected ? <Minus /> : <Plus />}
                      {selected ? 'Remove' : 'Add'}
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
        <p className="text-xs text-muted-foreground">
          Double counting with the core is allowed: a course may count toward both the CS major and a
          specialization, so “shared with core” courses cost nothing extra. Whether one course may count toward two specializations at once is not verified against the
          calendar — confirm with an advisor before relying on it.
        </p>
      </CardContent>
    </Card>
  )
}
