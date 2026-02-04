
import React, { useState } from 'react';
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useTranslation } from "react-i18next";
import { Loader2, MessageCircle, X, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface FeedbackModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FeedbackModal({ open, onOpenChange }: FeedbackModalProps) {
  const { t } = useTranslation();
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!feedback.trim()) return;

    setIsSubmitting(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log("Feedback submitted:", feedback);
    setIsSubmitting(false);
    setSubmitted(true);
    setFeedback("");
    
    // Close dialog after showing success message briefly
    setTimeout(() => {
        setSubmitted(false);
        onOpenChange(false);
    }, 1500);
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset state after transition might be better, but simple close is fine
    setTimeout(() => {
        setSubmitted(false);
        setFeedback("");
    }, 300);
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/50 z-[100] backdrop-blur-sm"
          />
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-md bg-[#1C1C1E] border border-neutral-800 rounded-2xl shadow-2xl p-6 pointer-events-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                    <MessageCircle size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white">{t('feedback.title')}</h2>
                    <p className="text-sm text-neutral-400">{t('feedback.description')}</p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  className="text-neutral-500 hover:text-white transition-colors"
                  type="button"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6">
                <AnimatePresence mode="wait">
                    {submitted ? (
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="flex flex-col items-center justify-center py-8 text-center"
                        >
                            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-4">
                                <CheckCircle2 className="w-8 h-8 text-green-500" />
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-2">{t('feedback.thankYou')}</h3>
                            <p className="text-neutral-400">{t('feedback.received')}</p>
                        </motion.div>
                    ) : (
                        <motion.form 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onSubmit={handleSubmit}
                            className="space-y-4"
                        >
                            <div className="space-y-2">
                                <Textarea
                                    value={feedback}
                                    onChange={(e) => setFeedback(e.target.value)}
                                    placeholder={t('feedback.placeholder')}
                                    className="min-h-[120px] bg-neutral-900/50 border-neutral-800 text-neutral-200 placeholder:text-neutral-500 resize-none focus-visible:ring-neutral-700"
                                />
                            </div>
                            
                            <Button 
                                type="submit" 
                                disabled={!feedback.trim() || isSubmitting}
                                className={cn(
                                    "w-full bg-white text-black hover:bg-neutral-200 transition-all",
                                    isSubmitting && "opacity-70 cursor-not-allowed"
                                )}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        {t('common.loading')}
                                    </>
                                ) : (
                                    t('feedback.submit')
                                )}
                            </Button>
                        </motion.form>
                    )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
