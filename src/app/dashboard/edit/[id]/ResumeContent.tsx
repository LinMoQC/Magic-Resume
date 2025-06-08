import React from 'react';
import { Button } from '@/components/ui/button';

type ResumeContentProps = {
  renderSections: () => React.ReactNode;
  handleSave: () => void;
  onShowJson: () => void;
};

export default function ResumeContent({ renderSections, handleSave, onShowJson }: ResumeContentProps) {
  return (
    <div className="p-6 h-full flex flex-col bg-neutral-900 border-r border-neutral-800">
      <div className="flex-1 overflow-y-auto pr-4 -mr-4">
        {renderSections()}
      </div>
      <div className="mt-6 flex gap-2">
        <Button onClick={onShowJson} className="w-full">
          查看 JSON
        </Button>
        <Button onClick={handleSave} className="w-full">
          保存
        </Button>
      </div>
    </div>
  );
}
