import { Header } from '@/components/features/landing/Header';
import { HeroSection } from '@/components/features/landing/HeroSection';
import { FeatureSections } from '@/components/features/landing/FeatureSections';
import { Footer } from '@/components/features/landing/Footer';
import { Suspense } from 'react';

export default async function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-white font-sans">
      <div className="relative z-10 isolate">
        <Header />
        <main className="pt-10 md:pt-14">
          <HeroSection />
          <FeatureSections />
        </main>
        <Suspense fallback={<div>Loading...</div>}>
          <Footer />
        </Suspense>
      </div>
    </div>
  );
}