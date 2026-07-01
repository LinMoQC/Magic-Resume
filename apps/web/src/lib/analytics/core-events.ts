'use client'

export type CoreAnalyticsEvent = {
  type: string
  path?: string
  userId?: string
  referrer?: string
  source?: string
  resumeId?: string
  properties?: Record<string, unknown>
}

export type ProductEvent = CoreAnalyticsEvent

export const captureCoreAnalyticsEvent = (event: CoreAnalyticsEvent) => {
  void event
  // Open-source and self-hosted builds intentionally do not send analytics.
}

export const captureProductEvent = captureCoreAnalyticsEvent

export const reportClientError = (error: unknown, context?: Record<string, unknown>) => {
  void error
  void context
  // Commercial builds may replace this facade through a private overlay.
}
