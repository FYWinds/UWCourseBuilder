import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/graph')({ component: GraphPage })

function GraphPage() {
  return <h1 className="text-3xl">graph</h1>
}
