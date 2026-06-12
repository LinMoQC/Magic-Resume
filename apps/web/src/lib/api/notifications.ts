import { httpClient, withAuth } from './httpClient';

export interface Notification {
  id: string;
  recipientId: string;
  actorId?: string;
  type: 'COMMENT' | 'REPLY';
  resumeId: string;
  commentId?: string;
  isRead: boolean;
  createdAt: string;
  actor?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    username?: string | null;
    imageUrl: string | null;
  };
  resume: {
    id: string;
    title: string;
    shareId?: string;
  };
}

export const notificationsApi = {
  /**
   * Fetch all notifications for the current user
   */
  fetchAll: async (token: string): Promise<Notification[]> => {
    try {
      const response = await httpClient.api.get('/api/notifications', withAuth(token));
      return response.data.data;
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      throw error;
    }
  },

  /**
   * Mark a notification as read
   */
  markAsRead: async (id: string, token: string): Promise<Notification> => {
    try {
      const response = await httpClient.api.patch(
        `/api/notifications/${id}/read`, 
        {}, 
        withAuth(token)
      );
      return response.data.data;
    } catch (error) {
      console.error(`Failed to mark notification ${id} as read:`, error);
      throw error;
    }
  }
};
