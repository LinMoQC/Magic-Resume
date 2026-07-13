import { NextRequest, NextResponse } from 'next/server';
import { getServerUserId } from '@/lib/auth/server';
import { serverFetchBackend } from '@/lib/auth/serverFetchBackend';

/**
 * Human-in-the-loop tool-approval reply. Forwards the user's decision and proxies
 * the streamed continuation through unchanged, just like the main chat route.
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
      // Log the upstream body server-side only; never surface it to the client.
      const errorText = await backendResponse.text();
      console.error(`[AGENT_APPROVE] Backend error ${backendResponse.status}: ${errorText}`);
      throw new Error(`Backend request failed with status ${backendResponse.status}`);
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
          // no-transform stops intermediaries gzipping the stream; X-Accel-Buffering
          // tells nginx not to buffer this response even if proxy_buffering is on
          // globally (host BaoTa reverse proxy defaults to on).
          'Cache-Control': 'no-cache, no-transform',
          Connection: 'keep-alive',
          'X-Accel-Buffering': 'no',
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
