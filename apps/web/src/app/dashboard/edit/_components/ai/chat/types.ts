import type { LucideIcon } from 'lucide-react';

export type SkillId = 'create' | 'optimize' | 'analyze' | 'translate' | 'interview';

export type CanvasView = 'preview' | 'diff' | 'json' | 'score';

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
  /** compact one-liner shown as the user's request bubble */
  buildIntent: (params: Record<string, string>) => string;
  /** summary shown on the completed execution card */
  doneSummary: string;
}

export type ChatRole = 'user' | 'assistant' | 'exec';

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content?: string;
  /** present when role === 'exec' */
  skillId?: SkillId;
  status?: 'running' | 'done';
}

export type CanvasStatus = 'idle' | 'streaming' | 'ready' | 'applied';

export interface CanvasState {
  open: boolean;
  skillId: SkillId | null;
  view: CanvasView;
  status: CanvasStatus;
}
