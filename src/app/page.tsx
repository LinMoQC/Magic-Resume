import { InteractiveBackground } from '@/app/components/interactive-background';
import { Header } from '@/app/components/landing/Header';
import { HeroSection } from '@/app/components/landing/HeroSection';
import { FeatureSections } from '@/app/components/landing/FeatureSections';
import { Footer } from '@/app/components/landing/Footer';
import { Suspense } from 'react';

const t = (key: string, options?: any) => {
  const texts: { [key: string]: string } = {
    "landing.footer.copyright": `© ${options?.year || new Date().getFullYear()} Magic Resume. All rights reserved.`,
  };
  return texts[key] || key;
};

export default async function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-white font-sans">
      <InteractiveBackground />
      <div className="relative z-10 isolate">
        <Header />
        <main className="pt-10 md:pt-14">
          <HeroSection />
          <FeatureSections />
        </main>
        <Suspense fallback={<div>Loading...</div>}>
          <Footer t={t} />
        </Suspense>
      </div>
    </div>
  );
}