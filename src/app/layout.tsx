import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from '@clerk/nextjs';
import { Theme } from "@radix-ui/themes";
import { Toaster } from "sonner";
import metaConfig from "@/constant/metaConfig";
import I18nProvider from "@/app/dashboard/_components/I18nProvider";
import LanguageSwitcher from "@/app/components/LanguageSwitcher";
import PreloadOptimizer from "@/app/components/PreloadOptimizer";
import StructuredData from "@/app/components/StructuredData";
import Analytics from "@/app/components/Analytics";

// 字体配置
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
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
          <I18nProvider>
            <Theme appearance="dark">
              {children}
              <Toaster />
              {/* 性能优化和预加载 */}
              <PreloadOptimizer />
            </Theme>
            {/* 语言切换 */}
            <LanguageSwitcher />
          </I18nProvider>

          {/* 结构化数据 */}
          <StructuredData type="website" />
          <StructuredData type="organization" />
          <StructuredData type="product" />
          
          {/* 动态Analytics组件 */}
          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  );
}
