import { proxyBilling } from '@/lib/billing/proxy';

/** Enabled plans (credit packs + subscriptions) for the pricing page. */
export function GET() {
  return proxyBilling('/api/billing/plans', { method: 'GET' });
}
