"use client";

import Link from 'next/link';
import { motion, useAnimation, useScroll, useTransform } from 'framer-motion';
import { FiArrowRight, FiStar, FiZap, FiShield } from 'react-icons/fi';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';
import { MorphingText } from '@/app/components/morphing-text';
import { useEffect, useState, useMemo } from 'react';

// 简化的浮动图标组件
const SimpleFloatingIcon = ({ icon: Icon, delay = 0 }: { 
  icon: React.ComponentType<{ size?: number }>; 
  delay?: number; 
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ 
      opacity: [0.2, 0.4, 0.2],
      y: [0, -15, 0],
    }}
    transition={{
      duration: 4,
      delay,
      repeat: Infinity,
      ease: "easeInOut"
    }}
    className="absolute text-purple-400/20 hidden md:block"
  >
    <Icon size={20} />
  </motion.div>
);

// 确定性随机数生成器
const seededRandom = (seed: number) => {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 2**32;
    return state / 2**32;
  };
};

// 修复水合错误的粒子效果组件
const SimpleParticleField = () => {
  const [isClient, setIsClient] = useState(false);
  
  // 使用固定种子生成确定性随机数
  const particleElements = useMemo(() => {
    if (!isClient) return [];
    
    const random = seededRandom(12345); // 固定种子
    
    return Array.from({ length: 50 }, (_, i) => {
      const initialX = random() * 1200;
      const initialY = random() * 800;
      const endY = random() * 800 - 200;
      const endX = random() * 1200 + 50;
      const duration = random() * 5 + 5;
      const delay = random() * 4;
      
      return (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-purple-400/50 rounded-full"
          initial={{ 
            opacity: 0,
            x: initialX,
            y: initialY,
          }}
          animate={{
            opacity: [0, 1, 0],
            y: [initialY, endY],
            x: [initialX, endX],
            scale: [0, 1, 0]
          }}
          transition={{
            duration,
            delay,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      );
    });
  }, [isClient]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* 服务端渲染时显示空容器 */}
      </div>
    );
  }

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particleElements}
    </div>
  );
};

const fadeIn = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { 
      duration: 0.8, 
      ease: [0.25, 0.46, 0.45, 0.94] 
    } 
  },
};

const slideIn = {
  hidden: { opacity: 0, x: 50, scale: 0.9 },
  visible: { 
    opacity: 1, 
    x: 0, 
    scale: 1,
    transition: { 
      duration: 1, 
      ease: [0.25, 0.46, 0.45, 0.94],
      delay: 0.2
    } 
  },
};

export function HeroSection() {
  const { t } = useTranslation();
  const controls = useAnimation();
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], [0, -50]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  const texts = [
    t("landing.morphingTexts.simpleAndSmart"),
    t("landing.morphingTexts.aiPowered"), 
    t("landing.morphingTexts.beautifulTemplates"),
    t("landing.morphingTexts.freeAndSecure"),
  ];

  useEffect(() => {
    controls.start("visible");
  }, [controls]);
  
  return (
    <motion.section 
      className="relative container mx-auto px-6 py-10 md:py-20 min-h-screen flex items-center justify-center overflow-hidden"
      style={{ y, opacity }}
    >
      {/* 粒子背景 */}
      <SimpleParticleField />
      
      {/* 浮动图标 */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="relative w-full h-full">
          <SimpleFloatingIcon icon={FiStar} delay={0} />
          <SimpleFloatingIcon icon={FiZap} delay={1} />
          <SimpleFloatingIcon icon={FiShield} delay={2} />
        </div>
      </div>

      {/* 主要内容网格 */}
      <div className="grid md:grid-cols-2 gap-16 items-center max-w-7xl mx-auto relative z-10">
        {/* 左侧内容 */}
        <motion.div 
          initial="hidden" 
          animate={controls} 
          variants={fadeIn}
          className="space-y-8"
        >
          {/* 标签 */}
          <motion.div 
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="inline-block"
          >
            <div className="bg-gradient-to-r from-purple-600/20 to-cyan-600/20 backdrop-blur-sm border border-purple-400/30 text-purple-300 text-sm py-2 px-4 rounded-full mb-4 shadow-lg">
              <span className="flex items-center gap-2">
                <FiZap className="w-4 h-4" />
                {t("landing.hero.tag")}
              </span>
            </div>
          </motion.div>

          {/* 主标题 */}
          <motion.div 
            className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter leading-tight mb-6 max-w-2xl"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            <div className="min-h-[140px] md:min-h-[200px] lg:min-h-[280px] flex items-center justify-center md:justify-start relative">
              <MorphingText 
                texts={texts}
              />
            </div>
          </motion.div>

          {/* 副标题 */}
          <motion.p 
            className="text-xl md:text-2xl text-neutral-300 mb-8 max-w-lg leading-relaxed"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
          >
            {t("landing.hero.subtitle")}
          </motion.p>

          {/* 按钮组 */}
          <motion.div 
            className="flex flex-col sm:flex-row gap-4"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.8 }}
          >
            <Link href="/dashboard">
              <motion.div
                className="group relative overflow-hidden rounded-lg"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-cyan-600 opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-lg" />
                <div className="relative z-10 bg-gradient-to-r from-purple-600 to-purple-700 text-white px-8 py-4 rounded-lg font-semibold transition-all duration-300 flex items-center gap-3 shadow-lg group-hover:shadow-purple-500/25 group-hover:shadow-xl">
                  {t("landing.hero.getStarted")} 
                  <motion.div
                    animate={{ x: [0, 4, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <FiArrowRight />
                  </motion.div>
                </div>
              </motion.div>
            </Link>

          </motion.div>

          {/* 特性标签 */}
          <motion.div 
            className="flex flex-wrap gap-3 pt-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.8 }}
          >
            {[t("landing.tags.aiSmart"), t("landing.tags.freeForever"), t("landing.tags.dataSecurity")].map((feature, index) => (
              <motion.span
                key={feature}
                className="px-3 py-1 bg-neutral-800/50 backdrop-blur-sm border border-neutral-700 text-neutral-400 text-sm rounded-full"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.2 + index * 0.1, type: "spring", stiffness: 200 }}
                whileHover={{ scale: 1.1, borderColor: "#a855f7" }}
              >
                {feature}
              </motion.span>
            ))}
          </motion.div>
        </motion.div>

        {/* 右侧图片区域 */}
        <motion.div 
          initial="hidden" 
          animate={controls} 
          variants={slideIn}
          className="relative"
        >
          {/* 简化的背景光晕 */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-cyan-500/10 rounded-2xl" />
          
          {/* 主图片容器 */}
          <div className="relative bg-neutral-900/90 border border-neutral-700/50 rounded-2xl p-2 shadow-lg group hover:border-purple-400/50 hover:shadow-xl transition-all duration-300">
            {/* 图片 */}
            <div className="relative overflow-hidden rounded-xl">
              <Image
                src={'/magic-resume-preview.png'}
                alt={t("landing.features.ai.alt")}
                width={800}
                height={600}
                className="w-full h-auto group-hover:brightness-110 transition-all duration-300"
                priority
                quality={85}
              />
              
              {/* 轻量级悬浮叠加 */}
              <div className="absolute inset-0 bg-gradient-to-t from-purple-900/0 to-purple-900/0 group-hover:from-purple-900/10 group-hover:to-transparent transition-all duration-300 rounded-xl" />
            </div>
          </div>

          {/* 简化的装饰元素 */}
          <div className="absolute -top-2 -right-2 w-4 h-4 bg-purple-400 rounded-full opacity-50" />
          <div className="absolute -bottom-2 -left-2 w-3 h-3 bg-cyan-400 rounded-full opacity-50" />
        </motion.div>
      </div>

      {/* 底部渐变 */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
    </motion.section>
  );
}
