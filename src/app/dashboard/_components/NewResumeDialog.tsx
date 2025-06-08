import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

type NewResumeDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  newName: string;
  setNewName: (name: string) => void;
  handleCreate: () => void;
};

export default function NewResumeDialog({ open, onOpenChange, newName, setNewName, handleCreate }: NewResumeDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='text-white'>
        <DialogHeader>
          <DialogTitle>新建简历</DialogTitle>
          <DialogDescription>请输入新简历名称</DialogDescription>
        </DialogHeader>
        <input
          className="flex h-10 w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-neutral-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="简历名称"
          value={newName}
          onChange={e => setNewName(e.target.value)}
          autoFocus
        />
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} variant="outline">取消</Button>
          <Button onClick={handleCreate} disabled={!newName.trim()}>创建</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 