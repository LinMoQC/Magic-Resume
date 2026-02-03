import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Globe, Link, Copy, Check, Lock } from "lucide-react";

import { useResumeStore } from "@/store/useResumeStore";

import { useAuth } from "@clerk/nextjs";
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
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Auto-sync if it's a local resume (ID is a timestamp)
  useEffect(() => {
    if (isOpen && activeResume) {
        const isLocalId = !isNaN(Number(activeResume.id)) && activeResume.id.length > 10;
        if (isLocalId && syncStatus !== 'syncing') {
            getToken().then(token => {
                if (token) {
                    saveResume(token, 'manual');
                }
            });
        }
    }
  }, [isOpen, activeResume?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const isSyncing = syncStatus === 'syncing';

  // Derive state from activeResume
  const isPublic = activeResume?.isPublic || false;
  const shareRole = activeResume?.shareRole || 'VIEWER';
  const shareUrl = typeof window !== 'undefined' && activeResume?.shareId 
    ? `${window.location.origin}/s/${activeResume.shareId}`
    : '';

  const handleTogglePublic = async (checked: boolean) => {
    setLoading(true);
    try {
        const token = await getToken();
        if (!token) {
            toast.error(t('modals.share.pleaseLogin'));
            return;
        }
        await updateSharing(checked, shareRole, token);
    } finally {
        setLoading(false);
    }
  };

  const handleRoleChange = async (role: 'VIEWER' | 'COMMENTER') => {
    if (!isPublic) return;
    setLoading(true);
    try {
        const token = await getToken();
        if (!token) {
            toast.error(t('modals.share.pleaseLogin'));
            return;
        }
        await updateSharing(true, role, token);
    } finally {
        setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success(t('modals.share.copySuccess'));
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-100 backdrop-blur-sm"
          />
          <div className="fixed inset-0 z-101 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-md bg-[#1C1C1E] border border-neutral-800 rounded-2xl shadow-2xl p-6 pointer-events-auto"
            >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                  <Globe size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">{t('modals.share.title')}</h2>
                  <p className="text-sm text-neutral-400">{t('modals.share.subtitle')}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-neutral-500 hover:text-white transition-colors"
                type="button"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6">
              {/* Public Toggle */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-neutral-900/50 border border-neutral-800">
                <div className="flex gap-3">
                    <div className={cn("mt-1", isPublic ? "text-green-500" : "text-neutral-500")}>
                        {isPublic ? <Globe size={18} /> : <Lock size={18} />}
                    </div>
                    <div>
                        <h3 className="text-sm font-medium text-white">{t('modals.share.publicAccess')}</h3>
                        <p className="text-xs text-neutral-400 mt-1">
                            {isSyncing ? t('modals.share.syncing') : (isPublic ? t('modals.share.publicAccessDesc') : t('modals.share.privateAccessDesc'))}
                        </p>
                    </div>
                </div>
                    <div 
                        className={cn(
                            "relative inline-flex items-center cursor-pointer group",
                            (loading || isSyncing) && "opacity-50 cursor-not-allowed pointer-events-none"
                        )}
                        onClick={() => !loading && !isSyncing && handleTogglePublic(!isPublic)}
                        role="switch"
                        aria-checked={isPublic}
                    >
                        <div className={cn(
                            "w-11 h-6 rounded-full transition-colors duration-200 ease-in-out",
                            isPublic ? "bg-green-500" : "bg-neutral-600"
                        )}>
                            <div className={cn(
                                "absolute top-1 left-1 bg-white w-4 h-4 rounded-full shadow transition-transform duration-200 ease-in-out flex items-center justify-center",
                                isPublic ? "translate-x-5" : "translate-x-0"
                            )}>
                                {(loading || isSyncing) && <div className="w-2 h-2 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />}
                            </div>
                        </div>
                    </div>
              </div>

              {/* Link Section (Only if Public) */}
              <AnimatePresence>
                {isPublic && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden space-y-4"
                  >
                    {/* Permissions */}
                    <div className="grid grid-cols-2 gap-2 p-1 bg-neutral-900 rounded-lg">
                        <button
                            type="button"
                            onClick={() => handleRoleChange('VIEWER')}
                            className={cn(
                                "py-2 px-3 text-sm font-medium rounded-md transition-all",
                                shareRole === 'VIEWER' 
                                    ? "bg-neutral-800 text-white shadow-sm" 
                                    : "text-neutral-400 hover:text-neutral-200"
                            )}
                        >
                            {t('modals.share.readOnly')}
                        </button>
                        <button
                            type="button"
                            onClick={() => handleRoleChange('COMMENTER')}
                            className={cn(
                                "py-2 px-3 text-sm font-medium rounded-md transition-all",
                                shareRole === 'COMMENTER' 
                                    ? "bg-neutral-800 text-white shadow-sm" 
                                    : "text-neutral-400 hover:text-neutral-200"
                            )}
                        >
                            {t('modals.share.allowComments')}
                        </button>
                    </div>

                    {/* Link Copy */}
                    <div className="relative">
                        <div className="flex items-center bg-neutral-950 border border-neutral-800 rounded-lg p-3 pr-12">
                            <Link size={16} className="text-neutral-500 min-w-[16px]" />
                            <input 
                                readOnly
                                value={shareUrl}
                                className="bg-transparent border-none text-sm text-neutral-300 ml-3 w-full focus:outline-none truncate"
                            />
                        </div>
                        <button
                            className="absolute right-1 top-1 h-8 w-8 flex items-center justify-center rounded hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
                            onClick={copyToClipboard}
                        >
                            {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                        </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            <div className="mt-6 pt-4 border-t border-neutral-800 flex justify-end">
                <button onClick={onClose} className="px-4 py-2 text-sm text-neutral-400 hover:text-white transition-colors">
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
