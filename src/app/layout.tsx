import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from '@clerk/nextjs';
import { Theme } from "@radix-ui/themes";
import { Toaster } from "sonner";
import metaConfig from "@/lib/constants/metaConfig";

import PreloadOptimizer from "@/components/shared/PreloadOptimizer";
import StructuredData from "@/components/shared/StructuredData";
import Analytics from "@/components/features/analytics/Analytics";
import { PHProvider } from "@/components/providers/posthog-provider";
import PostHogPageView from "@/components/providers/PostHogPageView";
import I18nProvider from "@/components/providers/I18nProvider";

// 字体配置
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://magic-resume.cn'),
  ...metaConfig.Landing,
  alternates: {
    canonical: '/',
    languages: {
      'en-US': '/en',
      'zh-CN': '/zh',
    },
  },
};

export default function RootLayout({
  children,
  params: { lang }
}: Readonly<{
  children: React.ReactNode;
  params: { lang: string };
}>) {
  return (
    <ClerkProvider>
      <html lang={lang} className="hide-scrollbar">
        <body className={inter.className}>
          <PHProvider>
            <PostHogPageView />
            <I18nProvider>
              <Theme appearance="dark">
                {children}
                <Toaster />
                {/* 性能优化和预加载 */}
                <PreloadOptimizer />
              </Theme>
              {/* 语言切换 */}

            </I18nProvider>

            {/* 结构化数据 */}
            <StructuredData type="website" />
            <StructuredData type="organization" />
            <StructuredData type="product" />
            
            {/* 动态Analytics组件 */}
            <Analytics />
          </PHProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
