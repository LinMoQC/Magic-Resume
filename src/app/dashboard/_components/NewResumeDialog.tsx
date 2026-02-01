import React from 'react';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/app/components/ui/dialog';
import { Button } from '@/app/components/ui/button';
import { useTranslation } from 'react-i18next';

type NewResumeDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  newName: string;
  setNewName: (name: string) => void;
  handleCreate: () => void;
  isLoading?: boolean;
};

export default function NewResumeDialog({ open, onOpenChange, newName, setNewName, handleCreate, isLoading }: NewResumeDialogProps) {
  const { t } = useTranslation();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='text-white'>
        <DialogHeader>
          <DialogTitle>{t('newResumeDialog.title')}</DialogTitle>
          <DialogDescription>{t('newResumeDialog.description')}</DialogDescription>
        </DialogHeader>
        <input
          className="flex h-10 w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-neutral-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          placeholder={t('newResumeDialog.placeholder')}
          value={newName}
          onChange={e => setNewName(e.target.value)}
          autoFocus
        />
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} variant="ghost" disabled={isLoading}>{t('newResumeDialog.cancel')}</Button>
          <Button onClick={handleCreate} disabled={!newName.trim() || isLoading} className="min-w-[80px]">
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : t('newResumeDialog.create')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 