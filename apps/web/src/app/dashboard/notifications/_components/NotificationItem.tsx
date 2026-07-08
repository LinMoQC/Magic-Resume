import React from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { zhCN, enUS } from 'date-fns/locale';
import { MessageSquare, Reply, Check, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { Notification } from '@/lib/api/notifications';

interface NotificationItemProps {
  notification: Notification;
  markAsRead: (id: string) => void;
}

export const NotificationItem = ({ notification, markAsRead }: NotificationItemProps) => {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === 'zh' ? zhCN : enUS;

  const unread = !notification.isRead;
  const isComment = notification.type === 'COMMENT';
  const href = notification.resume.shareId
    ? `/s/${notification.resume.shareId}?commentId=${notification.commentId}`
    : `/dashboard/edit/${notification.resume.id}`;
  const actorName =
    notification.actor?.firstName || notification.actor?.username || t('notificationsPage.someone');

  return (
    <div
      className={cn(
        'group relative flex gap-3.5 rounded-2xl border p-4 transition-colors duration-200',
        unread
          ? 'border-sky-400/20 bg-sky-400/[0.05] hover:border-sky-400/30'
          : 'border-white/[0.06] bg-white/[0.02] hover:border-white/10',
      )}
    >
      {/* actor avatar + type marker — self-start so the column wraps the 44px avatar
          (not stretched by the row), keeping the badge pinned to the avatar corner */}
      <div className="relative shrink-0 self-start">
        {notification.actor?.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={notification.actor.imageUrl}
            alt={actorName}
            referrerPolicy="no-referrer"
            className="h-11 w-11 rounded-full object-cover ring-1 ring-white/10"
          />
        ) : (
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-neutral-800 text-neutral-400 ring-1 ring-white/10">
            <User size={18} />
          </div>
        )}
        <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-sky-500 text-[#fff] ring-2 ring-desk">
          {isComment ? <MessageSquare size={11} /> : <Reply size={11} />}
        </span>
      </div>

      {/* body */}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm leading-relaxed text-neutral-300">
            <span className="font-semibold text-neutral-50">{actorName}</span>
            <span className="mx-1.5 text-neutral-500">
              {isComment ? t('notificationsPage.type.comment') : t('notificationsPage.type.reply')}
            </span>
            <Link
              href={href}
              className="font-medium text-sky-300 transition-colors hover:text-sky-200"
            >
              {notification.resume.title}
            </Link>
          </p>
          {unread && <span aria-hidden className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-sky-400" />}
        </div>

        <p className="mt-1 text-[11px] text-neutral-500">
          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale })}
        </p>

        {/* actions — collapsed to zero height until hover (grid-rows reveal, no layout jump) */}
        <div className="grid grid-rows-[0fr] transition-[grid-template-rows] duration-200 ease-out group-hover:grid-rows-[1fr] group-focus-within:grid-rows-[1fr]">
          <div className="overflow-hidden">
            <div className="mt-3 flex items-center gap-1.5">
              <Link
                href={href}
                className="rounded-full px-2.5 py-1 text-xs text-neutral-300 transition-colors hover:bg-white/[0.06] hover:text-white"
              >
                {t('notificationsPage.action.view')}
              </Link>
              {unread && (
                <button
                  type="button"
                  onClick={() => markAsRead(notification.id)}
                  className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs text-neutral-400 transition-colors hover:bg-white/[0.06] hover:text-sky-200"
                >
                  <Check size={12} />
                  {t('notificationsPage.action.markRead')}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
