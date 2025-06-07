'use client';

import Link from 'next/link';
import Image from 'next/image';
import { redirect, usePathname } from 'next/navigation';
import { FileText, Settings, LogOut } from 'lucide-react';
import { ClerkLoading, ClerkLoaded, SignOutButton, UserButton, useUser, useAuth } from '@clerk/nextjs';
import { Skeleton } from '@/components/ui/Skeleton';
import sidebarMenu from '@/constant/sidebarMenu';
import { useResumeStore } from "@/store/useResumeStore";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: '/dashboard', label: 'Resumes', icon: FileText },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

export default function DashboardSidebar() {
  const pathname = usePathname();
  const { setActiveSection } = useResumeStore();
  const { isLoaded, userId } = useAuth();

  if (!userId) {
    return redirect('/sign-in');
  }

  if (!isLoaded) {
    if (pathname.includes('/edit')) {
      return <div className="w-20 bg-black border-r border-neutral-800 flex flex-col items-center py-6 gap-6 flex-shrink-0">
        <Skeleton className="h-8 w-8 rounded-full" />
        <div className="flex flex-col gap-4">
          {[...Array(7)].map((_, i) => (
            <Skeleton key={i} className="h-8 w-8" />
          ))}
        </div>
        <div className="mt-auto">
          <Skeleton className="h-10 w-10 rounded-full" />
        </div>
      </div>;
    }

    return <div className="w-64 border-r border-neutral-800 p-6 flex flex-col justify-between">
      <div>
        <Skeleton className="h-8 w-32 mb-10" />
        <div className="space-y-4">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
        </div>
      </div>
      <div>
        <Skeleton className="h-10 w-full" />
      </div>
    </div>;
  }

  const menuItems = [...sidebarMenu];

  if (pathname.includes('/edit')) {
    return <aside className="border-r border-neutral-800 bg-neutral-900 flex flex-col p-4">
      <Link href="/dashboard">
        <Image src="/simple-logo.png" alt="simple-logo" width={40} height={40} />
      </Link>
      <nav className="flex flex-col gap-2 flex-grow justify-center">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <Button
              key={item.key}
              variant="ghost"
              className='hover:bg-neutral-800 bg-transparent'
              onClick={() => setActiveSection(item.key)}
            >
              <Icon />
            </Button>
          )
        })}
      </nav>
      <div className="mt-auto">
        <div className="flex items-center gap-3 p-2">
          <ClerkLoading>
            <Skeleton className="w-8 h-8 rounded-full" />
          </ClerkLoading>
          <ClerkLoaded>
            <UserButton />
          </ClerkLoaded>
        </div>
      </div>
    </aside>
  }

  return (
    <aside className="w-[240px] bg-neutral-900 border-r border-neutral-800 flex flex-col p-4">
      <div className="mb-8">
        <Link href="/dashboard">
          <Image src="/logo.png" alt="simple-logo" style={{ width: '100%' }} width={100} height={100} />
        </Link>
      </div>
      <nav className="flex flex-col gap-2 flex-grow">
        {navItems.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${pathname === item.href
                ? 'bg-neutral-800 text-white'
                : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
              }`}
          >
            <item.icon className="w-5 h-5" />
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
      <div className="mt-auto">
        <div className="flex items-center gap-3 p-2">
          <ClerkLoading>
            <Skeleton className="w-8 h-8 rounded-full" />
          </ClerkLoading>
          <ClerkLoaded>
            <UserButton />
          </ClerkLoaded>
          <div className="text-sm">
            {/* 可以加入用户名等信息 */}
          </div>
          <SignOutButton>
            <button className="ml-auto p-2 text-neutral-400 hover:text-white">
              <LogOut className="w-5 h-5" />
            </button>
          </SignOutButton>
        </div>
      </div>
    </aside>
  );
}
