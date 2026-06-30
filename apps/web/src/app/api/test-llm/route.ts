import { getServerUserId } from '@/lib/auth/server';

// Runs server-side so the provider ping isn't blocked by browser CORS (OpenAI /
// Anthropic don't allow direct browser calls). No Python backend involved — this
// route hits the provider directly with the user's BYOK key to validate it.
export const runtime = 'nodejs';

interface TestBody {
  provider?: string;
  baseUrl?: string;
  apiKey?: string;
  model?: string;
}

interface ProbeResult {
  ok: boolean;
  status?: number;
  message?: string;
}

const TIMEOUT_MS = 12_000;
const stripTrailingSlash = (url: string) => url.replace(/\/+$/, '');

const json = (data: unknown, status: number) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

async function timedFetch(url: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/** Map a provider HTTP response into a compact pass/fail result. */
async function toResult(res: Response): Promise<ProbeResult> {
  if (res.ok) return { ok: true, status: res.status };
  let message = `HTTP ${res.status}`;
  try {
    const text = await res.text();
    const parsed = JSON.parse(text) as {
      error?: { message?: string } | string;
      message?: string;
    };
    const fromError =
      typeof parsed.error === 'string' ? parsed.error : parsed.error?.message;
    message = fromError || parsed.message || text || message;
  } catch {
    // non-JSON body — keep the HTTP status message
  }
  return { ok: false, status: res.status, message: String(message).slice(0, 200) };
}

/** Provider-aware reachability + key check. Prefers the cheap GET /models probe. */
async function probe(
  provider: string,
  baseUrl: string,
  apiKey: string,
  model: string
): Promise<ProbeResult> {
  if (provider === 'google') {
    // Gemini: API key rides in the query string; list-models validates it.
    const res = await timedFetch(`${baseUrl}/models?key=${encodeURIComponent(apiKey)}`, {
      method: 'GET',
    });
    return toResult(res);
  }

  if (provider === 'anthropic') {
    const res = await timedFetch(`${baseUrl}/models`, {
      method: 'GET',
      headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
    });
    return toResult(res);
  }

  // openai / deepseek / custom — OpenAI-compatible. Try GET /models first…
  const auth = { Authorization: `Bearer ${apiKey}` };
  const listed = await timedFetch(`${baseUrl}/models`, { method: 'GET', headers: auth });
  if (listed.status !== 404 && listed.status !== 405) return toResult(listed);

  // …some gateways / local servers (e.g. Ollama variants) don't expose /models —
  // fall back to a 1-token chat completion, which also confirms the model id.
  const chat = await timedFetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: { ...auth, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: 'ping' }],
      max_tokens: 1,
    }),
  });
  return toResult(chat);
}

export async function POST(request: Request) {
  const userId = await getServerUserId();
  if (!userId) return json({ ok: false, message: 'Unauthorized' }, 401);

  let body: TestBody;
  try {
    body = (await request.json()) as TestBody;
  } catch {
    return json({ ok: false, message: 'Invalid JSON body' }, 400);
  }

  const provider = body.provider || 'custom';
  const apiKey = body.apiKey?.trim();
  const model = body.model?.trim();
  const baseUrl = body.baseUrl ? stripTrailingSlash(body.baseUrl.trim()) : '';
  if (!apiKey || !baseUrl || !model) {
    return json({ ok: false, message: 'Missing apiKey / baseUrl / model' }, 400);
  }

  const startedAt = Date.now();
  try {
    const result = await probe(provider, baseUrl, apiKey, model);
    return json({ ...result, latencyMs: Date.now() - startedAt }, 200);
  } catch (err) {
    const message =
      err instanceof Error
        ? err.name === 'AbortError'
          ? 'timeout'
          : err.message
        : 'request failed';
    return json({ ok: false, message }, 200);
  }
}
