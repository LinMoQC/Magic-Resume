import { NextRequest, NextResponse } from 'next/server';
import { getServerUserId } from '@/lib/auth/server';
import { serverFetchBackend } from '@/lib/auth/serverFetchBackend';

/**
 * Snippet/element-scoped edit — the living canvas' fast, in-place quick actions
 * (优化这段 / 缩短 / 量化 / 换动词 / 新增…). Unlike the whole-resume streaming skills
 * (`/api/chat-agent`), this is a single stateless LLM call: text + action in,
 * `{ after, rationale }` out. The request carries the caller's auth context and
 * model config through the shared API helper; `req.signal` propagates client
 * cancellation so upstream work can stop promptly.
 */
export async function POST(req: NextRequest) {
  try {
    const userId = await getServerUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    // Forward through the shared API helper; the UI never calls this upstream
    // route directly.
    const backendResponse = await serverFetchBackend('/api/agent/edit', {
      method: 'POST',
      body: JSON.stringify(body),
      signal: req.signal,
    });

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      throw new Error(`Backend responded with status: ${backendResponse.status}, body: ${errorText}`);
    }

    // Non-streaming: a single JSON `{ after, rationale, rationaleDetail? }`.
    const data = await backendResponse.json();
    return NextResponse.json(data);
  } catch (error: unknown) {
    // A client/upstream abort (closed canvas) surfaces as AbortError — expected cancel.
    if ((error as Error)?.name === 'AbortError') {
      return NextResponse.json({ error: 'aborted' }, { status: 499 });
    }
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'API转发失败', errorMessage },
      { status: 500 }
    );
  }
}
