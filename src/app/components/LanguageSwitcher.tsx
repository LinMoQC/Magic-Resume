"use client";

import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Globe2 } from "lucide-react";
import type { Easing } from "framer-motion";

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [isMounted, setIsMounted] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const toggleLanguage = () => {
    const newLang = i18n.language.startsWith("en") ? "zh" : "en";
    i18n.changeLanguage(newLang);
  };

  const iconVariants = {
    initial: { opacity: 0, scale: 0.5, rotateY: -90 },
    animate: { opacity: 1, scale: 1, rotateY: 0 },
    exit: { opacity: 0, scale: 0.5, rotateY: 90 },
  };

  const buttonVariants = {
    initial: { scale: 1 },
    hover: { 
      scale: 1.05,
      transition: { duration: 0.2, ease: "easeOut" as Easing }
    },
    tap: { 
      scale: 0.95,
      transition: { duration: 0.1 }
    }
  };

  if (!isMounted) {
    return null;
  }

  const isEnglish = i18n.language.startsWith("en");

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <motion.button
        onClick={toggleLanguage}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        variants={buttonVariants}
        initial="initial"
        whileHover="hover"
        whileTap="tap"
        aria-label="Change language"
        className="group relative overflow-hidden"
      >
        {/* 背景渐变层 */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/90 to-cyan-600/90 rounded-xl backdrop-blur-xl" />
        
        {/* Hover 效果层 */}
        <motion.div 
          className="absolute inset-0 bg-gradient-to-br from-purple-500/80 to-cyan-500/80 rounded-xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.3 }}
        />

        {/* 边框光晕 */}
        <div className="absolute inset-0 rounded-xl border border-white/20 group-hover:border-white/30 transition-colors duration-300" />
        
        {/* 内容容器 */}
        <div className="relative flex items-center gap-2 px-3 py-2 text-white">
          {/* 地球图标 */}
          <motion.div
            animate={{ rotate: isHovered ? 360 : 0 }}
            transition={{ duration: 0.6, ease: "easeInOut" as Easing }}
          >
            <Globe2 size={14} className="text-white/90" />
          </motion.div>

          {/* 语言文字 */}
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={i18n.language}
              variants={iconVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.3, ease: "easeInOut" as Easing }}
              className="font-medium text-xs w-4 text-center"
            >
              {isEnglish ? "EN" : "中"}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* 底部阴影 */}
        <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-6 h-1.5 bg-purple-600/40 rounded-full blur-sm group-hover:w-8 group-hover:bg-purple-500/60 transition-all duration-300" />
      </motion.button>
    </div>
  );
}