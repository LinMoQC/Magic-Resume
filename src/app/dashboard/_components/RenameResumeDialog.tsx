'use client'

import React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';

type RenameResumeDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  newName: string;
  setNewName: (name: string) => void;
  handleRename: () => void;
};

export default function RenameResumeDialog({
  open,
  onOpenChange,
  newName,
  setNewName,
  handleRename,
}: RenameResumeDialogProps) {
  const { t } = useTranslation();
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => onOpenChange(false)}
            className="fixed inset-0 bg-black/50 z-[100] backdrop-blur-sm"
          />
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-md bg-[#1C1C1E] border border-neutral-800 rounded-2xl shadow-2xl p-6 focus:outline-none pointer-events-auto"
            >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">{t('renameDialog.title')}</h2>
              <button
                onClick={() => onOpenChange(false)}
                className="text-neutral-500 hover:text-white transition-colors"
                type="button"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-6">
              <Input
                className="h-11 rounded-xl border-neutral-700 bg-neutral-900 text-white placeholder:text-neutral-500 focus:ring-2 focus:ring-sky-500/50"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder={t('renameDialog.placeholder')}
                onKeyDown={(e) => e.key === 'Enter' && handleRename()}
                autoFocus
              />
              
              <div className="flex justify-end gap-3 pt-2">
                <Button 
                    variant="ghost" 
                    onClick={() => onOpenChange(false)}
                    className="text-neutral-400 hover:text-white hover:bg-neutral-800"
                >
                    {t('renameDialog.cancel')}
                </Button>
                <Button 
                    onClick={handleRename}
                    className="min-w-[100px] bg-sky-600 hover:bg-sky-500 text-white rounded-lg"
                >
                    {t('renameDialog.rename')}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
        </>
      )}
    </AnimatePresence>
  );
}
 