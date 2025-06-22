"use client";

import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { FiCheckCircle, FiArrowRight, FiZap, FiShield, FiDownload, FiUpload } from 'react-icons/fi';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';
import { useState, useEffect, useRef } from 'react';

// 简化的磁性卡片组件
const SimpleMagneticCard = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      ref={ref}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      animate={{
        scale: isHovered ? 1.02 : 1,
      }}
      transition={{ duration: 0.2 }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// 发光按钮组件
const GlowButton = ({ children, onClick, variant = "primary" }: { 
  children: React.ReactNode; 
  onClick?: () => void;
  variant?: "primary" | "secondary";
}) => (
  <motion.button
    onClick={onClick}
    className={`
      relative px-6 py-3 rounded-lg font-semibold transition-all duration-300 overflow-hidden group
      ${variant === "primary" 
        ? "bg-gradient-to-r from-purple-600 to-cyan-600 text-white" 
        : "border border-neutral-600 text-neutral-300 hover:border-purple-400"
      }
    `}
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.98 }}
  >
    <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-cyan-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
    <div className="relative z-10 flex items-center gap-2">
      {children}
    </div>
  </motion.button>
);

export function FeatureSections() {
  const { t } = useTranslation();
  
  const aiCarouselImages = [
    '/magic-resume-chat.png',
    '/magic-resume-select.png',
    '/magic-resume-optimize.png',
    '/magic-resume-analysis.png',
  ];
  const [currentAiImageIndex, setCurrentAiImageIndex] = useState(0);
  const [aiPaused, setAiPaused] = useState(false);

  const exportImportImages = [
    '/magic-resume-export.png',
    '/magic-resume-import.png',
  ];
  const [currentExportImageIndex, setCurrentExportImageIndex] = useState(0);
  const [exportPaused, setExportPaused] = useState(false);

  useEffect(() => {
    const aiInterval = setInterval(() => {
      if (!aiPaused) {
        setCurrentAiImageIndex((prevIndex) => (prevIndex + 1) % aiCarouselImages.length);
      }
    }, 8000);

    const exportInterval = setInterval(() => {
      if (!exportPaused) {
        setCurrentExportImageIndex((prevIndex) => (prevIndex + 1) % exportImportImages.length);
      }
    }, 8000);

    return () => {
      clearInterval(aiInterval);
      clearInterval(exportInterval);
    };
  }, [aiCarouselImages.length, exportImportImages.length, aiPaused, exportPaused]);

  return (
    <>
      {/* AI 功能部分 */}
      <section className="relative py-32 bg-neutral-900/30 overflow-hidden">
        {/* 简化背景装饰 */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500/3 rounded-full blur-2xl" />
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-purple-500/3 rounded-full blur-2xl" />
        </div>

        <div className="container mx-auto px-6 text-center relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }} 
            transition={{ duration: 0.6 }}
            className="mb-16"
          >
            <motion.div
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="inline-block mb-6"
            >
              <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-sm border border-blue-400/30 text-blue-300 px-4 py-2 rounded-full">
                <FiZap className="inline w-4 h-4 mr-2" />
                {t("landing.tags.aiEnhancement")}
              </div>
            </motion.div>
            
            <h2 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white to-neutral-300 bg-clip-text text-transparent">
              {t("landing.features.main.title")}
            </h2>
            <p className="text-xl text-neutral-400 max-w-3xl mx-auto leading-relaxed">
              {t("landing.features.main.subtitle")}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-16 items-center max-w-7xl mx-auto">
            {/* AI 功能描述 */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} 
              transition={{ duration: 0.6 }}
              className="text-left space-y-8"
            >
              <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl border border-blue-400/20">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <FiZap className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <span className="font-bold text-blue-300">{t("landing.features.ai.tag.name")}</span>
                  <span className="text-neutral-400 ml-2">{t("landing.features.ai.tag.description")}</span>
                </div>
              </div>

              <h3 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                {t("landing.features.ai.title")}
              </h3>

              <p className="text-lg text-neutral-400 leading-relaxed">
                {t("landing.features.ai.description")}
              </p>

              <ul className="space-y-4">
                {[t("landing.features.ai.benefit1"), t("landing.features.ai.benefit2")].map((benefit, index) => (
                  <li
                    key={benefit}
                    className="flex items-start gap-4 group"
                  >
                    <div className="mt-1 p-1 bg-green-500/20 rounded-full group-hover:bg-green-500/30 transition-colors">
                      <FiCheckCircle className="text-green-400 w-5 h-5" />
                    </div>
                    <span className="text-neutral-300 group-hover:text-white transition-colors">{benefit}</span>
                  </li>
                ))}
              </ul>

              <div>
                <GlowButton>
                  {t("landing.buttons.experienceAI")}
                  <FiArrowRight className="w-4 h-4" />
                </GlowButton>
              </div>
            </motion.div>

            {/* AI 功能演示图片 */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} 
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <SimpleMagneticCard className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-2xl" />
                
                <div 
                  className="relative bg-neutral-900/90 border border-neutral-700/50 rounded-2xl p-4"
                  onMouseEnter={() => setAiPaused(true)}
                  onMouseLeave={() => setAiPaused(false)}
                >
                  <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-neutral-800">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={currentAiImageIndex}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="w-full h-full"
                      >
                        <Image
                          src={aiCarouselImages[currentAiImageIndex]}
                          alt={t("landing.features.ai.alt")}
                          width={800}
                          height={600}
                          className="object-cover w-full h-full"
                          loading="lazy"
                          quality={60}
                          priority={false}
                        />
                      </motion.div>
                    </AnimatePresence>
                  </div>

                  {/* 简化的图片指示器 */}
                  <div className="flex justify-center gap-2 mt-3">
                    {aiCarouselImages.map((_, index) => (
                      <button
                        key={index}
                        className={`w-2 h-2 rounded-full transition-colors duration-200 ${
                          index === currentAiImageIndex 
                            ? 'bg-blue-400' 
                            : 'bg-neutral-600 hover:bg-neutral-500'
                        }`}
                        onClick={() => setCurrentAiImageIndex(index)}
                      />
                    ))}
                  </div>
                </div>
              </SimpleMagneticCard>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 导入导出功能部分 */}
      <section className="relative py-32 bg-neutral-800/20 overflow-hidden">
        {/* 简化背景装饰 */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-green-500/3 rounded-full blur-2xl" />
          <div className="absolute bottom-1/3 left-1/4 w-64 h-64 bg-purple-500/3 rounded-full blur-2xl" />
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="grid md:grid-cols-2 gap-16 items-center max-w-7xl mx-auto">
            {/* 导入导出演示 */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} 
              transition={{ duration: 0.6 }}
            >
              <SimpleMagneticCard>
                <div 
                  className="bg-neutral-900/90 border border-neutral-700/50 rounded-2xl p-6"
                  onMouseEnter={() => setExportPaused(true)}
                  onMouseLeave={() => setExportPaused(false)}
                >
                  <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-purple-600/20 to-green-600/20 rounded-xl mb-6 border border-purple-400/30">
                    <div className="flex gap-2">
                      <FiUpload className="w-5 h-5 text-purple-400" />
                      <FiDownload className="w-5 h-5 text-green-400" />
                    </div>
                    <span className="text-purple-300 font-semibold">{t("landing.features.export.tag")}</span>
                  </div>

                  <p className="text-neutral-400 mb-6 leading-relaxed">
                    {t("landing.features.export.description")}
                  </p>

                  <div className="relative aspect-video overflow-hidden rounded-xl bg-neutral-800">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={currentExportImageIndex}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="w-full h-full"
                      >
                        <Image
                          src={exportImportImages[currentExportImageIndex]}
                          alt={t("landing.features.export.alt")}
                          width={800}
                          height={450}
                          className="object-cover w-full h-full"
                          loading="lazy"
                          quality={60}
                          priority={false}
                        />
                      </motion.div>
                    </AnimatePresence>
                  </div>

                  {/* 简化的图片指示器 */}
                  <div className="flex justify-center gap-2 mt-3">
                    {exportImportImages.map((_, index) => (
                      <button
                        key={index}
                        className={`w-2 h-2 rounded-full transition-colors duration-200 ${
                          index === currentExportImageIndex 
                            ? 'bg-purple-400' 
                            : 'bg-neutral-600 hover:bg-neutral-500'
                        }`}
                        onClick={() => setCurrentExportImageIndex(index)}
                      />
                    ))}
                  </div>
                </div>
              </SimpleMagneticCard>
            </motion.div>

            {/* 隐私安全特性 */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} 
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-left space-y-8"
            >
              <div className="inline-flex items-center gap-3 p-3 bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-full border border-green-400/30">
                <div className="bg-green-500/50 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                  <FiShield className="w-3 h-3" />
                  {t("landing.features.privacy.tag.name")}
                </div>
                <span className="font-semibold text-green-300 pr-2">{t("landing.features.privacy.tag.description")}</span>
              </div>

              <h3 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white to-green-200 bg-clip-text text-transparent">
                {t("landing.tags.dataSecurityGuarantee")}
              </h3>

              <p className="text-lg text-neutral-400 leading-relaxed max-w-md">
                {t("landing.features.privacy.description")}
              </p>

              <ul className="space-y-6">
                {[
                  t("landing.features.privacy.benefit1"),
                  t("landing.features.privacy.benefit2")
                ].map((benefit, index) => (
                  <li
                    key={benefit}
                    className="flex items-start gap-4 group"
                  >
                    <div className="mt-1 p-2 bg-cyan-500/20 rounded-lg group-hover:bg-cyan-500/30 transition-colors">
                      <FiArrowRight className="text-cyan-400 w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white group-hover:text-cyan-200 transition-colors">{benefit}</h4>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="flex gap-4">
                <GlowButton>
                  {t("landing.buttons.experienceNow")}
                  <FiArrowRight className="w-4 h-4" />
                </GlowButton>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 联系我们部分 */}
      <section className="relative py-32 text-center bg-neutral-900/30 overflow-hidden">
        {/* 简化背景效果 */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-t from-purple-900/5 via-transparent to-cyan-900/5" />
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-purple-500/5 rounded-full blur-2xl transform -translate-x-1/2 -translate-y-1/2" />
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} 
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto"
          >
            <h2 
              className="text-4xl md:text-6xl font-bold mb-8 bg-gradient-to-r from-white via-purple-200 to-cyan-200 bg-clip-text text-transparent"
            >
              {t("landing.contact.title")}
            </h2>
            
            <p className="text-xl text-neutral-400 max-w-2xl mx-auto mb-12 leading-relaxed">
              {t("landing.contact.subtitle")}
            </p>
            
            <div>
              <a 
                href="mailto:linmoeqc@qq.com" 
                className="inline-block relative group overflow-hidden bg-gradient-to-r from-purple-600 to-purple-700 text-white px-10 py-5 rounded-lg font-semibold shadow-lg transition-all duration-300 hover:shadow-purple-500/25 hover:shadow-xl hover:scale-105"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-cyan-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg" />
                <div className="relative">
                  {t("landing.contact.button")}
                </div>
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}
