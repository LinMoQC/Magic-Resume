import { useCallback } from 'react';
import useSWR from 'swr';
import { useAuth } from '@clerk/nextjs';
import { notificationsApi, Notification } from '@/lib/api/notifications';
import { toast } from 'sonner';
import i18next from 'i18next';

export function useNotifications() {
  const { isLoaded, isSignedIn } = useAuth();

  const { data: notifications, error, isLoading, mutate } = useSWR<Notification[]>(
    isLoaded && isSignedIn ? 'notifications' : null,
    () => notificationsApi.fetchAll(),
    { refreshInterval: 0, revalidateOnFocus: true }
  );

  const markAsRead = useCallback(async (id: string) => {
    try {
      await mutate(
        (currentData) => currentData?.map((n) => n.id === id ? { ...n, isRead: true } : n),
        false
      );
      await notificationsApi.markAsRead(id);
      mutate();
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      toast.error(i18next.t('notificationsPage.notificationUpdateFailed'));
      mutate();
    }
  }, [mutate]);

  const unreadCount = Array.isArray(notifications) ? notifications.filter(n => !n.isRead).length : 0;

  return { notifications, isLoading, isError: error, unreadCount, markAsRead, refresh: mutate };
}
