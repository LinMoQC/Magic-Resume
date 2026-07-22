import { proxyBilling } from '@/lib/billing/proxy';

/** The caller's current subscription (status / period end / cancel flag). */
export function GET() {
  return proxyBilling('/api/billing/subscription', { method: 'GET' });
}
