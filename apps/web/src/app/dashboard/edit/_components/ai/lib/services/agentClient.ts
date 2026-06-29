import { WEB_AGENT_ROUTES } from '@/lib/api/routes';
import type { AgentLlmConfig, AgentSseEvent } from './types';

/**
 * The AI Lab's single backend client. Calls go through the Next.js route handlers
 * (the gateway that proxies to the Magic-Core agent-service — design §3.8), so this
 * speaks relative `/api/...` paths and inherits the server-side auth check.
 *
 * P0 wires `analyze` (JSON). The streaming helper below is the foundation the later
 * phases (optimize / translate / create) build on; it parses the normalized
 * `AgentSseEvent` schema (design §3.2).
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
   * Conversation/session id (= LangGraph thread, namespaced by user server-side).
   * One conversation = one sessionId; "new chat" mints a new one. Persists history
   * across turns via the checkpointer and reattaches HITL approvals to the thread
   * (Magic-Core docs/agent-architecture-deepagents.md §2).
   */
  sessionId?: string;
  /**
   * id of the resume this session is scoped to. The agent pulls it on demand via
   * its `read_resume` tool (ReAct) instead of the client pushing a full snapshot.
   */
  resumeId?: string;
  /**
   * BYOK: the full client LLM config (apiKey / baseUrl / modelName / maxTokens) is
   * forwarded so the backend can initialize the per-session agent with it. There is
   * no server-side key — every AI session is driven by the user's own config (§3.11).
   */
  config?: AgentLlmConfig;
  signal?: AbortSignal;
}

/** Conversational chat stream (create / general) via the Next gateway route. */
export function streamChat({ signal, ...body }: ChatStreamParams): AsyncGenerator<AgentSseEvent> {
  return streamAgent(WEB_AGENT_ROUTES.chat, body, signal);
}

/**
 * Reclaim the backend session thread when the conversation ends (modal close /
 * new chat) — the ephemeral-data lifecycle (Magic-Core adr-0010 D4). Best-effort
 * and `keepalive` so it survives an unmount/tab close; failures are swallowed (the
 * TTL sweeper is the backstop). Carries only the sessionId, never the BYOK key.
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
  /** the paused conversation thread to resume */
  sessionId: string;
  /** one decision per pending action request (read_resume → a single decision) */
  decisions: HitlDecision[];
  /** re-sent so the resumed agent re-binds read_resume and uses the same model */
  resumeId?: string;
  config?: AgentLlmConfig;
  signal?: AbortSignal;
}

/**
 * Reply to a paused `tool_approval_request` (native HITL). The approve endpoint
 * now resumes the thread (`Command({ resume })`) and **streams the continuation**,
 * so this returns the resumed SSE stream — consume it like {@link streamChat}.
 */
export function approveTool({
  signal,
  ...body
}: ApproveToolParams): AsyncGenerator<AgentSseEvent> {
  return streamAgent(WEB_AGENT_ROUTES.chatApprove, body, signal);
}
