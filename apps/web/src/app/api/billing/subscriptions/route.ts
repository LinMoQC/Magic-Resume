import { NextRequest } from 'next/server';
import { proxyBilling } from '@/lib/billing/proxy';

/** Create a subscription ({ planId, channel:'paypal' }) → returns approve URL. */
export async function POST(req: NextRequest) {
  const body = await req.text();
  return proxyBilling('/api/billing/subscriptions', { method: 'POST', body });
}
