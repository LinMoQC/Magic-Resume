import { NextResponse } from 'next/server';
import { getServerUserId } from '@/lib/auth/server';
import { serverFetchBackend } from '@/lib/auth/serverFetchBackend';

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return { error: text };
  }
}

/** Strip the `{ code, data, message }` envelope the Core API wraps responses in. */
function unwrapApiEnvelope(payload: unknown): unknown {
  if (
    payload &&
    typeof payload === 'object' &&
    'data' in payload &&
    (payload as { data?: unknown }).data &&
    typeof (payload as { data?: unknown }).data === 'object'
  ) {
    return (payload as { data: unknown }).data;
  }
  return payload;
}

/**
 * Auth-gated passthrough to a Core API billing endpoint — mirrors
 * `app/api/billing/ai-entitlement/route.ts`. Forwards the caller's Clerk token
 * (via serverFetchBackend), preserves the upstream status, and unwraps the
 * response envelope so the client reads plain data.
 */
export async function proxyBilling(path: string, init: RequestInit = {}) {
  const userId = await getServerUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const res = await serverFetchBackend(path, init);
    const text = await res.text();
    const payload = text ? safeJson(text) : {};
    return NextResponse.json(unwrapApiEnvelope(payload), { status: res.status });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: '账单接口请求失败', errorMessage },
      { status: 500 },
    );
  }
}
