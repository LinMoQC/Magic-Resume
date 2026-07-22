import { NextResponse } from 'next/server';
import { getServerUserId } from '@/lib/auth/server';
import { serverFetchBackend } from '@/lib/auth/serverFetchBackend';

export async function GET() {
  try {
    const userId = await getServerUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const backendResponse = await serverFetchBackend('/api/billing/ai-entitlement', {
      method: 'GET',
    });
    const text = await backendResponse.text();
    const payload = text ? safeJson(text) : {};

    return NextResponse.json(unwrapApiEnvelope(payload), {
      status: backendResponse.status,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'AI entitlement 查询失败', errorMessage },
      { status: 500 },
    );
  }
}

function safeJson(text: string) {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return { error: text };
  }
}

function unwrapApiEnvelope(payload: unknown) {
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
