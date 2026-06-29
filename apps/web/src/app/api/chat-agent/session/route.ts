import { NextRequest, NextResponse } from 'next/server';
import { getServerUserId } from '@/lib/auth/server';
import { serverFetchBackend } from '@/lib/auth/serverFetchBackend';

/**
 * Reclaim a chat session's backend thread on conversation end / modal close
 * (ephemeral-data lifecycle, Magic-Core adr-0010 D4 / BP1). Best-effort: fired by
 * the client (often with `keepalive`) when it drops a sessionId, so the backend
 * `deleteThread`s the checkpoint state instead of leaking it. The agent-service
 * derives the thread from the caller's identity + sessionId, so this only carries
 * the sessionId — never the BYOK key.
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
