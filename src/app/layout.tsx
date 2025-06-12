import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from '@clerk/nextjs';
import { Theme } from "@radix-ui/themes";
import { Toaster } from "sonner";
import metaConfig from "@/constant/metaConfig";
import I18nProvider from "@/app/dashboard/_components/I18nProvider";
import LanguageSwitcher from "@/app/dashboard/_components/LanguageSwitcher";
import Script from "next/script";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = metaConfig.Landing;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={inter.className}>
          <I18nProvider>
            <Theme appearance="dark">
              {children}
              <Toaster />
            </Theme>
            <LanguageSwitcher />
          </I18nProvider>

          <Script async src="https://cloud.umami.is/script.js" data-website-id="566da2ef-02bf-4b3f-9374-14ec66075e32" />
        </body>
      </html>
    </ClerkProvider>
  );
}
