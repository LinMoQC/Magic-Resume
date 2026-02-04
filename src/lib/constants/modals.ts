/**
 * Maps model names to their official API base URL.
 * Last updated: February 2026
 */
export const MODEL_API_URL_MAP: Record<string, string> = {
  // OpenAI Models
  'gpt-3.5-turbo': 'https://api.openai.com/v1',
  'gpt-4': 'https://api.openai.com/v1',
  'gpt-4-turbo': 'https://api.openai.com/v1',
  'gpt-4o': 'https://api.openai.com/v1',
  'gpt-4o-mini': 'https://api.openai.com/v1',
  
  // GPT-5 series (2025-2026)
  'gpt-5': 'https://api.openai.com/v1',
  'gpt-5.1': 'https://api.openai.com/v1',
  'gpt-5.2': 'https://api.openai.com/v1',
  'gpt-5.1-chat-latest': 'https://api.openai.com/v1',
  
  // o-series reasoning models
  'o1': 'https://api.openai.com/v1',
  'o1-mini': 'https://api.openai.com/v1',
  'o1-preview': 'https://api.openai.com/v1',
  'o3': 'https://api.openai.com/v1',
  'o3-mini': 'https://api.openai.com/v1',
  'o3-pro': 'https://api.openai.com/v1',
  'o4-mini': 'https://api.openai.com/v1',
  
  // Anthropic Claude Models
  'claude-2': 'https://api.anthropic.com/v1',
  
  // Claude 3.x series
  'claude-3-opus': 'https://api.anthropic.com/v1',
  'claude-3-sonnet': 'https://api.anthropic.com/v1',
  'claude-3-haiku': 'https://api.anthropic.com/v1',
  'claude-3-5-sonnet': 'https://api.anthropic.com/v1',
  'claude-3-5-haiku': 'https://api.anthropic.com/v1',
  'claude-3-opus-20240229': 'https://api.anthropic.com/v1',
  'claude-3-sonnet-20240229': 'https://api.anthropic.com/v1',
  'claude-3-haiku-20240307': 'https://api.anthropic.com/v1',
  'claude-3-5-sonnet-20240620': 'https://api.anthropic.com/v1',
  'claude-3-5-sonnet-20241022': 'https://api.anthropic.com/v1',
  'claude-3-5-haiku-20241022': 'https://api.anthropic.com/v1',
  
  // Claude 4.5 series (2025)
  'claude-opus-4.5': 'https://api.anthropic.com/v1',
  'claude-sonnet-4.5': 'https://api.anthropic.com/v1',
  'claude-haiku-4.5': 'https://api.anthropic.com/v1',
  
  // Claude 5.0 series (2026)
  'claude-sonnet-5': 'https://api.anthropic.com/v1',
  'claude-sonnet-5-20260203': 'https://api.anthropic.com/v1',
  
  // Google Gemini Models
  'gemini-pro': 'https://generativelanguage.googleapis.com/v1beta',
  
  // Gemini 1.5 series
  'gemini-1.5-pro': 'https://generativelanguage.googleapis.com/v1beta',
  'gemini-1.5-flash': 'https://generativelanguage.googleapis.com/v1beta',
  'gemini-1.5-pro-002': 'https://generativelanguage.googleapis.com/v1beta',
  'gemini-1.5-flash-002': 'https://generativelanguage.googleapis.com/v1beta',
  
  // Gemini 2.0 series
  'gemini-2.0-flash': 'https://generativelanguage.googleapis.com/v1beta',
  'gemini-2.0-flash-001': 'https://generativelanguage.googleapis.com/v1beta',
  'gemini-2.0-flash-exp': 'https://generativelanguage.googleapis.com/v1beta',
  'gemini-2.0-pro-exp-02-05': 'https://generativelanguage.googleapis.com/v1beta',
  'gemini-2.0-flash-lite-preview-02-05': 'https://generativelanguage.googleapis.com/v1beta',
  
  // Gemini 3.0 series (2026)
  'gemini-3-flash-preview': 'https://generativelanguage.googleapis.com/v1beta',
  'gemini-3-pro-preview': 'https://generativelanguage.googleapis.com/v1beta',
  'gemini-flash-latest': 'https://generativelanguage.googleapis.com/v1beta',
  'gemini-pro-latest': 'https://generativelanguage.googleapis.com/v1beta',
  
  // DeepSeek Models
  'deepseek-chat': 'https://api.deepseek.com',
  'deepseek-reasoner': 'https://api.deepseek.com',
  'deepseek-coder': 'https://api.deepseek.com',
  
  // DeepSeek V3 series
  'deepseek-v3': 'https://api.deepseek.com',
  'deepseek-v3.1': 'https://api.deepseek.com',
  'deepseek-v3.2': 'https://api.deepseek.com',
  'deepseek-v3.2-exp': 'https://api.deepseek.com',
  
  // DeepSeek V4 series (2026)
  'deepseek-v4': 'https://api.deepseek.com',
  
  // DeepSeek specialized models
  'deepseek-r2': 'https://api.deepseek.com',
  'deepseek-r2-pro': 'https://api.deepseek.com',
  'deepseek-coder-v3': 'https://api.deepseek.com',
  'deepseek-math-v2': 'https://api.deepseek.com',
  'deepseek-vl2': 'https://api.deepseek.com',
};
