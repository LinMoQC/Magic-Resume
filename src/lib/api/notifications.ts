import axios from 'axios';

const CLOUD_API_BASE_URL = `${process.env.NEXT_PUBLIC_CLOUD_API_URL || 'http://localhost:3111'}/api/notifications`;

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
      const response = await axios.get(CLOUD_API_BASE_URL, {
        headers: { Authorization: `Bearer ${token}` }
      });
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
      const response = await axios.patch(`${CLOUD_API_BASE_URL}/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data.data;
    } catch (error) {
      console.error(`Failed to mark notification ${id} as read:`, error);
      throw error;
    }
  }
};
