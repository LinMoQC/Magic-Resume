import { WEB_AGENT_ROUTES } from '@/lib/api/routes';
import i18n from '@/i18n';
import type { ActionKind } from '../changeModel';
import type { AgentLlmConfig } from './types';

/**
 * The living canvas' snippet/element edit service behind fast, in-place quick
 * actions (优化这段 / 缩短 / 量化 / 换动词 / 新增…). Goes through the web route handler
 * so UI code stays transport-agnostic. Single JSON round-trip: text + action in,
 * `{ after, rationale }` out — so it drops straight into the `PendingChange` model
 * (see `buildElementChange` / `buildSelectionChange` / `buildInsertChange`).
 *
 * The whole-resume streaming skills (optimize / translate) stay on `streamChat`
 * (`./agentClient`); this is deliberately the lightweight, stateless path.
 */

export interface EditParams {
  /** The quick action, `'free'` for a custom instruction, or `'insert'` for a new item. */
  action: ActionKind | 'insert';
  /** Canonical field path (e.g. `sections.experience[<id>].description`) — context/logging. */
  resumePath?: string;
  /** The field's current HTML / plain text. */
  before: string;
  /** Selection-scoped edits: the exact substring to rewrite. Omitted for element/insert. */
  selectionText?: string;
  /** Free-text instruction (translate target language rides here, e.g. "翻译成日语"). */
  instruction?: string;
  /** Explicit target language for translate. */
  lang?: string;
  /** User-provided model config for this edit. */
  config: AgentLlmConfig;
  signal?: AbortSignal;
}

export interface EditResult {
  after: string;
  rationale: string;
  rationaleDetail?: string;
}

async function readError(res: Response): Promise<string> {
  try {
    const data = await res.json();
    return (data?.errorMessage || data?.error || data?.message || data?.detail || `请求失败（${res.status}）`) as string;
  } catch {
    return `请求失败（${res.status}）`;
  }
}

/** One-shot snippet/element edit. Throws on transport / empty-result errors. */
export async function requestEdit({ signal, ...body }: EditParams): Promise<EditResult> {
  // The backend prompts are English; the user-visible `rationale` follows this
  // UI locale (the stateless edit path has no user message to mirror).
  const isEn = i18n.language?.toLowerCase().startsWith('en') ?? false;
  const res = await fetch(WEB_AGENT_ROUTES.chatEdit, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...body, locale: isEn ? 'en' : 'zh' }),
    signal,
  });
  if (!res.ok) throw new Error(await readError(res));

  // Unwrap the useful payload, tolerating a bare `{ after, rationale }` body too.
  const raw = (await res.json()) as
    | (Partial<EditResult> & { data?: Partial<EditResult> })
    | null;
  const payload: Partial<EditResult> | null =
    raw && typeof raw === 'object' && raw.data && typeof raw.data === 'object' ? raw.data : raw;
  if (!payload || typeof payload.after !== 'string' || !payload.after.trim()) {
    throw new Error(isEn ? 'The AI returned nothing — tap to retry' : 'AI 没有返回内容，点一下重试');
  }
  return {
    after: payload.after,
    rationale: payload.rationale?.trim() || (isEn ? 'Rewritten as instructed' : '已按指令改写'),
    rationaleDetail: payload.rationaleDetail,
  };
}
