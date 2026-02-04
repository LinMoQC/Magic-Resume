
import React, { useState, useCallback } from 'react';
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useTranslation } from "react-i18next";
import { Loader2, MessageCircle, X, CheckCircle2, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@clerk/nextjs";
import { feedbackApi } from "@/lib/api/feedback";

interface FeedbackModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FeedbackModal({ open, onOpenChange }: FeedbackModalProps) {
  const { getToken, userId } = useAuth();
  const { t } = useTranslation(); // Note: keys might be missing for error messages
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!feedback.trim()) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const token = await getToken();
      await feedbackApi.submitFeedback(feedback, userId || undefined, token);
      
      console.log("Feedback submitted successfully");
      setIsSubmitting(false);
      setSubmitted(true);
      setFeedback("");
      
      // Close dialog after showing success message briefly
      setTimeout(() => {
          setSubmitted(false);
          onOpenChange(false);
      }, 1500);
    } catch (error: unknown) {
      console.error("Error submitting feedback:", error);
      setIsSubmitting(false);
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number } };
        if (axiosError.response?.status === 429) {
          setErrorMessage(t('feedback.error.tooManyRequests') || 'Too many requests. Please try again later.');
        } else {
          setErrorMessage(t('feedback.error.generic') || 'Failed to submit feedback. Please try again.');
        }
      } else {
        setErrorMessage(t('feedback.error.generic') || 'Failed to submit feedback. Please try again.');
      }
    }
  }, [feedback, getToken, userId, onOpenChange, t]);

  const handleClose = useCallback(() => {
    if (isSubmitting) return; // Prevent closing during submission
    onOpenChange(false);
    setTimeout(() => {
        setSubmitted(false);
        setFeedback("");
    }, 300);
  }, [isSubmitting, onOpenChange]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/60 z-[100] backdrop-blur-sm"
          />
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ 
                type: "spring",
                damping: 25,
                stiffness: 300
              }}
              className="w-full max-w-lg bg-[#1C1C1E] border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden pointer-events-auto"
            >
              {/* Header */}
              <div className="flex items-start justify-between p-6 pb-4 border-b border-neutral-800/50">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-linear-to-br from-blue-500/20 to-blue-600/10 flex items-center justify-center text-blue-400 ring-1 ring-blue-500/20">
                    <MessageCircle size={22} strokeWidth={2} />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold text-white mb-1">{t('feedback.title')}</h2>
                    <p className="text-sm text-neutral-400 leading-relaxed">{t('feedback.description')}</p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className={cn(
                    "text-neutral-500 hover:text-white hover:bg-neutral-800 rounded-lg p-1.5 transition-all",
                    isSubmitting && "opacity-50 cursor-not-allowed"
                  )}
                  type="button"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                <AnimatePresence mode="wait">
                    {submitted ? (
                        <motion.div 
                            key="success"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ type: "spring", damping: 20, stiffness: 300 }}
                            className="flex flex-col items-center justify-center py-12 text-center"
                        >
                            <motion.div 
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.1, type: "spring", damping: 15, stiffness: 300 }}
                                className="w-20 h-20 bg-linear-to-br from-green-500/20 to-emerald-600/10 rounded-full flex items-center justify-center mb-5 ring-4 ring-green-500/10"
                            >
                                <CheckCircle2 className="w-10 h-10 text-green-500" strokeWidth={2} />
                            </motion.div>
                            <motion.h3 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="text-2xl font-semibold text-white mb-2"
                            >
                                {t('feedback.thankYou')}
                            </motion.h3>
                            <motion.p 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3 }}
                                className="text-neutral-400 text-sm"
                            >
                                {t('feedback.received')}
                            </motion.p>
                        </motion.div>
                    ) : (
                        <motion.form 
                            key="form"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onSubmit={handleSubmit}
                            className="space-y-5"
                        >
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-neutral-300 block">
                                    {t('feedback.label')}
                                </label>
                                <Textarea
                                    value={feedback}
                                    onChange={(e) => setFeedback(e.target.value)}
                                    placeholder={t('feedback.placeholder')}
                                    className="min-h-[140px] bg-neutral-900/50 border-neutral-700 text-neutral-100 placeholder:text-neutral-500 resize-none focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:border-blue-500/50 rounded-xl transition-all"
                                    disabled={isSubmitting}
                                />
                                <div className="flex items-center justify-between text-xs text-neutral-500 px-1">
                                    <span>{feedback.length} {t('feedback.characters')}</span>
                                    <span className={cn(
                                        "transition-colors",
                                        feedback.trim().length > 0 && "text-blue-400"
                                    )}>
                                        {feedback.trim().length > 0 ? t('feedback.readyToSubmit') : t('feedback.typeFeedback')}
                                    </span>
                                </div>
                                {errorMessage && (
                                  <p className="text-red-400 text-sm px-1 mt-2">{errorMessage}</p>
                                )}
                            </div>
                            
                            <div className="flex gap-3 pt-2">
                                <Button 
                                    type="button"
                                    onClick={handleClose}
                                    disabled={isSubmitting}
                                    variant="outline"
                                    className="flex-1 bg-transparent border-neutral-700 text-neutral-300 hover:bg-neutral-800 hover:text-white transition-all"
                                >
                                    {t('feedback.close')}
                                </Button>
                                <Button 
                                    type="submit" 
                                    disabled={!feedback.trim() || isSubmitting}
                                    className={cn(
                                        "flex-1 bg-linear-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none",
                                        !feedback.trim() && "from-neutral-700 to-neutral-700 hover:from-neutral-700 hover:to-neutral-700"
                                    )}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            {t('common.loading')}
                                        </>
                                    ) : (
                                        <>
                                            <Send className="w-4 h-4 mr-2" />
                                            {t('feedback.submit')}
                                        </>
                                    )}
                                </Button>
                            </div>
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
