import { httpClient } from './httpClient';
import { API_ROUTES } from './routes';

export const feedbackApi = {
  submitFeedback: async (content: string, userId?: string) => {
    const response = await httpClient.api.post(API_ROUTES.users.feedback, { content, userId });
    return response.data;
  },
};
