import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/planner')({ component: PlannerPage })

function PlannerPage() {
  return <h1 className="text-3xl">planner</h1>
}
