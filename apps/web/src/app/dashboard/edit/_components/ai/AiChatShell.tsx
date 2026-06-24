'use client';

import React, { useCallback, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FlaskConical, FileText, SquarePen, X, Bot, PencilRuler, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { nanoid } from 'nanoid';
import { toast } from 'sonner';
import { InfoType, Resume, Section } from '@/types/frontend/resume';
import { SKILLS } from './skills/registry';
import type { CanvasState, CanvasView, ChatMessage, SkillId } from './types';
import ChatThread from './conversation/ChatThread';
import Composer from './conversation/Composer';
import SkillParamForm from './conversation/SkillParamForm';
import WelcomeSuggestions from './conversation/WelcomeSuggestions';
import ArtifactCanvas from './canvas/ArtifactCanvas';
import InterviewOverlay from './interview/InterviewOverlay';
import LivingCanvas, { type BatchRequest, type FocusRequest } from './canvas/living/LivingCanvas';

type AiChatShellProps = {
  resumeData: Resume;
  templateId: string;
  onClose: () => void;
  onApplySections: (sections: Section) => void;
  onApplyInfo: (info: InfoType) => void;
  setIsAiJobRunning: (running: boolean) => void;
};

const CLOSED_CANVAS: CanvasState = { open: false, skillId: null, view: 'preview', status: 'idle' };

export default function AiChatShell({
  resumeData,
  templateId,
  onClose,
  onApplySections,
  onApplyInfo,
  setIsAiJobRunning,
}: AiChatShellProps) {
  const [started, setStarted] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [paramSkill, setParamSkill] = useState<SkillId | null>(null);
  const [canvas, setCanvas] = useState<CanvasState>(CLOSED_CANVAS);
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [running, setRunning] = useState(false);
  const [livingOpen, setLivingOpen] = useState(false);
  const [livingSkillId, setLivingSkillId] = useState<SkillId | null>(null);
  const [batchRequest, setBatchRequest] = useState<BatchRequest | null>(null);
  const [focusRequest, setFocusRequest] = useState<FocusRequest | null>(null);
  const [railCollapsed, setRailCollapsed] = useState(false);
  const batchNonce = useRef(0);
  const focusNonce = useRef(0);

  const addMessage = useCallback((msg: ChatMessage) => {
    setMessages((prev) => [...prev, msg]);
  }, []);

  const addAssistant = useCallback(
    (content: string) => addMessage({ id: nanoid(), role: 'assistant', content }),
    [addMessage]
  );

  const logChange = useCallback(
    (content: string, resumePath?: string) =>
      addMessage({ id: nanoid(), role: 'log', content, resumePath }),
    [addMessage]
  );

  // Click a log entry → reopen the canvas and scroll to that spot (design §5 可点回溯).
  const focusOnCanvas = useCallback((resumePath: string) => {
    focusNonce.current += 1;
    setLivingOpen(true);
    setRailCollapsed(false);
    setFocusRequest({ path: resumePath, nonce: focusNonce.current });
  }, []);

  const toggleLiving = useCallback(() => {
    setLivingOpen((open) => {
      const next = !open;
      if (next) {
        setStarted(true);
        setCanvas(CLOSED_CANVAS);
        setBatchRequest(null); // manual open starts clean — don't replay a prior skill batch
        setLivingSkillId(null);
      }
      return next;
    });
  }, []);

  // P3 · a whole-resume content skill (optimize / translate) drops its result onto
  // the living canvas as a batch of in-place pending changes instead of a Diff tab.
  const isBatchSkill = (id: SkillId) => id === 'optimize' || id === 'translate';

  const seedBatch = useCallback((id: SkillId, params: Record<string, string>) => {
    batchNonce.current += 1;
    const kind = id === 'translate' ? 'translate' : 'optimize';
    setStarted(true);
    setCanvas(CLOSED_CANVAS);
    setLivingOpen(true);
    setLivingSkillId(id);
    setBatchRequest({ kind, lang: params.lang, nonce: batchNonce.current });
  }, []);

  const runSkill = useCallback(
    (id: SkillId, params: Record<string, string>, opts?: { addIntent?: boolean }) => {
      const skill = SKILLS[id];
      setStarted(true);
      setParamSkill(null);
      if (opts?.addIntent !== false) {
        addMessage({ id: nanoid(), role: 'user', content: skill.buildIntent(params) });
      }
      const execId = nanoid();
      addMessage({ id: execId, role: 'exec', skillId: id, status: 'running' });
      setRunning(true);
      setIsAiJobRunning(true);

      window.setTimeout(() => {
        setMessages((prev) =>
          prev.map((m) => (m.id === execId ? { ...m, status: 'done' } : m))
        );
        setRunning(false);
        setIsAiJobRunning(false);
        if (isBatchSkill(id)) {
          seedBatch(id, params);
        } else if (skill.canvas) {
          setLivingOpen(false);
          setCanvas({ open: true, skillId: id, view: skill.canvas.defaultView, status: 'ready' });
        }
      }, 1500);
    },
    [addMessage, setIsAiJobRunning, seedBatch]
  );

  const selectSkill = useCallback(
    (id: SkillId) => {
      const skill = SKILLS[id];
      setStarted(true);
      if (skill.surface === 'immersive') {
        setOverlayOpen(true);
        return;
      }
      if (skill.isChat) {
        addAssistant('好，我们从零开始。先告诉我：你的目标岗位和所在行业是什么？');
        return;
      }
      if (skill.params.length > 0) {
        setParamSkill(id);
        return;
      }
      runSkill(id, {});
    },
    [addAssistant, runSkill]
  );

  const handleSend = useCallback(
    (text: string) => {
      setStarted(true);
      addMessage({ id: nanoid(), role: 'user', content: text });
      if (/优化|jd|岗位/i.test(text)) {
        setParamSkill('optimize');
      } else if (/翻|英文|english|日|韩/i.test(text)) {
        setParamSkill('translate');
      } else if (/分析|体检|评分|竞争力/.test(text)) {
        window.setTimeout(() => runSkill('analyze', {}, { addIntent: false }), 250);
      } else if (/面试|模拟/.test(text)) {
        setOverlayOpen(true);
      } else if (/创建|从零|搭建|新建|从头|新简历/.test(text)) {
        window.setTimeout(
          () => addAssistant('好，我们从零开始。先告诉我：你的目标岗位和所在行业是什么？'),
          250
        );
      } else {
        window.setTimeout(
          () => addAssistant('我可以优化、分析、翻译，或模拟面试。选个技能，或告诉我目标岗位。'),
          250
        );
      }
    },
    [addAssistant, addMessage, runSkill]
  );

  const cancelParams = useCallback(() => {
    setParamSkill(null);
    setStarted((s) => (messages.length === 0 ? false : s));
  }, [messages.length]);

  const toggleCanvas = useCallback(
    (id: SkillId) => {
      // Content skills live on the living canvas — re-open it and regenerate the batch.
      if (isBatchSkill(id)) {
        if (livingOpen) {
          setLivingOpen(false);
        } else {
          seedBatch(id, {});
        }
        return;
      }
      setLivingOpen(false);
      setCanvas((prev) => {
        if (prev.open && prev.skillId === id) return { ...prev, open: false };
        const sk = SKILLS[id];
        if (!sk.canvas) return prev;
        return {
          open: true,
          skillId: id,
          view: sk.canvas.defaultView,
          status: prev.skillId === id ? prev.status : 'ready',
        };
      });
    },
    [livingOpen, seedBatch]
  );

  const applyChanges = useCallback(() => {
    onApplySections(resumeData.sections);
    setCanvas((prev) => ({ ...prev, status: 'applied' }));
    addAssistant('已把 4 处改动应用到当前简历。要我再做一次多角色体检吗？');
    toast.success('已应用到简历');
  }, [onApplySections, resumeData.sections, addAssistant]);

  const resetSession = useCallback(() => {
    setMessages([]);
    setStarted(false);
    setParamSkill(null);
    setCanvas(CLOSED_CANVAS);
    setOverlayOpen(false);
    setLivingOpen(false);
  }, []);

  const composer = (
    <Composer onPickSkill={selectSkill} onSend={handleSend} disabled={running || !!paramSkill} />
  );

  return (
    <div className="relative flex flex-col h-full">
      <header className="flex items-center gap-3 px-5 py-3 shrink-0">
        <div className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
          <FlaskConical size={18} />
        </div>
        <span className="text-base font-semibold text-white tracking-tight">AI 实验室</span>
        <span className="inline-flex items-center gap-1.5 text-xs text-neutral-400 border border-neutral-800 rounded-full px-2.5 py-1">
          <FileText size={12} />
          {resumeData.name || '未命名简历'}
        </span>
        <div className="ml-auto flex items-center gap-3 text-neutral-500">
          <button
            type="button"
            onClick={toggleLiving}
            aria-label="实时画布"
            title="在简历上直接让 AI 改"
            className={cn(
              'inline-flex items-center gap-1.5 text-xs rounded-full px-2.5 py-1 border transition-colors cursor-pointer',
              livingOpen
                ? 'text-sky-300 border-sky-500/40 bg-sky-500/10'
                : 'text-neutral-400 border-neutral-800 hover:text-white hover:border-neutral-700'
            )}
          >
            <PencilRuler size={13} />
            实时画布
          </button>
          <button
            type="button"
            onClick={resetSession}
            aria-label="新对话"
            title="新对话"
            className="hover:text-white transition-colors cursor-pointer"
          >
            <SquarePen size={17} />
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="关闭"
            className="hover:text-white transition-colors cursor-pointer active:scale-90"
          >
            <X size={20} />
          </button>
        </div>
      </header>

      <div className="flex-1 flex min-h-0">
        {livingOpen && railCollapsed ? (
          <aside className="shrink-0 w-12 flex flex-col items-center gap-3 py-4 border-r border-neutral-900">
            <div className="w-8 h-8 rounded-full bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <Bot size={15} />
            </div>
            <button
              type="button"
              onClick={() => setRailCollapsed(false)}
              aria-label="展开对话"
              title="展开对话"
              className="text-neutral-500 hover:text-white transition-colors cursor-pointer"
            >
              <PanelLeftOpen size={16} />
            </button>
            {messages.length > 0 && (
              <span className="text-[10px] text-neutral-600 tabular-nums">{messages.length}</span>
            )}
          </aside>
        ) : (
        <div className={cn('relative flex-1 flex flex-col min-w-0 overflow-hidden', !started && 'justify-center')}>
          {livingOpen && (
            <button
              type="button"
              onClick={() => setRailCollapsed(true)}
              aria-label="收起对话为侧栏"
              title="收起为侧栏"
              className="absolute top-2 right-2 z-10 text-neutral-600 hover:text-white transition-colors cursor-pointer"
            >
              <PanelLeftClose size={16} />
            </button>
          )}
          <AnimatePresence initial={false} mode="popLayout">
            {!started ? (
              <motion.div
                key="greeting"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8, transition: { duration: 0.15 } }}
                transition={{ duration: 0.25 }}
                className="flex flex-col items-center text-center px-4"
              >
                <div className="w-14 h-14 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 mb-5">
                  <Bot size={27} />
                </div>
                <h2 className="text-2xl font-semibold text-white tracking-tight mb-2">今天想怎么打磨简历？</h2>
                <p className="text-sm text-neutral-500">描述你的需求，我会调用合适的技能来完成</p>
              </motion.div>
            ) : (
              <motion.div
                key="thread"
                className="flex-1 min-h-0 flex"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.12 }}
              >
                <ChatThread
                  messages={messages}
                  onToggleCanvas={toggleCanvas}
                  onLogClick={focusOnCanvas}
                  openCanvasSkillId={
                    canvas.open ? canvas.skillId : livingOpen ? livingSkillId : null
                  }
                />
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div
            layout="position"
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            className="relative"
          >
            <AnimatePresence>
              {paramSkill && (
                <motion.div
                  key="paramform"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.18, ease: 'easeOut' }}
                  className="absolute bottom-full left-0 right-0 px-4 pb-2"
                >
                  <div className="max-w-3xl mx-auto">
                    <SkillParamForm
                      skill={SKILLS[paramSkill]}
                      onRun={(values) => runSkill(paramSkill, values)}
                      onCancel={cancelParams}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            {composer}
          </motion.div>

          <AnimatePresence mode="popLayout">
            {!started && (
              <motion.div
                key="cards"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8, transition: { duration: 0.15 } }}
                transition={{ duration: 0.25, delay: 0.05 }}
                className="mt-1"
              >
                <WelcomeSuggestions onPick={selectSkill} onPrompt={handleSend} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        )}

        {livingOpen ? (
          <div className={cn('shrink-0 min-w-0', railCollapsed ? 'flex-1' : 'w-[58%]')}>
            <LivingCanvas
              resumeData={resumeData}
              templateId={templateId}
              onApplySections={onApplySections}
              onApplyInfo={onApplyInfo}
              onLog={logChange}
              onClose={() => setLivingOpen(false)}
              batchRequest={batchRequest}
              focusRequest={focusRequest}
            />
          </div>
        ) : (
          <ArtifactCanvas
            state={canvas}
            resumeData={resumeData}
            templateId={templateId}
            onSetView={(view: CanvasView) => setCanvas((prev) => ({ ...prev, view }))}
            onApply={applyChanges}
            onDiscard={() => setCanvas(CLOSED_CANVAS)}
            onExport={() => addAssistant('体检报告已导出为 PDF。')}
          />
        )}
      </div>

      <InterviewOverlay
        open={overlayOpen}
        onBack={() => setOverlayOpen(false)}
        onEnd={() => {
          setOverlayOpen(false);
          addAssistant('模拟面试结束，已生成面试纪要。想让我据此分析你的表现吗？');
        }}
      />
    </div>
  );
}
