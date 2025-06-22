"use client";

import Link from 'next/link';
import Image from 'next/image';
import { FaGithub } from 'react-icons/fa';
import { motion } from 'framer-motion';
import StarOnGitHub from './StarOnGitHub';
import { useState, useEffect } from 'react';

export function Footer() {
  const [currentYear, setCurrentYear] = useState(2025); // 默认年份

  useEffect(() => {
    // 只在客户端设置实际年份，避免hydration错误
    setCurrentYear(new Date().getFullYear());
  }, []);

  const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { 
        duration: 0.6, 
        ease: [0.25, 0.46, 0.45, 0.94] 
      } 
    },
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  return (
    <motion.footer 
      className="relative border-t border-neutral-800/50 bg-gradient-to-b from-neutral-900/50 to-black/80 backdrop-blur-sm overflow-hidden"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      variants={staggerContainer}
    >
      {/* 背景装饰 */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />
        <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-purple-500/3 rounded-full blur-3xl" />
        <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-cyan-500/3 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-6 py-12 relative z-10">
        <motion.div 
          className="flex flex-col md:flex-row justify-between items-center gap-8"
          variants={fadeInUp}
        >
          {/* Logo 和版权信息 */}
          <motion.div 
            className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left"
            variants={fadeInUp}
          >
            <motion.div
              whileHover={{ scale: 1.05, rotate: [0, -2, 2, 0] }}
              transition={{ duration: 0.6 }}
            >
              <Link href="/" className="flex items-center gap-2 group">
                <div className="relative">
                  <Image 
                    src="/magic-resume-logo.png" 
                    alt="magic-resume-logo" 
                    width={140} 
                    height={35} 
                    className="transition-all duration-300 group-hover:brightness-110" 
                  />
                  {/* Logo 光晕 */}
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 to-cyan-400/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-lg" />
                </div>
              </Link>
            </motion.div>

            <motion.div 
              className="flex items-center gap-4"
              variants={fadeInUp}
            >
              {/* 分隔线 - 仅在 MD 及以上显示 */}
              <div className="hidden md:block w-px h-8 bg-gradient-to-b from-transparent via-neutral-600 to-transparent" />
              
              <motion.p 
                className="text-sm text-neutral-500 flex items-center gap-2"
                whileHover={{ color: "#a855f7" }}
                transition={{ duration: 0.3 }}
              >
                <span className="flex items-center gap-1">
                  © {currentYear} Magic Resume.
                </span>
                <motion.span
                  initial={{ opacity: 0.7 }}
                  whileHover={{ opacity: 1 }}
                  className="hidden sm:inline"
                >
                  All rights reserved.
                </motion.span>
              </motion.p>
            </motion.div>
          </motion.div>

          {/* 社交链接 */}
          <motion.div 
            className="flex items-center gap-6"
            variants={fadeInUp}
          >
            {/* GitHub 星标 */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
            >
              <StarOnGitHub />
            </motion.div>

            {/* GitHub 链接 */}
            <motion.a 
              href="https://github.com/LinMoQC/Magic-Resume" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="group relative p-3 rounded-lg bg-neutral-800/30 border border-neutral-700/50 hover:border-purple-400/50 transition-all duration-300"
              whileHover={{ 
                scale: 1.05,
                boxShadow: "0 10px 25px -5px rgba(168, 85, 247, 0.2)"
              }}
              whileTap={{ scale: 0.98 }}
            >
              {/* 背景光晕 */}
              <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-purple-500/10 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              <FaGithub className="relative z-10 w-6 h-6 text-neutral-400 group-hover:text-white transition-colors duration-300" />
              
              {/* 悬浮时的发光效果 */}
              <div className="absolute inset-0 rounded-lg bg-purple-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl" />
            </motion.a>

            {/* 额外的装饰元素 */}
            <motion.div
              className="hidden lg:flex items-center gap-2 px-3 py-1 bg-neutral-800/20 border border-neutral-700/30 rounded-full"
              variants={fadeInUp}
            >
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-xs text-neutral-500">在线</span>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* 底部额外信息 */}
        <motion.div 
          className="mt-8 pt-8 border-t border-neutral-800/30 text-center"
          variants={fadeInUp}
        >
          <motion.div 
            className="flex flex-col sm:flex-row justify-center items-center gap-4 text-xs text-neutral-600"
            variants={fadeInUp}
          >
            <motion.span whileHover={{ color: "#a855f7" }} transition={{ duration: 0.3 }}>
              Made with ❤️ for job seekers
            </motion.span>
            <div className="hidden sm:block w-1 h-1 bg-neutral-600 rounded-full" />
            <motion.span whileHover={{ color: "#06b6d4" }} transition={{ duration: 0.3 }}>
              Powered by AI & Modern Tech
            </motion.span>
            <div className="hidden sm:block w-1 h-1 bg-neutral-600 rounded-full" />
            <motion.span whileHover={{ color: "#10b981" }} transition={{ duration: 0.3 }}>
              Open Source & Free Forever
            </motion.span>
          </motion.div>
        </motion.div>
      </div>

      {/* 底部渐变 */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-neutral-700/50 to-transparent" />
    </motion.footer>
  );
}
