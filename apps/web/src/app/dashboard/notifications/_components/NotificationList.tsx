import React from 'react';
import { Bell } from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';
import { useTranslation } from 'react-i18next';
import { NotificationItem } from './NotificationItem';
import { Notification } from '@/lib/api/notifications';

interface NotificationListProps {
  notifications: Notification[] | undefined;
  isLoading: boolean;
  markAsRead: (id: string) => void;
}

export const NotificationList = ({ notifications, isLoading, markAsRead }: NotificationListProps) => {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="space-y-4 pb-20">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex gap-4 p-4 border border-neutral-800 rounded-xl bg-neutral-900/50">
            <Skeleton className="w-10 h-10 rounded-full bg-neutral-800" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4 bg-neutral-800" />
              <Skeleton className="h-3 w-1/4 bg-neutral-800" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (notifications?.length === 0) {
    return (
      <div className="text-center py-20 bg-neutral-900/30 rounded-2xl border border-dashed border-neutral-800">
        <div className="w-16 h-16 bg-neutral-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
          <Bell className="w-8 h-8 text-neutral-600" />
        </div>
        <h3 className="text-lg font-medium text-neutral-300">{t('notificationsPage.empty.title')}</h3>
        <p className="text-neutral-500 mt-1 max-w-xs mx-auto">
          {t('notificationsPage.empty.description')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-20">
      {notifications?.map((notification) => (
        <NotificationItem 
          key={notification.id} 
          notification={notification} 
          markAsRead={markAsRead} 
        />
      ))}
    </div>
  );
};
