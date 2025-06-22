import React from 'react';
import { Loader2, CheckCircle, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/app/components/ui/button';
import { useTranslation } from 'react-i18next';
import dynamic from 'next/dynamic';
import { LogEntry } from '@/store/useResumeOptimizerStore';

const ReactMarkdown = dynamic(() => import('react-markdown'), { ssr: false });

import { EditorComponents } from '@/lib/componentOptimization';

const ReactJsonView = EditorComponents.JsonViewer;

type LogItemProps = {
  log: LogEntry;
  isLast: boolean;
  onToggleExpand: (id: string) => void;
  expandedLogId: string | null;
  onToggleContentExpand: (id: string) => void;
};

export const LogItem: React.FC<LogItemProps> = ({ log, isLast, onToggleExpand, expandedLogId, onToggleContentExpand }) => {
  const { t } = useTranslation();
  const hasChildren = log.children && log.children.length > 0;
  const isExpandable = !!log.content || hasChildren;

  const getStatusText = (log: LogEntry) => {
    if (log.id.startsWith('rewrite_') && log.status !== 'pending') {
      const key = `modals.aiModal.optimizeTab.steps.rewriting_section.${log.status}`;
      return t(key, { section: log.title });
    }
    if (log.id.startsWith('analyze_') && log.status !== 'pending') {
      const key = `modals.aiModal.optimizeTab.steps.analyzing_category.${log.status}`;
      return t(key, { category: log.title });
    }
    if (log.id.startsWith('research_') && log.status !== 'pending') {
      const key = `modals.aiModal.optimizeTab.steps.researching_topic.${log.status}`;
      return t(key, { topic: log.title });
    }
    const key = `modals.aiModal.optimizeTab.steps.${log.id}.${log.status}`;
    const translation = t(key);
    if (translation === key && log.status === 'pending') return '';
    return translation;
  }

  let contentElement = null;
  if (expandedLogId === log.id && log.content) {
    if (typeof log.content === 'object' && log.content !== null) {
      contentElement = (
        <div className="json-viewer-enhanced max-w-full overflow-hidden">
          <ReactJsonView 
            src={log.content as object} 
            theme="ocean" 
            displayDataTypes={false} 
            name={false}
            collapsed={2}
            displayObjectSize={true}
            quotesOnKeys={false}
            sortKeys={false}
            enableClipboard={false}
            style={{ 
              background: 'transparent',
              fontSize: '12px',
              lineHeight: '1.5',
              maxWidth: '100%',
              overflowWrap: 'anywhere',
              wordBreak: 'break-all'
            }}
          />
        </div>
      );
    } else {
      contentElement = (
        <div className="prose prose-sm prose-invert max-w-none text-sm font-sans leading-relaxed">
          <ReactMarkdown>
            {String(log.content)}
          </ReactMarkdown>
        </div>
      );
    }
  }

  return (
    <div className="relative w-full">
      <div className="flex items-start max-w-full">
        <div className="flex flex-col items-center mr-4 self-stretch flex-shrink-0">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white z-10 shadow-lg transition-all duration-300 ${
            log.status === 'completed' 
              ? 'bg-gradient-to-r from-green-500 to-emerald-600 shadow-green-500/25' 
              : log.status === 'in_progress' 
              ? 'bg-gradient-to-r from-sky-500 to-blue-600 shadow-sky-500/25 animate-pulse' 
              : 'bg-gradient-to-r from-neutral-600 to-neutral-500 shadow-neutral-500/25'
          }`}>
            {log.status === 'in_progress' && <Loader2 size={18} className="animate-spin" />}
            {log.status === 'completed' && <CheckCircle size={18} />}
            {log.status === 'pending' && <div className="w-3 h-3 bg-neutral-300 rounded-full opacity-60" />}
          </div>
          {!isLast && <div className="w-0.5 flex-grow bg-gradient-to-b from-neutral-600 to-neutral-700 rounded-full mt-2" />}
        </div>
        <div className="flex-1 pt-1 pb-4 min-w-0 overflow-hidden">
          <div className="flex items-center min-w-0">
            {isExpandable && (
              <div className="flex-shrink-0 w-6 flex justify-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 rounded-md hover:bg-neutral-700/50 transition-all duration-200"
                    onClick={() => hasChildren ? onToggleExpand(log.id) : onToggleContentExpand(log.id)}
                  >
                    <ChevronRight size={12} className={`transition-transform duration-300 text-neutral-400 ${(hasChildren && log.isExpanded) || expandedLogId === log.id ? 'rotate-90 text-neutral-200' : ''}`} />
                  </Button>
              </div>
            )}
            <h4 className={`font-semibold text-neutral-100 text-sm ${isExpandable ? 'ml-1' : ''} truncate min-w-0`}>{log.title}</h4>
          </div>
          <div className={`${isExpandable ? "pl-7" : ""} min-w-0 max-w-full overflow-hidden`}>
            <p className="text-xs text-neutral-400 mt-1 leading-relaxed break-words overflow-wrap-anywhere">{getStatusText(log)}</p>

            <AnimatePresence>
              {contentElement && (
                <motion.div
                  initial={{ opacity: 0, height: 0, marginTop: -10 }}
                  animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
                  exit={{ opacity: 0, height: 0, marginTop: -10 }}
                  className="mb-2"
                >
                  <div className="p-4 bg-black/90 border border-neutral-600/50 rounded-lg max-h-64 overflow-auto backdrop-blur-sm shadow-xl max-w-full">
                    <div className="text-sm text-neutral-200 leading-relaxed break-words overflow-wrap-anywhere max-w-full">
                      {contentElement}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {hasChildren && log.isExpanded && (
              <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3 p-3 bg-gradient-to-br from-neutral-800/40 to-neutral-700/20 border border-neutral-600/30 rounded-lg backdrop-blur-sm shadow-lg overflow-hidden"
                >
                {log.children!.map((child, index) => (
                  <LogItem
                    key={child.id}
                    log={child}
                    isLast={index === log.children!.length - 1}
                    onToggleExpand={onToggleExpand}
                    expandedLogId={expandedLogId}
                    onToggleContentExpand={onToggleContentExpand}
                  />
                ))}
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};