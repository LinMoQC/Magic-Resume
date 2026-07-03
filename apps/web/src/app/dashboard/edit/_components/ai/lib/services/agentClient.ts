import { WEB_AGENT_ROUTES } from '@/lib/api/routes';
import type { AgentLlmConfig, AgentSseEvent } from './types';

/**
 * The AI Lab's single service client. Calls go through Next.js route handlers, so
 * this speaks relative `/api/...` paths and inherits server-side auth handling.
 *
 * P0 wires `analyze` (JSON). The streaming helper below is the foundation the later
 * phases (optimize / translate / create) build on; it parses the normalized
 * `AgentSseEvent` schema.
 */

async function readError(res: Response): Promise<string> {
  try {
    const data = await res.json();
    return (data?.error || data?.message || data?.detail || `请求失败（${res.status}）`) as string;
  } catch {
    return `请求失败（${res.status}）`;
  }
}

/**
 * Stream a normalized agent run. Yields typed {@link AgentSseEvent}s parsed from the
 * `data: {json}\n\n` frames. Foundation for the streaming skills (not used by P0).
 */
export async function* streamAgent(
  url: string,
  body: unknown,
  signal?: AbortSignal
): AsyncGenerator<AgentSseEvent> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  });
  if (!res.ok || !res.body) throw new Error(await readError(res));

  const reader = res.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  // Line-based: each AgentSseEvent is a single `data: {json}` line. This tolerates
  // both real `\n\n`-framed SSE (graph/translate — blank lines just skip) and the
  // chat-agent proxy that collapses `\n\n` → `\n`.
  const parse = (raw: string): AgentSseEvent | null => {
    const line = raw.trim();
    if (!line.startsWith('data:')) return null;
    const json = line.slice(5).trim();
    if (!json) return null;
    try {
      return JSON.parse(json) as AgentSseEvent;
    } catch {
      return null;
    }
  };

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const raw of lines) {
      const ev = parse(raw);
      if (ev) yield ev;
    }
  }
  const tail = parse(buffer);
  if (tail) yield tail;
}

export interface ChatStreamParams {
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[];
  mode?: 'create' | 'optimize' | 'analyze' | 'translate' | 'interview' | 'general';
  /**
   * Conversation/session id. One conversation = one sessionId; "new chat" mints
   * a new one. The server can use it to resume context across turns.
   */
  sessionId?: string;
  /**
   * id of the resume this session is scoped to. The client sends an id instead of
   * pushing a full resume snapshot into every chat turn.
   */
  resumeId?: string;
  /**
   * User-provided model config for this AI request.
   */
  config?: AgentLlmConfig;
  signal?: AbortSignal;
}

/** Conversational chat stream (create / general) via the web route handler. */
export function streamChat({ signal, ...body }: ChatStreamParams): AsyncGenerator<AgentSseEvent> {
  return streamAgent(WEB_AGENT_ROUTES.chat, body, signal);
}

/**
 * Reclaim server-side session resources when the user explicitly starts a new chat.
 * Modal close only puts the AI Lab away; the transcript + sessionId are locally
 * resumable and the server-side TTL sweeper remains the backstop.
 * Carries only the sessionId, never the user's model key.
 */
export async function endSessionThread(sessionId: string): Promise<void> {
  if (!sessionId) return;
  try {
    await fetch(WEB_AGENT_ROUTES.chatSession, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId }),
      keepalive: true,
    });
  } catch {
    // best-effort — the server-side TTL sweeper reclaims anything missed.
  }
}

/** A human's decision on a paused tool call (native HITL). */
export interface HitlDecision {
  /** approve/reject gate a sensitive tool; `edit` re-runs the tool with new args —
   *  GenUI widgets use it to inject the user's submitted form values. */
  type: 'approve' | 'reject' | 'edit';
  /** feedback to the model when rejecting. */
  message?: string;
  /** for `edit`: the tool call with the user's values merged into args. */
  editedAction?: { name: string; args: Record<string, unknown> };
}

export interface ApproveToolParams {
  /** the paused conversation session to resume */
  sessionId: string;
  /** one decision per pending action request (read_resume → a single decision) */
  decisions: HitlDecision[];
  /** re-sent so the resumed session keeps the same scope and model settings */
  resumeId?: string;
  config?: AgentLlmConfig;
  signal?: AbortSignal;
}

/**
 * Reply to a paused tool-approval request. The route streams the continuation, so
 * consume it like {@link streamChat}.
 */
export function approveTool({
  signal,
  ...body
}: ApproveToolParams): AsyncGenerator<AgentSseEvent> {
  return streamAgent(WEB_AGENT_ROUTES.chatApprove, body, signal);
}
