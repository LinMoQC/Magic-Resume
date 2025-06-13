"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { FiCheckCircle, FiArrowRight } from 'react-icons/fi';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeInOut' } },
};

export function FeatureSections() {
  const { t } = useTranslation();
  
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

  return (
    <>
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
    </>
  );
}
