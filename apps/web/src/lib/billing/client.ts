'use client';

import type { PlanSummary, SubscriptionSummary } from './types';

function unwrap<T>(payload: unknown): T {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    const inner = (payload as { data?: unknown }).data;
    if (inner !== undefined && inner !== null) return inner as T;
  }
  return payload as T;
}

async function readError(res: Response): Promise<string> {
  try {
    const d = await res.json();
    return (d?.error || d?.message || d?.errorMessage || `请求失败（${res.status}）`) as string;
  } catch {
    return `请求失败（${res.status}）`;
  }
}

export async function fetchPlans(): Promise<PlanSummary[]> {
  const res = await fetch('/api/billing/plans', { cache: 'no-store' });
  if (!res.ok) throw new Error(await readError(res));
  const data = unwrap<PlanSummary[]>(await res.json());
  return Array.isArray(data) ? data : [];
}

export async function fetchSubscription(): Promise<SubscriptionSummary | null> {
  const res = await fetch('/api/billing/subscription', { cache: 'no-store' });
  if (!res.ok) throw new Error(await readError(res));
  return unwrap<SubscriptionSummary | null>(await res.json());
}

/** Create a PayPal subscription; returns the approval URL to redirect the user to. */
export async function createSubscription(planId: string): Promise<string | null> {
  const res = await fetch('/api/billing/subscriptions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ planId, channel: 'paypal' }),
  });
  if (!res.ok) throw new Error(await readError(res));
  const data = unwrap<Record<string, unknown>>(await res.json());
  const url =
    data?.approveUrl ?? data?.approvalUrl ?? data?.url ?? data?.checkoutUrl ?? data?.redirectUrl;
  return typeof url === 'string' ? url : null;
}

export async function cancelSubscription(): Promise<void> {
  const res = await fetch('/api/billing/subscription/cancel', { method: 'POST' });
  if (!res.ok) throw new Error(await readError(res));
}
