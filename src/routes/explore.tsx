import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/explore')({ component: ExplorePage })

function ExplorePage() {
  return <h1 className="text-3xl">explore</h1>
}
