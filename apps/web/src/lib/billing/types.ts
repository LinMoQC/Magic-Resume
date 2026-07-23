/** Frontend mirror of the platform-api billing shapes (JSON-serialized). */

export type PlanKind = 'credit_pack' | 'subscription';

export interface PlanSummary {
  id: string;
  name: string;
  kind: PlanKind;
  priceCents: number;
  currency: string;
  modelAllowlist: string[];
  dailyLimit: number;
  weeklyLimit: number;
  interval?: string | null;
  isDefault: boolean;
  // `includedCredits` intentionally omitted: credits are the internal billing
  // unit and are never sent to the client — the API exposes only a percentage.
}

export interface SubscriptionSummary {
  id: string;
  planId: string;
  status: string;
  currentPeriodEnd?: string | null;
  cancelAtPeriodEnd: boolean;
  plan?: PlanSummary | null;
}

export interface UsageSummary {
  dailyUsed: number;
  weeklyUsed: number;
  dailyLimit: number;
  weeklyLimit: number;
  dailyResetAt: string;
  weeklyResetAt: string;
}

/**
 * Response of GET /api/billing/ai-entitlement. Credit-free by design: the client
 * only learns the plan type, whether internal AI is usable right now
 * (`canUseInternal` + `reason`), and how much of the monthly allowance is left
 * (`remainingPercent`). Raw credit balances/caps and day/week counts never leave
 * the server (credits are our internal billing unit).
 */
export interface Entitlement {
  mode: 'internal' | 'byok_required';
  /** Whether internal AI can be used right now (credits + day/week caps). */
  canUseInternal: boolean;
  reason?: string | null;
  /** 计划类型 — no credit fields. */
  currentPlan: PlanSummary | null;
  /** 还剩百分之多少 (0-100) of the monthly allowance; null = unlimited. */
  remainingPercent: number | null;
  /** When the monthly allowance refreshes (ISO). */
  resetAt?: string | null;
  /** Supported models the composer can offer for internal runs (allowlist-filtered). */
  availableModels?: string[];
}
