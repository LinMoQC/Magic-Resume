import Link from 'next/link';
import React from 'react';
import {
  UserButton,
  ClerkLoading,
  ClerkLoaded,
} from "@clerk/nextjs";
import { Skeleton } from "Skeleton";
import Image from 'next/image';
import { Button } from 'button';

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
    <aside className="relative transition-all duration-300 bg-neutral-900 border-r border-neutral-800 py-6 px-3 pb-4 items-center w-[72px]">
      <div className="flex flex-col justify-around w-full h-full items-center">
        <div className="mb-4 text-xl font-bold select-none flex items-center justify-center w-full">
          <Link href={'/dashboard'}><div className="mb-4 text-2xl font-bold select-none flex items-center justify-center w-full cursor-pointer">
            <Image src="/simple-logo.png" alt="simple-logo" width={40} height={40} />
          </div></Link>
        </div>

        <div className='flex-1 flex flex-col items-center justify-center gap-2'>
          {sidebarMenu.map(item => (
            <Button
              key={item.key}
              title={item.label}
              className="flex flex-col items-center justify-center transition text-sm text-neutral-400 hover:text-white w-12 h-12 rounded-lg hover:bg-neutral-800"
              onClick={() => handleSidebarClick(item.key)}
            >
              {item.icon}
            </Button>
          ))}
        </div>

        <div className="mt-auto">
          <div className="flex flex-col items-center gap-2 mb-2">
            <ClerkLoading>
              <Skeleton className="w-8 h-8 rounded-full" />
            </ClerkLoading>
            <ClerkLoaded>
              <UserButton afterSignOutUrl="/" />
            </ClerkLoaded>
          </div>
        </div>
      </div>
    </aside>
  );
} 