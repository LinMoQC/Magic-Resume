import React from 'react';

type ResumeContentProps = {
  renderSections: () => React.ReactNode;
  handleSave: () => void;
  onShowJson: () => void;
};

export default function ResumeContent({ renderSections, handleSave, onShowJson }: ResumeContentProps) {
  return (
    <div className="w-full bg-neutral-900 border-r border-neutral-800 flex flex-col h-screen">
      <div className="flex-grow px-6 py-6 overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-800 scrollbar-track-neutral-900">
        {renderSections()}
      </div>
      <footer className="flex justify-end gap-3 items-center px-6 py-4 bg-neutral-900 border-t border-neutral-800 shrink-0">
        <button
          className="px-4 py-2 rounded-lg bg-neutral-700 hover:bg-neutral-600 transition text-sm"
          onClick={onShowJson}
        >
          查看 JSON
        </button>
        <button 
          className="px-6 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 transition font-bold text-sm"
          onClick={handleSave}
        >
          保存
        </button>
      </footer>
    </div>
  );
}
