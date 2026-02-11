import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useAuth } from '@clerk/nextjs';
import { Loader2, X, FileText, FileJson } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Resume } from '@/types/frontend/resume';
import { useResumeStore } from '@/store/useResumeStore';
import { useSettingStore } from '@/store/useSettingStore';
import { toast } from 'sonner';
import { FaFileUpload } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { z } from 'zod';

// ─── Zod 校验 Schema ───

const InfoSchema = z.object({
  fullName: z.string().default(''),
  headline: z.string().default(''),
  email: z.string().default(''),
  phoneNumber: z.string().default(''),
  address: z.string().default(''),
  website: z.string().default(''),
  avatar: z.string().default(''),
});

// 统一的 SectionItem schema — 所有字段都是 string | null, id 和 visible 必须
const SectionItemSchema = z.object({
  id: z.string(),
  visible: z.boolean().default(true),
  company: z.string().nullable().default(null),
  position: z.string().nullable().default(null),
  date: z.string().nullable().default(null),
  location: z.string().nullable().default(null),
  website: z.string().nullable().default(null),
  summary: z.string().nullable().default(null),
  name: z.string().nullable().default(null),
  role: z.string().nullable().default(null),
  link: z.string().nullable().default(null),
  school: z.string().nullable().default(null),
  degree: z.string().nullable().default(null),
  major: z.string().nullable().default(null),
  level: z.string().nullable().default(null),
  language: z.string().nullable().default(null),
  issuer: z.string().nullable().default(null),
  platform: z.string().nullable().default(null),
  url: z.string().nullable().default(null),
  description: z.string().nullable().default(null),
}).passthrough(); // 允许额外字段

const SectionOrderItemSchema = z.object({
  key: z.string(),
  label: z.string(),
});

// 标准 sections — 每个 key 都必须是数组（可以为空）
const SectionsSchema = z.object({
  experience: z.array(SectionItemSchema).default([]),
  education: z.array(SectionItemSchema).default([]),
  projects: z.array(SectionItemSchema).default([]),
  skills: z.array(SectionItemSchema).default([]),
  languages: z.array(SectionItemSchema).default([]),
  certificates: z.array(SectionItemSchema).default([]),
}).passthrough(); // 允许额外的自定义 section

// 完整的解析结果 schema
const ParsedResumeSchema = z.object({
  info: InfoSchema,
  sections: SectionsSchema,
  sectionOrder: z.array(SectionOrderItemSchema).min(1),
});

type ImportResumeDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function ImportResumeDialog({ open, onOpenChange }: ImportResumeDialogProps) {
  const { importResume } = useResumeStore();
  const { apiKey, baseUrl, model, maxTokens } = useSettingStore();
  const { getToken } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<string>('');
  const { t } = useTranslation();

  // ─── 校验并规范化简历数据（只返回已验证字段，不透传未知属性）───
  const validateAndNormalize = useCallback((data: unknown) => {
    const parsed = ParsedResumeSchema.parse(data);
    const raw = data as Record<string, unknown>;

    // 只提取已知的可选字段，不盲目 spread 原始对象
    return {
      info: parsed.info,
      sections: parsed.sections,
      sectionOrder: parsed.sectionOrder,
      // 显式提取允许的额外字段（有默认值兜底）
      template: (typeof raw.template === 'string' ? raw.template : 'classic'),
      themeColor: (typeof raw.themeColor === 'string' ? raw.themeColor : '#f97316'),
      typography: (typeof raw.typography === 'string' ? raw.typography : 'inter'),
      customTemplate: (raw.customTemplate && typeof raw.customTemplate === 'object' ? raw.customTemplate : {}),
    };
  }, []);

  // ─── JSON 文件处理 ───
  const handleJsonFile = useCallback(async (file: File) => {
    const reader = new FileReader();

    const readFile = () => new Promise<string>((resolve, reject) => {
      reader.onabort = () => reject(new Error(t('importDialog.errors.fileReadAborted')));
      reader.onerror = () => reject(new Error(t('importDialog.errors.fileReadFailed')));
      reader.onload = () => resolve(reader.result as string);
      reader.readAsText(file);
    });

    const content = await readFile();
    const result = JSON.parse(content);
    return validateAndNormalize(result);
  }, [t, validateAndNormalize]);

  // ─── PDF 文件处理（前端传递 LLM 配置）───
  const handlePdfFile = useCallback(async (file: File) => {
    setImportStatus(t('importDialog.pdf.extracting', { defaultValue: 'Extracting text from PDF...' }));

    const formData = new FormData();
    formData.append('file', file);

    // 传递用户的 LLM 配置
    const llmConfig = { apiKey, baseUrl, modelName: model, maxTokens };
    formData.append('config', JSON.stringify(llmConfig));

    setImportStatus(t('importDialog.pdf.analyzing', { defaultValue: 'AI is analyzing your resume...' }));

    const response = await fetch('/api/pdf/parse', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      const detail = errorData.detail || errorData.error || `Server error: ${response.status}`;
      throw new Error(detail);
    }

    const result = await response.json();
    return validateAndNormalize(result);
  }, [apiKey, baseUrl, model, maxTokens, t, validateAndNormalize]);

  // ─── 统一文件处理 ───
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setError(null);
    setImportStatus('');
    const file = acceptedFiles[acceptedFiles.length - 1];
    if (!file) return;

    const isPdf = file.name.toLowerCase().endsWith('.pdf');
    const isJson = file.name.toLowerCase().endsWith('.json');

    if (!isPdf && !isJson) {
      setError(t('importDialog.errors.unsupportedFormat', { defaultValue: 'Please upload a PDF or JSON file.' }));
      return;
    }

    // PDF 需要大模型解析，检查是否已配置 API Key
    if (isPdf && !apiKey) {
      setError(t('importDialog.errors.noApiKey', { defaultValue: 'Please configure your AI model API key in Settings before importing PDF files.' }));
      return;
    }

    setIsImporting(true);

    try {
      const result = isPdf
        ? await handlePdfFile(file)
        : await handleJsonFile(file);

      const resumeName = result.info?.fullName
        ? `${result.info.fullName}'s Resume`
        : t('importDialog.defaultName');

      const newResume: Resume = {
        id: Date.now().toString(),
        name: resumeName,
        updatedAt: Date.now(),
        info: result.info,
        sections: result.sections,
        sectionOrder: result.sectionOrder,
        template: result.template,
        themeColor: result.themeColor,
        typography: result.typography,
        customTemplate: result.customTemplate as Resume['customTemplate'],
      } as Resume;

      const token = await getToken();
      await importResume(newResume, token || undefined);

      toast.success(
        isPdf
          ? t('importDialog.pdf.success', { defaultValue: 'PDF resume imported successfully!' })
          : t('importDialog.success')
      );
      onOpenChange(false);
    } catch (e) {
      let message: string;
      if (e instanceof z.ZodError) {
        const issues = e.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ');
        message = `Invalid resume format: ${issues}`;
      } else {
        message = e instanceof Error ? e.message : t('importDialog.errors.parseFailed');
      }
      toast.error(message);
      setError(message);
    } finally {
      setIsImporting(false);
      setImportStatus('');
    }
  }, [importResume, getToken, onOpenChange, t, handleJsonFile, handlePdfFile, apiKey]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/json': ['.json'],
      'application/pdf': ['.pdf'],
    },
    multiple: false,
    disabled: isImporting,
  });

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !isImporting && onOpenChange(false)}
            className="fixed inset-0 bg-black/50 z-[100] backdrop-blur-sm"
          />
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-lg bg-[#1C1C1E] border border-neutral-800 rounded-3xl shadow-2xl p-8 pointer-events-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">{t('importDialog.title')}</h2>
                <button
                  onClick={() => !isImporting && onOpenChange(false)}
                  className="text-neutral-500 hover:text-white transition-colors"
                  type="button"
                  disabled={isImporting}
                >
                  <X size={20} />
                </button>
              </div>
              
              <p className="text-sm text-neutral-400 mb-6">{t('importDialog.description')}</p>

              <div
                {...getRootProps()}
                className={`mt-4 border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300 relative
                  ${isDragActive ? 'border-sky-500 bg-sky-500/10 shadow-[0_0_20px_rgba(14,165,233,0.15)]' : 'border-neutral-700 bg-neutral-900/50 hover:border-sky-600 hover:bg-neutral-800/50'}
                  ${isImporting ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}
                `}
              >
                <input {...getInputProps()} />
                {isImporting ? (
                  <div className="flex flex-col items-center justify-center text-sky-500">
                    <Loader2 className="w-12 h-12 mb-4 animate-spin" />
                    <p className="font-medium">{importStatus || t('importDialog.importing')}</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-sky-500/10 flex items-center justify-center text-sky-500 mb-4 transition-transform group-hover:scale-110">
                      <FaFileUpload size={28} />
                    </div>
                    {isDragActive ? (
                      <p className="text-sky-400 font-medium">{t('importDialog.dropzone.active')}</p>
                    ) : (
                      <p className="text-neutral-300 font-medium">{t('importDialog.dropzone.default')}</p>
                    )}
                    <div className="flex items-center gap-3 mt-3">
                      <span className="inline-flex items-center gap-1 text-xs text-neutral-500 bg-neutral-800/60 px-2.5 py-1 rounded-full">
                        <FileJson size={12} /> JSON
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs text-neutral-500 bg-neutral-800/60 px-2.5 py-1 rounded-full">
                        <FileText size={12} /> PDF
                      </span>
                    </div>
                    <p className="text-xs text-neutral-600 mt-2">
                      {t('importDialog.pdf.hint', { defaultValue: 'PDF files will be parsed with AI' })}
                    </p>
                  </div>
                )}
              </div>
              
              {error && <p className="mt-4 text-sm text-red-500 bg-red-500/10 border border-red-500/20 p-3 rounded-lg">{error}</p>}

              <div className="mt-8 flex justify-end">
                <Button 
                  variant="ghost" 
                  onClick={() => onOpenChange(false)} 
                  disabled={isImporting}
                  className="text-neutral-400 hover:text-white hover:bg-neutral-800"
                >
                  {t('importDialog.cancel')}
                </Button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
