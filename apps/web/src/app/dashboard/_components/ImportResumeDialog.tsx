import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Loader2, X, FileText, FileJson, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Resume } from '@/types/frontend/resume';
import { useResumeStore } from '@/store/useResumeStore';
import { useSettingStore } from '@/store/useSettingStore';
import { useAccountUiStore } from '@/store/useAccountUiStore';
import { toast } from 'sonner';
import { FaFileUpload } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { appLifecycle } from '@/lib/extensions/app-lifecycle';
import { getFileSizeBucket } from '@/lib/utils/fileSize';
import {
  formatResumeImportError,
  validateAndNormalizeImportedResume,
} from '@/lib/validation/importResume';
import { streamPdfParse } from '@/app/dashboard/edit/_components/ai/lib/services/agentClient';

type FileType = 'json' | 'pdf' | null;

type PdfPhase = 'extracting' | 'analyzing' | null;

/**
 * Resume sections lit up as the parser streams them, in the order their anchors
 * appear in the model's JSON (kept in sync with agent-service
 * `document/lib/pdf-field-progress.ts`). The `key` matches the backend field key.
 */
const PDF_SECTIONS: { key: string; labelKey: string; defaultLabel: string }[] = [
  { key: 'info', labelKey: 'importDialog.pdf.sections.info', defaultLabel: '个人信息' },
  { key: 'experience', labelKey: 'importDialog.pdf.sections.experience', defaultLabel: '工作经历' },
  { key: 'education', labelKey: 'importDialog.pdf.sections.education', defaultLabel: '教育经历' },
  { key: 'projects', labelKey: 'importDialog.pdf.sections.projects', defaultLabel: '项目经历' },
  { key: 'skills', labelKey: 'importDialog.pdf.sections.skills', defaultLabel: '技能' },
  { key: 'languages', labelKey: 'importDialog.pdf.sections.languages', defaultLabel: '语言能力' },
  { key: 'certificates', labelKey: 'importDialog.pdf.sections.certificates', defaultLabel: '证书' },
];

// ease-out-expo — natural deceleration, no bounce (per design language).
const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

/**
 * Smoothly counts the displayed number toward `value` (ease-out-cubic over 300ms).
 * A quiet liveness signal while parsing; jumps instantly under reduced motion.
 */
function CountUp({ value, animate }: { value: number; animate: boolean }) {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);

  useEffect(() => {
    const from = fromRef.current;
    const to = value;
    if (from === to) return;
    if (!animate) {
      fromRef.current = to;
      setDisplay(to);
      return;
    }
    const start = performance.now();
    const duration = 300;
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(from + (to - from) * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
      else fromRef.current = to;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, animate]);

  return <>{display.toLocaleString()}</>;
}

/** A checkmark that draws itself in a single stroke when a section lights up. */
function SectionCheck({ draw, delay }: { draw: boolean; delay: number }) {
  return (
    <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" aria-hidden>
      <motion.path
        d="M5 13l4 4L19 7"
        stroke="currentColor"
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={draw ? { pathLength: 0 } : false}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.24, ease: 'easeOut', delay }}
      />
    </svg>
  );
}

/**
 * PDF parse progress, "scanline" style: a sky band rides the active section (the
 * frontier of what's been parsed) while each section lights up — sky node + a
 * drawn check — as its data streams in. No spinner; the scan *is* the progress.
 */
function PdfScanProgress({
  phase,
  charCount,
  litFields,
  complete,
}: {
  phase: PdfPhase;
  charCount: number;
  litFields: Set<string>;
  complete: boolean;
}) {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  // The active row is the frontier: first section not yet lit. Anchored to real
  // progress — never a constant-speed fake sweep.
  const activeIndex = complete
    ? -1
    : PDF_SECTIONS.findIndex((s) => !litFields.has(s.key));

  const heading = complete
    ? t('importDialog.pdf.done', { defaultValue: '解析完成' })
    : phase === 'analyzing'
      ? t('importDialog.pdf.analyzing', { defaultValue: '解析中' })
      : t('importDialog.pdf.extracting', { defaultValue: '读取 PDF' });

  return (
    <div className="text-left">
      <div className="mb-4 flex items-baseline justify-between">
        <span className="text-sm font-medium text-neutral-100">{heading}</span>
        {phase === 'analyzing' && !complete && charCount > 0 && (
          <span className="text-xs tabular-nums text-neutral-500">
            <CountUp value={charCount} animate={!reduceMotion} />{' '}
            {t('importDialog.pdf.charUnit', { defaultValue: '字' })}
          </span>
        )}
      </div>

      <ul className="relative flex flex-col gap-0.5">
        {/* Completion sweep: a single sky band runs down the whole list and fades. */}
        {complete && !reduceMotion && (
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-full rounded-lg bg-gradient-to-b from-transparent via-sky-500/10 to-transparent"
            initial={{ y: '-110%', opacity: 0.9 }}
            animate={{ y: '110%', opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        )}
        {PDF_SECTIONS.map((section, i) => {
          const lit = litFields.has(section.key) || complete;
          const active = i === activeIndex;
          return (
            <li
              key={section.key}
              className="relative flex h-10 items-center gap-3 rounded-lg px-3"
            >
              {active && !complete && (
                <motion.div
                  layoutId="pdf-scanband"
                  className="absolute inset-0 rounded-lg bg-sky-500/[0.08] ring-1 ring-inset ring-sky-500/25"
                  transition={{ duration: 0.32, ease: EASE_OUT_EXPO }}
                >
                  {!reduceMotion && (
                    <motion.span
                      className="absolute inset-x-3 bottom-0 h-px bg-sky-400"
                      animate={{ opacity: [0.25, 0.75, 0.25] }}
                      transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                    />
                  )}
                </motion.div>
              )}
              <span
                className={`relative z-10 flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition-colors duration-200 ${
                  lit
                    ? 'bg-sky-500 text-neutral-950'
                    : active
                      ? 'border border-sky-500/60'
                      : 'border border-neutral-700'
                }`}
                style={complete ? { transitionDelay: `${i * 45}ms` } : undefined}
              >
                {lit && <SectionCheck draw={!reduceMotion} delay={complete ? i * 0.045 : 0} />}
              </span>
              <span
                className={`relative z-10 text-sm transition-colors duration-200 ${
                  lit ? 'text-neutral-100' : active ? 'text-sky-200' : 'text-neutral-500'
                }`}
                style={complete ? { transitionDelay: `${i * 45}ms` } : undefined}
              >
                {t(section.labelKey, { defaultValue: section.defaultLabel })}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

type ImportResumeDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function ImportResumeDialog({ open, onOpenChange }: ImportResumeDialogProps) {
  const { importResume } = useResumeStore();
  const { apiKey, baseUrl, model, maxTokens, cloudSync, hasLlmConfig: hasLlmConfigFn } = useSettingStore();
  const openSettings = useAccountUiStore((s) => s.openSettings);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [llmConfigMissing, setLlmConfigMissing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<string>('');
  const [fileType, setFileType] = useState<FileType>(null);
  // PDF streaming progress: current phase, running char count, and the set of
  // sections lit up so far. Decorative — the imported result still comes from the
  // final `resume_update` + validation.
  const [pdfPhase, setPdfPhase] = useState<PdfPhase>(null);
  const [pdfCharCount, setPdfCharCount] = useState(0);
  const [pdfLitFields, setPdfLitFields] = useState<Set<string>>(new Set());
  const [pdfComplete, setPdfComplete] = useState(false);
  const pdfAbortRef = useRef<AbortController | null>(null);
  const { t } = useTranslation();
  // Shared readiness check (provider + key + baseUrl + model + maxTokens) — see useSettingStore.
  const hasLlmConfig = hasLlmConfigFn();

  const resetPdfProgress = useCallback(() => {
    setPdfPhase(null);
    setPdfCharCount(0);
    setPdfLitFields(new Set());
    setPdfComplete(false);
  }, []);

  const handleClose = useCallback((open: boolean) => {
    if (!open) {
      // Cancel any in-flight parse so the backend stops generating (no orphaned
      // token burn) when the user closes mid-import.
      pdfAbortRef.current?.abort();
      pdfAbortRef.current = null;
      setFileType(null);
      setUploadError(null);
      setLlmConfigMissing(false);
      setImportStatus('');
      resetPdfProgress();
    }
    onOpenChange(open);
  }, [onOpenChange, resetPdfProgress]);

  const handleSelectType = useCallback((value: string) => {
    const type = value as FileType;
    setUploadError(null);
    setFileType(type);
    setLlmConfigMissing(type === 'pdf' && !hasLlmConfig);
  }, [hasLlmConfig]);

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
    return validateAndNormalizeImportedResume(result);
  }, [t]);

  // ─── PDF 文件处理（流式解析 + 逐板块点亮）───
  const handlePdfFile = useCallback(async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    // 传递用户的 LLM 配置
    formData.append('config', JSON.stringify({ apiKey, baseUrl, modelName: model, maxTokens }));

    const controller = new AbortController();
    pdfAbortRef.current = controller;

    resetPdfProgress();
    setPdfPhase('extracting');

    let resume: unknown = null;

    for await (const ev of streamPdfParse(formData, controller.signal)) {
      if (ev.type === 'tool_result') {
        const payload = ev.payload as
          | { kind?: string; phase?: PdfPhase; charCount?: number; fields?: string[] }
          | undefined;
        if (payload?.kind !== 'pdf_progress') continue;
        if (payload.phase) setPdfPhase(payload.phase);
        if (typeof payload.charCount === 'number') setPdfCharCount(payload.charCount);
        if (payload.fields?.length) {
          setPdfLitFields((prev) => {
            const next = new Set(prev);
            for (const f of payload.fields!) next.add(f);
            return next;
          });
        }
      } else if (ev.type === 'resume_update') {
        // Final product: prefer `data`, fall back to the chat-shaped `payload.resume`.
        resume = ev.data ?? (ev.payload as { resume?: unknown } | undefined)?.resume ?? null;
      } else if (ev.type === 'error' || ev.type === 'run_failed') {
        throw new Error(ev.error || t('importDialog.errors.parseFailed'));
      }
    }

    if (!resume) {
      throw new Error(t('importDialog.errors.parseFailed'));
    }

    // Completion beat: light every section, run the finishing sweep, and hold on
    // "解析完成" briefly so the user sees the parse land before the dialog closes.
    setPdfLitFields(new Set(PDF_SECTIONS.map((s) => s.key)));
    setPdfComplete(true);
    await new Promise((r) => setTimeout(r, 600));

    return validateAndNormalizeImportedResume(resume);
  }, [apiKey, baseUrl, model, maxTokens, t, resetPdfProgress]);

  // ─── 统一文件处理 ───
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setUploadError(null);
    setImportStatus('');
    const file = acceptedFiles[acceptedFiles.length - 1];
    if (!file) return;
    if (!fileType) return;
    if (fileType === 'pdf' && !hasLlmConfig) {
      setLlmConfigMissing(true);
      setUploadError(t('importDialog.errors.noApiKey', { defaultValue: 'Please complete your AI model settings before importing PDF files.' }));
      return;
    }

    setIsImporting(true);

    try {
      const result = fileType === 'pdf'
        ? await handlePdfFile(file)
        : await handleJsonFile(file);

      const resumeName = result.info?.fullName
        ? `${result.info.fullName}'s Resume`
        : (result as Record<string, unknown>).name as string || t('importDialog.defaultName');

      const newResume: Resume = {
        ...(result as Record<string, unknown>),
        id: Date.now().toString(),
        name: resumeName,
        updatedAt: Date.now(),
        template: ((result as Record<string, unknown>).template as string) || 'classic',
        themeColor: ((result as Record<string, unknown>).themeColor as string) || '#f97316',
        typography: ((result as Record<string, unknown>).typography as string) || 'inter',
        customTemplate: ((result as Record<string, unknown>).customTemplate as Resume['customTemplate']) || {},
      } as Resume;

      await importResume(newResume);
      appLifecycle.resumeImportCompleted({
        source: fileType,
        cloudSyncEnabled: cloudSync,
        sizeBucket: getFileSizeBucket(file.size),
      });

      toast.success(
        fileType === 'pdf'
          ? t('importDialog.pdf.success', { defaultValue: 'PDF resume imported successfully!' })
          : t('importDialog.success')
      );
      handleClose(false);
    } catch (e) {
      const message = formatResumeImportError(e, t('importDialog.errors.parseFailed'));
      toast.error(message);
      setUploadError(message);
    } finally {
      setIsImporting(false);
      setImportStatus('');
      pdfAbortRef.current = null;
    }
  }, [fileType, hasLlmConfig, importResume, handleClose, t, handleJsonFile, handlePdfFile, cloudSync]);

  const dropzoneAccept: Record<string, string[]> = fileType === 'pdf'
    ? { 'application/pdf': ['.pdf'] }
    : { 'application/json': ['.json'] };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: dropzoneAccept,
    multiple: false,
    disabled: isImporting || fileType === null,
  });

  const showUploadZone = fileType !== null && !llmConfigMissing;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !isImporting && handleClose(false)}
            className="fixed inset-0 bg-black/50 z-100 backdrop-blur-sm cursor-pointer"
          />
          <div className="fixed inset-0 z-101 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-lg bg-[#1C1C1E] border border-neutral-800 rounded-3xl shadow-2xl p-8 pointer-events-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-bold text-white">{t('importDialog.title')}</h2>
                <button
                  onClick={() => !isImporting && handleClose(false)}
                  className="text-neutral-500 hover:text-white transition-colors cursor-pointer"
                  type="button"
                  disabled={isImporting}
                >
                  <X size={20} />
                </button>
              </div>

              <p className="text-sm text-neutral-400 mb-6">{t('importDialog.description')}</p>

              {/* 类型选择 */}
              <div className="mb-5">
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  {t('importDialog.typeLabel', { defaultValue: '类型' })}
                </label>
                <Select
                  value={fileType ?? ''}
                  onValueChange={handleSelectType}
                  disabled={isImporting}
                >
                  <SelectTrigger className="w-full bg-neutral-900 border-neutral-700 text-neutral-200 hover:border-neutral-600 focus:border-sky-500 focus:ring-sky-500/20 h-10 rounded-xl">
                    <SelectValue placeholder={t('importDialog.typePlaceholder', { defaultValue: '选择文件类型...' })} />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-900 border-neutral-700 rounded-xl z-200">
                    <SelectItem
                      value="json"
                      className="text-neutral-200 focus:bg-neutral-800 focus:text-white rounded-lg cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <FileJson size={15} className="text-sky-400 shrink-0" />
                        {'Magic Resume JSON'}
                      </span>
                    </SelectItem>
                    <SelectItem
                      value="pdf"
                      className="text-neutral-200 focus:bg-neutral-800 focus:text-white rounded-lg cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <FileText size={15} className="text-sky-400 shrink-0" />
                        {'PDF'}
                        <span className="inline-flex items-center text-[10px] font-semibold text-sky-400 bg-sky-500/15 border border-sky-500/30 px-1.5 py-0.5 rounded-full leading-none">
                          {'AI'}
                        </span>
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* API Key 未配置警告 */}
              <AnimatePresence>
                {llmConfigMissing && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden mb-5"
                  >
                    <div className="flex items-start gap-2 text-sm text-amber-400 bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl">
                      <AlertTriangle size={15} className="mt-0.5 shrink-0" />
                      <span>
                        {t('importDialog.errors.noApiKey', { defaultValue: '使用 PDF 导入需要先完成大模型配置（API Key、Base URL、模型、Max Tokens），请前往' })}{' '}
                        <button
                          type="button"
                          onClick={() => {
                            handleClose(false);
                            openSettings('model');
                          }}
                          className="underline underline-offset-2 hover:text-amber-300 font-medium"
                        >
                          {t('importDialog.errors.noApiKeyLink', { defaultValue: '设置' })}
                        </button>
                        {' '}{t('importDialog.errors.noApiKeySuffix', { defaultValue: '完成配置后再试。' })}
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* 上传区域 */}
              <AnimatePresence>
                {showUploadZone && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div
                      {...getRootProps()}
                      className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-300
                        ${isDragActive ? 'border-sky-500 bg-sky-500/10 shadow-[0_0_20px_rgba(14,165,233,0.15)]' : 'border-neutral-700 bg-neutral-900/50 hover:border-sky-600 hover:bg-neutral-800/50'}
                        ${isImporting ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}
                      `}
                    >
                      <input {...getInputProps()} />
                      {isImporting && fileType === 'pdf' ? (
                        <PdfScanProgress
                          phase={pdfPhase}
                          charCount={pdfCharCount}
                          litFields={pdfLitFields}
                          complete={pdfComplete}
                        />
                      ) : isImporting ? (
                        <div className="flex flex-col items-center justify-center text-sky-500">
                          <Loader2 className="w-10 h-10 mb-3 animate-spin" />
                          <p className="font-medium text-sm">{importStatus || t('importDialog.importing')}</p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center">
                          <div className="w-14 h-14 rounded-full bg-sky-500/10 flex items-center justify-center text-sky-500 mb-3">
                            <FaFileUpload size={24} />
                          </div>
                          {isDragActive ? (
                            <p className="text-sky-400 font-medium text-sm">{t('importDialog.dropzone.active')}</p>
                          ) : (
                            <p className="text-neutral-300 font-medium text-sm">{t('importDialog.dropzone.default')}</p>
                          )}
                          <span className="inline-flex items-center gap-1 text-xs text-neutral-500 bg-neutral-800/60 px-2.5 py-1 rounded-full mt-2.5">
                            {fileType === 'pdf' ? <FileText size={11} /> : <FileJson size={11} />}
                            {fileType === 'pdf' ? '.pdf' : '.json'}
                          </span>
                        </div>
                      )}
                    </div>

                    {uploadError && (
                      <p className="mt-3 text-sm text-red-400 bg-red-500/10 border border-red-500/20 p-3 rounded-xl">{uploadError}</p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="mt-6 flex justify-end">
                <Button
                  variant="ghost"
                  onClick={() => handleClose(false)}
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
