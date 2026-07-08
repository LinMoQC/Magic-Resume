import { NextRequest, NextResponse } from 'next/server';
import { getServerUserId } from '@/lib/auth/server';
import { serverFetchBackend } from '@/lib/auth/serverFetchBackend';

export async function POST(req: NextRequest) {
  try {
    // 验证用户身份 — 未登录直接拒绝
    const userId = await getServerUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 透传前端的 FormData（file + config）给 agent-service。pass req.signal so a
    // closed dialog / navigation cancels upstream generation promptly.
    const formData = await req.formData();
    const backendResponse = await serverFetchBackend('/api/pdf/parse', {
      method: 'POST',
      body: formData,
      signal: req.signal,
    });

    const contentType = backendResponse.headers.get('content-type');

    // Success path: agent-service streams parse progress + the final resume as SSE.
    // Forward it line-by-line so the stream reaches the browser unbuffered (mirror
    // of app/api/chat-agent/route.ts).
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
            // Client/upstream abort (dialog closed) surfaces as AbortError — an
            // expected cancel, not a stream failure.
            if ((error as Error)?.name === 'AbortError') {
              controller.close();
            } else {
              console.error('[PDF_PARSE] Stream error:', error);
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
          // no-transform stops any intermediary (nginx/CDN) from gzipping the
          // stream (gzip batches chunks and defeats SSE).
          'Cache-Control': 'no-cache, no-transform',
          Connection: 'keep-alive',
          // Disable nginx buffering for THIS stream even if proxy_buffering is on
          // globally (host BaoTa reverse proxy defaults to on).
          'X-Accel-Buffering': 'no',
        },
      });
    }

    // Non-stream path: the backend rejected before it started streaming (bad file,
    // over-budget, no LLM config, …) — surface the human-readable message.
    const errorBody = await backendResponse.text();
    if (!backendResponse.ok) {
      console.error(`[PDF_PARSE] Backend error: ${backendResponse.status} ${errorBody}`);
      let message = errorBody;
      try {
        const parsed = JSON.parse(errorBody);
        message = parsed?.message ?? parsed?.error ?? errorBody;
      } catch {
        /* not JSON — use the raw text */
      }
      return new Response(JSON.stringify({ error: message }), {
        status: backendResponse.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Unexpected: a 2xx that isn't SSE. Forward the body as-is rather than guess.
    return new Response(errorBody || '{}', {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('[PDF_PARSE_API_ERROR]', error);
    const errorMessage =
      error instanceof Error ? error.message : 'An unexpected error occurred.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
