import { WEB_AGENT_ROUTES } from '@/lib/api/routes';
import type { Resume } from '@/types/frontend/resume';
import type { MultiPersonaResumeAnalysis } from '@/types/agent/multi-persona';
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

export interface AnalyzeParams {
  resumeData: Resume;
  config?: AgentLlmConfig;
  language?: string;
}

/** Multi-persona competitiveness analysis — JSON (not streamed). */
export async function analyzeResumeMulti({
  resumeData,
  config,
  language,
}: AnalyzeParams): Promise<MultiPersonaResumeAnalysis> {
  const res = await fetch(WEB_AGENT_ROUTES.analyzeMulti, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ resumeData, config, language }),
  });
  if (!res.ok) throw new Error(await readError(res));
  // v2 agent-service wraps non-streamed JSON in a TransformInterceptor envelope
  // ({code,data,message}); tolerate both the envelope and a raw analysis (the
  // analysis itself has no top-level `data`, so this never double-unwraps).
  const body = await res.json();
  return (body?.data ?? body) as MultiPersonaResumeAnalysis;
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
   * id of the resume this session is scoped to. The agent pulls it on demand via
   * its `read_resume` tool (ReAct) instead of the client pushing a full snapshot
   * (see Magic-Core docs/agent-read-resume-tool.md).
   */
  resumeId?: string;
  /**
   * BYOK: the full client LLM config (apiKey / baseUrl / modelName / maxTokens) is
   * forwarded so the backend can initialize the per-session agent with it. There is
   * no server-side key — every AI session is driven by the user's own config (§3.11).
   */
  config?: AgentLlmConfig;
  /**
   * Resource scopes the user already authorized this session (e.g. `['resume']`) —
   * lets the agent skip re-prompting for a tool the user already approved
   * (Magic-Core docs/agent-tool-approval-hitl.md).
   */
  grantedScopes?: string[];
  signal?: AbortSignal;
}

/** Conversational chat stream (create / general) via the Next gateway route. */
export function streamChat({ signal, ...body }: ChatStreamParams): AsyncGenerator<AgentSseEvent> {
  return streamAgent(WEB_AGENT_ROUTES.chat, body, signal);
}

export interface ApproveToolParams {
  runId: string;
  requestId: string;
  approved: boolean;
}

/**
 * Reply to a paused `tool_approval_request` (human-in-the-loop). Unblocks the
 * streaming run server-side; the original SSE stream then resumes.
 */
export async function approveTool(params: ApproveToolParams): Promise<void> {
  const res = await fetch(WEB_AGENT_ROUTES.chatApprove, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error(await readError(res));
}
