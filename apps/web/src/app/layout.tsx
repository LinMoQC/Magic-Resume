import type { Metadata } from "next";
import "./globals.css";
import { ClerkProvider } from '@clerk/nextjs';
import { Fragment } from "react";
import { Theme } from "@radix-ui/themes";
import { Toaster } from "sonner";
import metaConfig from "@/lib/constants/metaConfig";
import { isCloudMode } from "@/lib/config/app";

import PreloadOptimizer from "@/components/shared/PreloadOptimizer";
import StructuredData from "@/components/shared/StructuredData";
import I18nProvider from "@/components/providers/I18nProvider";
import { HttpClientProvider } from "@/components/providers/HttpClientProvider";
import { CommercialRuntimeProvider } from "@/lib/commercial/runtime";
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

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}>) {
  const { lang } = await params;
  return (
    <AuthWrapper>
      <AuthBridge>
        <HttpClientProvider>
          <html lang={lang} className="hide-scrollbar">
            <body className="font-sans">
              <CommercialRuntimeProvider>
                <I18nProvider>
                  <Theme appearance="dark">
                    {children}
                    <Toaster />
                    <PreloadOptimizer />
                  </Theme>
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
