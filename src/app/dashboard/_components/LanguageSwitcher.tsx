"use client";

import { useTranslation } from "react-i18next";
import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GlobeIcon } from "@radix-ui/react-icons";

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    setIsOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const menuVariants = {
    open: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { type: "spring", stiffness: 300, damping: 24 },
    },
    closed: {
      opacity: 0,
      scale: 0.95,
      y: -10,
      transition: { duration: 0.1 },
    },
  };

  return (
    <div className="fixed bottom-6 right-6 z-50" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="true"
        aria-expanded={isOpen}
        className="inline-flex items-center justify-center whitespace-nowrap rounded-full text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border-1 h-10 w-10 bg-transparent text-foreground hover:bg-accent hover:text-accent-foreground"
      >
        <GlobeIcon className="h-[1.2rem] w-[1.2rem]" />
        <span className="sr-only">Change language</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="absolute bottom-full right-0 mb-2 w-32 origin-bottom-right rounded-md border border-neutral-200 bg-background/80 p-1 shadow-lg backdrop-blur-lg focus:outline-none dark:border-neutral-800"
            initial="closed"
            animate="open"
            exit="closed"
            variants={menuVariants}
          >
            <button
              onClick={() => changeLanguage("en")}
              className="block w-full rounded-sm px-3 py-1.5 text-left text-sm text-foreground transition-colors hover:bg-black/5 dark:hover:bg-white/10"
            >
              English
            </button>
            <button
              onClick={() => changeLanguage("zh")}
              className="block w-full rounded-sm px-3 py-1.5 text-left text-sm text-foreground transition-colors hover:bg-black/5 dark:hover:bg-white/10"
            >
              简体中文
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 