'use client'

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/app/components/ui/dialog';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { useTranslation } from 'react-i18next';

type RenameResumeDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  newName: string;
  setNewName: (name: string) => void;
  handleRename: () => void;
};

export default function RenameResumeDialog({
  open,
  onOpenChange,
  newName,
  setNewName,
  handleRename,
}: RenameResumeDialogProps) {
  const { t } = useTranslation();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='text-white'>
        <DialogHeader>
          <DialogTitle>{t('renameDialog.title')}</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder={t('renameDialog.placeholder')}
            onKeyDown={(e) => e.key === 'Enter' && handleRename()}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('renameDialog.cancel')}</Button>
          <Button onClick={handleRename}>{t('renameDialog.rename')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 