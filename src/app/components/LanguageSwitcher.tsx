"use client";

import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Globe2 } from "lucide-react";

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
      transition: { duration: 0.2, ease: "easeOut" }
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
        className="group relative overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300"
      >
        {/* 背景层 */}
        <div className="absolute inset-0 bg-gray-900/95 backdrop-blur-sm rounded-full border border-gray-700/50" />
        
        {/* Hover 效果层 */}
        <motion.div 
          className="absolute inset-0 bg-gray-800/90 rounded-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.2 }}
        />
        
        {/* 内容容器 */}
        <div className="relative flex items-center gap-2 px-3 py-2.5 text-white">
          {/* 地球图标 */}
          <motion.div
            animate={{ rotate: isHovered ? 15 : 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <Globe2 size={16} className="text-gray-300" />
          </motion.div>

          {/* 语言文字 */}
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={i18n.language}
              variants={iconVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="font-medium text-sm w-5 text-center text-white"
            >
              {isEnglish ? "EN" : "中"}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* 底部微妙阴影 */}
        <div className="absolute -bottom-0.5 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-gray-600/40 rounded-full blur-[1px] group-hover:w-10 group-hover:bg-gray-500/50 transition-all duration-300" />
      </motion.button>
    </div>
  );
} 