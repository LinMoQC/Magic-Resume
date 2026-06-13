import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Languages, Code2, Eye, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useSettingStore } from '@/store/useSettingStore';
import { translateApi, TranslateStreamEvent } from '@/lib/api/translate';
import ResumePreview from '../preview/ResumePreview';
import { useResumeStore } from '@/store/useResumeStore';
import { EditorComponents } from '@/lib/utils/componentOptimization';
import { InfoType, Section, Resume } from '@/types/frontend/resume';

type TranslateTabProps = {
  resumeData: Resume;
  onApplyResume: (newResume: Resume) => void;
  setIsAiJobRunning: (isRunning: boolean) => void;
};

const TARGET_LANGUAGE_OPTIONS = [
  { value: 'Chinese', key: 'modals.aiModal.translateTab.targetLanguage.options.zh' },
  { value: 'English', key: 'modals.aiModal.translateTab.targetLanguage.options.en' },
  { value: 'Japanese', key: 'modals.aiModal.translateTab.targetLanguage.options.ja' },
  { value: 'Korean', key: 'modals.aiModal.translateTab.targetLanguage.options.ko' },
  { value: 'French', key: 'modals.aiModal.translateTab.targetLanguage.options.fr' },
  { value: 'German', key: 'modals.aiModal.translateTab.targetLanguage.options.de' },
  { value: 'Spanish', key: 'modals.aiModal.translateTab.targetLanguage.options.es' },
  { value: 'Portuguese', key: 'modals.aiModal.translateTab.targetLanguage.options.pt' },
  { value: 'Italian', key: 'modals.aiModal.translateTab.targetLanguage.options.it' },
  { value: 'Russian', key: 'modals.aiModal.translateTab.targetLanguage.options.ru' },
  { value: 'Arabic', key: 'modals.aiModal.translateTab.targetLanguage.options.ar' },
  { value: 'Hindi', key: 'modals.aiModal.translateTab.targetLanguage.options.hi' },
];

const ReactJsonView = EditorComponents.JsonViewer;

type ResumePreviewData = {
  info: InfoType;
  sections: Section;
  sectionOrder: string[];
};

const isResumeLike = (value: unknown): value is ResumePreviewData => {
  if (!value || typeof value !== 'object') return false;
  const obj = value as Record<string, unknown>;
  return Boolean(
    obj.info &&
    typeof obj.info === 'object' &&
    obj.sections &&
    typeof obj.sections === 'object' &&
    Array.isArray(obj.sectionOrder)
  );
};

const buildResumeSourceText = (resumeData: Resume) => {
  return JSON.stringify(
    {
      info: resumeData.info,
      sections: resumeData.sections,
      sectionOrder: resumeData.sectionOrder,
    },
    null,
    2
  );
};

export default function TranslateTab({ resumeData, onApplyResume, setIsAiJobRunning }: TranslateTabProps) {
  const { t } = useTranslation();
  const { apiKey, baseUrl, model, maxTokens } = useSettingStore();
  const templateId = useResumeStore(state => state.activeResume?.template || 'classic');

  const [sourceText] = useState(() => buildResumeSourceText(resumeData));
  const [targetLanguage, setTargetLanguage] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [streamStage, setStreamStage] = useState<'idle' | 'translating' | 'json'>('idle');
  const [translatedText, setTranslatedText] = useState('');
  const [resumeJsonRaw, setResumeJsonRaw] = useState<Record<string, unknown> | null>(null);
  const [viewMode, setViewMode] = useState<'json' | 'preview'>('json');
  const streamTextRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isTranslating || !streamTextRef.current) return;
    // Keep latest streamed text visible for "live transmission" effect.
    streamTextRef.current.scrollTop = streamTextRef.current.scrollHeight;
  }, [translatedText, isTranslating]);

  const resumePreviewData = useMemo(() => {
    if (!resumeJsonRaw || !isResumeLike(resumeJsonRaw)) return null;
    const sectionOrderKeys = resumeJsonRaw.sectionOrder.map((item) => {
      if (typeof item === 'string') return item;
      if (item && typeof item === 'object' && 'key' in item) {
        return String((item as { key: unknown }).key);
      }
      return '';
    }).filter(Boolean);

    return {
      info: resumeJsonRaw.info,
      sections: resumeJsonRaw.sections,
      sectionOrder: sectionOrderKeys.length > 0 ? sectionOrderKeys : ['basics', 'education', 'experience', 'projects', 'skills'],
    };
  }, [resumeJsonRaw]);

  const translatedResume = useMemo<Resume | null>(() => {
    if (!resumePreviewData || !resumeJsonRaw) return null;
    const raw = resumeJsonRaw as Record<string, unknown>;
    const nextSectionOrder = resumePreviewData.sectionOrder.map((key) => ({
      key,
      label: key.charAt(0).toUpperCase() + key.slice(1),
    }));

    return {
      ...resumeData,
      info: resumePreviewData.info,
      sections: resumePreviewData.sections,
      sectionOrder: nextSectionOrder,
      template: typeof raw.template === 'string' ? raw.template : resumeData.template,
      themeColor: typeof raw.themeColor === 'string' ? raw.themeColor : resumeData.themeColor,
      typography: typeof raw.typography === 'string' ? raw.typography : resumeData.typography,
      name: typeof raw.name === 'string' && raw.name.trim() ? raw.name : resumeData.name,
      updatedAt: Date.now(),
    };
  }, [resumeData, resumeJsonRaw, resumePreviewData]);

  const handleTranslate = async () => {
    if (!sourceText.trim() || isTranslating) return;

    if (!apiKey) {
      toast.error(t('modals.aiModal.notifications.apiKeyMissing'));
      return;
    }
    if (!targetLanguage) {
      toast.error(t('modals.aiModal.translateTab.notifications.targetLanguageRequired'));
      return;
    }

    setIsTranslating(true);
    setIsAiJobRunning(true);
    setStreamStage('translating');
    setTranslatedText('');
    setResumeJsonRaw(null);
    let latestTranslatedText = '';

    try {
      await translateApi.translateTextStream({
        text: sourceText,
        target_language: targetLanguage,
        custom_prompt: customPrompt.trim() || undefined,
        generate_resume_json: true,
        config: {
          apiKey,
          baseUrl,
          modelName: model,
          maxTokens,
        },
      }, (event: TranslateStreamEvent) => {
        if (event.type === 'translation_chunk') {
          latestTranslatedText += event.content;
          setTranslatedText(latestTranslatedText);
          setStreamStage('translating');
          return;
        }
        if (event.type === 'translation_done') {
          latestTranslatedText = event.translated_text || latestTranslatedText;
          setTranslatedText(latestTranslatedText);
          return;
        }
        if (event.type === 'json_start') {
          setStreamStage('json');
          return;
        }
        if (event.type === 'json_done') {
          setResumeJsonRaw(event.resume_json ?? null);
          setStreamStage('idle');
          return;
        }
        if (event.type === 'error') {
          throw new Error(event.message || 'Stream error');
        }
      });

      if (!latestTranslatedText.trim()) {
        throw new Error('Empty translation result');
      }

      toast.success(t('modals.aiModal.translateTab.notifications.success'));
    } catch (error) {
      const message = error instanceof Error ? error.message : t('modals.aiModal.notifications.unknownError');
      toast.error(t('modals.aiModal.translateTab.notifications.failed', { message }));
    } finally {
      setIsTranslating(false);
      setStreamStage('idle');
      setIsAiJobRunning(false);
    }
  };

  const handleApplyTranslatedResume = () => {
    if (!translatedResume) {
      toast.error(t('modals.aiModal.translateTab.notifications.noResultToApply'));
      return;
    }
    onApplyResume(translatedResume);
    toast.success(t('modals.aiModal.translateTab.notifications.applySuccess'));
  };

  return (
    <div className="h-full min-h-0 grid grid-cols-1 lg:grid-cols-2 gap-4 py-2">
      <div className="min-h-0 overflow-hidden bg-neutral-900 rounded-lg border border-neutral-800 p-4 flex flex-col gap-3">
        <div className="space-y-1">
          <h3 className="text-base font-semibold text-white">
            {t('modals.aiModal.translateTab.inputTitle')}
          </h3>
          <p className="text-xs text-neutral-400">
            {t('modals.aiModal.translateTab.inputDescription')}
          </p>
        </div>

        <div className="space-y-2 flex flex-col">
          <Label htmlFor="translate-target-language" className="text-neutral-300">
            {t('modals.aiModal.translateTab.targetLanguage.label')}
          </Label>
          <Select
            value={targetLanguage}
            onValueChange={setTargetLanguage}
            disabled={isTranslating}
          >
            <SelectTrigger
              id="translate-target-language"
              className="w-full h-10 bg-neutral-800 border-neutral-700 text-neutral-100 focus:ring-sky-500/60 focus:border-sky-500"
            >
              <SelectValue placeholder={t('modals.aiModal.translateTab.targetLanguage.placeholder')} />
            </SelectTrigger>
            <SelectContent className="z-220 bg-neutral-900 border-neutral-700 text-neutral-100 max-h-64">
              {TARGET_LANGUAGE_OPTIONS.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  className="focus:bg-neutral-800 focus:text-sky-300"
                >
                  {t(option.key)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 flex flex-col flex-1 min-h-0">
          <Label htmlFor="translate-custom-prompt" className="text-neutral-300">
            {t('modals.aiModal.translateTab.customPrompt.label')}
          </Label>
          <Textarea
            id="translate-custom-prompt"
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder={t('modals.aiModal.translateTab.customPrompt.placeholder')}
            className="flex-1 min-h-0 bg-neutral-800 border-neutral-700 focus:ring-sky-500 focus:border-sky-500 resize-none text-sm"
            disabled={isTranslating}
          />
        </div>

        <Button
          type="button"
          onClick={handleTranslate}
          disabled={isTranslating || !sourceText.trim()}
          className="w-full bg-sky-600 hover:bg-sky-500 text-white"
        >
          {isTranslating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t('modals.aiModal.translateTab.translateButtonLoading')}
            </>
          ) : (
            <>
              <Languages className="mr-2 h-4 w-4" />
              {t('modals.aiModal.translateTab.translateButton')}
            </>
          )}
        </Button>
      </div>

      <div className="min-h-0 overflow-hidden bg-neutral-900 rounded-lg border border-neutral-800 p-4 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-white">
              {t('modals.aiModal.translateTab.outputTitle')}
            </h3>
            <p className="text-xs text-neutral-400">
              {t('modals.aiModal.translateTab.outputDescription')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-neutral-900/70 p-1 rounded-lg border border-neutral-700/60 w-fit">
          <Button
            size="sm"
            onClick={() => setViewMode('json')}
            className={`px-3 py-1.5 h-auto text-xs font-medium rounded-md transition-all ${viewMode === 'json'
              ? 'bg-linear-to-r from-slate-200 to-slate-100 text-slate-900'
              : 'bg-transparent text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200'}`}
          >
            <Code2 size={13} className="mr-1" />
            {t('modals.aiModal.translateTab.viewModes.json')}
          </Button>
          <Button
            size="sm"
            onClick={() => setViewMode('preview')}
            className={`px-3 py-1.5 h-auto text-xs font-medium rounded-md transition-all ${viewMode === 'preview'
              ? 'bg-linear-to-r from-slate-200 to-slate-100 text-slate-900'
              : 'bg-transparent text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200'}`}
          >
            <Eye size={13} className="mr-1" />
            {t('modals.aiModal.translateTab.viewModes.preview')}
          </Button>
        </div>

        <div className="flex-1 min-h-0 rounded-lg border border-neutral-700/60 bg-neutral-900/40 overflow-auto hide-scrollbar p-3">
          {isTranslating && (
            <div className="h-full flex flex-col items-center justify-center text-center px-4">
              <Loader2 className="h-8 w-8 animate-spin text-sky-400 mb-3" />
              <p className="text-sm text-neutral-200">
                {streamStage === 'json'
                  ? t('modals.aiModal.translateTab.loading.generatingJson')
                  : t('modals.aiModal.translateTab.loading.translating')}
              </p>
              {translatedText && (
                <div className="mt-3 w-full max-w-xl">
                  <div className="relative h-24 overflow-hidden">
                    <div
                      ref={streamTextRef}
                      className="h-full overflow-y-auto hide-scrollbar px-1 text-left text-xs text-neutral-400 whitespace-pre-wrap wrap-break-word pointer-events-none select-none"
                    >
                      {translatedText}
                    </div>
                    <div className="pointer-events-none absolute inset-x-0 top-0 h-7 bg-linear-to-b from-neutral-900/95 to-transparent" />
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-7 bg-linear-to-t from-neutral-900/95 to-transparent" />
                  </div>
                </div>
              )}
            </div>
          )}

          {!isTranslating && !resumeJsonRaw && (
            <div className="h-full flex items-center justify-center text-sm text-neutral-500 text-center px-4">
              {t('modals.aiModal.translateTab.emptyJsonState')}
            </div>
          )}

          {!isTranslating && resumeJsonRaw && viewMode === 'json' && (
            <ReactJsonView
              src={resumeJsonRaw}
              theme="ocean"
              collapsed={1}
              displayDataTypes={false}
              name={false}
              displayObjectSize={true}
              displayArrayKey={true}
              style={{ background: 'transparent', fontSize: '12px', lineHeight: '1.5' }}
            />
          )}

          {!isTranslating && resumeJsonRaw && viewMode === 'preview' && (
            <>
              {!resumePreviewData ? (
                <div className="h-full flex items-center justify-center text-sm text-amber-400 text-center px-4">
                  {t('modals.aiModal.translateTab.invalidPreviewData')}
                </div>
              ) : (
                <div className="p-2 bg-white/95 h-full w-full flex justify-center overflow-auto hide-scrollbar rounded-lg">
                  <div style={{ transform: 'scale(0.5)', transformOrigin: 'top center', minWidth: '600px' }}>
                    <ResumePreview
                      info={resumePreviewData.info}
                      sections={resumePreviewData.sections}
                      sectionOrder={resumePreviewData.sectionOrder}
                      templateId={templateId}
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </div>
        {!isTranslating && translatedResume && (
          <Button
            onClick={handleApplyTranslatedResume}
            className="w-full h-10 bg-linear-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold rounded-lg transition-all duration-200"
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            {t('modals.aiModal.translateTab.applyButton')}
          </Button>
        )}
      </div>
    </div>
  );
}
