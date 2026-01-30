"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { FiCheckCircle, FiArrowRight, FiZap, FiShield, FiDownload, FiUpload } from 'react-icons/fi';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';
import { useState, useEffect, useRef } from 'react';
import CardSwap, { Card } from '@/components/CardSwap';
import { HoverBorderGradient } from '@/components/ui/hover-border-gradient';

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
// 发光按钮组件
const GlowButton = ({ children, onClick }: { 
  children: React.ReactNode; 
  onClick?: () => void;
}) => (
  <HoverBorderGradient
    onClick={onClick}
    containerClassName="rounded-full"
        as="button"
        className="dark:bg-black bg-white text-black dark:text-white flex items-center space-x-2"
  >
    {children}
  </HoverBorderGradient>
);

export function FeatureSections() {
  const { t } = useTranslation();
  const [isMobile, setIsMobile] = useState(false);
  
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

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const aiInterval = setInterval(() => {
      if (!aiPaused && isMobile) {
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
  }, [aiCarouselImages.length, exportImportImages.length, aiPaused, exportPaused, isMobile]);

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
            
            <h2 className="text-3xl md:text-[48px] font-bold mb-6 bg-gradient-to-r from-white to-neutral-300 bg-clip-text text-transparent">
              {t("landing.features.main.title")}
            </h2>
            <p className="text-base md:text-[17px] text-neutral-400 max-w-3xl mx-auto leading-relaxed">
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
              <div className="inline-flex items-center gap-3 p-3 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full border border-blue-400/20">
                <div className="bg-blue-500/50 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                  <FiZap className="w-3 h-3" />
                  {t("landing.features.ai.tag.name")}
                </div>
                <span className="font-semibold text-blue-300 pr-2">{t("landing.features.ai.tag.description")}</span>
              </div>

              <h3 className="text-3xl md:text-[36px] font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                {t("landing.features.ai.title")}
              </h3>

              <p className="text-base md:text-[17px] text-neutral-400 leading-relaxed max-w-md">
                {t("landing.features.ai.description")}
              </p>

              <ul className="space-y-4">
                {[t("landing.features.ai.benefit1"), t("landing.features.ai.benefit2")].map((benefit) => (
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

            {/* AI 功能演示图片 - 响应式 */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} 
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
              style={!isMobile ? { height: '500px' } : {}}
            >
              {isMobile ? (
                // 移动端：使用原来的 AnimatePresence
                <SimpleMagneticCard className="relative">
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

                    {/* 图片指示器 */}
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
              ) : (
                // PC端：使用 CardSwap
                <CardSwap
                  width={600}
                  height={450}
                  cardDistance={25}
                  verticalDistance={35}
                  delay={5000}
                  pauseOnHover={true}
                  skewAmount={3}
                  easing="elastic"
                >
                  {aiCarouselImages.map((imageSrc, index) => (
                    <Card key={index} customClass="ai-feature-card">
                      <div className="relative w-full h-full rounded-xl border border-white/10 bg-neutral-900/90 backdrop-blur-sm shadow-2xl overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none z-10"></div>
                        <Image
                          src={imageSrc}
                          alt={`${t("landing.features.ai.alt")} - ${index + 1}`}
                          width={800}
                          height={600}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          quality={75}
                        />
                      </div>
                    </Card>
                  ))}
                </CardSwap>
              )}
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
            {/* 隐私安全特性 */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} 
              transition={{ duration: 0.6 }}
              className="text-left space-y-8"
            >
              <div className="inline-flex items-center gap-3 p-3 bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-full border border-green-400/30">
                <div className="bg-green-500/50 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                  <FiShield className="w-3 h-3" />
                  {t("landing.features.privacy.tag.name")}
                </div>
                <span className="font-semibold text-green-300 pr-2">{t("landing.features.privacy.tag.description")}</span>
              </div>

              <h3 className="text-3xl md:text-[36px] font-bold bg-gradient-to-r from-white to-green-200 bg-clip-text text-transparent">
                {t("landing.tags.dataSecurityGuarantee")}
              </h3>

              <p className="text-base md:text-[17px] text-neutral-400 leading-relaxed max-w-md">
                {t("landing.features.privacy.description")}
              </p>

              <ul className="space-y-4">
                {[
                  t("landing.features.privacy.benefit1"),
                  t("landing.features.privacy.benefit2")
                ].map((benefit) => (
                  <li
                    key={benefit}
                    className="flex items-start gap-4 group"
                  >
                    <div className="mt-1 p-1 bg-cyan-500/20 rounded-full group-hover:bg-cyan-500/30 transition-colors">
                      <FiArrowRight className="text-cyan-400 w-5 h-5" />
                    </div>
                    <span className="text-neutral-300 group-hover:text-white transition-colors">{benefit}</span>
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

            {/* 导入导出演示 - 响应式 */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} 
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
              style={!isMobile ? { height: '450px' } : {}}
            >
              {isMobile ? (
                // 移动端：使用 AnimatePresence
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

                    {/* 图片指示器 */}
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
              ) : (
                // PC端：使用 CardSwap
                <CardSwap
                  width={600}
                  height={450}
                  cardDistance={25}
                  verticalDistance={35}
                  delay={5000}
                  pauseOnHover={true}
                  skewAmount={3}
                  easing="elastic"
                >
                  {exportImportImages.map((imageSrc, index) => (
                    <Card key={index} customClass="export-feature-card">
                      <div className="relative w-full h-full rounded-xl border border-white/10 bg-neutral-900/90 backdrop-blur-sm shadow-2xl overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none z-10"></div>
                        
                        {/* Tag overlay */}
                        {/* <div className="absolute top-4 left-4 z-20 flex items-center gap-2 p-2 bg-gradient-to-r from-purple-600/80 to-green-600/80 rounded-lg backdrop-blur-sm">
                          <FiUpload className="w-4 h-4 text-white" />
                          <FiDownload className="w-4 h-4 text-white" />
                          <span className="text-white text-sm font-semibold">{t("landing.features.export.tag")}</span>
                        </div> */}

                        <Image
                          src={imageSrc}
                          alt={`${t("landing.features.export.alt")} - ${index + 1}`}
                          width={800}
                          height={450}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          quality={75}
                        />
                      </div>
                    </Card>
                  ))}
                </CardSwap>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      {/* 联系我们部分 */}
      <section className="relative py-32 overflow-hidden" id="contact">
        {/* 背景效果 */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-t from-purple-900/5 via-transparent to-cyan-900/5" />
          <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-purple-500/5 rounded-full blur-[100px] transform -translate-x-1/2 -translate-y-1/2" />
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} 
            transition={{ duration: 0.6 }}
            className="max-w-2xl mx-auto"
          >
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-[48px] font-bold mb-6 bg-gradient-to-r from-white via-purple-200 to-cyan-200 bg-clip-text text-transparent">
                {t("landing.contact.title")}
              </h2>
              <p className="text-base md:text-[17px] text-neutral-400 max-w-xl mx-auto leading-relaxed">
                {t("landing.contact.subtitle")}
              </p>
            </div>

            <div className="bg-[#0f0f0f]/50 backdrop-blur-xl border border-white/5 rounded-[32px] p-6 md:p-10 shadow-3xl">
              <form 
                className="space-y-6"
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const name = formData.get('name');
                  const email = formData.get('email');
                  const content = formData.get('content');
                  window.location.href = `mailto:linmoeqc@qq.com?subject=Contact from ${name}&body=Name: ${name}%0D%0AEmail: ${email}%0D%0A%0D%0AContent:%0D%0A${content}`;
                }}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
                  <div className="space-y-1.5 md:space-y-2">
                    <label htmlFor="name" className="text-[13px] md:text-sm font-medium text-neutral-400 ml-1">{t("landing.contact.form.name.label")}</label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      required
                      placeholder={t("landing.contact.form.name.placeholder")}
                      className="w-full px-4 py-3 rounded-2xl bg-white/[0.03] border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500/30 transition-all duration-300"
                    />
                  </div>
                  <div className="space-y-1.5 md:space-y-2">
                    <label htmlFor="email" className="text-[13px] md:text-sm font-medium text-neutral-400 ml-1">{t("landing.contact.form.email.label")}</label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      placeholder={t("landing.contact.form.email.placeholder")}
                      className="w-full px-4 py-3 rounded-2xl bg-white/[0.03] border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500/30 transition-all duration-300"
                    />
                  </div>
                </div>
                <div className="space-y-1.5 md:space-y-2">
                  <label htmlFor="content" className="text-[13px] md:text-sm font-medium text-neutral-400 ml-1">{t("landing.contact.form.content.label")}</label>
                  <textarea
                    id="content"
                    name="content"
                    required
                    rows={4}
                    placeholder={t("landing.contact.form.content.placeholder")}
                    className="w-full px-4 py-3 rounded-2xl bg-white/[0.03] border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500/30 transition-all duration-300 resize-none"
                  />
                </div>

                <div className="pt-6">
                  <HoverBorderGradient
                    containerClassName="rounded-2xl w-full"
                    as="button"
                    className="dark:bg-black bg-white text-black dark:text-white flex items-center justify-center space-x-2 w-full py-4 text-lg"
                  >
                    <span className="font-semibold">{t("landing.contact.button")}</span>
                    <FiArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                  </HoverBorderGradient>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}
