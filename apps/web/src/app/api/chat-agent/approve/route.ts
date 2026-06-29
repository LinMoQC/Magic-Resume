import { NextRequest, NextResponse } from 'next/server';
import { getServerUserId } from '@/lib/auth/server';
import { serverFetchBackend } from '@/lib/auth/serverFetchBackend';

/**
 * Human-in-the-loop tool-approval reply (native HITL). Forwards the user's
 * decision to the agent-service, which resumes the paused thread
 * (`Command({ resume })`) and **streams the continuation** as SSE. So unlike the
 * old JSON reply, this proxies the streamed body through unchanged — exactly like
 * the /api/chat-agent route (Magic-Core docs/agent-architecture-deepagents.md §6).
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
      signal: req.signal,
    });

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      throw new Error(
        `Backend responded with status: ${backendResponse.status}, body: ${errorText}`
      );
    }

    const contentType = backendResponse.headers.get('content-type');
    if (contentType && contentType.includes('text/event-stream')) {
      if (!backendResponse.body) {
        throw new Error('No response body');
      }

      let reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
      const readable = new ReadableStream({
        async start(controller) {
          reader = backendResponse.body!.getReader();
          const decoder = new TextDecoder();
          let buffer = '';
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split('\n');
              buffer = lines.pop() || '';
              for (const line of lines) {
                if (line.trim()) {
                  controller.enqueue(new TextEncoder().encode(line + '\n'));
                }
              }
            }
            if (buffer.trim()) {
              controller.enqueue(new TextEncoder().encode(buffer));
            }
            controller.close();
          } catch (error) {
            // Client/upstream abort → expected cancel, not a failure.
            if ((error as Error)?.name === 'AbortError') {
              controller.close();
            } else {
              console.error('Approve stream error:', error);
              controller.error(error);
            }
          }
        },
        cancel(reason) {
          reader?.cancel(reason).catch(() => {});
        },
      });

      return new Response(readable, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      });
    }

    // Backend may still answer with JSON (e.g. a 4xx already handled above, or a
    // non-stream edge case) — pass it through.
    const data = await backendResponse.json().catch(() => ({}));
    return NextResponse.json(data, { status: backendResponse.status });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: '授权转发失败', errorMessage },
      { status: 500 }
    );
  }
}
