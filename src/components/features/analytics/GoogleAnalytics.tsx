"use client";

import Script from 'next/script';
import { useEffect } from 'react';

// 声明gtag全局函数类型
declare global {
  interface Window {
    gtag: (
      command: 'config' | 'event' | 'js',
      targetId: string | Date,
      config?: Record<string, string | number | boolean>
    ) => void;
    dataLayer: unknown[];
  }
}

interface GoogleAnalyticsProps {
  trackingId: string;
}

export default function GoogleAnalytics({ trackingId }: GoogleAnalyticsProps) {
  useEffect(() => {
    // 确保gtag函数可用
    if (typeof window !== 'undefined' && window.gtag) {
      // 配置Google Analytics
      window.gtag('config', trackingId, {
        page_title: document.title,
        page_location: window.location.href,
      });
    }
  }, [trackingId]);

  return (
    <>
      {/* Google Analytics 脚本 */}
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${trackingId}`}
      />
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${trackingId}', {
              page_title: document.title,
              page_location: window.location.href,
            });
          `,
        }}
      />
    </>
  );
} 