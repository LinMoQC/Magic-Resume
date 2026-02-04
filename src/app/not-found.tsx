'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Home } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function NotFound() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[20%] left-[20%] w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[20%] right-[20%] w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[120px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center relative z-10 max-w-lg mx-auto"
      >
        <motion.h1 
          className="text-[150px] font-black leading-none bg-linear-to-b from-white to-white/10 bg-clip-text text-transparent select-none"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", duration: 0.8 }}
        >
          404
        </motion.h1>
        
        <h2 className="text-2xl font-bold text-white mb-4 mt-8">
          {t('notFoundPage.title')}
        </h2>
        
        <p className="text-neutral-400 mb-10 text-lg">
          {t('notFoundPage.description')}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/">
            <Button size="lg" className="gap-2 bg-white text-black hover:bg-neutral-200">
              <Home className="w-4 h-4" />
              {t('notFoundPage.buttons.backHome')}
            </Button>
          </Link>
          <Button 
            variant="outline" 
            size="lg" 
            className="gap-2 bg-transparent border-neutral-800 text-neutral-300 hover:bg-neutral-900"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="w-4 h-4" />
            {t('notFoundPage.buttons.goBack')}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
