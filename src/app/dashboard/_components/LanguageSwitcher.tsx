"use client";

import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { Languages, CaseSensitive } from 'lucide-react';

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language.startsWith("en") ? "zh" : "en";
    i18n.changeLanguage(newLang);
  };

  const iconVariants = {
    initial: { opacity: 0, scale: 0.5 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.5 },
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <button
        onClick={toggleLanguage}
        aria-label="Change language"
        className="inline-flex items-center justify-center whitespace-nowrap rounded-full text-lg font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-neutral-700 h-10 w-10 text-foreground hover:bg-accent hover:text-accent-foreground backdrop-blur-lg"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={i18n.language}
            variants={iconVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.2 }}
          >
            {i18n.language.startsWith("en") ? (
              // <Languages className="h-[1.2rem] w-[1.2rem]" />
              <span className="text-sm">EN</span>
            ) : (
              <span className="text-sm">CN</span>
            )}
          </motion.div>
        </AnimatePresence>
        <span className="sr-only">Change language</span>
      </button>
    </div>
  );
} 