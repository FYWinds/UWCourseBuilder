import type { Course, CatalogMeta, Season } from '@/domain/types'
import { parseTermCode } from '@/engine'
import { cn } from '@/lib/utils'
import { SEASON_LABEL, SEASONS, shortTermName } from './labels'

/** Sampled terms as academic-year rows (Fall → Winter → Spring) with offered cells highlighted. */
export function OfferingHistory({ course, meta }: { course: Course; meta: CatalogMeta }) {
  const offered = new Set(course.offeredTerms)
  const years = new Map<number, Partial<Record<Season, string>>>()
  for (const code of meta.offeringTerms) {
    const { year, season } = parseTermCode(code)
    const academicYear = season === 'F' ? year : year - 1
    years.set(academicYear, { ...years.get(academicYear), [season]: code })
  }
  const count = meta.offeringTerms.filter((t) => offered.has(t)).length

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-[auto_repeat(3,minmax(0,1fr))] gap-1 text-xs">
        <span />
        {SEASONS.map((s) => (
          <span key={s} className="px-1 text-center font-medium text-muted-foreground">
            {SEASON_LABEL[s]}
          </span>
        ))}
        {[...years].map(([year, terms]) => (
          <div key={year} className="contents">
            <span className="pr-2 text-right font-mono text-muted-foreground tabular-nums">
              {year}/{String(year + 1).slice(-2)}
            </span>
            {SEASONS.map((s) => {
              const code = terms[s]
              if (!code) return <span key={s} />
              const yes = offered.has(code)
              return (
                <span
                  key={s}
                  title={`${shortTermName(code)}: ${yes ? 'scheduled' : 'not scheduled'}`}
                  className={cn(
                    'rounded-md border py-1 text-center font-mono',
                    yes
                      ? 'border-primary/50 bg-primary/15 font-medium text-foreground'
                      : 'border-dashed text-muted-foreground/60',
                  )}
                >
                  {shortTermName(code)}
                  <span className="sr-only">{yes ? ' scheduled' : ' not scheduled'}</span>
                </span>
              )
            })}
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Scheduled in {count} of {meta.offeringTerms.length} past terms
        {course.offered.length > 0 && ` (${course.offered.map((s) => SEASON_LABEL[s]).join(', ')})`}. Historical reference
        only — check Quest for the upcoming term; cross-listed codes may show terms in which only a partner code ran.
      </p>
    </div>
  )
}
