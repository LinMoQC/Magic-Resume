import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from '@clerk/nextjs';
import { Theme } from "@radix-ui/themes";
import { Toaster } from "sonner";
import metaConfig from "@/constant/metaConfig";

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
          <Theme appearance="dark">
            {children}
            <Toaster />
          </Theme>
        </body>
      </html>
    </ClerkProvider>
  );
}
