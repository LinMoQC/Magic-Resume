import type { Metadata } from "next";
import "./globals.css";
import { Sora } from "next/font/google";
import { ClerkProvider } from '@clerk/nextjs';

// Brand typeface — Latin only, exposed as --font-brand for the logomark wordmark.
const brandFont = Sora({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-brand",
  display: "swap",
});
import { Fragment } from "react";
import { Toaster } from "sonner";
import { ThemeProvider, themeInitScript } from "@/components/providers/ThemeProvider";
import metaConfig from "@/lib/constants/metaConfig";
import { isCloudMode } from "@/lib/config/app";

import PreloadOptimizer from "@/components/shared/PreloadOptimizer";
import StructuredData from "@/components/shared/StructuredData";
import I18nProvider from "@/components/providers/I18nProvider";
import { HttpClientProvider } from "@/components/providers/HttpClientProvider";
import { CommercialRuntimeProvider } from "@/lib/commercial/runtime";
import { RuntimeEnvScript } from "@/lib/commercial/runtime-env";
import { CloudAuthBridge } from "@/lib/auth";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://magic-resume.cn'),
  ...metaConfig.Landing,
  alternates: {
    canonical: '/',
    languages: { 'en-US': '/en', 'zh-CN': '/zh' },
  },
};

// Provider tree (cloud):    ClerkProvider → CloudAuthBridge → HttpClientProvider → ...
// Provider tree (self-hosted): Fragment → HttpClientProvider → ... (default context)
// CloudAuthBridge MUST wrap HttpClientProvider so getToken is available from context.
const AuthWrapper = isCloudMode ? ClerkProvider : Fragment;
const AuthBridge = isCloudMode ? CloudAuthBridge : Fragment;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthWrapper>
      <AuthBridge>
        <HttpClientProvider>
          <html lang="zh-CN" className="hide-scrollbar dark" style={{ colorScheme: "dark" }} suppressHydrationWarning>
            <head>
              <script
                // 水合前落定主题 class,避免浅/深闪烁(FOUC)。
                dangerouslySetInnerHTML={{ __html: themeInitScript }}
              />
            </head>
            <body className={`font-sans ${brandFont.variable}`}>
              {/* Runtime API origin → window.__ENV, injected before any client
                  bundle reads it. Kept OUT of CommercialRuntimeProvider because
                  the commercial overlay replaces that module — see runtime-env.tsx. */}
              <RuntimeEnvScript />
              <CommercialRuntimeProvider>
                <I18nProvider>
                  <ThemeProvider>
                    {children}
                    <Toaster />
                    <PreloadOptimizer />
                  </ThemeProvider>
                </I18nProvider>
              </CommercialRuntimeProvider>
              <StructuredData type="website" />
              <StructuredData type="organization" />
              <StructuredData type="product" />
            </body>
          </html>
        </HttpClientProvider>
      </AuthBridge>
    </AuthWrapper>
  );
}
