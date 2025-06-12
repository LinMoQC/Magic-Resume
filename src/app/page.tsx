"use client";

import Link from 'next/link';
import { motion } from 'framer-motion';
import { FiFeather, FiEye, FiMove, FiLock } from 'react-icons/fi';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';
import { MorphingText } from '@/app/components/morphing-text';
import { InteractiveBackground } from '@/app/components/interactive-background';

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

export default function Landing() {
  const { t } = useTranslation();

  const texts = [
    t('landing.hero.morphingTexts.modernResume'),
    t('landing.hero.morphingTexts.aiPowered'),
    t('landing.hero.morphingTexts.beautifulTemplates'),
    t('landing.hero.morphingTexts.getStarted'),
    t('landing.hero.morphingTexts.standOut'),
  ];

  const features = [
    {
      icon: <FiFeather className="h-8 w-8 text-sky-400" />,
      title: t('landing.features.ai.title'),
      description: t('landing.features.ai.description'),
    },
    {
      icon: <FiEye className="h-8 w-8 text-sky-400" />,
      title: t('landing.features.preview.title'),
      description: t('landing.features.preview.description'),
    },
    {
      icon: <FiMove className="h-8 w-8 text-sky-400" />,
      title: t('landing.features.dnd.title'),
      description: t('landing.features.dnd.description'),
    },
    {
      icon: <FiLock className="h-8 w-8 text-sky-400" />,
      title: t('landing.features.privacy.title'),
      description: t('landing.features.privacy.description'),
    },
  ];

  return (
    <div className="min-h-screen bg-black text-white font-sans">
      <InteractiveBackground />
      <div className="relative z-10 isolate">
        <header className="fixed top-0 left-0 right-0 bg-black/50 backdrop-blur-lg border-b border-neutral-800 z-50">
          <div className="container mx-auto px-6 py-4 flex justify-between items-center">
            <Image src="/magic-resume-logo.png" alt="magic-resume-logo" width={150} height={0} style={{ height: 'auto' }} />
            <Link href="/dashboard" legacyBehavior>
              <a className="bg-white text-black px-5 py-2 rounded-lg font-semibold hover:bg-neutral-200 transition-colors">
                {t('landing.nav.goToApp')}
              </a>
            </Link>
          </div>
        </header>

        <main className="pt-24">
          <section className="text-center container mx-auto px-6 py-20 md:py-32">
            <motion.div initial="hidden" animate="visible" variants={fadeIn}>
              <div className="text-xl md:text-6xl font-bold tracking-tighter leading-tight mb-4 min-h-[140px] md:min-h-[120px] flex items-center justify-center">
                <MorphingText texts={texts} />
              </div>
            </motion.div>
          </section>

          <section className="py-20 bg-neutral-900/50">
            <div className="container mx-auto px-6">
              <motion.div 
                initial="hidden" 
                whileInView="visible" 
                viewport={{ once: true }}
                variants={{
                  visible: { transition: { staggerChildren: 0.2 } }
                }}
                className="grid md:grid-cols-2 lg:grid-cols-4 gap-8"
              >
                {features.map((feature, index) => (
                  <motion.div key={index} variants={fadeIn} className="bg-neutral-900 p-6 rounded-xl border border-neutral-800">
                    <div className="mb-4">{feature.icon}</div>
                    <h3 className="font-bold text-xl mb-2">{feature.title}</h3>
                    <p className="text-neutral-400">{feature.description}</p>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </section>
        </main>

        <footer className="border-t border-neutral-800">
          <div className="container mx-auto px-6 py-8 text-center text-neutral-500">
            <p>{t('landing.footer.copyright', { year: new Date().getFullYear() })}</p>
          </div>
        </footer>
      </div>
    </div>
  );
}