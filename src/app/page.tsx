"use client";

import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { FiArrowRight, FiCheckCircle, FiEye } from 'react-icons/fi';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';
import { InteractiveBackground } from '@/app/components/interactive-background';
import { MorphingText } from '@/app/components/morphing-text';
import { FaStar, FaGithub } from 'react-icons/fa';
import { useState, useEffect } from 'react';

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeInOut' } },
};

export default function Landing() {
  const { t } = useTranslation();
  const [stars, setStars] = useState<number | null>(null);

  const aiCarouselImages = [
    '/magic-resume-optimize.png',
    '/magic-resume-analysis.png',
  ];
  const [currentAiImageIndex, setCurrentAiImageIndex] = useState(0);

  const exportImportImages = [
    '/magic-resume-export.png',
    '/magic-resume-import.png',
  ];
  const [currentExportImageIndex, setCurrentExportImageIndex] = useState(0);

  useEffect(() => {
    const aiInterval = setInterval(() => {
      setCurrentAiImageIndex((prevIndex) => (prevIndex + 1) % aiCarouselImages.length);
    }, 3000);

    const exportInterval = setInterval(() => {
      setCurrentExportImageIndex((prevIndex) => (prevIndex + 1) % exportImportImages.length);
    }, 3000);

    return () => {
      clearInterval(aiInterval);
      clearInterval(exportInterval);
    };
  }, [aiCarouselImages.length, exportImportImages.length]);

  useEffect(() => {
    fetch('/api/github-stars')
      .then(res => res.json())
      .then(data => {
        if (data && typeof data.stars === 'number') {
          setStars(data.stars);
        }
      })
      .catch(err => {
        console.error('Failed to fetch stars:', err);
      });
  }, []);

  const texts = [
    t("landing.morphingTexts.simpleAndSmart"),
    t("landing.morphingTexts.aiPowered"),
    t("landing.morphingTexts.beautifulTemplates"),
    t("landing.morphingTexts.freeAndSecure"),
  ];

  return (
    <div className="min-h-screen bg-black text-white font-sans">
      <InteractiveBackground />
      <div className="relative z-10 isolate">
        <header className="fixed top-0 left-0 right-0 bg-black/50 backdrop-blur-lg border-b border-neutral-800 z-50">
          <div className="container mx-auto px-6 py-4 flex justify-between items-center">
            <Link href="/" className="flex items-center gap-2">
              <Image src="/magic-resume-logo.png" alt="magic-resume-logo" width={160} height={0} />
            </Link>
            <nav className="flex items-center md:gap-4">
              <a href="https://github.com/LinMoQC/Magic-Resume" target="_blank" rel="noopener noreferrer" className="bg-[#211E2D] border flex border-neutral-700 rounded-lg px-4 py-2 items-center gap-3 text-sm font-medium text-neutral-300 hover:bg-neutral-800 transition-colors">
                <FaStar className="text-yellow-400" />
                <span>{t("landing.nav.starOnGithub")}</span>
                <span className="text-neutral-600">|</span>
                <span className="font-semibold text-white">
                  {stars !== null ? new Intl.NumberFormat().format(stars) : '...'}
                </span>
              </a>
              <Link href="/dashboard">
                <p className="bg-white hidden md:flex  text-black px-5 py-2 rounded-lg font-semibold hover:bg-neutral-200 transition-colors">
                  {t("landing.hero.getStarted")}
                </p>
              </Link>
            </nav>
          </div>
        </header>

        <main className="pt-10 md:pt-14">
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

          <section className="py-20 bg-neutral-900/50">
            <div className="container mx-auto px-6 text-center">
              <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn}>
                <h2 className="text-3xl md:text-4xl font-bold mb-4">{t("landing.features.main.title")}</h2>
                <p className="text-lg text-neutral-400 max-w-3xl mx-auto mb-12">
                  {t("landing.features.main.subtitle")}
                </p>
              </motion.div>
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn} className="text-left">
                  <div className="p-4 bg-blue-500/10 rounded-lg inline-flex items-center gap-2 text-blue-400 mb-6">
                    <span className="font-bold">{t("landing.features.ai.tag.name")}</span>
                    <span>{t("landing.features.ai.tag.description")}</span>
                  </div>
                  <h3 className="text-3xl font-bold mb-4">{t("landing.features.ai.title")}</h3>
                  <p className="text-neutral-400 mb-6">
                    {t("landing.features.ai.description")}
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-center gap-3">
                      <FiCheckCircle className="text-green-500 w-5 h-5 flex-shrink-0" />
                      <span>{t("landing.features.ai.benefit1")}</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <FiCheckCircle className="text-green-500 w-5 h-5 flex-shrink-0" />
                      <span>{t("landing.features.ai.benefit2")}</span>
                    </li>
                  </ul>
                </motion.div>
                <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn}>
                  <div className="group relative bg-neutral-900 border border-neutral-800 rounded-xl aspect-[4/3] flex items-center justify-center overflow-hidden transition-transform duration-300 hover:-translate-y-2">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={currentAiImageIndex}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5 }}
                        className="w-full h-full"
                      >
                        <Image
                          src={aiCarouselImages[currentAiImageIndex]}
                          alt={t("landing.features.ai.alt")}
                          width={800}
                          height={600}
                          className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
                        />
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </motion.div>
              </div>
            </div>
          </section>

          <section className="py-20 bg-neutral-900/50">
            <div className="container mx-auto px-6">
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn} className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-8">
                  <div className="inline-block bg-purple-600/10 text-purple-400 text-sm py-1 px-3 rounded-full mb-4">
                    {t("landing.features.export.tag")}
                  </div>
                  <p className="text-neutral-400 mb-6">{t("landing.features.export.description")}</p>
                  <div className="group relative bg-neutral-900 border border-neutral-800 rounded-xl aspect-video flex items-center justify-center overflow-hidden transition-transform duration-300 hover:-translate-y-2">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={currentExportImageIndex}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5 }}
                        className="w-full h-full"
                      >
                        <Image
                          src={exportImportImages[currentExportImageIndex]}
                          alt={t("landing.features.export.alt")}
                          width={800}
                          height={450}
                          className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
                        />
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </motion.div>

                <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn} className="text-left">
                  <div className="inline-flex items-center gap-2 p-2 pr-3 bg-green-500/10 rounded-full mb-6">
                    <span className="bg-green-500/50 text-white text-xs font-bold px-2 py-1 rounded-full">{t("landing.features.privacy.tag.name")}</span>
                    <span className="font-semibold text-green-400">{t("landing.features.privacy.tag.description")}</span>
                  </div>
                  <p className="text-neutral-400 mb-6 max-w-md">
                    {t("landing.features.privacy.description")}
                  </p>
                  <ul className="space-y-4">
                    <li className="flex items-start gap-3">
                      <FiArrowRight className="text-sky-400 w-5 h-5 mt-1 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold">{t("landing.features.privacy.benefit1")}</h4>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <FiArrowRight className="text-sky-400 w-5 h-5 mt-1 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold">{t("landing.features.privacy.benefit2")}</h4>
                      </div>
                    </li>
                  </ul>
                </motion.div>
              </div>
            </div>
          </section>

          <section className="py-20 text-center bg-neutral-900/50">
            <div className="container mx-auto px-6">
              <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn}>
                <h2 className="text-3xl md:text-4xl font-bold mb-4">{t("landing.contact.title")}</h2>
                <p className="text-lg text-neutral-400 max-w-2xl mx-auto mb-8">
                  {t("landing.contact.subtitle")}
                </p>
                <a href="mailto:linmoeqc@qq.com" className="bg-purple-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-purple-700 transition-colors">
                  {t("landing.contact.button")}
                </a>
              </motion.div>
            </div>
          </section>
        </main>

        <footer className="border-t border-neutral-800">
          <div className="container mx-auto px-6 py-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex flex-col md:flex-row items-center gap-4 text-center md:text-left">
                <Link href="/" className="flex items-center gap-2">
                  <Image src="/magic-resume-logo.png" alt="magic-resume-logo" width={140} height={0} />
                </Link>
                <p className="text-sm text-neutral-500 mt-2 md:mt-0 md:ml-4 md:border-l md:pl-4 border-neutral-700">
                  {t("landing.footer.copyright", { year: new Date().getFullYear() })}
                </p>
              </div>
              <div className="flex items-center gap-6 text-neutral-400">
                <Link href="/dashboard">
                  <p className="hover:text-white transition-colors">{t("landing.hero.getStarted")}</p>
                </Link>
                <a href="https://github.com/LinMoQC/Magic-Resume" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                  <FaGithub className="w-6 h-6" />
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}