import { API_ORIGIN } from '@/lib/api/routes';

/**
 * Rollout config, served by platform-api's public endpoint
 * (`GET /api/config/rollout`) and managed from the admin "灰度发布" tab.
 * Replaces the former `BETA_GATE` / `NEXT_PUBLIC_LAUNCH_AT` env vars so ops can
 * flip the gate / launch time without an app redeploy.
 */
export interface RolloutConfig {
  /** false = gate open to everyone (one-click full launch). */
  gateEnabled: boolean;
  /** ISO datetime the coming-soon countdown targets; null hides it. */
  launchAt: string | null;
  /** External waitlist form; null falls back to mailto(contactEmail). */
  waitlistUrl: string | null;
  contactEmail: string | null;
}

// fail-closed default: if the backend is unreachable the gate stays ON, so only
// users whose Clerk claim already grants access get in; everyone else sees
// coming-soon. That is the safe beta behaviour (never expose the app by accident).
const FALLBACK: RolloutConfig = {
  gateEnabled: true,
  launchAt: null,
  waitlistUrl: null,
  contactEmail: null,
};

/**
 * Server-side read of the public rollout config. Cached by Next for a few
 * seconds so the per-request beta gate doesn't add a network hop each time.
 */
export async function getRolloutConfig(): Promise<RolloutConfig> {
  try {
    const res = await fetch(`${API_ORIGIN}/api/config/rollout`, {
      next: { revalidate: 10 },
    });
    if (!res.ok) return FALLBACK;
    // platform-api wraps responses as { code, data, ... }
    const body = await res.json();
    const data = (body?.data ?? body) as Partial<RolloutConfig>;
    return { ...FALLBACK, ...data };
  } catch {
    return FALLBACK;
  }
}
