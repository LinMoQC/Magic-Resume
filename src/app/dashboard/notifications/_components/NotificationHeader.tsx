import React from 'react';
import { Bell } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface NotificationHeaderProps {
  unreadCount: number;
}

export const NotificationHeader = ({ unreadCount }: NotificationHeaderProps) => {
  const { t } = useTranslation();

  return (
    <div className="sticky top-0 z-40 bg-[#0a0a0a]/80 backdrop-blur-md px-12 py-6 border-b border-white/5">
      <div className="max-w-4xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-xl">
              <Bell className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">
                {t('notificationsPage.title')}
              </h1>
            </div>
          </div>
          
          {unreadCount > 0 && (
            <div className="bg-blue-500/20 text-blue-400 border border-blue-500/20 px-3 py-1 rounded-full text-xs font-medium">
              {t('notificationsPage.unread', { count: unreadCount })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
