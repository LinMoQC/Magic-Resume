'use client'

const SESSION_TTL_MS = 30 * 60 * 1000
const API_BASE_URL = process.env.NEXT_PUBLIC_CLOUD_API_URL || 'http://localhost:3111'

const createId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export const getAnonymousId = () => {
  const key = 'magic_resume_anonymous_id'
  const existing = localStorage.getItem(key)
  if (existing) return existing

  const id = createId()
  localStorage.setItem(key, id)
  return id
}

export const getSessionId = () => {
  const key = 'magic_resume_session'
  const now = Date.now()
  const existing = localStorage.getItem(key)

  if (existing) {
    try {
      const parsed = JSON.parse(existing) as { id: string; lastSeenAt: number }
      if (parsed.id && now - parsed.lastSeenAt < SESSION_TTL_MS) {
        localStorage.setItem(key, JSON.stringify({ id: parsed.id, lastSeenAt: now }))
        return parsed.id
      }
    } catch {
      localStorage.removeItem(key)
    }
  }

  const id = createId()
  localStorage.setItem(key, JSON.stringify({ id, lastSeenAt: now }))
  return id
}

type CoreAnalyticsEvent = {
  type: string
  path?: string
  userId?: string
  referrer?: string
  source?: string
  resumeId?: string
  properties?: Record<string, unknown>
}

export const captureCoreAnalyticsEvent = (event: CoreAnalyticsEvent) => {
  if (typeof window === 'undefined') return

  try {
    const payload = JSON.stringify({
      type: event.type,
      path: event.path || `${window.location.pathname}${window.location.search}`,
      anonymousId: getAnonymousId(),
      sessionId: getSessionId(),
      userId: event.userId,
      referrer: event.referrer || document.referrer || undefined,
      source: event.source,
      resumeId: event.resumeId,
      properties: event.properties,
    })

    if (navigator.sendBeacon) {
      navigator.sendBeacon(`${API_BASE_URL}/api/analytics/events`, new Blob([payload], { type: 'application/json' }))
    } else {
      fetch(`${API_BASE_URL}/api/analytics/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: true,
      }).catch(() => undefined)
    }
  } catch (error) {
    console.warn('Failed to capture product analytics event:', error)
  }
}
