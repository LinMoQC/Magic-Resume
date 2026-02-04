"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DropMenu } from '@/components/ui/drop-menu';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { FaPlus, FaDownload, FaRegClone, FaEdit, FaTrash } from 'react-icons/fa';
import { Resume } from '@/types/frontend/resume';
import { useSettingStore } from '@/store/useSettingStore';
import { formatTime, cn } from '@/lib/utils';
import Link from 'next/link';
import { getMagicTemplateList } from '@/templates/config/magic-templates';
import { MagicTemplateDSL } from '@/templates/types/magic-dsl';
import { FiMoreVertical, FiCloud, FiArrowRight } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import ResumeMiniPreview from './ResumeMiniPreview';
import { FileText } from 'lucide-react';

type ResumeListProps = {
  resumes: Resume[];
  onAdd: () => void;
  onImport: () => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onRename: (resume: Resume) => void;
  isLoading?: boolean;
};

const ResumeCard = React.memo(({ 
  resume, 
  onDelete,
  onDuplicate,
  onRename,
  templates,
}: { 
  resume: Resume, 
  onDelete: (id: string) => void,
  onDuplicate: (id: string) => void,
  onRename: (resume: Resume) => void,
  templates: MagicTemplateDSL[],
}) => {
  const { t } = useTranslation();
  const template = templates.find(t => t.id === resume.template);

  const menuItems = [
    {
      label: t('dashboard.resumeCard.rename'),
      icon: <FaEdit className="h-4 w-4" />,
      onClick: () => onRename(resume),
    },
    {
      label: t('dashboard.resumeCard.duplicate'),
      icon: <FaRegClone className="h-4 w-4" />,
      onClick: () => onDuplicate(resume.id),
    },
    {
      label: t('dashboard.resumeCard.delete'),
      icon: <FaTrash className="h-4 w-4" />,
      onClick: () => onDelete(resume.id),
      variant: 'danger' as const,
      separator: true,
    },
  ];

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <motion.div
      key={resume.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.98 }}
      layout
    >
      <Card className={cn(
        "group h-64 flex flex-col justify-between cursor-pointer relative overflow-hidden bg-neutral-900 border transition-all duration-300",
        isMenuOpen ? "border-neutral-700" : "border-neutral-800 hover:border-neutral-700"
      )}>
        <Link href={`/dashboard/edit/${resume.id}`} className="block w-full h-full">
          <div className="relative w-full h-full p-2 bg-neutral-800">
            {template ? (
              <ResumeMiniPreview 
                template={template} 
                className={cn(
                  "scale-[0.8] origin-top transition-opacity duration-300",
                  isMenuOpen ? "opacity-100" : "opacity-60 group-hover:opacity-100"
                )} 
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <FaRegClone className="text-4xl text-neutral-600" />
              </div>
            )}
            <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/50 to-transparent pointer-events-none" />
          </div>
        </Link>
        
        <CardFooter className="absolute bottom-0 left-0 w-full p-4 z-10">
          <div>
            <div className={cn(
              "font-semibold text-white text-base truncate transition-colors",
              isMenuOpen ? "text-sky-400" : "group-hover:text-sky-400"
            )}>{resume.name}</div>
            <div className="text-xs text-neutral-400 mt-1">{t('dashboard.resumeCard.lastUpdated', { time: formatTime(resume.updatedAt) })}</div>
          </div>
        </CardFooter>

        <div className={`absolute top-2 right-2 z-20 transition-all duration-200 ${isMenuOpen ? 'opacity-100 scale-100' : 'opacity-0 group-hover:opacity-100'}`}>
          <DropMenu
            width="w-36"
            side="bottom"
            align="end"
            items={menuItems}
            onOpenChange={setIsMenuOpen}
            trigger={
              <motion.button 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className={cn(
                  "p-2.5 rounded-xl backdrop-blur-md shadow-lg shadow-black/20 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20",
                  isMenuOpen 
                    ? "bg-neutral-800/90 text-white border-neutral-700" 
                    : "bg-neutral-900/80 text-neutral-400 hover:text-white border-neutral-800/50 hover:border-neutral-700"
                )}
                onClick={e => e.stopPropagation()}
              >
                <FiMoreVertical className="w-4 h-4" />
              </motion.button>
            }
          />
        </div>
      </Card>
    </motion.div>
  );
});

ResumeCard.displayName = 'ResumeCard';

function ResumeCardSkeleton() {
  return (
    <div className="h-64 flex flex-col justify-between relative overflow-hidden bg-neutral-900 border border-neutral-800 rounded-2xl">
      <div className="relative w-full h-full p-2 bg-neutral-800">
        <div className="w-full h-full bg-neutral-700/50 animate-pulse rounded" />
      </div>
      
      <div className="absolute bottom-0 left-0 w-full p-4">
        <div className="h-5 bg-neutral-700/50 rounded w-3/4 mb-2 animate-pulse" />
        <div className="h-3 bg-neutral-700/30 rounded w-1/2 animate-pulse" />
      </div>
    </div>
  );
}

function CloudSyncBanner() {
  const { t } = useTranslation();
  const cloudSync = useSettingStore(state => state.cloudSync);

  if (cloudSync) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      className="mb-8"
    >
      <Link href="/dashboard/settings">
        <div className="relative group overflow-hidden rounded-2xl p-4 bg-linear-to-r from-blue-600/20 to-indigo-600/10 border border-blue-500/30 hover:border-blue-400/50 transition-all duration-300">
          {/* Animated background glow */}
          <div className="absolute inset-0 bg-blue-500/5 group-hover:bg-blue-500/10 transition-colors" />
          
          <div className="relative flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                <FiCloud size={20} />
              </div>
              <div>
                <h4 className="text-blue-100 font-semibold mb-0.5">{t('dashboardPage.cloudSyncBanner.title')}</h4>
                <p className="text-sm text-blue-200/70">{t('dashboardPage.cloudSyncBanner.description')}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-blue-400 font-medium text-sm whitespace-nowrap group-hover:translate-x-1 transition-transform">
              {t('dashboardPage.cloudSyncBanner.button')} <FiArrowRight />
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

const ResumeList = React.memo(({ resumes, onAdd, onImport, onDelete, onDuplicate, onRename, isLoading = false }: ResumeListProps) => {
  const { t } = useTranslation();
  const [isMounted, setIsMounted] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [templates, setTemplates] = useState<MagicTemplateDSL[]>([]);

  useEffect(() => {
    setIsMounted(true);
    const loadTemplates = async () => {
      try {
        const list = await getMagicTemplateList();
        setTemplates(list);
      } catch (e) {
        console.error('Failed to load templates for dashboard', e);
      }
    };
    loadTemplates();
  }, []);

  if (!isMounted) {
    return null; // Prevent SSR flicker entirely for this list component, or render a skeleton/empty state
  }

  return (
    <div className="flex-1 overflow-y-auto relative bg-[#0a0a0a]">
       {/* Sticky Header */}
      <div className="sticky top-0 z-40 bg-[#0a0a0a]/80 backdrop-blur-md px-12 py-6 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/10 rounded-xl">
            <FileText className="w-6 h-6 text-blue-500" />
          </div>
          <h1 className="text-3xl font-bold text-white">{t('dashboard.title')}</h1>
        </div>
      </div>

      <div className="px-12 py-8 space-y-8 pb-32">
        <CloudSyncBanner />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {/* 新建简历卡片 */}
          <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.98 }}>
            <Card className="group cursor-pointer h-64 flex flex-col items-center relative overflow-hidden bg-neutral-900 border border-neutral-800 hover:border-blue-500/50 transition-colors" onClick={onAdd}>
              <CardContent className="flex-1 flex flex-col items-center pt-16 text-center px-4">
                <div className="w-12 h-12 rounded-full bg-neutral-800 flex items-center justify-center mb-4 group-hover:bg-blue-500/20 transition-colors">
                  <FaPlus className="text-xl text-neutral-400 group-hover:text-blue-500 transition-colors" />
                </div>
                <div className="text-lg font-semibold text-neutral-200 group-hover:text-white transition-colors">{t('dashboard.newResumeCard.title')}</div>
                <div className="text-xs text-neutral-500 mt-1">{t('dashboard.newResumeCard.description')}</div>
              </CardContent>
            </Card>
          </motion.div>
          {/* 导入简历卡片 */}
          <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.98 }}>
            <Card className="group cursor-pointer h-64 flex flex-col items-center relative overflow-hidden bg-neutral-900 border border-neutral-800 hover:border-blue-500/50 transition-colors" onClick={onImport}>
              <CardContent className="flex-1 flex flex-col items-center pt-16 text-center px-4">
                <div className="w-12 h-12 rounded-full bg-neutral-800 flex items-center justify-center mb-4 transition-colors group-hover:bg-blue-500/20">
                  <FaDownload className="text-xl text-neutral-500 transition-colors group-hover:text-blue-400" />
                </div>
                <div className="text-lg font-semibold text-neutral-200 group-hover:text-white transition-colors">{t('dashboard.importResumeCard.title')}</div>
                <div className="text-sm text-neutral-500 mt-1">{t('dashboard.importResumeCard.description')}</div>
              </CardContent>
            </Card>
          </motion.div>
          {/* 简历卡片列表 */}
          {isLoading ? (
            // Show skeleton loaders while loading
            Array.from({ length: 6 }).map((_, i) => (
              <ResumeCardSkeleton key={`skeleton-${i}`} />
            ))
          ) : (
            <AnimatePresence>
              {resumes.map(resume => (
                <ResumeCard 
                  key={resume.id} 
                  resume={resume} 
                  onDelete={(id) => setDeleteId(id)}
                  onDuplicate={onDuplicate}
                  onRename={onRename}
                  templates={templates}
                />
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>

      <ConfirmDialog 
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleteId) onDelete(deleteId);
        }}
        title={t('common.confirmDeleteResume')}
        description={useSettingStore.getState().cloudSync ? t('common.deleteDescriptionCloud') : t('common.deleteDescriptionLocal')}
      />
    </div>
  );
});

ResumeList.displayName = 'ResumeList';

export default ResumeList;