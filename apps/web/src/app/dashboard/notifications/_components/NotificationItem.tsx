import React from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { zhCN, enUS } from 'date-fns/locale';
import { Mail, MessageSquare, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { Notification } from '@/lib/api/notifications';

interface NotificationItemProps {
  notification: Notification;
  markAsRead: (id: string) => void;
}

export const NotificationItem = ({ notification, markAsRead }: NotificationItemProps) => {
  const { t, i18n } = useTranslation();

  const getDateLocale = () => {
    return i18n.language === 'zh' ? zhCN : enUS;
  };

  const getNotificationLink = (notification: Notification) => {
    if (notification.resume.shareId) {
      return `/s/${notification.resume.shareId}?commentId=${notification.commentId}`;
    }
    return `/dashboard/edit/${notification.resume.id}`;
  };

  return (
      <div 
        className={`group relative flex gap-5 p-5 rounded-2xl border transition-all duration-200 ${
          notification.isRead 
            ? 'bg-neutral-900/30 border-neutral-800/50' 
            : 'bg-blue-500/5 border-blue-500/20'
        }`}
      >
        <div className="shrink-0 mt-1 relative">
          {notification.actor?.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img 
              src={notification.actor.imageUrl} 
              alt="Actor" 
              className="w-12 h-12 rounded-full object-cover border-2 border-[#0a0a0a]"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-linear-to-br from-neutral-800 to-neutral-700 flex items-center justify-center border-2 border-[#0a0a0a]">
              <MessageSquare className="w-5 h-5 text-neutral-400" />
            </div>
          )}
          <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center border-2 border-[#0a0a0a] ${
            notification.type === 'COMMENT' ? 'bg-blue-500' : 'bg-purple-500'
          }`}>
            {notification.type === 'COMMENT' ? (
              <MessageSquare className="w-3 h-3 text-white" />
            ) : (
              <Mail className="w-3 h-3 text-white" />
            )}
          </div>
        </div>

        <div className="flex-1 min-w-0 pt-0.5">
          <div className="flex justify-between items-start gap-4">
            <div className="space-y-1">
              <p className="text-[15px] leading-relaxed text-neutral-300">
                <span className="font-semibold text-white">
                  {notification.actor?.firstName || notification.actor?.username || t('notificationsPage.someone')}
                </span>
                <span className="text-neutral-500 mx-1.5">
                  {notification.type === 'COMMENT' ? t('notificationsPage.type.comment') : t('notificationsPage.type.reply')}
                </span>
                <Link href={getNotificationLink(notification)} className="font-medium text-blue-400 hover:text-blue-300 transition-colors">
                  {notification.resume.title}
                </Link>
              </p>
              <p className="text-xs text-neutral-500 font-medium">
                {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: getDateLocale() })}
              </p>
            </div>
            
            <div className="flex items-center gap-2">
               {!notification.isRead && (
                <div className="w-2 h-2 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
               )}
            </div>
          </div>
          
          <div className="mt-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200 transform translate-y-1 group-hover:translate-y-0">
            <Link href={getNotificationLink(notification)}>
              <Button variant="outline" size="sm" className="h-8 text-xs bg-transparent hover:bg-neutral-800 border-neutral-700 text-neutral-300">
                {t('notificationsPage.action.view')}
              </Button>
            </Link>
            {!notification.isRead && (
              <Button
                variant="ghost" 
                size="sm"
                onClick={() => markAsRead(notification.id)}
                className="h-8 text-xs text-neutral-400 hover:text-white hover:bg-white/5"
              >
                <Check className="w-3 h-3 mr-1.5" />
                {t('notificationsPage.action.markRead')}
              </Button>
            )}
          </div>
        </div>
      </div>
  );
};
