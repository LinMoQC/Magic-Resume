"use client";

import React, { memo, useMemo } from 'react';
import { Handle, Position, Node, NodeProps } from '@xyflow/react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { 
  Loader2, Search, Brain, FileText, 
  Globe, ClipboardList, Target, ShieldCheck, Zap, Database, Activity
} from 'lucide-react';
import type { ComponentType } from 'react';

type NodeCategory = 'input' | 'output' | 'agent' | 'tool_ext' | 'tool_int';

type NeuralNodeData = {
  title: string;
  status?: 'completed' | 'in_progress' | 'failed' | string;
  id: string;
  isInteractive?: boolean;
};
type NeuralFlowNode = Node<NeuralNodeData>;

const STEP_CONFIG: Record<string, { 
  icon: ComponentType<{ size?: number; className?: string }>, 
  color: string, 
  personality: string, // Label for the pill
  inputLabel: string,
  outputLabel: string,
  variant?: 'toxic' | 'default',
  category: NodeCategory
}> = {
  // --- INPUT NODES ---
  preparer: { icon: ClipboardList, color: 'sky', personality: 'Input Source', inputLabel: 'USER', outputLabel: 'STREAM', category: 'input' },

  // --- AGENT NODES (Brains) ---
  resume_analyzer: { icon: Brain, color: 'purple', personality: 'Resume Analyst', inputLabel: 'RESUME', outputLabel: 'INSIGHTS', category: 'agent' },
  jd_analyzer: { icon: Brain, color: 'purple', personality: 'JD Analyst', inputLabel: 'JD_TEXT', outputLabel: 'ENTITY_MAP', category: 'agent' },
  prepare_research: { icon: Target, color: 'indigo', personality: 'Research Planner', inputLabel: 'CONTEXT', outputLabel: 'PLAN (VEC)', category: 'agent' },
  reflection: { icon: Brain, color: 'orange', personality: 'Critic & Refine', inputLabel: 'SEARCH_RES', outputLabel: 'VERDICT', category: 'agent' },
  prepare_rewriter: { icon: FileText, color: 'teal', personality: 'Strategy Planner', inputLabel: 'REPORT', outputLabel: 'TASKS', category: 'agent' },
  adversarial_critique: { icon: ShieldCheck, color: 'rose', personality: 'Toxic Recruiter', inputLabel: 'DRAFT', outputLabel: 'CRITIQUE', variant: 'toxic', category: 'agent' },
  strategic_analyzer: { icon: Brain, color: 'purple', personality: 'Gap Analyst', inputLabel: 'RESEARCH', outputLabel: 'STRATEGY', category: 'agent' },

  // --- EXTERNAL TOOL NODES (Web/RAG) ---
  resume_web_search: { icon: Globe, color: 'cyan', personality: 'Market Research', inputLabel: 'RESUME_DATA', outputLabel: 'TRENDS', category: 'tool_ext' },
  jd_web_search: { icon: Globe, color: 'cyan', personality: 'Job Market Intel', inputLabel: 'JD_ENTITIES', outputLabel: 'SALARY_DATA', category: 'tool_ext' },
  company_interview_search: { icon: Search, color: 'pink', personality: 'Interview Spy', inputLabel: 'CO_NAME', outputLabel: 'EXP_LOGS', category: 'tool_ext' },
  web_searcher: { icon: Globe, color: 'cyan', personality: 'Deep Crawler', inputLabel: 'QUERIES', outputLabel: 'HTML_DOM', category: 'tool_ext' },
  rag_knowledge: { icon: Database, color: 'amber', personality: 'LyraNote RAG', inputLabel: 'CONTEXT', outputLabel: 'KNOWLEDGE', category: 'tool_ext' }, // New RAG node

  // --- INTERNAL TOOL NODES (Processors) ---
  query_writer: { icon: Zap, color: 'blue', personality: 'Query Gen', inputLabel: 'TOPIC', outputLabel: 'SQL/BOOL', category: 'tool_int' },
  rewrite_section: { icon: FileText, color: 'indigo', personality: 'Content Writer', inputLabel: 'PROMPT', outputLabel: 'SECTION', category: 'tool_int' },
  route_next_rewrite: { icon: Activity, color: 'neutral', personality: 'Task Router', inputLabel: 'QUEUE', outputLabel: 'NEXT', category: 'tool_int' },
  
  // --- OUTPUT NODES ---
  research_combiner: { icon: FileText, color: 'emerald', personality: 'Report Engine', inputLabel: 'MULTI_TRACK', outputLabel: 'FULL_REPORT', category: 'output' },
  combiner: { icon: Zap, color: 'blue', personality: 'Merger', inputLabel: 'CHUNKS', outputLabel: 'DOC', category: 'tool_int' }, // Legacy/Internal
  combine_sections: { icon: Zap, color: 'blue', personality: 'Assembler', inputLabel: 'SECTIONS', outputLabel: 'DRAFT', category: 'tool_int' },
  final_answer: { icon: FileText, color: 'emerald', personality: 'Final Output', inputLabel: 'CRITIQUE', outputLabel: 'RESUME_DOC', category: 'output' },
  
  // Legacy mappings
  company_analysis: { icon: Brain, color: 'indigo', personality: 'Corp Intel', inputLabel: 'DOMAIN', outputLabel: 'CTX', category: 'agent' },
};

export const NeuralNode = memo(({ data, selected }: NodeProps<NeuralFlowNode>) => {
  const { t } = useTranslation();
  const { title, status, id } = data;
  const config = STEP_CONFIG[id] || { icon: Target, color: 'sky', personality: 'Agent', inputLabel: 'DATA', outputLabel: 'STATE', category: 'agent' };
  const { icon: Icon, variant, category } = config;
  
  // Localized personality
  const personality = t(`modals.aiModal.optimizeTab.steps.${id}.personality`, { defaultValue: config.personality });

  const synapticParticles = useMemo(() => [...Array(3)].map(() => ({
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    duration: Math.random() * 1.5 + 1.0,
    delay: Math.random() * 2
  })), []);

  const isToxic = variant === 'toxic';
  const isInput = category === 'input';
  const isOutput = category === 'output';
  const isAgent = category === 'agent';
  const isExternalTool = category === 'tool_ext';

  // Base container styles mapping
  const containerStyles = {
    input: `rounded-xl border border-sky-500/40 bg-gradient-to-br from-sky-950/40 to-slate-950/30 shadow-[0_0_18px_rgba(14,165,233,0.25)]`,
    output: `rounded-xl border-2 border-emerald-500/60 bg-gradient-to-br from-emerald-950/30 to-emerald-900/20 shadow-[0_0_32px_rgba(16,185,129,0.25)]`,
    agent: `rounded-[2rem] border border-purple-500/40 bg-gradient-to-br from-neutral-950/90 to-purple-950/20 shadow-[0_0_24px_rgba(168,85,247,0.2)]`,
    tool_ext: `rounded-lg border border-cyan-500/40 bg-gradient-to-br from-cyan-950/20 to-slate-950/20 border-dashed shadow-[0_0_14px_rgba(34,211,238,0.15)]`,
    tool_int: `rounded-lg border border-neutral-700/80 bg-gradient-to-br from-neutral-950/70 to-neutral-900/60 shadow-[0_0_12px_rgba(100,116,139,0.15)]`,
  };

  return (
    <motion.div
      className={`relative flex flex-col overflow-hidden transition-all duration-300 group
        ${containerStyles[category as NodeCategory] || containerStyles.agent}
        w-[280px] h-[190px]
        ${selected ? 'ring-2 ring-white/60 scale-105 z-20' : 'hover:border-white/30'}
        ${status === 'in_progress' ? 'shadow-[0_0_20px_rgba(56,189,248,0.15)]' : ''}
      `}
    >
      {/* Dynamic Handles based on category */}
      {!isInput && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1.5 z-30">
          <Handle type="target" position={Position.Left} className={`w-3! h-3! border-2! border-black! ${status === 'completed' ? 'bg-emerald-400' : 'bg-neutral-400'} p-0! transition-colors`} />
        </div>
      )}
      
      {(!isOutput || id !== 'final_answer') && (
        <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1.5 z-30">
          <Handle type="source" position={Position.Right} className={`w-3! h-3! border-2! border-black! ${status === 'completed' ? 'bg-emerald-400' : 'bg-neutral-600'} p-0! transition-colors`} />
        </div>
      )}

      {/* RAG / Memory Connection Point (Top) */}
      {(isAgent || isExternalTool) && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1.5 z-30 opacity-0 group-hover:opacity-100 transition-opacity">
          <Handle id="rag-target" type="target" position={Position.Top} className="w-2! h-2! bg-amber-400/80 border-none! p-0!" />
        </div>
      )}

      {/* RAG Source Point (Bottom) - Only for Memory Node */}
      {id === 'rag_knowledge' && (
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1.5 z-30">
          <Handle id="rag-source" type="source" position={Position.Bottom} className="w-3! h-3! bg-amber-400 shadow-[0_0_10px_#fbbf24] border-none! p-0!" />
        </div>
      )}

      {/* Header Section */}
      <div className={`flex items-center gap-3 p-3 ${isAgent ? 'border-b border-white/5 bg-white/5' : ''} ${isExternalTool ? 'bg-cyan-950/20' : ''}`}>
        
        {/* Icon Wrapper */}
        <div className={`relative shrink-0 flex items-center justify-center
          ${isAgent ? 'w-10 h-10 rounded-xl' : 'w-8 h-8 rounded-lg'}
          ${status === 'in_progress' ? 'animate-pulse' : ''}
          ${isToxic ? 'bg-rose-900/50 text-rose-400' : 
            category === 'tool_ext' ? 'bg-cyan-900/30 text-cyan-400' :
            category === 'output' ? 'bg-emerald-900/30 text-emerald-400' :
            'bg-neutral-800 text-neutral-400'}
        `}>
          {status === 'in_progress' ? <Loader2 size={isAgent ? 20 : 16} className="animate-spin" /> : <Icon size={isAgent ? 20 : 16} />}
          
          {/* Status Dot */}
          <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-black
            ${status === 'completed' ? 'bg-emerald-500' : 
              status === 'in_progress' ? 'bg-sky-500 animate-ping' : 
              status === 'failed' ? 'bg-red-500' : 'bg-neutral-600'}
          `} />
        </div>

        {/* Text Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between mb-0.5">
            <h4 className={`font-bold truncate ${isAgent ? 'text-sm text-white' : 'text-xs text-neutral-300'}`}>
              {title}
            </h4>
            {isAgent && (
               <span className="text-[9px] font-mono text-neutral-500">{id.split('_')[0].toUpperCase()}</span> 
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <span className={`text-[9px] px-1.5 rounded-full border ${
              isToxic ? 'border-rose-500/30 text-rose-400 bg-rose-500/10' : 
              'border-white/10 text-neutral-500 bg-white/5'
            }`}>
              {personality}
            </span>
          </div>
            {status === 'in_progress' && (
              <span className="text-[8px] text-sky-400 animate-pulse font-mono">::EXECUTING</span>
            )}
        </div>
      </div>

      {/* Body / Thinking Console */}
      <div className="p-3 bg-black/40 flex-1 flex flex-col gap-2 relative overflow-hidden group">
        {/* Specialized Animations Layer */}
        {status === 'in_progress' && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            
            {/* 1. Enhanced Radar Sweeper (web_searcher) */}
            {id === 'web_searcher' && (
              <div className="absolute inset-0 flex items-center justify-center opacity-30 mix-blend-screen">
                <motion.div
                  className="absolute w-[180%] h-[180%] blur-[1px]"
                  style={{ 
                    backgroundImage: 'conic-gradient(from 0deg, #06b6d4 0deg, transparent 60deg, transparent 360deg)',
                    top: '-40%', 
                    left: '-40%' 
                  }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
                />
                {[1, 2].map(i => (
                  <motion.div
                    key={i}
                    className="absolute border border-cyan-400/40 rounded-full"
                    initial={{ width: 10, height: 10, opacity: 1, borderWidth: 2 }}
                    animate={{ width: 300, height: 300, opacity: 0, borderWidth: 0 }}
                    transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.8, ease: "easeOut" }}
                  />
                ))}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.1)_0%,transparent_70%)]" />
              </div>
            )}

            {/* 2. Synaptic Neural Firing (jd_analyzer, brain, company_analysis) */}
            {(id === 'jd_analyzer' || id === 'brain' || id === 'company_analysis') && (
              <div className="absolute inset-0 opacity-20 mix-blend-plus-lighter">
                {synapticParticles.map((p, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-1 h-1 bg-purple-400 rounded-full"
                    style={{ left: p.left, top: p.top }}
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{ duration: p.duration, repeat: Infinity, delay: p.delay }}
                  />
                ))}
              </div>
            )}

            {/* 3. Logic Assembly Blocks (preparer, prepare_research, prepare_rewriter, query_writer) */}
            {(id === 'preparer' || id === 'prepare_research' || id === 'prepare_rewriter' || id === 'query_writer') && (
              <div className="absolute inset-0 flex items-center justify-center opacity-10">
                <div className="grid grid-cols-2 gap-4 scale-110">
                  {[...Array(2)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="w-12 h-1 bg-sky-400/40 rounded-sm"
                      animate={{ 
                        opacity: [0.1, 0.5, 0.1],
                      }}
                      transition={{ 
                        duration: 3.5, 
                        repeat: Infinity, 
                        delay: i * 0.7,
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* 4. Semantic Reflection Pulse (reflection) - NEW */}
            {id === 'reflection' && (
              <div className="absolute inset-0 flex items-center justify-center opacity-15">
                <motion.div
                  className="w-full h-full border-2 border-orange-400/30 rounded-full"
                  animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.1, 0.4, 0.1] }}
                  transition={{ duration: 4, repeat: Infinity }}
                />
              </div>
            )}

            {/* 5. High-Speed Fiber Optic Stream (final_answer) */}
            {id === 'final_answer' && (
              <div className="absolute inset-0 overflow-hidden flex justify-around opacity-50 mix-blend-screen">
                {[...Array(3)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="w-[2px] h-full relative"
                  >
                    <motion.div 
                      className="absolute top-0 bottom-0 w-full bg-linear-to-b from-transparent via-emerald-400 to-transparent"
                      animate={{ y: ['-100%', '100%'] }}
                      transition={{ duration: 1 + Math.random(), repeat: Infinity, delay: Math.random(), ease: "linear" }}
                      style={{ height: '50%' }}
                    />
                  </motion.div>
                ))}
              </div>
            )}
            
            {/* 6. Combiner Fusion Core (combiner, combine_sections) */}
             {(id === 'combiner' || id === 'combine_sections') && (
              <div className="absolute inset-0 flex items-center justify-center opacity-30">
                <motion.div
                  className="w-24 h-24 border-2 border-dashed border-blue-400 rounded-full"
                  animate={{ rotate: 360, scale: [1, 1.1, 1] }}
                  transition={{ rotate: { duration: 8, repeat: Infinity, ease: "linear" }, scale: { duration: 2, repeat: Infinity } }}
                />
                <motion.div
                  className="absolute w-16 h-16 border-2 border-blue-300 rounded-full"
                  animate={{ rotate: -360 }}
                  transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                />
                 <motion.div className="absolute w-2 h-2 bg-blue-100 rounded-full shadow-[0_0_10px_#60a5fa] animate-ping" />
              </div>
            )}

          </div>
        )}

        {/* Console Text & Status */}
        <div className="flex items-center justify-between text-[8px] text-neutral-500 font-mono relative z-10">
          <span>{t('modals.aiModal.optimizeTab.neuralEngine.console.process_locus', { defaultValue: 'PROCESS::THOUGHT_LOCUS' })}</span>
          <span>{status === 'completed' 
            ? t('modals.aiModal.optimizeTab.neuralEngine.console.status_ok', { defaultValue: 'OK' }) 
            : t('modals.aiModal.optimizeTab.neuralEngine.console.status_active', { defaultValue: 'ACTIVE' })}
          </span>
        </div>
        <div className="bg-black/60 rounded-md p-2 font-mono text-[9px] min-h-[50px] border border-white/5 overflow-hidden relative z-10">
          {status === 'in_progress' ? (
            <div className="flex flex-col gap-1">
              <motion.p 
                initial={{ x: -10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className={isToxic ? 'text-rose-400/80' : 'text-sky-400/80'}
              >
                {isToxic 
                  ? '> Initiating psychological deconstruction...' 
                  : t('modals.aiModal.optimizeTab.neuralEngine.console.analyzing', { id: id.split('_')[0].toUpperCase(), defaultValue: `> Agent ${id} analyzing...` })
                }
              </motion.p>
              <div className="flex gap-1">
                <span className="text-[8px] opacity-40">{t('modals.aiModal.optimizeTab.neuralEngine.console.system', { defaultValue: 'SYSTEM:' })}</span>
                <span className="text-white/60 animate-pulse">{t('modals.aiModal.optimizeTab.neuralEngine.console.validating', { defaultValue: 'Running validation...' })}</span>
              </div>
            </div>
          ) : status === 'completed' ? (
            <p className="text-emerald-400/80">{t('modals.aiModal.optimizeTab.neuralEngine.console.success', { defaultValue: '> Operation successful. Output buffered.' })}</p>
          ) : (
            <p className="text-neutral-600">{t('modals.aiModal.optimizeTab.neuralEngine.console.waiting', { defaultValue: '> Awaiting trigger signal...' })}</p>
          )}
        </div>
      </div>

      {/* Footer / Status Bar */}
      <div className="px-3 py-2 bg-black/60 border-t border-white/5 flex items-center justify-between">
        <div className="flex gap-1">
          {[1,2,3,4,5].map(i => (
            <div key={i} className={`w-1.5 h-0.5 rounded-full transition-all duration-500 ${
              status === 'completed' ? 'bg-emerald-500' :
              status === 'in_progress' && i <= 3 ? (isToxic ? 'bg-rose-500' : 'bg-sky-500') :
              'bg-neutral-800'
            }`} />
          ))}
        </div>
        <span className="text-[7px] font-mono text-neutral-500 uppercase">
          {id}::{status || t('modals.aiModal.optimizeTab.neuralEngine.console.standby', { defaultValue: 'STANDBY' })}
        </span>
      </div>

      {/* Special Adversarial Glitch */}
      {isToxic && status === 'in_progress' && (
        <div className="absolute inset-0 pointer-events-none border-2 border-rose-500/20 mix-blend-overlay overflow-hidden">
          <motion.div 
            className="absolute inset-0 bg-red-500/10"
            animate={{ 
              clipPath: [
                'inset(0 0 100% 0)', 'inset(20% 0 50% 0)', 'inset(80% 0 5% 0)', 'inset(0 0 100% 0)'
              ],
              x: [-2, 2, -1, 0, 3, -2],
              opacity: [0, 0.2, 0, 0.4, 0]
            }}
            transition={{ duration: 0.3, repeat: Infinity, ease: "linear", times: [0, 0.2, 0.4, 0.6, 0.8, 1] }}
          />
          <motion.div 
            className="absolute inset-0 bg-rose-500/20 mix-blend-color-dodge"
            animate={{ 
              x: [2, -2, 0],
              skewX: [0, 5, -5, 0]
            }}
            transition={{ duration: 0.15, repeat: Infinity, ease: "linear" }}
          />
        </div>
      )}
    </motion.div>
  );
});

NeuralNode.displayName = 'NeuralNode';
