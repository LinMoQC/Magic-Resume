import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Cpu, Database, Activity, Brain } from 'lucide-react';

interface NodeInspectorProps {
  nodeId: string | null;
  nodeData: NodeInspectorData | null;
  isOpen: boolean;
  onClose: () => void;
}

type NodeInspectorChild = {
  title: string;
  status?: 'completed' | 'in_progress' | 'failed' | string;
  content?: unknown;
};

type NodeInspectorData = {
  title?: string;
  status?: 'completed' | 'in_progress' | 'failed' | string;
  content?: unknown;
  children?: NodeInspectorChild[];
  isToxic?: boolean;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
};

const StreamingText = ({ content, speed = 5 }: { content: string, speed?: number }) => {
  const [displayedContent, setDisplayedContent] = useState('');
  const [fullContent, setFullContent] = useState('');
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Only reset if the content is completely different or shorter
    if (!content.startsWith(fullContent)) {
       setDisplayedContent('');
       setFullContent(content);
    } else if (content !== fullContent) {
       // It's an append update
       setFullContent(content);
    }
  }, [content, fullContent]);

  useEffect(() => {
    if (displayedContent.length >= fullContent.length) return;

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      setDisplayedContent(fullContent.slice(0, displayedContent.length + 1));
    }, speed);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [displayedContent, fullContent, speed]);

  return <span>{displayedContent}</span>;
};

export const NodeInspector: React.FC<NodeInspectorProps> = ({ nodeId, nodeData, isOpen, onClose }) => {
  const { t } = useTranslation();
  const scrollRef = useRef<HTMLDivElement>(null);
  const children = nodeData?.children ?? [];
  const hasContent = nodeData?.content != null;

  // Auto scroll to bottom when new data arrives
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [nodeData, nodeData?.children?.length]); // improved dependency

  // Helper to format content for display
  const renderContent = (content: unknown) => {
    if (!content) return '';
    if (typeof content === 'string') return content;
    return JSON.stringify(content, null, 2);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: '100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="absolute right-0 top-0 bottom-0 w-96 bg-neutral-900/95 backdrop-blur-xl border-l border-white/10 shadow-2xl z-50 flex flex-col pointer-events-auto"
        >
          {/* Header */}
          <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/20">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${
                 nodeData?.isToxic ? 'bg-rose-500/20 text-rose-400' : 'bg-blue-500/20 text-blue-400'
              }`}>
                {nodeData?.icon ? <nodeData.icon size={18} /> : <Cpu size={18} />}
              </div>
              <div>
                <h3 className="font-bold text-sm text-neutral-200 uppercase tracking-wider">
                  {nodeData?.title || t('modals.aiModal.optimizeTab.nodeInspector.unknown_agent', { defaultValue: 'Unknown Agent' })}
                </h3>
                <p className="text-[10px] text-neutral-500 font-mono">ID: {nodeId}</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-1 hover:bg-white/10 rounded-full transition-colors text-neutral-400 hover:text-white"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            
            {/* Status Card */}
            <div className="bg-neutral-800/50 rounded-lg p-3 border border-white/5">
              <div className="flex items-center gap-2 mb-2 text-xs text-neutral-400 uppercase font-bold tracking-wider">
                <Activity size={12} />
                <span>{t('modals.aiModal.optimizeTab.nodeInspector.agent_status', { defaultValue: 'Agent Status' })}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full animate-pulse ${
                  nodeData?.status === 'completed' ? 'bg-emerald-500' :
                  nodeData?.status === 'in_progress' ? 'bg-blue-500' :
                  'bg-neutral-600'
                }`} />
                <span className={`text-sm font-mono ${
                   nodeData?.status === 'completed' ? 'text-emerald-400' :
                   nodeData?.status === 'in_progress' ? 'text-blue-400' :
                   'text-neutral-500'
                }`}>
                  {nodeData?.status?.toUpperCase() || t('modals.aiModal.optimizeTab.nodeInspector.idle', { defaultValue: 'IDLE' })}
                </span>
              </div>
            </div>

            {/* Real Execution Stream (Children Logs) */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-xs text-neutral-400 uppercase font-bold tracking-wider">
                <Brain size={12} />
                <span>{t('modals.aiModal.optimizeTab.nodeInspector.execution_log', { defaultValue: 'Execution Log' })}</span>
              </div>
              <div 
                ref={scrollRef}
                className="bg-black/80 rounded-lg border border-white/10 p-3 h-64 overflow-y-auto font-mono text-[10px] space-y-1 shadow-inner"
              >
                {!children.length && !hasContent ? (
                   <span className="text-neutral-600 italic">{t('modals.aiModal.optimizeTab.nodeInspector.no_logs', { defaultValue: 'No logs available...' })}</span>
                ) : (
                  <>
                    {/* Render Children (Sub-steps) */}
                    {children.map((child, i) => (
                      <div key={i} className="mb-2">
                        <div className="flex items-center gap-2 text-neutral-400">
                          <span className="opacity-50">[{i + 1}]</span>
                          <span className={child.status === 'completed' ? 'text-green-400' : 'text-blue-300'}>
                             {String(child.title ?? '')}
                          </span>
                        </div>
                        {child.content != null && (
                          <div className="pl-6 text-neutral-500 break-all whitespace-pre-wrap font-mono">
                             <StreamingText content={renderContent(child.content)} speed={5} />
                          </div>
                        )}
                      </div>
                    ))}
                    
                    {/* Render Main Content if no children or as summary */}
                    {hasContent && !children.length && (
                      <div className="text-green-400/90 whitespace-pre-wrap break-all font-mono">
                        <StreamingText content={renderContent(nodeData.content)} speed={5} />
                      </div>
                    )}
                  </>
                )}
                
                {nodeData?.status === 'in_progress' && (
                  <motion.div 
                    animate={{ opacity: [0, 1, 0] }} 
                    transition={{ repeat: Infinity, duration: 0.8 }}
                    className="w-2 h-4 bg-green-500/50 inline-block align-middle ml-1"
                  />
                )}
              </div>
            </div>

            {/* I/O Data Inspection */}
            {hasContent && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-xs text-neutral-400 uppercase font-bold tracking-wider">
                  <Database size={12} />
                  <span>{t('modals.aiModal.optimizeTab.nodeInspector.payload_data', { defaultValue: 'Payload Data' })}</span>
                </div>
                <div className="bg-neutral-900 rounded border border-white/10 p-2 overflow-x-auto">
                   <pre className="text-[9px] text-blue-300 font-mono">
                     {/* For the payload view, we just show it static because it's for inspection */}
                     {JSON.stringify(nodeData.content, null, 2)}
                   </pre>
                </div>
              </div>
            )}

          </div>

          {/* Footer */}
          <div className="p-3 bg-black/40 border-t border-white/5 text-[10px] text-neutral-500 font-mono flex justify-between">
            <span>
              {t('modals.aiModal.optimizeTab.nodeInspector.realtime_link', { defaultValue: 'REALTIME_LINK' })}: 
              {t('modals.aiModal.optimizeTab.nodeInspector.active', { defaultValue: 'ACTIVE' })}
            </span>
            <span>{t('modals.aiModal.optimizeTab.nodeInspector.nodes', { defaultValue: 'NODES' })}: {nodeData?.children?.length || 0}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
