import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Globe, Link, Copy, Check, Lock } from "lucide-react";

import { useResumeStore } from "@/store/useResumeStore";

import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const { activeResume, updateSharing, saveResume, syncStatus } = useResumeStore();
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Auto-sync if it's a local resume (ID is a timestamp)
  useEffect(() => {
    if (isOpen && activeResume) {
        const isLocalId = !isNaN(Number(activeResume.id)) && activeResume.id.length > 10;
        if (isLocalId && syncStatus !== 'syncing') {
            saveResume('manual');
        }
    }
  }, [isOpen, activeResume, syncStatus, saveResume]);

  const isSyncing = syncStatus === 'syncing';

  // Derive state from activeResume
  const isPublic = activeResume?.isPublic || false;
  const shareRole = activeResume?.shareRole || 'VIEWER';
  
  const shareUrl = useMemo(() => {
    return typeof window !== 'undefined' && activeResume?.shareId 
      ? `${window.location.origin}/s/${activeResume.shareId}`
      : '';
  }, [activeResume?.shareId]);

  const handleTogglePublic = useCallback(async (checked: boolean) => {
    setLoading(true);
    try {
        await updateSharing(checked, shareRole);
    } finally {
        setLoading(false);
    }
  }, [shareRole, updateSharing]);

  const handleRoleChange = useCallback(async (role: 'VIEWER' | 'COMMENTER') => {
    if (!isPublic) return;
    setLoading(true);
    try {
        await updateSharing(true, role);
    } finally {
        setLoading(false);
    }
  }, [isPublic, updateSharing]);

  const copyToClipboard = useCallback(() => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success(t('modals.share.copySuccess'));
    setTimeout(() => setCopied(false), 2000);
  }, [shareUrl, t]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 z-100 backdrop-blur-sm cursor-pointer"
          />
          <div className="fixed inset-0 z-101 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 12 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="w-full max-w-md rounded-2xl bg-[#0e0f11] p-6 shadow-[0_24px_70px_-20px_rgb(0_0_0/0.8)] ring-1 ring-white/[0.07] pointer-events-auto"
            >
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-400/10 text-sky-400 ring-1 ring-sky-400/20">
                  <Globe size={17} />
                </div>
                <div>
                  <h2 className="text-[15px] font-semibold tracking-tight text-white">{t('modals.share.title')}</h2>
                  <p className="mt-0.5 text-[13px] text-neutral-500">{t('modals.share.subtitle')}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="-mr-1 -mt-1 flex h-8 w-8 items-center justify-center rounded-lg text-neutral-500 hover:bg-white/5 hover:text-white transition-colors cursor-pointer"
                type="button"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Public Toggle */}
              <div className="flex items-center justify-between gap-4 rounded-xl bg-white/[0.02] p-4 ring-1 ring-white/[0.06]">
                <div className="flex gap-3">
                    <div className={cn("mt-0.5", isPublic ? "text-sky-400" : "text-neutral-500")}>
                        {isPublic ? <Globe size={17} /> : <Lock size={17} />}
                    </div>
                    <div>
                        <h3 className="text-sm font-medium text-white">{t('modals.share.publicAccess')}</h3>
                        <p className="mt-1 text-xs text-neutral-500">
                            {isSyncing ? t('modals.share.syncing') : (isPublic ? t('modals.share.publicAccessDesc') : t('modals.share.privateAccessDesc'))}
                        </p>
                    </div>
                </div>
                    <div
                        className={cn(
                            "relative inline-flex shrink-0 items-center cursor-pointer group",
                            (loading || isSyncing) && "opacity-50 cursor-not-allowed pointer-events-none"
                        )}
                        onClick={() => !loading && !isSyncing && handleTogglePublic(!isPublic)}
                        role="switch"
                        aria-checked={isPublic}
                    >
                        <div className={cn(
                            "h-6 w-11 rounded-full transition-colors duration-200 ease-out",
                            isPublic ? "bg-sky-500" : "bg-white/10"
                        )}>
                            <div className={cn(
                                "absolute left-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-white shadow-sm transition-transform duration-200 ease-out",
                                isPublic ? "translate-x-5" : "translate-x-0"
                            )}>
                                {(loading || isSyncing) && <div className="h-2 w-2 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />}
                            </div>
                        </div>
                    </div>
              </div>

              {/* Link Section (Only if Public) */}
              <AnimatePresence initial={false}>
                {isPublic && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-3 pt-1">
                    {/* Permissions */}
                    <div className="grid grid-cols-2 gap-1 rounded-lg bg-white/[0.03] p-1 ring-1 ring-white/[0.05]">
                        <button
                            type="button"
                            onClick={() => handleRoleChange('VIEWER')}
                            className={cn(
                                "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                                shareRole === 'VIEWER'
                                    ? "bg-sky-400/12 text-sky-300 ring-1 ring-sky-400/25"
                                    : "text-neutral-400 hover:text-white"
                            )}
                        >
                            {t('modals.share.readOnly')}
                        </button>
                        <button
                            type="button"
                            onClick={() => handleRoleChange('COMMENTER')}
                            className={cn(
                                "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                                shareRole === 'COMMENTER'
                                    ? "bg-sky-400/12 text-sky-300 ring-1 ring-sky-400/25"
                                    : "text-neutral-400 hover:text-white"
                            )}
                        >
                            {t('modals.share.allowComments')}
                        </button>
                    </div>

                    {/* Link Copy */}
                    <div className="relative">
                        <div className="flex items-center rounded-lg bg-black/40 p-3 pr-12 ring-1 ring-white/[0.06] focus-within:ring-sky-400/40 transition-shadow">
                            <Link size={15} className="min-w-[15px] text-neutral-500" />
                            <input
                                readOnly
                                value={shareUrl}
                                className="ml-3 w-full truncate border-none bg-transparent text-sm text-neutral-300 focus:outline-none"
                            />
                        </div>
                        <button
                            className="absolute right-1.5 top-1.5 flex h-8 w-8 items-center justify-center rounded-md text-neutral-400 hover:bg-white/5 hover:text-white transition-colors cursor-pointer"
                            onClick={copyToClipboard}
                        >
                            {copied ? <Check size={14} className="text-sky-400" /> : <Copy size={14} />}
                        </button>
                    </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="mt-6 flex justify-end border-t border-white/[0.06] pt-4">
                <button onClick={onClose} className="rounded-lg bg-white/[0.06] px-4 py-2 text-sm font-medium text-neutral-200 ring-1 ring-white/[0.08] hover:bg-white/10 transition-colors cursor-pointer">
                    {t('common.done')}
                </button>
            </div>
          </motion.div>
        </div>
        </>
      )}
    </AnimatePresence>
  );
};
