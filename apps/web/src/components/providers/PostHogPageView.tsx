'use client'

import { usePathname, useSearchParams } from "next/navigation"
import { useEffect, Suspense } from "react"
import { usePostHog } from 'posthog-js/react'
import { useUser } from '@clerk/nextjs'
import { captureCoreAnalyticsEvent } from '@/lib/analytics/core-events'

function PostHogPageViewContent() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const posthog = usePostHog()
  const { user } = useUser()

  useEffect(() => {
    // Track pageview
    if (pathname && posthog) {
      let url = window.origin + pathname
      if (searchParams?.toString()) {
        url = url + `?${searchParams.toString()}`
      }
      posthog.capture('$pageview', {
        '$current_url': url,
      })
    }

    if (pathname) {
      captureCoreAnalyticsEvent({
        type: 'page_view',
        path: `${pathname}${searchParams?.toString() ? `?${searchParams.toString()}` : ''}`,
        userId: user?.id,
      })
    }
  }, [pathname, searchParams, posthog, user?.id])

  return null
}

export default function PostHogPageView() {
  return (
    <Suspense fallback={null}>
      <PostHogPageViewContent />
    </Suspense>
  )
}
