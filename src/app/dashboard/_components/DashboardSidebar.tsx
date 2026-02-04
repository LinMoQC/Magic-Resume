'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { UserButton, useUser } from '@clerk/nextjs';
import { motion, AnimatePresence } from 'framer-motion';
import useMobile from '@/hooks/useMobile';
import { FiMenu, FiX } from 'react-icons/fi';
import { FaRegFileAlt, FaCog, FaBell } from 'react-icons/fa';
import { Skeleton } from '@/components/ui/Skeleton';

import { useResumeStore } from '@/store/useResumeStore';
import sidebarMenu from '@/lib/constants/sidebarMenu';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';

export default function DashboardSidebar() {
  const { t } = useTranslation();

  const menuItems = [
    { href: '/dashboard', label: t('sidebar.resumes'), icon: FaRegFileAlt },
    { href: '/dashboard/notifications', label: t('sidebar.notifications'), icon: FaBell },
    { href: '/dashboard/settings', label: t('sidebar.settings'), icon: FaCog },
  ];

  const { isMobile } = useMobile();
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useUser();
  const pathname = usePathname();
  const [hasMounted, setHasMounted] = useState(false);
  const { activeResume, setActiveSection } = useResumeStore();

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const sidebarContent = (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Logo Placeholder */}
      <div className="pt-8 pb-6 flex justify-center shrink-0">
        <Link href="/dashboard" className="transition-transform active:scale-95">
          <div className="h-10 flex items-center">
            <Image 
              src="/magic-resume-logo.png" 
              alt="Magic Resume Logo" 
              width={150} 
              height={40} 
              priority
              className="object-contain h-10"
            />
          </div>
        </Link>
      </div>

      {/* Navigation Area */}
      <nav className="flex-1 px-4 overflow-y-auto hide-scrollbar">
        {menuItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`flex items-center px-4 mt-2 py-3 text-lg rounded-lg transition-colors ${pathname === href ? 'bg-neutral-700 text-white' : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'}`}
          >
            <Icon className="w-5 h-5 mr-4 z-1" />
            {label}
          </Link>
        ))}
      </nav>

      {/* Profile Placeholder */}
      <div className="px-6 pt-6 pb-4 border-t border-neutral-800 bg-black shrink-0 flex items-center gap-3">
        <div className="relative w-8 h-8 shrink-0">
          <div className="absolute inset-0 bg-neutral-800 rounded-full animate-pulse z-0" />
          <div className="relative z-10 w-8 h-8 flex items-center justify-center">
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
        <div className='flex flex-col overflow-hidden'>
          <span className='text-sm font-bold truncate'>{user?.fullName}</span>
          <span className='text-xs text-neutral-400 truncate'>{user?.primaryEmailAddress?.emailAddress}</span>
        </div>
      </div>
    </div>
  );

  if (pathname.includes('/edit')) {
    if (!hasMounted) {
      return (
        <aside className="w-20 bg-black border-r border-neutral-800 hidden md:flex flex-col items-center">
          {/* Logo Placeholder */}
          <div className="pt-12 pb-8 shrink-0">
            <Skeleton className="h-10 w-10 rounded-md" />
          </div>
          {/* Nav Placeholder */}
          <div className="flex-1 flex flex-col items-center justify-center gap-4 w-full px-4 py-4">
            <Skeleton className="h-10 w-full rounded-md shrink-0" />
            <Skeleton className="h-10 w-full rounded-md shrink-0" />
            <Skeleton className="h-10 w-full rounded-md shrink-0" />
            <Skeleton className="h-10 w-full rounded-md shrink-0" />
          </div>
          {/* Profile Placeholder */}
          <div className="pt-4 pb-4 shrink-0">
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        </aside>
      );
    }
    return (
      <aside className="border-r border-neutral-800 bg-neutral-900 w-20 h-full hidden md:flex flex-col items-center">
        {/* Logo Placeholder */}
        <div className="pt-6 pb-8 shrink-0">
          <Link href="/dashboard" className="transition-transform active:scale-95">
            <Image src="/simple-logo.png" alt="Magic Resume Logo" width={40} height={40} priority />
          </Link>
        </div>
        
        <nav className="flex-1 flex flex-col items-center justify-center gap-2 w-full overflow-y-auto hide-scrollbar py-4">
          {activeResume?.sectionOrder.map((section) => {
            const iconItem = sidebarMenu.find((item) => item.key === section.key);
            if (!iconItem) return null;
            const Icon = iconItem.icon;

            return (
              <Button
                key={section.key}
                variant="ghost"
                className='h-12 w-12 hover:bg-neutral-800 bg-transparent z-[1] shrink-0'
                onClick={() => setActiveSection(section.key)}
                title={t(section.label)}
              >
                <Icon className="w-4 h-4" />
              </Button>
            );
          })}
        </nav>

        {/* Profile Placeholder */}
        <div className="pt-4 pb-4 shrink-0">
          <div className="relative w-8 h-8">
            <div className="absolute inset-0 bg-neutral-800 rounded-full animate-pulse z-0" />
            <div className="relative z-10 w-8 h-8 flex items-center justify-center">
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
        </div>
      </aside>
    );
  }

  if (!hasMounted) {
    return (
      <aside className="w-64 bg-black border-r border-neutral-800 hidden md:flex flex-col h-full">
        {/* Logo Placeholder */}
        <div className="pt-12 pb-8 flex justify-center shrink-0">
          <Skeleton className="h-10 w-36 rounded-md" />
        </div>
        {/* Nav Placeholder */}
        <nav className="flex-1 px-4 space-y-2 overflow-hidden pt-4">
          <Skeleton className="h-10 w-full shrink-0" />
          <Skeleton className="h-10 w-full shrink-0" />
          <Skeleton className="h-10 w-full shrink-0" />
        </nav>
        {/* Profile Placeholder */}
        <div className="px-6 pt-6 pb-4 border-t border-neutral-800 bg-black shrink-0 flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-full shrink-0" />
          <div className="flex-1 space-y-1">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
      </aside>
    );
  }

  if (isMobile) {
    return (
      <>
        <button
          onClick={() => setIsOpen(true)}
          className="fixed top-4 right-4 z-5 p-2 bg-neutral-800 rounded-md"
          aria-label={t('sidebar.open')}
        >
          <FiMenu className="h-6 w-6 text-white" />
        </button>
        <AnimatePresence>
          {isOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="fixed inset-0 bg-black/50 z-40"
                onClick={() => setIsOpen(false)}
              />
              <motion.aside
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="fixed top-0 left-0 h-full w-64 bg-black border-r border-neutral-800 flex flex-col z-50"
              >
                <button
                  onClick={() => setIsOpen(false)}
                  className="absolute top-4 right-4 p-2"
                  aria-label={t('sidebar.close')}
                >
                  <FiX className="h-6 w-6 text-neutral-400 z-5" />
                </button>
                <div className="flex flex-col flex-1">
                  {sidebarContent}
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>
      </>
    );
  }

  return (
    <aside className="w-64 bg-black border-r border-neutral-800 flex flex-col">
      {sidebarContent}
    </aside>
  );
}
