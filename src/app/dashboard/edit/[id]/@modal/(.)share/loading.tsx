'use client';

import React from 'react';
import { Loader2, Share2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="fixed inset-0 bg-black/60 z-100 flex items-center justify-center p-4 animate-in fade-in fill-mode-forwards duration-300 delay-200 opacity-0">
      <div className="w-full max-w-xl h-fit py-12 bg-[#0A0A0A] border border-neutral-800 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col items-center justify-center overflow-hidden">
        <div className="flex flex-col items-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-sky-500/10 flex items-center justify-center text-sky-400 border border-sky-500/20 animate-pulse">
            <Share2 size={32} />
          </div>
          <div className="flex flex-col items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight animate-pulse">
              正在准备分享配置...
            </h2>
            <p className="text-sm text-neutral-500">正在加载权限与链接选项</p>
          </div>
          <div className="mt-4">
            <Loader2 className="w-8 h-8 text-sky-500 animate-spin opacity-50" />
          </div>
        </div>
      </div>
    </div>
  );
}
