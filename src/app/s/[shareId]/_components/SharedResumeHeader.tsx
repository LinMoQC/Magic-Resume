'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const Logo = () => (
  <div className="flex items-center gap-2">
    <div className="w-8 h-8 flex items-center justify-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/simple-logo.png" alt="Magic Resume" className="w-full h-full object-contain" />
    </div>
    <span className="font-bold text-lg bg-clip-text text-transparent bg-linear-to-r from-white to-white/70">
      Magic Resume
    </span>
  </div>
);

export const SharedResumeHeader = () => {
    const { t } = useTranslation();
    return (
        <header className="relative z-50 w-full border-b border-white/10 bg-black/20 backdrop-blur-md">
            <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                <Link href="/" className="hover:opacity-80 transition-opacity">
                    <Logo />
                </Link>
                <Link 
                    href="/dashboard"
                    className="group flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg text-sm font-medium hover:bg-neutral-200 transition-colors shadow-lg shadow-white/5"
                >
                    <span className="hidden sm:inline">{t('sharedPage.header.createResume')}</span>
                    <span className="inline sm:hidden">{t('sharedPage.header.create')}</span>
                    <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                </Link>
            </div>
        </header>
    );
};
