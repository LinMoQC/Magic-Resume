import { NextRequest, NextResponse } from 'next/server';
import { getServerUserId } from '@/lib/auth/server';
import { serverFetchBackend } from '@/lib/auth/serverFetchBackend';

/**
 * Reclaim server-side chat session resources on conversation end / explicit new
 * chat. Best-effort: fired by the client (often with `keepalive`) when it drops a
 * sessionId. This only carries the sessionId, never the user's model key.
 */
export async function DELETE(req: NextRequest) {
  try {
    const userId = await getServerUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.text();
    const backendResponse = await serverFetchBackend('/api/chat/session', {
      method: 'DELETE',
      body: body || undefined,
      signal: req.signal,
    });

    const data = await backendResponse.json().catch(() => ({}));
    return NextResponse.json(data, { status: backendResponse.status });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'session 回收失败', errorMessage },
      { status: 500 }
    );
  }
}
