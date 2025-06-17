import React from 'react';
import { Loader2, CheckCircle, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/app/components/ui/button';
import { useTranslation } from 'react-i18next';
import dynamic from 'next/dynamic';
import { LogEntry } from '@/store/useResumeOptimizerStore';

const ReactJsonView = dynamic(() => import('@microlink/react-json-view'), { ssr: false });

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
      contentElement = <ReactJsonView src={log.content as object} theme="ocean" displayDataTypes={false} name={false} />;
    } else {
      contentElement = <pre className="text-sm text-white whitespace-pre-wrap">{String(log.content)}</pre>;
    }
  }

  return (
    <div className="relative">
      <div className="flex items-start">
        <div className="flex flex-col items-center mr-4 self-stretch">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white z-10 ${log.status === 'completed' ? 'bg-green-600' : 'bg-sky-600'}`}>
            {log.status === 'in_progress' && <Loader2 size={16} className="animate-spin" />}
            {log.status === 'completed' && <CheckCircle size={16} />}
            {log.status === 'pending' && <div className="w-2 h-2 bg-neutral-500 rounded-full" />}
          </div>
          {!isLast && <div className="w-px flex-grow bg-neutral-700" />}
        </div>
        <div className="flex-1 pt-1 pb-4">
          <div className="flex items-center">
            {isExpandable && (
              <div className="flex-shrink-0 w-8 flex justify-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => hasChildren ? onToggleExpand(log.id) : onToggleContentExpand(log.id)}
                  >
                    <ChevronRight size={16} className={`transition-transform duration-200 ${(hasChildren && log.isExpanded) || expandedLogId === log.id ? 'rotate-90' : ''}`} />
                  </Button>
              </div>
            )}
            <h4 className={`font-semibold text-neutral-200 ${isExpandable ? 'ml-2' : ''}`}>{log.title}</h4>
          </div>
          <div className={isExpandable ? "pl-10" : ""}>
            <p className="text-sm text-neutral-400 mt-1">{getStatusText(log)}</p>

            <AnimatePresence>
              {contentElement && (
                <motion.div
                  initial={{ opacity: 0, height: 0, marginTop: -10 }}
                  animate={{ opacity: 1, height: 'auto', marginTop: 10 }}
                  exit={{ opacity: 0, height: 0, marginTop: -10 }}
                  className="mb-2"
                >
                  <div className="p-2 bg-black rounded-md max-h-48 overflow-y-auto">
                    {contentElement}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {hasChildren && log.isExpanded && (
              <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 p-4 bg-neutral-900 border border-neutral-800 rounded-lg"
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