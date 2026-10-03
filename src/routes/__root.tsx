import { Link, Outlet, createRootRoute } from '@tanstack/react-router'
import { GraduationCap, Monitor, Moon, Sun } from 'lucide-react'
import { Suspense } from 'react'
import { CommandSearch } from '@/components/course/CommandSearch'
import { CourseSheet } from '@/components/course/CourseSheet'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { useCatalog } from '@/lib/data'
import { type ThemeMode, useResolvedTheme, useThemeStore } from '@/store/theme'

interface RootSearch {
  /** Course shown in the detail sheet. */
  course?: string
}

export const Route = createRootRoute({
  validateSearch: (search: Record<string, unknown>): RootSearch =>
    typeof search.course === 'string' ? { course: search.course } : {},
  component: RootLayout,
})

const NAV = [
  { to: '/', label: 'Overview' },
  { to: '/audit', label: 'Audit' },
  { to: '/explore', label: 'Explore' },
  { to: '/planner', label: 'Planner' },
  { to: '/graph', label: 'Prereq graph' },
] as const

function RootLayout() {
  const { course } = Route.useSearch()
  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex min-h-svh flex-col">
        <header className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
          <div className="mx-auto flex h-14 max-w-7xl items-center gap-6 px-4">
            <Link to="/" className="flex items-center gap-2">
              <GraduationCap className="size-5 text-primary" aria-hidden />
              <span className="font-serif text-lg font-semibold tracking-tight">UW Course Builder</span>
              <span className="hidden rounded-full border px-2 py-0.5 text-xs text-muted-foreground md:inline">
                BCS · 2026/27
              </span>
            </Link>
            <nav className="flex items-center gap-1 overflow-x-auto text-sm">
              {NAV.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  search={(prev) => prev}
                  activeOptions={{ exact: item.to === '/', includeSearch: false }}
                  className="rounded-md px-3 py-1.5 whitespace-nowrap text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground data-[status=active]:bg-secondary data-[status=active]:font-medium data-[status=active]:text-foreground"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="ml-auto flex items-center gap-2">
              <Suspense fallback={null}>
                <CommandSearch />
              </Suspense>
              <ThemeToggle />
            </div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6">
          <Suspense fallback={<PageSkeleton />}>
            <Outlet />
          </Suspense>
        </main>
        <Suspense fallback={null}>
          <Footer />
        </Suspense>
        <Suspense fallback={null}>
          <CourseSheet code={course} />
        </Suspense>
        <Toaster position="bottom-right" />
      </div>
    </TooltipProvider>
  )
}

function ThemeToggle() {
  const mode = useThemeStore((s) => s.mode)
  const setMode = useThemeStore((s) => s.setMode)
  const resolved = useResolvedTheme()
  const Icon = mode === 'system' ? Monitor : resolved === 'dark' ? Moon : Sun
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label="Theme">
          <Icon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup value={mode} onValueChange={(v) => setMode(v as ThemeMode)}>
          <DropdownMenuRadioItem value="light">Light</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="dark">Dark</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="system">System</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function Footer() {
  const { meta } = useCatalog()
  return (
    <footer className="border-t py-4 text-xs text-muted-foreground">
      <div className="mx-auto flex max-w-7xl flex-wrap justify-between gap-2 px-4">
        <span>
          Data: {meta.calendar} ({meta.courseCount} courses), offerings {meta.offeringTerms.at(0)}–{meta.offeringTerms.at(-1)} via UW
          Open Data · snapshot {new Date(meta.fetchedAt).toLocaleDateString()}
        </span>
        <span>Unofficial planning aid — the Undergraduate Calendar always takes precedence.</span>
      </div>
    </footer>
  )
}

function PageSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  )
}
