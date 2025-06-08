"use client";

import { useSettingStore } from '@/store/useSettingStore';
import { toast } from 'sonner';

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
  } = useSettingStore();

  const handleSave = async () => {
    toast.success('Settings saved locally.');
  };

  return (
    <div className="flex-1 px-12 py-10 overflow-y-auto">
      <h1 className="text-3xl font-bold mb-4">Settings</h1>
      
      <div className="space-y-12 max-w-4xl">
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
          
          <div className="mt-8">
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg font-semibold transition-colors border border-neutral-700"
            >
              Save Locally
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}