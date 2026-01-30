"use client";

import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { Globe, Check, ChevronDown } from "lucide-react";

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [isMounted, setIsMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMounted(true);
    
    // Close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!isMounted) return null;

  const currentLang = i18n.language.startsWith("en") ? "en" : "zh";
  
  const languages = [
    { code: "en", label: "English" },
    { code: "zh", label: "中文" } // Simplified Chinese
  ];

  const handleLanguageChange = (langCode: string) => {
    i18n.changeLanguage(langCode);
    setIsOpen(false);
  };

  return (
    <div className="relative z-50" ref={containerRef}>
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors backdrop-blur-md"
      >
        <Globe size={16} className="text-neutral-400 group-hover:text-white transition-colors" />
        <span className="text-sm font-medium text-neutral-200">
          {currentLang === "en" ? "English" : "中文"}
        </span>
        <ChevronDown 
          size={14} 
          className={`text-neutral-500 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} 
        />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute right-0 top-full mt-2 w-32 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-xl overflow-hidden backdrop-blur-xl"
          >
            <div className="p-1 flex flex-col gap-0.5">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  className={`flex items-center justify-between w-full px-3 py-2 text-sm rounded-lg transition-all ${
                    currentLang === lang.code 
                      ? "bg-purple-500/20 text-purple-300" 
                      : "text-neutral-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <span>{lang.label}</span>
                  {currentLang === lang.code && (
                    <Check size={14} className="text-purple-400" />
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 