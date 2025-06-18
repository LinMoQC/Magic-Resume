'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { UserButton, useUser } from '@clerk/nextjs';
import { motion, AnimatePresence } from 'framer-motion';
import useMobile from '@/app/hooks/useMobile';
import { FiMenu, FiX } from 'react-icons/fi';
import { FaRegFileAlt, FaCog } from 'react-icons/fa';
import { Skeleton } from '@/app/components/ui/Skeleton';
import { useResumeStore } from '@/store/useResumeStore';
import sidebarMenu from '@/constant/sidebarMenu';
import { Button } from '@/app/components/ui/button';
import { useTranslation } from 'react-i18next';

export default function DashboardSidebar() {
  const { t } = useTranslation();

  const menuItems = [
    { href: '/dashboard', label: t('sidebar.resumes'), icon: FaRegFileAlt },
    { href: '/dashboard/settings', label: t('sidebar.settings'), icon: FaCog },
  ];

  const { isMobile } = useMobile();
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useUser();
  const pathname = usePathname();
  const [hasMounted, setHasMounted] = useState(false);
  const { setActiveSection } = useResumeStore();

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const sidebarContent = (
    <>
      <div className="px-4 mb-8 flex justify-center">
        <Link href="/dashboard">
          <Image src="/magic-resume-logo.png" alt="Magic Resume Logo" width={150} height={0} />
        </Link>
      </div>
      <nav className="flex-1 px-4">
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
      <div className="px-6 mt-auto flex items-center gap-3">
        <UserButton afterSignOutUrl="/" />
        <div className='flex flex-col'>
          <span className='text-sm font-bold'>{user?.fullName}</span>
          <span className='text-xs text-neutral-400'>{user?.primaryEmailAddress?.emailAddress}</span>
        </div>
      </div>
    </>
  );

  if (pathname.includes('/edit')) {
    if (!hasMounted) {
      return (
        <aside className="w-20 bg-black border-r border-neutral-800 flex-col py-8 hidden md:flex items-center">
          <Skeleton className="h-10 w-10 mb-8 rounded-md" />
          <div className="flex-1 flex flex-col justify-center gap-4">
            <Skeleton className="h-10 w-10 rounded-md" />
            <Skeleton className="h-10 w-10 rounded-md" />
            <Skeleton className="h-10 w-10 rounded-md" />
            <Skeleton className="h-10 w-10 rounded-md" />
          </div>
          <div className="mt-auto">
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        </aside>
      );
    }
    return (
      <aside className="border-r border-neutral-800 bg-neutral-900 flex-col p-4 w-20 items-center hidden md:flex">
        <Link href="/dashboard" className="mb-8">
          <Image src="/simple-logo.png" alt="Magic Resume Logo" width={40} height={40} />
        </Link>
        <nav className="flex flex-col gap-2 flex-grow justify-center">
          {sidebarMenu.map((item) => {
            const Icon = item.icon;
            return (
              <Button
                key={item.key}
                variant="ghost"
                className='h-12 w-12 hover:bg-neutral-800 bg-transparent z-[1]'
                onClick={() => setActiveSection(item.key)}
                title={t(item.label)}
              >
                <span className="h-5 w-5">
                  <Icon />
                </span>
              </Button>
            );
          })}
        </nav>
        <div className="mt-auto">
          <UserButton afterSignOutUrl="/" />
        </div>
      </aside>
    );
  }

  if (!hasMounted) {
    return (
      <aside className="w-64 bg-black border-r border-neutral-800 flex-col py-8 hidden md:flex">
        <div className="px-4 mb-8">
          <Skeleton className="h-10 w-36" />
        </div>
        <nav className="flex-1 px-4 space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </nav>
        <div className="px-6 mt-auto flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-full" />
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
          className="fixed top-4 right-4 z-50 p-2 bg-neutral-800 rounded-md"
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
                className="fixed top-0 left-0 h-full w-64 bg-black border-r border-neutral-800 flex flex-col py-8 z-50"
              >
                <button
                  onClick={() => setIsOpen(false)}
                  className="absolute top-4 right-4 p-2"
                  aria-label={t('sidebar.close')}
                >
                  <FiX className="h-6 w-6 text-neutral-400" />
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
    <aside className="w-64 bg-black border-r border-neutral-800 flex flex-col py-8">
      {sidebarContent}
    </aside>
  );
}
