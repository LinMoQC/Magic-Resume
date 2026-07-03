import React from 'react';
import { motion, type Variants } from 'framer-motion';
import { Bell } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { NotificationItem } from './NotificationItem';
import { Notification } from '@/lib/api/notifications';

interface NotificationListProps {
  notifications: Notification[] | undefined;
  isLoading: boolean;
  markAsRead: (id: string) => void;
}

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04, delayChildren: 0.02 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.26, ease: [0.22, 1, 0.36, 1] } },
};

function NotificationSkeleton() {
  return (
    <div className="flex gap-3.5 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
      <div className="h-11 w-11 shrink-0 animate-pulse rounded-full bg-white/[0.05]" />
      <div className="flex-1 space-y-2 pt-1">
        <div className="h-3.5 w-3/4 animate-pulse rounded bg-white/[0.06]" />
        <div className="h-3 w-1/4 animate-pulse rounded bg-white/[0.04]" />
      </div>
    </div>
  );
}

function EmptyState() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/[0.08] bg-white/[0.01] px-6 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-400/10 text-sky-300">
        <Bell size={22} />
      </div>
      <h3 className="mt-4 text-base font-semibold text-neutral-200">{t('notificationsPage.empty.title')}</h3>
      <p className="mt-1 max-w-sm text-[13px] leading-relaxed text-neutral-500">
        {t('notificationsPage.empty.description')}
      </p>
    </div>
  );
}

export const NotificationList = ({ notifications, isLoading, markAsRead }: NotificationListProps) => {
  if (isLoading) {
    return (
      <div className="space-y-2.5">
        {Array.from({ length: 4 }).map((_, i) => (
          <NotificationSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!notifications || notifications.length === 0) {
    return <EmptyState />;
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-2.5">
      {notifications.map((notification) => (
        <motion.div key={notification.id} variants={item}>
          <NotificationItem notification={notification} markAsRead={markAsRead} />
        </motion.div>
      ))}
    </motion.div>
  );
};
