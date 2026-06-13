import { httpClient } from './httpClient';
import { API_ROUTES } from './routes';

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
  fetchAll: async (): Promise<Notification[]> => {
    const response = await httpClient.api.get(API_ROUTES.notifications.list);
    return response.data.data;
  },

  markAsRead: async (id: string): Promise<Notification> => {
    const response = await httpClient.api.patch(API_ROUTES.notifications.markRead(id), {});
    return response.data.data;
  },
};
