import { createFileRoute } from '@tanstack/react-router'
import { MustTakePanel } from '@/components/overview/MustTakePanel'
import { PlanSettingsCard } from '@/components/overview/PlanSettingsCard'
import { ProgressSummary, VerdictBanner } from '@/components/overview/ProgressSummary'
import { SpecComparison } from '@/components/overview/SpecComparison'
import { useAnalysis } from '@/lib/data'

export const Route = createFileRoute('/')({ component: OverviewPage })

function OverviewPage() {
  const analysis = useAnalysis()
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <aside className="space-y-6 lg:sticky lg:top-20 lg:order-2 lg:self-start">
        <PlanSettingsCard />
      </aside>
      <div className="min-w-0 space-y-6">
        <header className="space-y-1">
          <h1 className="text-3xl">Overview</h1>
          <p className="text-sm text-muted-foreground">
            Bachelor of Computer Science, 2026/27 calendar — what is mandatory, what is optional, and how far along you
            are.
          </p>
        </header>
        <VerdictBanner analysis={analysis} />
        <ProgressSummary analysis={analysis} />
        <MustTakePanel analysis={analysis} />
        <SpecComparison analysis={analysis} />
      </div>
    </div>
  )
}
