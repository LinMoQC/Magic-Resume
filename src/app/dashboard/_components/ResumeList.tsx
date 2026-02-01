"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardFooter } from '@/app/components/ui/card';
import { FaPlus, FaDownload, FaRegClone, FaEdit, FaTrash } from 'react-icons/fa';
import { Resume } from '@/store/useResumeStore';
import { useSettingStore } from '@/store/useSettingStore';
import { formatTime } from '@/lib/utils';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/app/components/ui/dropdown-menu';
import { getMagicTemplateList } from '@/templates/config/magic-templates';
import { MagicTemplateDSL } from '@/templates/types/magic-dsl';
import { FiMoreVertical, FiCloud, FiArrowRight } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import ConfirmDialog from '@/app/components/ConfirmDialog';
import ResumeMiniPreview from './ResumeMiniPreview';

type ResumeListProps = {
  resumes: Resume[];
  onAdd: () => void;
  onImport: () => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onRename: (resume: Resume) => void;
};

function ResumeCard({ 
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
}) {
  const { t } = useTranslation();
  const template = templates.find(t => t.id === resume.template);

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
      <Card className="group h-64 flex flex-col justify-between cursor-pointer relative overflow-hidden bg-neutral-900 border border-neutral-800 hover:border-neutral-700">
        <Link href={`/dashboard/edit/${resume.id}`} className="block w-full h-full">
          <div className="relative w-full h-full p-2 bg-neutral-800">
            {template ? (
              <ResumeMiniPreview template={template} className="scale-[0.8] origin-top opacity-60 group-hover:opacity-100 transition-opacity duration-300" />
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
            <div className="font-semibold text-white text-base truncate group-hover:text-sky-400 transition-colors">{resume.name}</div>
            <div className="text-xs text-neutral-400 mt-1">{t('dashboard.resumeCard.lastUpdated', { time: formatTime(resume.updatedAt) })}</div>
          </div>
        </CardFooter>

        <div className="absolute top-2 right-2 z-20">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <motion.button 
                whileHover={{ scale: 1.2 }}
                className="p-2 rounded-full bg-black hover:bg-neutral-700 text-white transition-colors focus:outline-none"
                onClick={e => e.stopPropagation()}
              >
                <FiMoreVertical />
              </motion.button>
            </DropdownMenuTrigger>
            <DropdownMenuContent onClick={e => e.stopPropagation()} side="bottom" align="end" className='bg-neutral-900 border-neutral-700 text-white'>
              <DropdownMenuItem onClick={() => onRename(resume)} className='cursor-pointer'>
                <FaEdit className="mr-2" />
                {t('dashboard.resumeCard.rename')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDuplicate(resume.id)} className='cursor-pointer'>
                <FaRegClone className="mr-2" />
                {t('dashboard.resumeCard.duplicate')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onDelete(resume.id)} className='cursor-pointer text-red-500 focus:text-red-500 focus:bg-red-500/10'>
                <FaTrash className="mr-2" />
                {t('dashboard.resumeCard.delete')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </Card>
    </motion.div>
  );
}

function CloudSyncBanner() {
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
                <h4 className="text-blue-100 font-semibold mb-0.5">云端同步功能现已上线！</h4>
                <p className="text-sm text-blue-200/70">开启后可多端同步并自动备份所有简历版本，数据安全无忧。目前您处于本地存储模式。</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-blue-400 font-medium text-sm whitespace-nowrap group-hover:translate-x-1 transition-transform">
              前往设置开启 <FiArrowRight />
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export default function ResumeList({ resumes, onAdd, onImport, onDelete, onDuplicate, onRename }: ResumeListProps) {
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
    <div className="flex-1 flex flex-col px-12 py-10 overflow-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold">{t('dashboard.title')}</h1>
      </div>

      <CloudSyncBanner />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {/* 新建简历卡片 */}
        <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.98 }}>
          <Card className="group cursor-pointer h-64 flex flex-col items-center justify-center relative overflow-hidden" onClick={onAdd}>
            <CardContent className="flex-1 flex flex-col items-center justify-center">
              <FaPlus className="text-4xl text-neutral-600 group-hover:text-blue-500 mb-2 transition" />
              <div className="text-lg font-semibold text-neutral-300">{t('dashboard.newResumeCard.title')}</div>
              <div className="text-xs text-neutral-500 mt-1">{t('dashboard.newResumeCard.description')}</div>
            </CardContent>
          </Card>
        </motion.div>
        {/* 导入简历卡片 */}
        <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.98 }}>
          <Card className="group cursor-pointer h-64 flex flex-col items-center justify-center relative overflow-hidden" onClick={onImport}>
            <CardContent className="flex-1 flex flex-col items-center justify-center text-center p-6">
              <div className="w-16 h-16 rounded-full bg-neutral-800 flex items-center justify-center mb-4 transition-colors group-hover:bg-blue-500/20">
                <FaDownload className="text-3xl text-neutral-500 transition-colors group-hover:text-blue-400" />
              </div>
              <div className="text-lg font-semibold text-neutral-200">{t('dashboard.importResumeCard.title')}</div>
              <div className="text-sm text-neutral-500 mt-1">{t('dashboard.importResumeCard.description')}</div>
            </CardContent>
          </Card>
        </motion.div>
        {/* 简历卡片列表 */}
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
}