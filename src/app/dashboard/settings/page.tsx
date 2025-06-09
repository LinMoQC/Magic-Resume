"use client";

import React, { useEffect } from 'react';
import { useSettingStore } from '@/store/useSettingStore';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { InfoCircledIcon } from '@radix-ui/react-icons';
import { motion, AnimatePresence } from 'framer-motion';

export default function Settings() {
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
    toast.success('Settings saved!');
  };

  const handleReset = () => {
    resetSettings();
    toast.info('Changes have been reset.');
  };

  return (
    <div className="flex-1 px-12 py-10 overflow-y-auto relative">
      <h1 className="text-3xl font-bold mb-4">Settings</h1>
      
      <div className="space-y-12 max-w-4xl pb-24">
        <section id="llm-settings">
          <h2 className="text-2xl font-semibold mb-2">OpenAI/Ollama Integration</h2>
          <p className="text-neutral-400 mb-4 text-sm">
            You can make use of the OpenAI API to help you generate content, or improve your writing while composing your resume.
          </p>
          <p className="text-neutral-400 mb-4 text-sm">
            You have the option to <a href="https://platform.openai.com/account/api-keys" target="_blank" rel="noopener noreferrer" className="text-sky-400 hover:underline">obtain your own OpenAI API key</a>. This key empowers you to leverage the API as you see fit. Alternatively, if you wish to disable the AI features in Reactive Resume altogether, you can simply remove the key from your settings.
          </p>
          <p className="text-neutral-400 mb-4 text-sm">
            You can also integrate with Ollama simply by setting the API key to `sk-1234567890abcdef` and the Base URL to your Ollama URL, i.e. `http://localhost:11434/v1`. You can also pick and choose models and set the max tokens as per your preference.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            <div>
              <label htmlFor="apiKey" className="block text-sm font-medium text-neutral-300 mb-2">OpenAI/Ollama API Key</label>
              <input
                id="apiKey"
                type="text"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
                className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-2 focus:ring-sky-500 focus:border-sky-500"
              />
            </div>
            <div>
              <label htmlFor="baseUrl" className="block text-sm font-medium text-neutral-300 mb-2">Base URL</label>
              <input
                id="baseUrl"
                type="text"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="http://localhost:11434/v1"
                className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-2 focus:ring-sky-500 focus:border-sky-500"
              />
            </div>
            <div>
              <label htmlFor="model" className="block text-sm font-medium text-neutral-300 mb-2">Model</label>
              <input
                id="model"
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="gpt-3.5-turbo"
                className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-2 focus:ring-sky-500 focus:border-sky-500"
              />
            </div>
            <div>
              <label htmlFor="maxTokens" className="block text-sm font-medium text-neutral-300 mb-2">Max Tokens</label>
              <input
                id="maxTokens"
                type="number"
                value={maxTokens}
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
            className="fixed bottom-6 left-1/2 -translate-x-1/2 w-auto bg-neutral-800 border border-neutral-700 rounded-3xl shadow-2xl px-4 py-2 flex items-center justify-between z-50"
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            <div className="flex items-center gap-3">
              <InfoCircledIcon className="h-5 w-5 text-white" />
              <p className="text-white font-medium text-sm">Unsaved changes</p>
            </div>
            <div className="flex items-center gap-3 ml-3">
              <Button onClick={handleReset} size="sm" className="h-6 rounded-2xl text-red-500 border-red-500 bg-red-500/20 hover:bg-red-500/10 hover:text-red-400">Reset</Button>
              <Button onClick={handleSave} size="sm" className="h-6 rounded-2xl text-gray-300 hover:text-gray-200 bg-green-500/20 hover:bg-green-500/10">Save</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}