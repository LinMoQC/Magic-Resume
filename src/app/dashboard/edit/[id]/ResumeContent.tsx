import React from 'react';
import { Button } from '@/app/components/ui/button';
import { useTranslation } from 'react-i18next';

type ResumeContentProps = {
  renderSections: () => React.ReactNode;
  handleSave: () => void;
  onShowJson: () => void;
};

export default function ResumeContent({ renderSections, handleSave, onShowJson }: ResumeContentProps) {
  const { t } = useTranslation();
  return (
    <div className="p-6 px-0 h-full flex flex-col bg-neutral-900 border-r border-neutral-800">
      <div className="flex-1 overflow-y-auto px-4 hide-scrollbar">
        {renderSections()}
      </div>
      <div className="mt-6 flex gap-2 px-4">
        <Button onClick={onShowJson} className="w-full">
          {t('resumeContent.viewJson')}
        </Button>
        <Button onClick={handleSave} className="w-full">
          {t('resumeContent.save')}
        </Button>
      </div>
    </div>
  );
}
