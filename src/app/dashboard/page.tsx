'use client'

import { useResumeStore } from '@/store/useResumeStore';
import { useRouter } from 'next/navigation';
import { useState, useEffect, Fragment } from 'react';
import { FaPlus, FaDownload, FaRegFileAlt, } from 'react-icons/fa';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogFooter as DialogFooterUI, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '@clerk/nextjs';
import DashboardSkeleton from './skeleton/DashboardSkeleton';

function formatTime(ts: number) {
  if (!ts) return '';
  const d = new Date(ts);
  return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
}

export default function Dashboard() {
  const { resumes, addResume, deleteResume } = useResumeStore();
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const { isLoaded } = useUser();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleAdd = () => setDialogOpen(true);
  const handleImport = () => setImportDialogOpen(true);
  const handleCreate = () => {
    if (!newName.trim()) return;
    const id = addResume(newName.trim());
    setNewName('');
    setDialogOpen(false);
    router.push(`/dashboard/edit/${id}`);
  };

  if(!isLoaded || !isClient) {
    return <DashboardSkeleton />;
  }

  return (
    <Fragment>
      {/* 新建简历弹窗 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新建简历</DialogTitle>
            <DialogDescription>请输入新简历名称</DialogDescription>
          </DialogHeader>
          <input
            className="w-full bg-neutral-800 border border-neutral-700 rounded px-3 py-2 text-sm mt-2"
            placeholder="简历名称"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            autoFocus
          />
          <DialogFooterUI>
            <Button onClick={() => setDialogOpen(false)} variant="outline">取消</Button>
            <Button onClick={handleCreate} disabled={!newName.trim()}>创建</Button>
          </DialogFooterUI>
        </DialogContent>
      </Dialog>
      {/* 导入简历弹窗 */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>导入简历</DialogTitle>
            <DialogDescription>导入功能开发中，敬请期待！</DialogDescription>
          </DialogHeader>
          <DialogFooterUI>
            <Button onClick={() => setImportDialogOpen(false)}>关闭</Button>
          </DialogFooterUI>
        </DialogContent>
      </Dialog>
      {/* 中间主内容区 */}
      <main className="flex-1 flex flex-col px-12 py-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold">Resumes</h1>
        </div>
        <div className="grid grid-cols-4 gap-8">
          {/* 新建简历卡片 */}
          <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.98 }}>
            <Card className="group cursor-pointer h-64 flex flex-col items-center justify-center relative overflow-hidden" onClick={handleAdd}>
              <CardContent className="flex-1 flex flex-col items-center justify-center">
                <FaPlus className="text-4xl text-neutral-600 group-hover:text-blue-500 mb-2 transition" />
                <div className="text-lg font-semibold text-neutral-300">Create a new resume</div>
                <div className="text-xs text-neutral-500 mt-1">Start building from scratch</div>
              </CardContent>
            </Card>
          </motion.div>
          {/* 导入简历卡片 */}
          <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.98 }}>
            <Card className="group cursor-pointer h-64 flex flex-col items-center justify-center relative overflow-hidden" onClick={handleImport}>
              <CardContent className="flex-1 flex flex-col items-center justify-center text-center p-6">
                <div className="w-16 h-16 rounded-full bg-neutral-800 flex items-center justify-center mb-4 transition-colors group-hover:bg-blue-500/20">
                  <FaDownload className="text-3xl text-neutral-500 transition-colors group-hover:text-blue-400" />
                </div>
                <div className="text-lg font-semibold text-neutral-200">Import an existing resume</div>
                <div className="text-sm text-neutral-500 mt-1">LinkedIn, JSON Resume, etc.</div>
              </CardContent>
            </Card>
          </motion.div>
          {/* 简历卡片列表 */}
          <AnimatePresence>
            {resumes.map(r => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.98 }}
                layout
              >
                <Card className="group h-64 flex flex-col justify-between cursor-pointer relative overflow-hidden" onClick={() => router.push(`/dashboard/edit/${r.id}`)}>
                   <CardContent className="flex-1 flex items-center justify-center">
                     <FaRegFileAlt className="text-6xl text-neutral-700 group-hover:text-blue-500 transition" />
                   </CardContent>
                   <CardFooter className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/80 to-transparent p-4">
                     <div>
                       <div className="font-semibold text-white text-base truncate">{r.name}</div>
                       <div className="text-xs text-neutral-400 mt-1">Last updated {formatTime(r.updatedAt)}</div>
                     </div>
                   </CardFooter>
                   {/* 删除按钮 */}
                   <motion.button
                     whileHover={{ scale: 1.2, backgroundColor: '#ef4444' }}
                     className="absolute top-3 right-3 bg-black/60 hover:bg-red-600 text-white rounded-full p-2 transition"
                     onClick={e => { e.stopPropagation(); deleteResume(r.id); }}
                   >
                     <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 6 6 18M6 6l12 12"/></svg>
                   </motion.button>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </main>
    </Fragment>
  );
} 