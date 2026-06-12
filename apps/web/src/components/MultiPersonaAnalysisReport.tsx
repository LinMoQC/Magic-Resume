'use client';

import React from 'react';
import { MultiPersonaResumeAnalysis, PersonaAnalysis } from '@/types/agent/multi-persona';
import { motion } from 'framer-motion';
import { 
  Users, 
  Briefcase, 
  TrendingUp,  
  Lightbulb,
  Code2,
  AlertCircle
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { 
  CircularProgressbar, 
  buildStyles 
} from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  ResponsiveContainer 
} from 'recharts';

interface MultiPersonaAnalysisReportProps {
  analysis: MultiPersonaResumeAnalysis;
}

function getLighthouseColor(score: number) {
  if (score < 50) return '#f87171'; // Red
  if (score < 90) return '#fbbf24'; // Orange
  return '#4ade80'; // Green
}

function ScoreGauge({ score, label, size = 'md' }: { score: number; label: string; size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' }) {
    const color = getLighthouseColor(score);
    const dimensions = {
        xs: 'w-10 h-10',
        sm: 'w-12 h-12 md:w-14 md:h-14',
        md: 'w-16 h-16 md:w-20 md:h-20',
        lg: 'w-24 h-24 md:w-28 h-28',
        xl: 'w-32 h-32 md:w-48 h-48'
    };
    
    return (
        <div className="flex flex-col items-center gap-2">
            <div className={`${dimensions[size]} relative group`}>
                <div className="absolute inset-0 bg-white/5 rounded-full blur-3xl opacity-30 transition-opacity duration-1000" style={{ backgroundColor: color }} />
                <CircularProgressbar
                    value={score}
                    text={`${score}`}
                    strokeWidth={size === 'xl' ? 5 : (size === 'md' || size === 'lg') ? 7 : 10}
                    styles={buildStyles({
                        pathColor: color,
                        textColor: color,
                        trailColor: 'rgba(255, 255, 255, 0.05)',
                        textSize: size === 'xl' ? '20px' : (size === 'md' || size === 'sm') ? '28px' : '32px',
                        pathTransitionDuration: 2,
                    })}
                />
            </div>
            <span className={`text-[9px] md:text-[10px] font-black text-neutral-400 uppercase tracking-[0.3em] text-center mt-1 group-hover:text-neutral-300 transition-colors`}>{label}</span>
        </div>
    );
}

export default function MultiPersonaAnalysisReport({ analysis }: MultiPersonaAnalysisReportProps) {
  const { t } = useTranslation();

  const categoryLabels: Record<string, string> = {
    ImpactAndActionability: t('report.categories.impact', 'Impact'),
    QuantifiableAchievements: t('report.categories.metrics', 'Metrics'),
    ClarityAndReadability: t('report.categories.clarity', 'Clarity'),
    ProfessionalSummary: t('report.categories.summary', 'Summary'),
  };

  const personaConfig: Record<string, { title: string; subtitle: string; icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>; color: string; bgColor: string; borderColor: string }> = {
    peer_developer: {
      title: t('persona.peer.title', 'Peer Developer'),
      subtitle: t('persona.peer.subtitle', 'CO-WORKER / PEER'),
      icon: Code2,
      color: '#3b82f6',
      bgColor: 'bg-blue-500/5',
      borderColor: 'border-blue-500/20',
    },
    tech_lead: {
      title: t('persona.lead.title', 'Tech Lead / Leader'),
      subtitle: t('persona.lead.subtitle', 'HIRING MANAGER / +1'),
      icon: Briefcase,
      color: '#a855f7',
      bgColor: 'bg-purple-500/5',
      borderColor: 'border-purple-500/20',
    },
    hrbp: {
      title: t('persona.hrbp.title', 'HRBP'),
      subtitle: t('persona.hrbp.subtitle', 'CULTURE / SOFT SKILLS'),
      icon: Users,
      color: '#22c55e',
      bgColor: 'bg-green-500/5',
      borderColor: 'border-green-500/20',
    },
  };

  function PersonaDetails({ analysis, index }: { analysis: PersonaAnalysis; index: number }) {
    const config = personaConfig[analysis.persona];
    const Icon = config.icon;
  
    return (
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 * index }}
        className={`rounded-2xl border ${config.borderColor} ${config.bgColor} p-6 md:p-8 h-full flex flex-col shadow-xl backdrop-blur-sm relative overflow-hidden group`}
      >
        {/* Background Accent */}
        <div className={`absolute top-0 right-0 w-48 h-48 opacity-[0.03] -mr-12 -mt-12 rounded-full translate-x-4 -translate-y-4 group-hover:scale-150 transition-transform duration-1000`} style={{ backgroundColor: config.color }} />

        {/* Persona Header */}
        <div className="flex justify-between items-start mb-8 relative z-10">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl bg-white/5 border border-white/10 shadow-inner group-hover:border-white/20 transition-colors`}>
              <Icon className="w-6 h-6 md:w-5 md:h-5 lg:w-7 lg:h-7" style={{ color: config.color }} />
            </div>
            <div>
              <h3 className="font-black text-neutral-100 text-sm md:text-xl tracking-tight">{config.title}</h3>
              <p className="text-[9px] md:text-[11px] text-neutral-500 font-bold uppercase tracking-[0.3em]">{config.subtitle}</p>
            </div>
          </div>
          <div className="w-10 h-10 md:w-16 md:h-16">
              <CircularProgressbar
                  value={analysis.score}
                  text={`${analysis.score}`}
                  strokeWidth={8}
                  styles={buildStyles({
                      pathColor: getLighthouseColor(analysis.score),
                      textColor: getLighthouseColor(analysis.score),
                      trailColor: 'rgba(255, 255, 255, 0.05)',
                      textSize: '30px',
                  })}
              />
          </div>
        </div>
  
        {/* Dimensional Matrix Mini Bars */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-10 bg-black/40 p-5 rounded-2xl border border-white/5 shadow-inner">
          {Object.entries(analysis.categories_scores || {}).map(([key, score]) => (
            <div key={key} className="space-y-2">
              <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-tighter text-neutral-400">
                <span className="truncate mr-1">{categoryLabels[key] || key}</span>
                <span className="font-mono shrink-0" style={{ color: getLighthouseColor(score) }}>{score}</span>
              </div>
              <div className="h-1.5 w-full bg-neutral-800/50 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${score}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="h-full"
                  style={{ backgroundColor: getLighthouseColor(score) }}
                />
              </div>
            </div>
          ))}
        </div>
  
        {/* Strengths & Weaknesses (Grid Layout to fill horizontal space) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 flex-1 relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-5 border-b border-emerald-500/10 pb-2">
              <div className="p-1 rounded bg-emerald-500/10">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </div>
              <h4 className="text-xs md:text-sm font-black text-emerald-400 uppercase tracking-[0.2em]">{t('report.strengths', 'Strengths')}</h4>
            </div>
            <ul className="space-y-4">
              {analysis.strengths.map((s, i) => (
                <li key={i} className="text-[13px] md:text-sm text-neutral-300 flex items-start gap-4 group/item">
                  <span className="text-emerald-500/40 mt-1 shrink-0 group-hover/item:text-emerald-400 transition-colors">✦</span>
                  <p className="leading-relaxed opacity-85 group-hover/item:opacity-100 transition-opacity">{s}</p>
                </li>
              ))}
            </ul>
          </div>
  
          <div>
            <div className="flex items-center gap-3 mb-5 border-b border-yellow-500/10 pb-2">
              <div className="p-1 rounded bg-yellow-500/10">
                <AlertCircle className="w-4 h-4 text-yellow-400" />
              </div>
              <h4 className="text-xs md:text-sm font-black text-yellow-400 uppercase tracking-[0.2em]">{t('report.improvements', 'Improvements')}</h4>
            </div>
            <ul className="space-y-4">
              {analysis.weaknesses.map((w, i) => (
                <li key={i} className="text-[13px] md:text-sm text-neutral-300 flex items-start gap-4 group/item">
                  <span className="text-yellow-500/40 mt-1 shrink-0 group-hover/item:text-yellow-400 transition-colors">○</span>
                  <p className="leading-relaxed opacity-85 group-hover/item:opacity-100 transition-opacity">{w}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </motion.div>
    );
  }

  const radarData = Object.entries(analysis.category_averages || {}).map(([key, value]) => ({
    subject: categoryLabels[key] || key,
    A: value,
    fullMark: 100,
  }));

  return (
    <div className="space-y-12 md:space-y-16 pb-24 scrollbar-hide overflow-x-hidden">
      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none !important;
        }
        .scrollbar-hide {
          -ms-overflow-style: none !important;
          scrollbar-width: none !important;
        }
      `}</style>

      {/* Unified Triangular Dashboard Card */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-neutral-900/40 border border-white/10 rounded-[3rem] p-10 md:px-14 md:py-16 backdrop-blur-3xl shadow-[0_30px_60px_-12px_rgba(0,0,0,0.6)] flex flex-col items-center gap-14 relative overflow-hidden"
      >
        {/* Decorative Background Orb */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-blue-500/5 blur-[120px] rounded-full -mt-80" />

        {/* Peak: Overall Score (Centrally Emphasized) */}
        <div className="relative z-10 scale-110 md:scale-135 transition-all duration-700">
          <ScoreGauge score={analysis.overall_score} label={t('report.overallRating', 'Overall Rating')} size="xl" />
        </div>

        {/* Connected Base: Radar (Left) and Expert Triangle (Right) */}
        <div className="w-full grid grid-cols-1 xl:grid-cols-2 gap-12 md:gap-16 items-stretch relative z-10 pt-4">
           
           {/* Radar Chart (Balanced Left) */}
           <div className="w-full h-full min-h-[360px] md:min-h-[440px] bg-black/40 rounded-[2.5rem] border border-white/5 p-8 flex flex-col items-center justify-center relative group shadow-2xl overflow-hidden">
              <div className="absolute inset-0 bg-white/1 opacity-0 group-hover:opacity-100 transition-opacity" />
              <h4 className="absolute top-8 left-0 w-full text-[10px] md:text-[11px] font-black text-neutral-500 uppercase tracking-[0.4em] text-center z-20 pointer-events-none group-hover:text-neutral-400 transition-colors">
                {t('report.attributeMatrix', 'Attribute Matrix')}
              </h4>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="55%" outerRadius="80%" data={radarData}>
                  <PolarGrid stroke="rgba(255,255,255,0.06)" />
                  <PolarAngleAxis 
                    dataKey="subject" 
                    tick={{ fill: '#777', fontSize: 10, fontWeight: 900 }}
                  />
                  <PolarRadiusAxis 
                    angle={30} 
                    domain={[0, 100]} 
                    tick={false}
                    axisLine={false}
                  />
                  <Radar
                    name="Quality"
                    dataKey="A"
                    stroke={getLighthouseColor(analysis.overall_score)}
                    fill={getLighthouseColor(analysis.overall_score)}
                    fillOpacity={0.4}
                    animationDuration={2500}
                  />
                </RadarChart>
              </ResponsiveContainer>
           </div>

           {/* Expert Triangle Panel (Small Triangle on the Right) */}
           <div className="flex flex-col items-center justify-between bg-black/20 rounded-[2.5rem] border border-white/5 p-10 shadow-inner group transition-colors hover:border-white/10 group">
              
              <div className="flex flex-col items-center gap-10 w-full mb-8">
                {/* Expert Triangle Peak: Leader */}
                <div className="scale-110 group-hover:scale-115 transition-transform duration-500">
                    <ScoreGauge score={analysis.leader_analysis.score} label={t('persona.leader.short', 'Leader')} size="md" />
                </div>

                {/* Expert Triangle Base: Peer & HRBP */}
                <div className="flex justify-center gap-12 md:gap-16 w-full mt-4">
                    <ScoreGauge score={analysis.peer_analysis.score} label={t('persona.peer.short', 'Peer')} size="sm" />
                    <ScoreGauge score={analysis.hrbp_analysis.score} label={t('persona.hrbp.short', 'HRBP')} size="sm" />
                </div>
              </div>
              
              <div className="flex flex-wrap justify-center gap-6 border-t border-white/5 pt-10 w-full mt-auto">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#f87171] shadow-[0_0_15px_rgba(248,113,113,0.3)]" />
                  <span className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em]">{t('report.status.critical', 'Critical')}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#fbbf24] shadow-[0_0_15px_rgba(251,191,36,0.3)]" />
                  <span className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em]">{t('report.status.normal', 'Normal')}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#4ade80] shadow-[0_0_15px_rgba(74,222,128,0.3)]" />
                  <span className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em]">{t('report.status.good', 'Good')}</span>
                </div>
              </div>
           </div>
        </div>
      </motion.div>

      {/* Details Section */}
      <div className="space-y-10 px-4 md:px-8">
        <div className="flex items-center gap-5 border-b border-white/5 pb-6">
          <div className="p-3.5 bg-blue-500/10 rounded-2xl border border-blue-500/20 shadow-2xl">
            <Lightbulb className="w-7 h-7 text-blue-400" />
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-black text-neutral-100 tracking-tight leading-none">{t('report.optimizationRoadmap', 'Optimization Roadmap')}</h2>
            <p className="text-[11px] text-neutral-500 font-bold uppercase tracking-[0.4em] mt-2 italic opacity-60">{t('report.roadmapSubtitle', 'High-level insights from the panel')}</p>
          </div>
        </div>
        
        <div className="flex flex-col gap-10 md:gap-14">
          <PersonaDetails analysis={analysis.peer_analysis} index={0} />
          <PersonaDetails analysis={analysis.leader_analysis} index={1} />
          <PersonaDetails analysis={analysis.hrbp_analysis} index={2} />
        </div>
      </div>
    </div>
  );
}