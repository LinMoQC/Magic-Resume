import { proxyBilling } from '@/lib/billing/proxy';

/** Cancel the caller's subscription at period end. */
export function POST() {
  return proxyBilling('/api/billing/subscription/cancel', { method: 'POST' });
}
