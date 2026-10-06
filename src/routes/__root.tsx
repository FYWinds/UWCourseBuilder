import { Link, Outlet, createRootRoute } from '@tanstack/react-router'
import { Bug, GraduationCap, Monitor, Moon, Sun } from 'lucide-react'
import { Suspense } from 'react'
import { DisclaimerDialog } from '@/components/DisclaimerDialog'
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
import { ISSUE_CHOOSER_URL, REPO_URL } from '@/lib/repo'
import { MAJORS } from '@/requirements/majors'
import { usePlanStore } from '@/store/plan'
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
  const major = usePlanStore((s) => MAJORS[s.plan.major])
  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex min-h-svh flex-col">
        <header className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
          <div className="mx-auto flex h-14 max-w-7xl items-center gap-6 px-4">
            <Link to="/" className="flex shrink-0 items-center gap-2">
              <GraduationCap className="size-5 text-primary" aria-hidden />
              <span className="font-serif text-lg font-semibold tracking-tight whitespace-nowrap">UW Course Builder</span>
              <span
                className="hidden max-w-48 truncate rounded-full border px-2 py-0.5 text-xs text-muted-foreground lg:inline"
                title={major.name}
              >
                {major.shortName} · 2026/27
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
              <Button variant="ghost" size="icon-sm" asChild>
                <a href={ISSUE_CHOOSER_URL} target="_blank" rel="noreferrer" aria-label="Report a problem" title="Report a problem">
                  <Bug />
                </a>
              </Button>
              <Button variant="ghost" size="icon-sm" asChild>
                <a href={REPO_URL} target="_blank" rel="noreferrer" aria-label="GitHub repository" title="GitHub repository">
                  <GitHubMark />
                </a>
              </Button>
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
        <DisclaimerDialog />
      </div>
    </TooltipProvider>
  )
}

/** GitHub's mark (lucide no longer ships brand icons). */
function GitHubMark() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 .3a12 12 0 0 0-3.8 23.38c.6.12.83-.26.83-.57L9 21.07c-3.34.72-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.08-.74.09-.73.09-.73 1.2.09 1.83 1.24 1.83 1.24 1.07 1.83 2.81 1.3 3.5 1 .1-.78.42-1.31.76-1.61-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.14-.3-.54-1.52.1-3.18 0 0 1-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.28-1.55 3.29-1.23 3.29-1.23.64 1.66.24 2.88.12 3.18a4.65 4.65 0 0 1 1.23 3.22c0 4.61-2.8 5.63-5.48 5.92.42.36.81 1.1.81 2.22l-.01 3.29c0 .31.2.69.82.57A12 12 0 0 0 12 .3" />
    </svg>
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
