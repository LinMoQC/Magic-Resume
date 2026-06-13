import { httpClient } from './httpClient';
import { API_ROUTES } from './routes';

export const feedbackApi = {
  /** 提交用户反馈内容 */
  submitFeedback: async (content: string, userId?: string): Promise<void> => {
    const response = await httpClient.api.post(API_ROUTES.users.feedback, { content, userId });
    return response.data;
  },
};
