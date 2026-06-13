'use client';

import React from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { motion } from 'framer-motion';
import { NotificationHeader } from './_components/NotificationHeader';
import { NotificationList } from './_components/NotificationList';

export default function NotificationsPage() {
  const { notifications, isLoading, markAsRead, unreadCount } = useNotifications();

  return (
    <div className="flex-1 overflow-y-auto relative bg-[#0a0a0a]">
      <NotificationHeader unreadCount={unreadCount} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl px-12 py-8"
      >
        <NotificationList 
          notifications={notifications} 
          isLoading={isLoading} 
          markAsRead={markAsRead} 
        />
      </motion.div>
    </div>
  );
}
