import React from 'react';
import { Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';

type NewResumeDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  newName: string;
  setNewName: (name: string) => void;
  handleCreate: () => void;
  isLoading?: boolean;
};

export default function NewResumeDialog({ open, onOpenChange, newName, setNewName, handleCreate, isLoading }: NewResumeDialogProps) {
  const { t } = useTranslation();
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !isLoading && onOpenChange(false)}
            className="fixed inset-0 bg-black/50 z-[100] backdrop-blur-sm"
          />
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-md bg-[#1C1C1E] border border-neutral-800 rounded-3xl shadow-2xl p-8 pointer-events-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">{t('newResumeDialog.title')}</h2>
                <button
                  onClick={() => !isLoading && onOpenChange(false)}
                  className="text-neutral-500 hover:text-white transition-colors"
                  type="button"
                  disabled={isLoading}
                >
                  <X size={20} />
                </button>
              </div>
              
              <p className="text-sm text-neutral-400 mb-6">{t('newResumeDialog.description')}</p>
              
              <div className="space-y-6">
                <input
                  className="flex h-11 w-full rounded-xl border border-neutral-700 bg-neutral-900 px-4 py-2 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50 transition-all"
                  placeholder={t('newResumeDialog.placeholder')}
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  autoFocus
                />
                
                <div className="flex justify-end gap-3 pt-2">
                  <Button 
                      onClick={() => onOpenChange(false)} 
                      variant="ghost" 
                      disabled={isLoading}
                      className="text-neutral-400 hover:text-white hover:bg-neutral-800"
                  >
                      {t('newResumeDialog.cancel')}
                  </Button>
                  <Button 
                      onClick={handleCreate} 
                      disabled={!newName.trim() || isLoading} 
                      className="min-w-[100px] bg-sky-600 hover:bg-sky-500 text-white rounded-lg"
                  >
                      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : t('newResumeDialog.create')}
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