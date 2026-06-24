'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Check, CircleCheck, FileDown, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Resume, Section } from '@/types/frontend/resume';
import ResumePreview from '../../preview/ResumePreview';
import { SKILLS } from '../skills/registry';
import type { CanvasState, CanvasView } from '../types';

const VIEW_LABEL: Record<CanvasView, string> = {
  preview: '预览',
  diff: 'Diff',
  json: 'JSON',
  score: '评分',
};

type ArtifactCanvasProps = {
  state: CanvasState;
  resumeData: Resume;
  templateId: string;
  onSetView: (view: CanvasView) => void;
  onApply: () => void;
  onDiscard: () => void;
  onExport: () => void;
};

const DIFF_STYLE_DEL =
  'text-decoration:line-through;color:#dc2626;background:#fef2f2;border-radius:3px;padding:0 3px;';
const DIFF_STYLE_INS =
  'text-decoration:none;color:#15803d;background:#f0fdf4;border-radius:3px;padding:0 3px;';

const IMPROVED = [
  '主导核心模块重构，使首屏加载时间缩短 40%，覆盖日活 50w+ 用户',
  '基于 React 18 + TS 搭建组件库，复用率达 70%，迭代效率提升 3 倍',
  '通过虚拟列表与懒加载将长列表渲染耗时降低 60%',
  '推动接口聚合与缓存策略，P95 响应从 800ms 降至 220ms',
];

function injectDiff(html: string, improved: string): string {
  const liRegex = /<li[^>]*>([\s\S]*?)<\/li>/i;
  if (liRegex.test(html)) {
    return html.replace(
      liRegex,
      (_m, inner) =>
        `<li><del style="${DIFF_STYLE_DEL}">${inner}</del> <ins style="${DIFF_STYLE_INS}">${improved}</ins></li>`
    );
  }
  return `<del style="${DIFF_STYLE_DEL}">${html}</del> <ins style="${DIFF_STYLE_INS}">${improved}</ins>`;
}

/**
 * Mock: inject inline diff markup into the real resume's HTML descriptions so the
 * changes render in-place on the actual rendered resume. Real wiring would map an
 * AI-produced before/after onto these same fields.
 */
function buildDiffSections(sections: Section): Section {
  const clone: Section = JSON.parse(JSON.stringify(sections));
  let n = 0;
  for (const key of Object.keys(clone)) {
    const items = clone[key];
    if (!Array.isArray(items)) continue;
    for (const item of items) {
      if (n >= IMPROVED.length) return clone;
      const fieldKey = Object.keys(item).find(
        (k) => typeof item[k] === 'string' && /<li|<p|<ul|<ol/i.test(item[k] as string)
      );
      if (fieldKey) {
        item[fieldKey] = injectDiff(item[fieldKey] as string, IMPROVED[n]);
        n += 1;
      }
    }
  }
  return clone;
}

const PERSONAS = [
  { label: '同行专家', value: 85, color: '#38bdf8' },
  { label: '用人主管', value: 78, color: '#a78bfa' },
  { label: 'HRBP', value: 82, color: '#34d399' },
];

function RingGauge({ score }: { score: number }) {
  const size = 96;
  const stroke = 8;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, score / 10));
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#818cf8" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} className="text-neutral-800" stroke="currentColor" strokeWidth={stroke} fill="none" />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="url(#ringGrad)"
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - pct) }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[26px] leading-none font-semibold text-white tabular-nums">{score.toFixed(1)}</span>
        <span className="text-[10px] text-neutral-500 mt-0.5">/ 10</span>
      </div>
    </div>
  );
}

const STRENGTHS = [
  '项目经历包含量化成果，说服力强',
  '技术栈与目标岗位匹配度高',
  '成长路径清晰、履历连续',
];

const IMPROVEMENTS = [
  '部分经历表述偏笼统，建议突出个人贡献与角色',
  '缺少团队规模与业务影响力的描述',
  '可补充 3–5 个目标岗位关键词以提升匹配',
];

function ReportSection({ label, color, children }: { label: string; color: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <span className="w-1 h-3.5 rounded-full" style={{ background: color }} />
        <span className="text-xs font-medium text-neutral-200">{label}</span>
      </div>
      <ul className="space-y-2 pl-0.5">{children}</ul>
    </div>
  );
}

function ScoreView({ onExport }: { onExport: () => void }) {
  return (
    <div className="rounded-2xl bg-neutral-900/60 p-6 space-y-6">
      <div className="flex items-center gap-5">
        <RingGauge score={8.2} />
        <div className="min-w-0">
          <div className="text-[15px] font-medium text-white">综合竞争力良好</div>
          <p className="text-xs text-neutral-500 mt-1.5 leading-relaxed">
            三位虚拟面试官综合评估，优于约 78% 的同岗位简历。
          </p>
        </div>
      </div>

      <div className="space-y-3.5">
        {PERSONAS.map((p, i) => (
          <div key={p.label} className="flex items-center gap-3">
            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: p.color }} />
            <span className="text-xs text-neutral-300 w-16 shrink-0">{p.label}</span>
            <div className="flex-1 h-1.5 rounded-full bg-neutral-800 overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: p.color }}
                initial={{ width: 0 }}
                animate={{ width: `${p.value}%` }}
                transition={{ duration: 0.7, delay: 0.15 + i * 0.1, ease: 'easeOut' }}
              />
            </div>
            <span className="text-xs font-medium text-white w-7 text-right tabular-nums">{(p.value / 10).toFixed(1)}</span>
          </div>
        ))}
      </div>

      <ReportSection label="亮点" color="#34d399">
        {STRENGTHS.map((s) => (
          <li key={s} className="flex gap-2 text-xs text-neutral-400 leading-relaxed">
            <Check size={13} className="text-emerald-400 mt-0.5 shrink-0" />
            <span>{s}</span>
          </li>
        ))}
      </ReportSection>

      <ReportSection label="待改进" color="#fbbf24">
        {IMPROVEMENTS.map((s) => (
          <li key={s} className="flex gap-2 text-xs text-neutral-400 leading-relaxed">
            <ArrowUpRight size={13} className="text-amber-400 mt-0.5 shrink-0" />
            <span>{s}</span>
          </li>
        ))}
      </ReportSection>

      <button
        type="button"
        onClick={onExport}
        className="w-full h-9 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-sm text-neutral-200 transition-colors cursor-pointer inline-flex items-center justify-center gap-1.5"
      >
        <FileDown size={14} />
        导出报告
      </button>
    </div>
  );
}

export default function ArtifactCanvas({
  state,
  resumeData,
  templateId,
  onSetView,
  onApply,
  onDiscard,
  onExport,
}: ArtifactCanvasProps) {
  const { open, skillId, view, status } = state;
  const skill = skillId ? SKILLS[skillId] : null;
  const views = skill?.canvas?.views ?? [];
  const diffSections = useMemo(() => buildDiffSections(resumeData.sections), [resumeData.sections]);

  return (
    <div
      className={cn(
        'shrink-0 overflow-hidden transition-[width] duration-300 ease-out flex flex-col',
        open ? 'w-[44%] bg-neutral-900/25' : 'w-0'
      )}
    >
      {open && skill && (
        <>
          <div className="flex items-center gap-3 px-5 py-3 shrink-0">
            <span className="text-sm font-medium text-white whitespace-nowrap">简历画布</span>
            <div className="ml-auto inline-flex rounded-lg bg-neutral-900 p-0.5">
              {views.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => onSetView(v)}
                  className={cn(
                    'text-xs px-3 py-1 rounded-md transition-colors cursor-pointer',
                    v === view ? 'bg-neutral-800 text-white' : 'text-neutral-500 hover:text-neutral-300'
                  )}
                >
                  {VIEW_LABEL[v]}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-5 flex flex-col">
            {(view === 'preview' || view === 'diff') && (
              <div className="bg-white/95 rounded-lg p-2 flex justify-center overflow-hidden">
                <div style={{ transform: 'scale(0.5)', transformOrigin: 'top center', minWidth: '600px' }}>
                  <ResumePreview
                    info={resumeData.info}
                    sections={view === 'diff' ? diffSections : resumeData.sections}
                    sectionOrder={resumeData.sectionOrder.map((s) => s.key)}
                    templateId={templateId}
                  />
                </div>
              </div>
            )}

            {view === 'json' && (
              <pre className="text-[11px] leading-relaxed text-neutral-400 font-mono whitespace-pre-wrap bg-neutral-900/70 rounded-xl p-4">
                {JSON.stringify({ info: resumeData.info, sections: resumeData.sections }, null, 2)}
              </pre>
            )}

            {view === 'score' && (
              <div className="mx-auto w-full max-w-sm">
                <ScoreView onExport={onExport} />
              </div>
            )}
          </div>

          {view !== 'score' && (
            <div className="px-5 py-3 flex items-center gap-2 shrink-0">
              {status === 'applied' ? (
                <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400">
                  <CircleCheck size={14} />
                  已应用到简历
                </span>
              ) : (
                <>
                  <span className="inline-flex items-center gap-1.5 text-xs text-neutral-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />4 处改动待应用
                  </span>
                  <button
                    type="button"
                    onClick={onDiscard}
                    className="ml-auto text-xs px-3.5 py-1.5 rounded-lg text-neutral-400 hover:bg-neutral-800 transition-colors cursor-pointer"
                  >
                    放弃
                  </button>
                  <button
                    type="button"
                    onClick={onApply}
                    className="text-xs px-3.5 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 transition-colors cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <Check size={13} />
                    应用更改
                  </button>
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
