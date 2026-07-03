/**
 * Frontend mirror of the normalized AI streaming events consumed by the UI.
 * JSON skills (analyze) don't use it, but streaming skills do.
 */
export type AgentEventType =
  | 'run_started'
  | 'agent_plan'
  | 'plan_update'
  | 'skill_loaded'
  | 'subagent_started'
  | 'subagent_completed'
  | 'step_started'
  | 'llm_started'
  | 'llm_usage'
  | 'tool_started'
  | 'tool_result'
  | 'tool_completed'
  | 'tool_approval_request'
  | 'message_chunk'
  | 'resume_patch'
  | 'resume_update'
  | 'resume_analysis'
  | 'translation_result'
  | 'pdf_result'
  | 'interview_question'
  | 'critique'
  | 'suggestion'
  | 'step_completed'
  | 'run_completed'
  | 'run_failed'
  | 'done'
  | 'error';

export interface AgentSseEvent {
  type: AgentEventType;
  runId?: string;
  stepId?: string;
  sequence?: number;
  /** text delta for `message_chunk` */
  content?: string;
  payload?: Record<string, unknown>;
  /** structured artifact (e.g. resume, analysis) */
  data?: unknown;
  error?: string;
}

/** User-provided model config carried in request bodies. */
export interface AgentLlmConfig {
  apiKey?: string;
  baseUrl?: string;
  modelName?: string;
  maxTokens?: number;
}
