import { httpClient, withAuth } from './httpClient';

export const feedbackApi = {
  /**
   * Submit feedback
   */
  submitFeedback: async (content: string, userId?: string, token?: string | null) => {
    try {
      const config = token ? withAuth(token) : {};
      const response = await httpClient.api.post('/api/users/feedback', {
        content,
        userId
      }, config);
      return response.data;
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      throw error;
    }
  }
};
