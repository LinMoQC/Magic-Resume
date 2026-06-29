'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Check, CircleCheck, FileDown, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Resume } from '@/types/frontend/resume';
import ResumePreview from '../../preview/ResumePreview';
import { SKILLS } from '../skills/registry';
import type { CanvasState } from '../types';
import type { MultiPersonaResumeAnalysis, PersonaAnalysis } from '@/types/agent/multi-persona';

type ArtifactCanvasProps = {
  state: CanvasState;
  resumeData: Resume;
  templateId: string;
  analysis: MultiPersonaResumeAnalysis | null;
  onApply: () => void;
  onDiscard: () => void;
  onExport: () => void;
};

const PERSONA_COLORS = { peer: '#38bdf8', leader: '#a78bfa', hrbp: '#34d399' };

/** Flatten + de-dupe persona bullet lists, capping the count for the compact view. */
function topItems(lists: string[][], cap = 4): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const list of lists) {
    for (const item of list || []) {
      const t = item.trim();
      if (!t || seen.has(t)) continue;
      seen.add(t);
      out.push(t);
      if (out.length >= cap) return out;
    }
  }
  return out;
}

function scoreBand(score: number): string {
  if (score >= 85) return '综合竞争力优秀';
  if (score >= 70) return '综合竞争力良好';
  if (score >= 50) return '综合竞争力中等';
  return '竞争力有待提升';
}

function RingGauge({ score }: { score: number }) {
  const size = 96;
  const stroke = 8;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, score / 100));
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
        <span className="text-[26px] leading-none font-semibold text-white tabular-nums">{Math.round(score)}</span>
        <span className="text-[10px] text-neutral-500 mt-0.5">/ 100</span>
      </div>
    </div>
  );
}

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

function ScoreView({
  analysis,
  onExport,
}: {
  analysis: MultiPersonaResumeAnalysis | null;
  onExport: () => void;
}) {
  if (!analysis) {
    return (
      <div className="rounded-2xl bg-neutral-900/60 p-6 text-sm text-neutral-500">暂无分析结果。</div>
    );
  }

  const personas: { label: string; color: string; data: PersonaAnalysis }[] = [
    { label: '同行专家', color: PERSONA_COLORS.peer, data: analysis.peer_analysis },
    { label: '用人主管', color: PERSONA_COLORS.leader, data: analysis.leader_analysis },
    { label: 'HRBP', color: PERSONA_COLORS.hrbp, data: analysis.hrbp_analysis },
  ];
  const strengths = topItems(personas.map((p) => p.data.strengths));
  const improvements = topItems(personas.map((p) => p.data.weaknesses));

  return (
    <div className="rounded-2xl bg-neutral-900/60 p-6 space-y-6">
      <div className="flex items-center gap-5">
        <RingGauge score={analysis.overall_score} />
        <div className="min-w-0">
          <div className="text-[15px] font-medium text-white">{scoreBand(analysis.overall_score)}</div>
          <p className="text-xs text-neutral-500 mt-1.5 leading-relaxed">
            三位虚拟面试官（同行 / 用人主管 / HRBP）综合评估。
          </p>
        </div>
      </div>

      <div className="space-y-3.5">
        {personas.map((p, i) => (
          <div key={p.label} className="flex items-center gap-3">
            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: p.color }} />
            <span className="text-xs text-neutral-300 w-16 shrink-0">{p.label}</span>
            <div className="flex-1 h-1.5 rounded-full bg-neutral-800 overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: p.color }}
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(0, Math.min(100, p.data.score))}%` }}
                transition={{ duration: 0.7, delay: 0.15 + i * 0.1, ease: 'easeOut' }}
              />
            </div>
            <span className="text-xs font-medium text-white w-7 text-right tabular-nums">{Math.round(p.data.score)}</span>
          </div>
        ))}
      </div>

      {strengths.length > 0 && (
        <ReportSection label="亮点" color="#34d399">
          {strengths.map((s) => (
            <li key={s} className="flex gap-2 text-xs text-neutral-400 leading-relaxed">
              <Check size={13} className="text-emerald-400 mt-0.5 shrink-0" />
              <span>{s}</span>
            </li>
          ))}
        </ReportSection>
      )}

      {improvements.length > 0 && (
        <ReportSection label="待改进" color="#fbbf24">
          {improvements.map((s) => (
            <li key={s} className="flex gap-2 text-xs text-neutral-400 leading-relaxed">
              <ArrowUpRight size={13} className="text-amber-400 mt-0.5 shrink-0" />
              <span>{s}</span>
            </li>
          ))}
        </ReportSection>
      )}

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
  analysis,
  onApply,
  onDiscard,
  onExport,
}: ArtifactCanvasProps) {
  const { open, skillId, view, status } = state;
  const skill = skillId ? SKILLS[skillId] : null;

  return (
    <div
      className={cn(
        'shrink-0 overflow-hidden transition-[width] duration-300 ease-out flex flex-col',
        open ? 'w-[44%] bg-neutral-900/25' : 'w-0'
      )}
    >
      {open && skill && (
        <>
          <div className="flex-1 overflow-y-auto custom-scrollbar p-5 flex flex-col">
            {view === 'preview' && (
              <div className="bg-white/95 rounded-lg p-2 flex justify-center overflow-hidden">
                <div style={{ transform: 'scale(0.5)', transformOrigin: 'top center', minWidth: '600px' }}>
                  <ResumePreview
                    info={resumeData.info}
                    sections={resumeData.sections}
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
                <ScoreView analysis={analysis} onExport={onExport} />
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
