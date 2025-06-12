import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from '@clerk/nextjs';
import { Theme } from "@radix-ui/themes";
import { Toaster } from "sonner";
import metaConfig from "@/constant/metaConfig";
import I18nProvider from "@/app/dashboard/_components/I18nProvider";
import LanguageSwitcher from "@/app/dashboard/_components/LanguageSwitcher";

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
        </body>
      </html>
    </ClerkProvider>
  );
}
