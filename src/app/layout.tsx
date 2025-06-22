import type { Metadata } from "next";
import { 
  Inter, 
  Nunito, 
  Quicksand, 
  Comfortaa, 
  Raleway, 
  Righteous,
  Pacifico,
  Caveat,
  Dancing_Script,
  Lobster,
  Orbitron,
  Space_Mono,
  PT_Serif,
  Playfair_Display,
  JetBrains_Mono,
  Source_Code_Pro
} from "next/font/google";
import "./globals.css";
import { ClerkProvider } from '@clerk/nextjs';
import { Theme } from "@radix-ui/themes";
import { Toaster } from "sonner";
import metaConfig from "@/constant/metaConfig";
import I18nProvider from "@/app/dashboard/_components/I18nProvider";
import LanguageSwitcher from "@/app/components/LanguageSwitcher";
import PreloadOptimizer from "@/app/components/PreloadOptimizer";
import Script from "next/script";

// 字体配置
const inter = Inter({ subsets: ["latin"] });
const nunito = Nunito({ subsets: ["latin"] });
const quicksand = Quicksand({ subsets: ["latin"] });
const comfortaa = Comfortaa({ subsets: ["latin"] });
const raleway = Raleway({ subsets: ["latin"] });
const righteous = Righteous({ weight: "400", subsets: ["latin"] });
const pacifico = Pacifico({ weight: "400", subsets: ["latin"] });
const caveat = Caveat({ subsets: ["latin"] });
const dancingScript = Dancing_Script({ subsets: ["latin"] });
const lobster = Lobster({ weight: "400", subsets: ["latin"] });
const orbitron = Orbitron({ subsets: ["latin"] });
const spaceMono = Space_Mono({ weight: ["400", "700"], subsets: ["latin"] });
const ptSerif = PT_Serif({ weight: ["400", "700"], subsets: ["latin"] });
const playfairDisplay = Playfair_Display({ subsets: ["latin"] });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"] });
const sourceCodePro = Source_Code_Pro({ subsets: ["latin"] });

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

          {/* Umami Analytics */}
          <Script async src="https://cloud.umami.is/script.js" data-website-id="566da2ef-02bf-4b3f-9374-14ec66075e32" />
        </body>
      </html>
    </ClerkProvider>
  );
}
