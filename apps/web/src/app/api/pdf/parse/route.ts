import { getServerUserId } from '@/lib/auth/server';
import { serverFetchBackend } from '@/lib/auth/serverFetchBackend';

export async function POST(request: Request) {
  try {
    // 验证用户身份 — 未登录直接拒绝
    const userId = await getServerUserId();
    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 透传前端的 FormData（包含 file + config）给 Python 后端
    const formData = await request.formData();

    const backendResponse = await serverFetchBackend('/api/pdf/parse', {
      method: 'POST',
      body: formData,
    });

    if (!backendResponse.ok) {
      const errorBody = await backendResponse.text();
      console.error(`[PDF_PARSE] Backend error: ${backendResponse.status} ${errorBody}`);
      // Surface the backend's human-readable message (the { code, message }
      // envelope) rather than dumping the raw JSON at the user.
      let message = errorBody;
      try {
        const parsed = JSON.parse(errorBody);
        message = parsed?.message ?? parsed?.error ?? errorBody;
      } catch {
        /* not JSON — use the raw text */
      }
      return new Response(
        JSON.stringify({ error: message }),
        { status: backendResponse.status, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const result = await backendResponse.json();

    // The agent-service wraps every response in a { code, data, message }
    // envelope and nests the parsed resume under `data.resume_json`. Unwrap to
    // the bare { info, sections, sectionOrder } shape the client-side validator
    // expects, tolerating an already-bare or differently-shaped response.
    const payload =
      result && typeof result === 'object' && 'data' in result
        ? (result as { data?: unknown }).data
        : result;
    const resume =
      payload && typeof payload === 'object' && 'resume_json' in payload
        ? (payload as { resume_json?: unknown }).resume_json
        : payload;

    if (!resume || typeof resume !== 'object') {
      return new Response(
        JSON.stringify({ error: 'The AI could not extract a resume from this PDF.' }),
        { status: 422, headers: { 'Content-Type': 'application/json' } },
      );
    }

    return new Response(JSON.stringify(resume), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('[PDF_PARSE_API_ERROR]', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
