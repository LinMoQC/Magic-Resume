'use client'

import { usePathname, useSearchParams } from "next/navigation"
import { useEffect, Suspense } from "react"
import { captureCoreAnalyticsEvent } from '@/lib/analytics/core-events'

function PageViewTrackerContent() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (!pathname) return
    captureCoreAnalyticsEvent({
      type: 'page_view',
      path: `${pathname}${searchParams?.toString() ? `?${searchParams.toString()}` : ''}`,
      userId: undefined,
    })
  }, [pathname, searchParams])

  return null
}

export default function PageViewTracker() {
  return (
    <Suspense fallback={null}>
      <PageViewTrackerContent />
    </Suspense>
  )
}
