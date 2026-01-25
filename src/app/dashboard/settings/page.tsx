"use client";

import React, { useEffect } from 'react';
import { useSettingStore } from '@/store/useSettingStore';
import { toast } from 'sonner';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { InfoCircledIcon } from '@radix-ui/react-icons';
import { motion, AnimatePresence } from 'framer-motion';
import { MODEL_API_URL_MAP } from '@/constant/modals';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { useTranslation, Trans } from 'react-i18next';

export default function Settings() {
  const { t } = useTranslation();
  const {
    apiKey,
    baseUrl,
    model,
    maxTokens,
    setApiKey,
    setBaseUrl,
    setModel,
    setMaxTokens,
    isDirty,
    saveSettings,
    resetSettings,
    loadSettings,
  } = useSettingStore();

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleSave = () => {
    saveSettings();
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

  return (
    <div className="flex-1 px-12 py-10 overflow-y-auto relative">
      <h1 className="text-3xl font-bold mb-4">{t('settings.title')}</h1>

      <div className="space-y-12 max-w-4xl pb-24">
        <section id="llm-settings">
          <h2 className="text-2xl font-semibold mb-2">{t('settings.llm.title')}</h2>
          <p className="text-neutral-400 mb-4 text-sm">
            {t('settings.llm.description1')}
          </p>
          <p className="text-neutral-400 mb-4 text-sm">
            <Trans i18nKey="settings.llm.description2">
              You have the option to <a href="https://platform.openai.com/account/api-keys" target="_blank" rel="noopener noreferrer" className="text-sky-400 hover:underline">obtain your own OpenAI API key</a>. This key empowers you to leverage the API as you see fit. Alternatively, if you wish to disable the AI features in Reactive Resume altogether, you can simply remove the key from your settings.
            </Trans>
          </p>
          <p className="text-neutral-400 mb-4 text-sm">
            {t('settings.llm.description3')}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            <div>
              <label htmlFor="apiKey" className="block text-sm font-medium text-neutral-300 mb-2">{t('settings.llm.apiKeyLabel')}</label>
              <Input
                id="apiKey"
                type="text"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
                className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-2 focus:ring-sky-500 focus:border-sky-500"
              />
            </div>
            <div>
              <label htmlFor="baseUrl" className="block text-sm font-medium text-neutral-300 mb-2">{t('settings.llm.baseUrlLabel')}</label>
              <Input
                id="baseUrl"
                type="text"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="http://localhost:11434/v1"
                className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-2 focus:ring-sky-500 focus:border-sky-500"
              />
            </div>
            <div>
              <label htmlFor="model" className="block text-sm font-medium text-neutral-300 mb-2">{t('settings.llm.modelLabel')}</label>
              <Select onValueChange={handleModelChange} value={model}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t('settings.llm.modelPlaceholder')} />
                </SelectTrigger>
                <SelectContent className='bg-neutral-800 focus:outline-0 border-0 text-white'>
                  {Object.keys(MODEL_API_URL_MAP).map((modelName) => (
                    <SelectItem key={modelName} value={modelName}>
                      {modelName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label htmlFor="maxTokens" className="block text-sm font-medium text-neutral-300 mb-2">{t('settings.llm.maxTokensLabel')}</label>
              <Input
                id="maxTokens"
                type="number"
                value={maxTokens}
                max={65536}
                min={1024}
                onChange={(e) => setMaxTokens(parseInt(e.target.value, 10))}
                placeholder="1024"
                className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-2 focus:ring-sky-500 focus:border-sky-500"
              />
            </div>
          </div>
        </section>
      </div>

      <AnimatePresence>
        {isDirty && (
          <motion.div
            className="rounded-full fixed bottom-8 left-1/2 -translate-x-1/2 w-auto bg-neutral-900/90 backdrop-blur-md border border-neutral-800 shadow-2xl pl-5 pr-2 py-2 flex items-center justify-between z-50 gap-6"
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            <div className="flex items-center gap-3">
              <InfoCircledIcon className="h-5 w-5 text-neutral-400" />
              <p className="text-neutral-200 font-medium text-sm">{t('settings.notifications.unsavedChanges')}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={handleReset} variant="ghost" size="sm" className="h-8 px-4 rounded-full text-neutral-400 hover:text-white hover:bg-white/10">{t('settings.buttons.reset')}</Button>
              <Button onClick={handleSave} size="sm" className="h-8 px-5 rounded-full bg-white text-black hover:bg-neutral-200 font-medium transition-colors">{t('settings.buttons.save')}</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}