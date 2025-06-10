import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useResumeStore, Resume } from '@/store/useResumeStore';
import { toast } from 'sonner';
import { FaFileUpload } from 'react-icons/fa';

type ImportResumeDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function ImportResumeDialog({ open, onOpenChange }: ImportResumeDialogProps) {
  const { addResume } = useResumeStore();
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setError(null);
    const file = acceptedFiles[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onabort = () => toast.error('File reading was aborted.');
    reader.onerror = () => toast.error('File reading has failed.');
    reader.onload = () => {
      try {
        const result = JSON.parse(reader.result as string);

        // Basic validation
        if (typeof result === 'object' && result !== null && 'info' in result && 'sections' in result) {
          const newResume: Resume = {
            ...result,
            id: Date.now().toString(),
            name: `${result.name || 'Imported Resume'} (Imported)`,
            updatedAt: Date.now(),
          };
          addResume(newResume);
          toast.success('Resume imported successfully!');
          onOpenChange(false);
        } else {
          throw new Error('Invalid resume JSON format.');
        }
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Failed to parse JSON file.';
        toast.error(message);
        setError(message);
      }
    };
    reader.readAsText(file);
  }, [addResume, onOpenChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/json': ['.json'] },
    multiple: false,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className='text-white'>Import Resume from JSON</DialogTitle>
          <DialogDescription>
            Select or drop a JSON file below to create a new resume.
          </DialogDescription>
        </DialogHeader>

        <div
          {...getRootProps()}
          className={`mt-4 border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors
            ${isDragActive ? 'border-sky-500 bg-sky-500/10' : 'border-neutral-700 hover:border-sky-600'}
          `}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center justify-center text-neutral-400">
            <FaFileUpload className="w-12 h-12 mb-4" />
            {isDragActive ? (
              <p>Drop the file here ...</p>
            ) : (
              <p>Drag &apos;n&apos; drop a JSON file here, or click to select file</p>
            )}
            <p className="text-xs mt-1">(.json file only)</p>
          </div>
        </div>
        
        {error && <p className="mt-2 text-sm text-red-500">{error}</p>}

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 