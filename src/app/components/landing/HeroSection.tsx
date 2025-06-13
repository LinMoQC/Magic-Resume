"use client";

import Link from 'next/link';
import { motion } from 'framer-motion';
import { FiArrowRight } from 'react-icons/fi';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';
import { MorphingText } from '@/app/components/morphing-text';

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeInOut' } },
};

export function HeroSection() {
  const { t } = useTranslation();

  const texts = [
    t("landing.morphingTexts.simpleAndSmart"),
    t("landing.morphingTexts.aiPowered"),
    t("landing.morphingTexts.beautifulTemplates"),
    t("landing.morphingTexts.freeAndSecure"),
  ];
  
  return (
    <section className="container mx-auto px-6 py-10 md:py-20 h-screen flex items-center justify-center">
      <div className="grid md:grid-cols-2 gap-12 items-center">
        <motion.div initial="hidden" animate="visible" variants={fadeIn}>
          <div className="inline-block bg-purple-600/10 text-purple-400 text-sm py-1 px-3 rounded-full mb-4">
            {t("landing.hero.tag")}
          </div>
          <div className="text-5xl md:text-7xl font-bold tracking-tighter leading-tight mb-6 max-w-md min-h-[100px] md:min-h-[200px]">
            <MorphingText texts={texts} />
          </div>
          <p className="text-lg text-neutral-400 mb-8 max-w-lg">
            {t("landing.hero.subtitle")}
          </p>
          <div className="flex gap-4">
            <Link href="/dashboard">
              <p className="bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors flex items-center gap-2">
                {t("landing.hero.getStarted")} <FiArrowRight />
              </p>
            </Link>
          </div>
        </motion.div>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn}>
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl flex items-center justify-center overflow-hidden">
            <Image
              src={'/magic-resume-preview.png'}
              alt={t("landing.features.ai.alt")}
              width={800}
              height={0}
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
