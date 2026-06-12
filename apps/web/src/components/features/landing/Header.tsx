"use client";

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '@/components/shared/LanguageSwitcher';

export function Header() {
  const { t } = useTranslation();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-black/70 backdrop-blur-xl border-b border-neutral-800/50 shadow-2xl shadow-purple-500/10' 
          : 'bg-black/30 backdrop-blur-md border-b border-neutral-800/30'
      }`}
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      {/* 顶部装饰线 */}
      <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-purple-500/50 to-transparent" />
      
      <div className="container mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          {/* Logo 区域 */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.2 }}
          >
            <Link href="/" className="flex items-center gap-2 group">
              <motion.div
                className="relative"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <Image 
                  src="/magic-resume-logo.png" 
                  alt={t("common.logoAlt")} 
                  width={160} 
                  height={40} 
                  className="transition-all duration-300 group-hover:brightness-110" 
                />
                {/* Logo 光晕效果 */}
                <div className="absolute inset-0 bg-linear-to-r from-purple-400/20 to-cyan-400/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl" />
              </motion.div>
            </Link>
          </motion.div>

          {/* 导航区域 */}
          <nav className="flex items-center gap-2 md:gap-4">
            {/* GitHub 星标按钮 */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              <LanguageSwitcher />
            </motion.div>
          </nav>
        </div>
      </div>

      {/* 底部装饰线 */}
      <motion.div 
        className="absolute bottom-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-neutral-700 to-transparent"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 0.8, duration: 1 }}
      />
    </motion.header>
  );
}
