import type { LucideIcon } from 'lucide-react';
import type { WidgetInstance } from './widgets/types';

export type SkillId = 'create' | 'optimize' | 'analyze' | 'translate' | 'interview';

export type CanvasView = 'preview' | 'diff' | 'json' | 'score';

/**
 * Where a skill can act (design §8.1). `whole-resume` is the classic "optimize
 * the whole thing" mode; `element` / `selection` are the directed, in-place
 * calls the living canvas drives. A skill can support more than one.
 */
export type SkillScope = 'whole-resume' | 'element' | 'selection';

export type ParamField =
  | {
      id: string;
      label: string;
      kind: 'textarea' | 'text';
      placeholder?: string;
      defaultValue?: string;
    }
  | {
      id: string;
      label: string;
      kind: 'select';
      options: { value: string; label: string }[];
      defaultValue?: string;
    };

/**
 * A single source of truth per AI capability. The chat shell, the skill chips,
 * the slash menu and (later) the agent tool definitions all read from this.
 * Adding a capability == adding one entry to the registry.
 */
export interface AiSkill {
  id: SkillId;
  name: string;
  tagline: string;
  icon: LucideIcon;
  /** tailwind text-color class for the icon, e.g. 'text-sky-400' */
  accent: string;
  /** raw hex for inline dots / non-class usage */
  accentHex: string;
  /** inline = renders in the thread; immersive = takes over with an overlay */
  surface: 'inline' | 'immersive';
  /** create is a pure conversation, no artifact */
  isChat?: boolean;
  /** structured inputs collected before running, rendered as the composer param bar */
  params: ParamField[];
  /** run-button label shown in the param bar */
  cta?: string;
  /** which canvas views this skill produces; omitted = no canvas artifact */
  canvas?: { views: CanvasView[]; defaultView: CanvasView };
  /** scopes this skill can target; defaults to whole-resume when omitted */
  scope?: SkillScope[];
  /** compact one-liner shown as the user's request bubble */
  buildIntent: (params: Record<string, string>) => string;
  /** summary shown on the completed execution card */
  doneSummary: string;
}

export type ChatRole = 'user' | 'assistant' | 'exec' | 'log' | 'approval' | 'activity' | 'plan' | 'widget';

/** A single checklist item in a `plan` message — the live analyze todolist. */
export interface PlanTodo {
  content: string;
  status: 'pending' | 'in_progress' | 'completed';
}

/**
 * A human-in-the-loop tool-approval prompt the agent paused on. With native HITL
 * the run resumes by `sessionId` + a `Command`, so no runId is needed here — the
 * decision (approve/reject) is all the backend wants.
 */
export interface ApprovalRequest {
  /** Interrupt id (display/key only; resume is keyed by sessionId server-side). */
  requestId: string;
  /** Tool the agent paused before, e.g. 'read_resume'. */
  toolName?: string;
  /** resource class being requested, e.g. 'resume' (drives the read narration). */
  scope: string;
  status: 'pending' | 'approved' | 'denied';
  /**
   * For a read_resume approval: how far the read has progressed once approved.
   * Lets the card show 已允许读取 → 正在读取简历… → 已读取简历 in one place instead of
   * spawning a separate activity line.
   */
  readState?: 'reading' | 'read';
}

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content?: string;
  /** present when role === 'exec' */
  skillId?: SkillId;
  status?: 'running' | 'done';
  /** present when role === 'log' — anchors the entry back to a canvas change */
  resumePath?: string;
  /** live-streamed assistant text — render raw (no typewriter re-animation) */
  streamed?: boolean;
  /** present when role === 'approval' — the pending tool-approval prompt */
  approval?: ApprovalRequest;
  /** present when role === 'plan' — the live review checklist (analyze / subagent todolist) */
  todos?: PlanTodo[];
  /** present when role === 'plan' and the todolist belongs to a subagent (the `task` tool) */
  subagentName?: string;
  /** present when role === 'widget' — a GenUI interactive card (form / decision) */
  widget?: WidgetInstance;
  /** present when a user message quotes a canvas snippet (「询问 Polaris」bridge) */
  quote?: { label: string; text: string };
}

export type CanvasStatus = 'idle' | 'streaming' | 'ready' | 'applied';

export interface CanvasState {
  open: boolean;
  skillId: SkillId | null;
  view: CanvasView;
  status: CanvasStatus;
}
