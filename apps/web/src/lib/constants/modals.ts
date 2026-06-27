/**
 * LLM model catalog, grouped by provider. Drives the (grouped) model picker and
 * the model → official base-URL lookup.
 *
 * Model ids verified against each provider's official docs (2026-06):
 *   OpenAI     https://developers.openai.com/api/docs/models
 *   Anthropic  https://platform.claude.com/docs/en/docs/about-claude/models/overview
 *   Google     https://ai.google.dev/gemini-api/docs/models
 *   DeepSeek   https://api-docs.deepseek.com/quick_start/pricing
 * Newest first per provider. Legacy/superseded ids dropped.
 */
export interface ModelProvider {
  /** stable provider key */
  id: string;
  /** display name shown as the group header */
  label: string;
  /** official API base URL for this provider */
  baseUrl: string;
  /** model ids (exact API `model` strings), newest first */
  models: string[];
}

export const MODEL_PROVIDERS: ModelProvider[] = [
  {
    id: 'openai',
    label: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    models: ['gpt-5.5', 'gpt-5.4', 'gpt-5.4-mini', 'gpt-5.4-nano'],
  },
  {
    id: 'anthropic',
    label: 'Anthropic Claude',
    baseUrl: 'https://api.anthropic.com/v1',
    // API ids use dashes (claude-opus-4-8), not dots.
    models: ['claude-fable-5', 'claude-opus-4-8', 'claude-sonnet-4-6', 'claude-haiku-4-5'],
  },
  {
    id: 'google',
    label: 'Google Gemini',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    models: ['gemini-3.5-flash', 'gemini-3.1-pro-preview', 'gemini-2.5-pro', 'gemini-2.5-flash'],
  },
  {
    id: 'deepseek',
    label: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com',
    // deepseek-chat / deepseek-reasoner are deprecated 2026-07-24 (→ deepseek-v4-flash).
    models: ['deepseek-v4-pro', 'deepseek-v4-flash'],
  },
];

/**
 * model id → official API base URL. Derived from {@link MODEL_PROVIDERS} so the
 * two never drift. Used by the settings page to auto-fill the base URL on select.
 */
export const MODEL_API_URL_MAP: Record<string, string> = Object.fromEntries(
  MODEL_PROVIDERS.flatMap((provider) => provider.models.map((model) => [model, provider.baseUrl])),
);
