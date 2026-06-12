import { httpClient } from './httpClient';

export interface TranslateTextParams {
  text: string;
  config: {
    apiKey: string;
    baseUrl?: string;
    modelName?: string;
    maxTokens?: number;
  };
  target_language?: string;
  custom_prompt?: string;
  generate_resume_json?: boolean;
}

export interface TranslateTextResponse {
  translated_text: string;
  resume_json?: Record<string, unknown>;
}

export type TranslateStreamEvent =
  | { type: 'translation_chunk'; content: string }
  | { type: 'translation_done'; translated_text: string }
  | { type: 'json_start' }
  | { type: 'json_done'; resume_json: Record<string, unknown> }
  | { type: 'done' }
  | { type: 'error'; message: string };

const parseHttpError = async (response: Response): Promise<string> => {
  try {
    const data = await response.json();
    if (data?.detail) return String(data.detail);
  } catch {
    // ignore JSON parse errors and fallback to status text
  }
  return response.statusText || 'Request failed';
};

export const translateApi = {
  translateText: async (params: TranslateTextParams): Promise<TranslateTextResponse> => {
    const response = await httpClient.agent.post('/api/translate/text', params);
    return response.data;
  },

  translateTextStream: async (
    params: TranslateTextParams,
    onEvent: (event: TranslateStreamEvent) => void
  ): Promise<void> => {
    const baseURL = httpClient.agent.defaults.baseURL || 'http://localhost:8000';
    const endpoint = `${baseURL.replace(/\/$/, '')}/api/translate/stream`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 300000);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(await parseHttpError(response));
      }

      if (!response.body) {
        throw new Error('Empty stream response');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const segments = buffer.split('\n\n');
        buffer = segments.pop() || '';

        for (const segment of segments) {
          const line = segment.trim();
          if (!line.startsWith('data:')) continue;
          const jsonText = line.slice(5).trim();
          if (!jsonText) continue;

          try {
            const event = JSON.parse(jsonText) as TranslateStreamEvent;
            onEvent(event);
          } catch {
            // ignore malformed event chunks
          }
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Stream timeout exceeded (300s)');
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  },
};
