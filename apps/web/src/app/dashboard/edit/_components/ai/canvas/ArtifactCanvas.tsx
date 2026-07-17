'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Check, CircleCheck, FileDown, ArrowUpRight, MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { RingGauge } from '@/components/ui/ring-gauge';
import { cn } from '@/lib/utils';
import { Resume } from '@/types/frontend/resume';
import ResumePreview from '../../preview/ResumePreview';
import { SKILLS } from '../skills/registry';
import type { CanvasState } from '../types';
import type { MultiPersonaResumeAnalysis, PersonaAnalysis } from '@/types/agent/multi-persona';
import type { FitDimension, FitReport } from '@/types/agent/fit-report';

type ArtifactCanvasProps = {
  state: CanvasState;
  resumeData: Resume;
  templateId: string;
  analysis: MultiPersonaResumeAnalysis | null;
  fitReport: FitReport | null;
  onApply: () => void;
  onDiscard: () => void;
  onExport: () => void;
};

const PERSONA_COLORS = { peer: '#38bdf8', leader: '#a78bfa', hrbp: '#34d399' };

/** Fixed order + accent per fit dimension (design: sky-led workstation palette). */
const FIT_DIMENSIONS: { key: FitDimension; color: string }[] = [
  { key: 'technical', color: '#38bdf8' },
  { key: 'experience', color: '#a78bfa' },
  { key: 'behavioral', color: '#34d399' },
  { key: 'career', color: '#fbbf24' },
];

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

function scoreBandKey(score: number): string {
  if (score >= 85) return 'aiLab.artifact.scoreBand.excellent';
  if (score >= 70) return 'aiLab.artifact.scoreBand.good';
  if (score >= 50) return 'aiLab.artifact.scoreBand.medium';
  return 'aiLab.artifact.scoreBand.needsWork';
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
  const { t } = useTranslation();

  if (!analysis) {
    return (
      <div className="rounded-2xl bg-neutral-900/60 p-6 text-sm text-neutral-500">{t('aiLab.artifact.emptyAnalysis')}</div>
    );
  }

  const personas: { label: string; color: string; data: PersonaAnalysis }[] = [
    { label: t('aiLab.artifact.personas.peer'), color: PERSONA_COLORS.peer, data: analysis.peer_analysis },
    { label: t('aiLab.artifact.personas.leader'), color: PERSONA_COLORS.leader, data: analysis.leader_analysis },
    { label: t('aiLab.artifact.personas.hrbp'), color: PERSONA_COLORS.hrbp, data: analysis.hrbp_analysis },
  ];
  const strengths = topItems(personas.map((p) => p.data.strengths));
  const improvements = topItems(personas.map((p) => p.data.weaknesses));

  return (
    <div className="rounded-2xl bg-neutral-900/60 p-6 space-y-6">
      <div className="flex items-center gap-5">
        <RingGauge value={analysis.overall_score} />
        <div className="min-w-0">
          <div className="text-[15px] font-medium text-white">{t(scoreBandKey(analysis.overall_score))}</div>
          <p className="text-xs text-neutral-500 mt-1.5 leading-relaxed">
            {t('aiLab.artifact.summary')}
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
        <ReportSection label={t('aiLab.artifact.strengths')} color="#34d399">
          {strengths.map((s) => (
            <li key={s} className="flex gap-2 text-xs text-neutral-400 leading-relaxed">
              <Check size={13} className="text-emerald-400 mt-0.5 shrink-0" />
              <span>{s}</span>
            </li>
          ))}
        </ReportSection>
      )}

      {improvements.length > 0 && (
        <ReportSection label={t('aiLab.artifact.improvements')} color="#fbbf24">
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
        {t('aiLab.artifact.exportReport')}
      </button>
    </div>
  );
}

/** Small pill list of keywords (matched = emerald, missing = amber). */
function KeywordChips({ items, tone }: { items: string[]; tone: 'matched' | 'missing' }) {
  const cls =
    tone === 'matched'
      ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
      : 'bg-amber-500/10 text-amber-300 border-amber-500/20';
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((k) => (
        <span key={k} className={cn('rounded-md border px-2 py-0.5 text-[11px] leading-tight', cls)}>
          {k}
        </span>
      ))}
    </div>
  );
}

function MatchView({ fitReport }: { fitReport: FitReport | null }) {
  const { t } = useTranslation();

  if (!fitReport) {
    return (
      <div className="rounded-2xl bg-neutral-900/60 p-6 text-sm text-neutral-500">{t('aiLab.artifact.match.empty')}</div>
    );
  }

  const { overall, band, location_pass, dims, matched_keywords, missing_keywords, gaps } = fitReport;

  return (
    <div className="rounded-2xl bg-neutral-900/60 p-6 space-y-6">
      <div className="flex items-center gap-5">
        <RingGauge value={overall} />
        <div className="min-w-0 space-y-1.5">
          <div className="text-[15px] font-medium text-white">{t(`aiLab.artifact.match.band.${band}`)}</div>
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px]',
              location_pass
                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-300 border-rose-500/20'
            )}
          >
            <MapPin size={11} />
            {t(location_pass ? 'aiLab.artifact.match.locationPass' : 'aiLab.artifact.match.locationFail')}
          </span>
        </div>
      </div>

      <div className="space-y-3.5">
        {FIT_DIMENSIONS.map((d, i) => (
          <div key={d.key} className="flex items-center gap-3">
            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: d.color }} />
            <span className="text-xs text-neutral-300 w-16 shrink-0">{t(`aiLab.artifact.match.dims.${d.key}`)}</span>
            <div className="flex-1 h-1.5 rounded-full bg-neutral-800 overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: d.color }}
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(0, Math.min(100, dims[d.key] ?? 0))}%` }}
                transition={{ duration: 0.7, delay: 0.15 + i * 0.1, ease: 'easeOut' }}
              />
            </div>
            <span className="text-xs font-medium text-white w-7 text-right tabular-nums">
              {Math.round(dims[d.key] ?? 0)}
            </span>
          </div>
        ))}
      </div>

      {matched_keywords.length > 0 && (
        <ReportSection label={t('aiLab.artifact.match.matched')} color="#34d399">
          <KeywordChips items={matched_keywords} tone="matched" />
        </ReportSection>
      )}

      {missing_keywords.length > 0 && (
        <ReportSection label={t('aiLab.artifact.match.missing')} color="#fbbf24">
          <KeywordChips items={missing_keywords} tone="missing" />
        </ReportSection>
      )}

      {gaps.length > 0 && (
        <ReportSection label={t('aiLab.artifact.match.gaps')} color="#38bdf8">
          {gaps.map((g) => (
            <li key={g} className="flex gap-2 text-xs text-neutral-400 leading-relaxed">
              <ArrowUpRight size={13} className="text-sky-400 mt-0.5 shrink-0" />
              <span>{g}</span>
            </li>
          ))}
        </ReportSection>
      )}
    </div>
  );
}

export default function ArtifactCanvas({
  state,
  resumeData,
  templateId,
  analysis,
  fitReport,
  onApply,
  onDiscard,
  onExport,
}: ArtifactCanvasProps) {
  const { t } = useTranslation();
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

            {view === 'match' && (
              <div className="mx-auto w-full max-w-sm">
                <MatchView fitReport={fitReport} />
              </div>
            )}
          </div>

          {view !== 'score' && view !== 'match' && (
            <div className="px-5 py-3 flex items-center gap-2 shrink-0">
              {status === 'applied' ? (
                <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400">
                  <CircleCheck size={14} />
                  {t('aiLab.artifact.applied')}
                </span>
              ) : (
                <>
                  <span className="inline-flex items-center gap-1.5 text-xs text-neutral-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    {t('aiLab.artifact.pendingChanges', { count: 4 })}
                  </span>
                  <button
                    type="button"
                    onClick={onDiscard}
                    className="ml-auto text-xs px-3.5 py-1.5 rounded-lg text-neutral-400 hover:bg-neutral-800 transition-colors cursor-pointer"
                  >
                    {t('aiLab.artifact.discard')}
                  </button>
                  <button
                    type="button"
                    onClick={onApply}
                    className="text-xs px-3.5 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 transition-colors cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <Check size={13} />
                    {t('aiLab.artifact.applyChanges')}
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
