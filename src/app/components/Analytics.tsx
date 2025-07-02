"use client";

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// 声明gtag全局函数类型
declare global {
  interface Window {
    gtag: (
      command: 'config' | 'event' | 'js',
      targetId: string | Date,
      config?: Record<string, string | number | boolean>
    ) => void;
  }
}

// 动态导入Google Analytics组件
const GoogleAnalytics = dynamic(() => import('./GoogleAnalytics'), {
  ssr: false,
  loading: () => null,
});

// 分析配置
const analyticsConfig = {
  googleAnalytics: {
    enabled: process.env.NODE_ENV === 'production' && !!process.env.NEXT_PUBLIC_GA_ID,
    trackingId: process.env.NEXT_PUBLIC_GA_ID,
  },
};

export default function Analytics() {
  return (
    <Suspense fallback={null}>
      {/* Google Analytics */}
      {analyticsConfig.googleAnalytics.enabled && analyticsConfig.googleAnalytics.trackingId && (
        <GoogleAnalytics trackingId={analyticsConfig.googleAnalytics.trackingId} />
      )}
    </Suspense>
  );
}

// 导出gtag函数供其他组件使用
export const trackEvent = (action: string, parameters?: Record<string, string | number | boolean>) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, parameters);
  }
};

// 导出页面浏览追踪
export const trackPageView = (url: string, title?: string) => {
  if (typeof window !== 'undefined' && window.gtag && process.env.NEXT_PUBLIC_GA_ID) {
    window.gtag('config', process.env.NEXT_PUBLIC_GA_ID, {
      page_title: title || document.title,
      page_location: url,
    });
  }
}; 