import Link from 'next/link';
import React from 'react';
import {
  UserButton,
  ClerkLoading,
  ClerkLoaded,
} from "@clerk/nextjs";
import Image from 'next/image';
import { Skeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/button';

export type SidebarMenuItem = {
  key: string;
  icon: React.ReactNode;
  label: string;
};

type SidebarNavProps = {
  sidebarMenu: SidebarMenuItem[];
  handleSidebarClick: (key: string) => void;
};

export default function SidebarNav({ sidebarMenu, handleSidebarClick }: SidebarNavProps) {
  return (
    <aside className="transition-all duration-300 bg-neutral-900 border-r border-neutral-800 w-[72px] h-full flex flex-col items-center overflow-hidden">
      {/* Logo Placeholder */}
      <div className="pt-10 pb-6 shrink-0 flex justify-center w-full">
        <Link href="/dashboard" className="transition-transform active:scale-95 block">
          <div className="w-10 h-10 flex items-center justify-center">
            <Image 
              src="/simple-logo.png" 
              alt="simple-logo" 
              width={40} 
              height={40} 
              priority
              className="object-contain"
            />
          </div>
        </Link>
      </div>

      {/* Menu Area - Flex Scrollable & Centered */}
      <div className="flex-1 w-full flex flex-col items-center justify-center gap-2 overflow-y-auto hide-scrollbar py-4">
        {sidebarMenu.map(item => (
          <Button
            key={item.key}
            title={item.label}
            className="flex flex-col items-center justify-center transition text-sm text-neutral-400 hover:text-white w-12 h-12 rounded-lg hover:bg-neutral-800 shrink-0"
            onClick={() => handleSidebarClick(item.key)}
          >
            {item.icon}
          </Button>
        ))}
      </div>

      {/* Profile Placeholder */}
      <div className="pt-4 pb-6 shrink-0 flex justify-center w-full">
        <div className="relative h-8 w-8 shrink-0">
          <div className="absolute inset-0 flex items-center justify-center">
            <Skeleton className="w-8 h-8 rounded-full bg-neutral-800" />
          </div>
          <div className="relative z-10 w-8 h-8 flex items-center justify-center">
            <ClerkLoaded>
              <UserButton 
                afterSignOutUrl="/" 
                appearance={{ 
                  elements: { 
                    rootBox: 'w-8 h-8', 
                    avatarBox: 'w-8 h-8' 
                  } 
                }}
              />
            </ClerkLoaded>
          </div>
        </div>
      </div>
    </aside>
  );
} 