"use client";

import React, { useEffect, useState } from 'react';
import { useSettingStore } from '@/store/useSettingStore';
import { toast } from 'sonner';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { InfoCircledIcon, GearIcon, LockClosedIcon } from '@radix-ui/react-icons';
import { Cloud, Settings as SettingsIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MODEL_API_URL_MAP } from '@/constant/modals';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { Switch } from '@/app/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { Card, CardHeader, CardContent } from '@/app/components/ui/card';
import { useTranslation, Trans } from 'react-i18next';
import { useTrace } from '@/app/hooks/useTrace';

export default function Settings() {
  const { t } = useTranslation();
  const {
    apiKey,
    baseUrl,
    model,
    maxTokens,
    cloudSync,
    syncDisclaimerAgreed,
    setApiKey,
    setBaseUrl,
    setModel,
    setMaxTokens,
    setCloudSync,
    setSyncDisclaimerAgreed,
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

  const handleModelChange = (newModel: string) => {
    setModel(newModel);

    const officialUrl = MODEL_API_URL_MAP[newModel as keyof typeof MODEL_API_URL_MAP];
    const isOfficialUrl = Object.values(MODEL_API_URL_MAP).includes(baseUrl);

    if (officialUrl && (!baseUrl || isOfficialUrl)) {
      setBaseUrl(officialUrl);
    }
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
          {/* Cloud Sync Section */}
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

          {/* LLM Settings Section */}
          <section id="llm-settings">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <div className="w-1.5 h-6 bg-sky-500 rounded-full" />
              {t('settings.llm.title')}
            </h2>
            
            <Card className="border-neutral-800/50 bg-neutral-900/50 backdrop-blur-sm p-6">
              <div className="space-y-4 mb-8">
                <p className="text-neutral-400 text-sm leading-relaxed">
                  {t('settings.llm.description1')}
                </p>
                <p className="text-neutral-400 text-sm leading-relaxed">
                  <Trans i18nKey="settings.llm.description2">
                    You have the option to <a href="https://platform.openai.com/account/api-keys" target="_blank" rel="noopener noreferrer" className="text-sky-400 hover:underline">obtain your own OpenAI API key</a>. This key empowers you to leverage the API as you see fit. Alternatively, if you wish to disable the AI features in Reactive Resume altogether, you can simply remove the key from your settings.
                  </Trans>
                </p>
                <p className="text-neutral-400 text-sm leading-relaxed">
                  {t('settings.llm.description3')}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <div className="space-y-2">
                  <label htmlFor="apiKey" className="text-sm font-medium text-neutral-300 flex items-center gap-2">
                    <LockClosedIcon className="w-3.5 h-3.5" />
                    {t('settings.llm.apiKeyLabel')}
                  </label>
                  <Input
                    id="apiKey"
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="sk-..."
                    className="bg-neutral-950/50 border-neutral-800 focus:ring-sky-500/50 transition-all placeholder:text-neutral-600"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="baseUrl" className="text-sm font-medium text-neutral-300">
                    {t('settings.llm.baseUrlLabel')}
                  </label>
                  <Input
                    id="baseUrl"
                    type="text"
                    value={baseUrl}
                    onChange={(e) => setBaseUrl(e.target.value)}
                    placeholder="http://localhost:11434/v1"
                    className="bg-neutral-950/50 border-neutral-800 focus:ring-sky-500/50 transition-all placeholder:text-neutral-600"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="model" className="text-sm font-medium text-neutral-300">
                    {t('settings.llm.modelLabel')}
                  </label>
                  <Select onValueChange={handleModelChange} value={model}>
                    <SelectTrigger className="bg-neutral-950/50 border-neutral-800">
                      <SelectValue placeholder={t('settings.llm.modelPlaceholder')} />
                    </SelectTrigger>
                    <SelectContent className='bg-neutral-900 border-neutral-800 text-white'>
                      {Object.keys(MODEL_API_URL_MAP).map((modelName) => (
                        <SelectItem key={modelName} value={modelName} className="focus:bg-neutral-800 focus:text-sky-400 transition-colors">
                          {modelName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label htmlFor="maxTokens" className="text-sm font-medium text-neutral-300">
                    {t('settings.llm.maxTokensLabel')}
                  </label>
                  <Input
                    id="maxTokens"
                    type="number"
                    value={maxTokens}
                    max={65536}
                    min={1024}
                    onChange={(e) => setMaxTokens(parseInt(e.target.value, 10))}
                    placeholder="1024"
                    className="bg-neutral-950/50 border-neutral-800 focus:ring-sky-500/50 transition-all"
                  />
                </div>
              </div>
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
                className="h-10 px-6 rounded-full text-neutral-400 hover:text-white hover:bg-white/5 transition-all whitespace-nowrap flex-shrink-0"
              >
                {t('settings.buttons.reset')}
              </Button>
              <Button 
                onClick={handleSave} 
                size="sm" 
                className="h-10 px-8 rounded-full bg-sky-500 text-white hover:bg-sky-400 font-semibold shadow-lg shadow-sky-500/20 transition-all whitespace-nowrap flex-shrink-0"
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