import useSWR from 'swr';
import { useAuth } from '@clerk/nextjs';
import { notificationsApi, Notification } from '@/lib/api/notifications';
import { toast } from 'sonner';
import i18next from 'i18next';

export function useNotifications() {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  
  const { data: notifications, error, isLoading, mutate } = useSWR<Notification[]>(
    isLoaded && isSignedIn ? 'notifications' : null,
    async () => {
      const token = await getToken();
      if (!token) return [];
      return notificationsApi.fetchAll(token);
    },
    {
      refreshInterval: 0, // Disable auto polling for now, relying on manual refresh
      revalidateOnFocus: true,
    }
  );

  const markAsRead = async (id: string) => {
    try {
      const token = await getToken();
      if (!token) return;

      // Optimistic update
      await mutate(
        (currentData) =>
          currentData?.map((n) =>
            n.id === id ? { ...n, isRead: true } : n
          ),
        false
      );

      await notificationsApi.markAsRead(id, token);
      
      // Revalidate to ensure consistency
      mutate();
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      toast.error(i18next.t('notificationsPage.notificationUpdateFailed'));
      // Rollback on error
      mutate();
    }
  };

  const unreadCount = Array.isArray(notifications) ? notifications.filter(n => !n.isRead).length : 0;

  return {
    notifications,
    isLoading,
    isError: error,
    unreadCount,
    markAsRead,
    refresh: mutate
  };
}
