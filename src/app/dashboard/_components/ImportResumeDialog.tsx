import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useAuth } from '@clerk/nextjs';
import { Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Resume } from '@/types/frontend/resume';
import { useResumeStore } from '@/store/useResumeStore';
import { toast } from 'sonner';
import { FaFileUpload } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';

type ImportResumeDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function ImportResumeDialog({ open, onOpenChange }: ImportResumeDialogProps) {
  const { importResume } = useResumeStore();
  const { getToken } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const { t } = useTranslation();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setError(null);
    const file = acceptedFiles[acceptedFiles.length - 1];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();
    
    const readFile = () => new Promise<string>((resolve, reject) => {
      reader.onabort = () => reject(new Error(t('importDialog.errors.fileReadAborted')));
      reader.onerror = () => reject(new Error(t('importDialog.errors.fileReadFailed')));
      reader.onload = () => resolve(reader.result as string);
      reader.readAsText(file);
    });

    try {
      const content = await readFile();
      const result = JSON.parse(content);

      // Basic validation
      if (typeof result === 'object' && result !== null && 'info' in result && 'sections' in result) {
        const newResume: Resume = {
          ...result,
          id: Date.now().toString(),
          name: result.name || t('importDialog.defaultName'),
          updatedAt: Date.now(),
        };
        
        const token = await getToken();
        await importResume(newResume, token || undefined);
        
        toast.success(t('importDialog.success'));
        onOpenChange(false);
      } else {
        throw new Error(t('importDialog.errors.invalidFormat'));
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : t('importDialog.errors.parseFailed');
      toast.error(message);
      setError(message);
    } finally {
      setIsImporting(false);
    }
  }, [importResume, getToken, onOpenChange, t]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/json': ['.json'] },
    multiple: false,
    disabled: isImporting,
  });

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !isImporting && onOpenChange(false)}
            className="fixed inset-0 bg-black/50 z-[100] backdrop-blur-sm"
          />
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-lg bg-[#1C1C1E] border border-neutral-800 rounded-3xl shadow-2xl p-8 pointer-events-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">{t('importDialog.title')}</h2>
                <button
                  onClick={() => !isImporting && onOpenChange(false)}
                  className="text-neutral-500 hover:text-white transition-colors"
                  type="button"
                  disabled={isImporting}
                >
                  <X size={20} />
                </button>
              </div>
              
              <p className="text-sm text-neutral-400 mb-6">{t('importDialog.description')}</p>

              <div
                {...getRootProps()}
                className={`mt-4 border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300 relative
                  ${isDragActive ? 'border-sky-500 bg-sky-500/10 shadow-[0_0_20px_rgba(14,165,233,0.15)]' : 'border-neutral-700 bg-neutral-900/50 hover:border-sky-600 hover:bg-neutral-800/50'}
                  ${isImporting ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}
                `}
              >
                <input {...getInputProps()} />
                {isImporting ? (
                  <div className="flex flex-col items-center justify-center text-sky-500">
                    <Loader2 className="w-12 h-12 mb-4 animate-spin" />
                    <p className="font-medium">{t('importDialog.importing')}</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-sky-500/10 flex items-center justify-center text-sky-500 mb-4 transition-transform group-hover:scale-110">
                      <FaFileUpload size={28} />
                    </div>
                    {isDragActive ? (
                      <p className="text-sky-400 font-medium">{t('importDialog.dropzone.active')}</p>
                    ) : (
                      <p className="text-neutral-300 font-medium">{t('importDialog.dropzone.default')}</p>
                    )}
                    <p className="text-xs text-neutral-500 mt-2">{t('importDialog.dropzone.jsonOnly')}</p>
                  </div>
                )}
              </div>
              
              {error && <p className="mt-4 text-sm text-red-500 bg-red-500/10 border border-red-500/20 p-3 rounded-lg">{error}</p>}

              <div className="mt-8 flex justify-end">
                <Button 
                  variant="ghost" 
                  onClick={() => onOpenChange(false)} 
                  disabled={isImporting}
                  className="text-neutral-400 hover:text-white hover:bg-neutral-800"
                >
                  {t('importDialog.cancel')}
                </Button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
 