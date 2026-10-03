import { Suspense, useState } from 'react'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { CourseDetail } from './CourseDetail'
import { useOpenCourse } from './CourseLink'

/** Global course detail sheet, driven by the root `course` search param. */
export function CourseSheet({ code }: { code: string | undefined }) {
  const openCourse = useOpenCourse()
  // Keep rendering the last course while the sheet animates closed.
  const [shown, setShown] = useState(code)
  if (code && code !== shown) setShown(code)
  const normalized = shown?.toUpperCase().replace(/\s+/g, '')

  return (
    <Sheet open={!!code} onOpenChange={(open) => !open && openCourse(undefined)}>
      <SheetContent side="right" className="w-full gap-0 p-0 sm:max-w-xl">
        {normalized && (
          <Suspense fallback={<DetailSkeleton />}>
            <CourseDetail key={normalized} code={normalized} />
          </Suspense>
        )}
      </SheetContent>
    </Sheet>
  )
}

function DetailSkeleton() {
  return (
    <div className="space-y-4 p-6">
      <Skeleton className="h-6 w-28" />
      <Skeleton className="h-8 w-3/4" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-40 w-full" />
    </div>
  )
}
