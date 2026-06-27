import { httpClient } from './httpClient';
import { AGENT_ROUTES } from './routes';

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

export const translateApi = {
  /** 一次性翻译文本，返回翻译结果及可选的简历 JSON */
  translateText: async (params: TranslateTextParams): Promise<TranslateTextResponse> => {
    const response = await httpClient.agent.post(AGENT_ROUTES.translate.text, params);
    return response.data;
  },
};
