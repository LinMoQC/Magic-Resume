"use client";

import React, { useEffect, useState } from 'react';
import { useSettingStore } from '@/store/useSettingStore';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { InfoCircledIcon } from '@radix-ui/react-icons';
import { Cloud, Settings as SettingsIcon, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ModelConfigFields } from '@/components/llm/ModelConfigFields';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { useTranslation } from 'react-i18next';
import { useTrace } from '@/hooks/useTrace';
import { McpAccessSection } from './_components/McpAccessSection';
import { isCloudMode } from '@/lib/config/app';

export default function Settings() {
  const { t } = useTranslation();
  const {
    model,
    cloudSync,
    syncDisclaimerAgreed,
    setCloudSync,
    setSyncDisclaimerAgreed,
    hasLlmConfig,
    isDirty,
    saveSettings,
    resetSettings,
    loadSettings,
  } = useSettingStore();
  const { traceSettingsViewed, traceSettingsSaved } = useTrace();
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    loadSettings();
    traceSettingsViewed();
  }, [loadSettings, traceSettingsViewed]);


  const handleSave = () => {
    saveSettings();
    traceSettingsSaved({ model });
    toast.success(t('settings.notifications.settingsSaved'));
  };

  const handleReset = () => {
    resetSettings();
    toast.info(t('settings.notifications.changesReset'));
  };

  const handleCloudSyncToggle = (checked: boolean) => {
    if (checked && !syncDisclaimerAgreed) {
      setShowDisclaimer(true);
    } else {
      setCloudSync(checked);
    }
  };

  const handleConfirmDisclaimer = () => {
    setSyncDisclaimerAgreed(true);
    setCloudSync(true);
    setShowDisclaimer(false);
  };

  if (!mounted) return null;

  return (
    <div className="flex-1 overflow-y-auto relative bg-[#0a0a0a]">
      <div className="sticky top-0 z-40 bg-[#0a0a0a]/80 backdrop-blur-md px-12 py-6 border-b border-white/5">
        <div className="max-w-4xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-sky-500/10 rounded-xl">
              <SettingsIcon className="w-6 h-6 text-sky-500" />
            </div>
            <h1 className="text-3xl font-bold">{t('settings.title')}</h1>
          </div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl px-12 py-8"
      >
        <div className="space-y-8 pb-32">
          {/* Cloud Sync + MCP — cloud mode only */}
          {isCloudMode && (
            <>
              <section id="cloud-sync">
                <Card className="overflow-hidden border-neutral-800/50 bg-neutral-900/50 backdrop-blur-sm">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                    <div className="flex items-center gap-2">
                      <Cloud className="w-5 h-5 text-sky-400" />
                      <h2 className="text-xl font-semibold">{t('settings.cloudSync.title')}</h2>
                    </div>
                    <Switch
                      checked={cloudSync}
                      onCheckedChange={handleCloudSyncToggle}
                    />
                  </CardHeader>
                  <CardContent>
                    <p className="text-neutral-400 text-sm leading-relaxed">
                      {t('settings.cloudSync.description')}
                    </p>
                  </CardContent>
                </Card>
              </section>
              <McpAccessSection />
            </>
          )}

          {/* LLM Settings Section */}
          <section id="llm-settings">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <div className="w-1.5 h-6 bg-sky-500 rounded-full" />
                {t('settings.llm.title')}
              </h2>
              {hasLlmConfig() ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {t('settings.llm.statusReady')}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {t('settings.llm.statusNotConfigured')}
                </span>
              )}
            </div>

            <Card className="relative overflow-hidden rounded-2xl border-neutral-800/60 bg-gradient-to-b from-neutral-900/70 to-neutral-900/40 backdrop-blur-sm p-6">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-500/40 to-transparent" />
              <p className="text-neutral-400 text-sm leading-relaxed mb-6">
                {t('settings.llm.description')}
              </p>
              <ModelConfigFields />
            </Card>
          </section>
        </div>
      </motion.div>

      {/* Floating Action Bar */}
      <AnimatePresence>
        {isDirty && (
          <motion.div
            className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-6 bg-neutral-900/80 backdrop-blur-xl border border-white/10 shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] pl-6 pr-2 py-2 rounded-full z-50"
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-sky-500/20 flex items-center justify-center">
                <InfoCircledIcon className="h-4.5 w-4.5 text-sky-400" />
              </div>
              <p className="text-neutral-200 font-medium text-sm whitespace-nowrap">
                {t('settings.notifications.unsavedChanges')}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                onClick={handleReset} 
                variant="ghost" 
                size="sm" 
                className="h-10 px-6 rounded-full text-neutral-400 hover:text-white hover:bg-white/5 transition-all whitespace-nowrap shrink-0"
              >
                {t('settings.buttons.reset')}
              </Button>
              <Button 
                onClick={handleSave} 
                size="sm" 
                className="h-10 px-8 rounded-full bg-sky-500 text-white hover:bg-sky-400 font-semibold shadow-lg shadow-sky-500/20 transition-all whitespace-nowrap shrink-0"
              >
                {t('settings.buttons.save')}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cloud Sync Disclaimer Dialog */}
      <Dialog open={showDisclaimer} onOpenChange={setShowDisclaimer}>
        <DialogContent className="max-w-md border-neutral-800 bg-neutral-900 text-white rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Cloud className="w-6 h-6 text-sky-400" />
              {t('settings.cloudSync.disclaimer.title')}
            </DialogTitle>
            <DialogDescription className="text-neutral-400 pt-2">
              {t('settings.cloudSync.disclaimer.description')}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 text-sm text-neutral-300 bg-neutral-950/50 p-4 rounded-xl border border-neutral-800 leading-relaxed">
            {t('settings.cloudSync.disclaimer.content')}
          </div>
          <DialogFooter className="gap-2 sm:gap-2 mt-4">
            <Button 
              variant="ghost" 
              onClick={() => setShowDisclaimer(false)} 
              className="hover:bg-neutral-800 text-neutral-400 rounded-full"
            >
              {t('settings.cloudSync.disclaimer.cancel')}
            </Button>
            <Button 
              onClick={handleConfirmDisclaimer}
              className="bg-sky-500 hover:bg-sky-400 text-white font-medium rounded-full px-6"
            >
              {t('settings.cloudSync.disclaimer.agree')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
