import React from 'react';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';

type ResumeContentProps = {
  renderSections: () => React.ReactNode;
  handleSave: () => void;
  onShowJson: () => void;
  isSaving?: boolean;
};

export default function ResumeContent({ renderSections, handleSave, onShowJson, isSaving = false }: ResumeContentProps) {
  const { t } = useTranslation();
  return (
    <div className="flex h-full flex-col bg-desk py-5">
      <div className="flex-1 overflow-y-auto px-4 hide-scrollbar">
        {renderSections()}
      </div>
      <div className="mt-6 flex gap-2 px-4">
        <Button onClick={onShowJson} className="w-full">
          {t('resumeContent.viewJson')}
        </Button>
        <Button 
          onClick={handleSave} 
          className="w-full"
          loading={isSaving}
        >
          {t('resumeContent.save')}
        </Button>
      </div>
    </div>
  );
}
