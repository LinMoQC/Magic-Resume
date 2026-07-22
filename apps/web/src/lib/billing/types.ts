/** Frontend mirror of the platform-api billing shapes (JSON-serialized). */

export type PlanKind = 'credit_pack' | 'subscription';

export interface PlanSummary {
  id: string;
  name: string;
  kind: PlanKind;
  priceCents: number;
  currency: string;
  includedCredits: string;
  modelAllowlist: string[];
  dailyLimit: number;
  weeklyLimit: number;
  interval?: string | null;
  isDefault: boolean;
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

/** Response of GET /api/billing/ai-entitlement (usage + plan + subscription). */
export interface Entitlement {
  mode: 'internal' | 'byok_required';
  canUseInternal: boolean;
  reason?: string | null;
  balanceCredits: string;
  currency: string;
  checkedAt: string;
  currentPlan: PlanSummary | null;
  subscription: SubscriptionSummary | null;
  usage: UsageSummary;
  overDailyLimit: boolean;
  overWeeklyLimit: boolean;
  /** Supported models the composer can offer for internal runs (allowlist-filtered). */
  availableModels?: string[];
}
