import { NextRequest, NextResponse } from 'next/server';
import { getServerUserId } from '@/lib/auth/server';
import { serverFetchBackend } from '@/lib/auth/serverFetchBackend';

/**
 * Human-in-the-loop tool approval reply. Forwards the user's decision on a paused
 * `read_resume` (or other sensitive tool) to the agent-service, which unblocks the
 * streaming run (see Magic-Core docs/agent-tool-approval-hitl.md). JSON, not streamed.
 */
export async function POST(req: NextRequest) {
  try {
    const userId = await getServerUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const backendResponse = await serverFetchBackend('/api/chat/approve', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    const data = await backendResponse.json().catch(() => ({}));
    return NextResponse.json(data, { status: backendResponse.status });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: '授权转发失败', errorMessage }, { status: 500 });
  }
}
