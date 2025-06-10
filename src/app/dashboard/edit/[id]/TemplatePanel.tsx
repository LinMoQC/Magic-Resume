import React from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FaRegClone } from 'react-icons/fa';

type TemplatePanelProps = {
  rightCollapsed: boolean;
  setRightCollapsed: (collapsed: boolean) => void;
};

export default function TemplatePanel({ rightCollapsed, setRightCollapsed }: TemplatePanelProps) {
  return (
    <aside className={`relative bg-neutral-900 border-l border-neutral-800 transition-all duration-300 flex justify-center items-start p-2 ${rightCollapsed ? 'w-[56px]' : 'w-[280px]'}`}>
      <Button 
        variant="ghost"
        size="icon"
        className="absolute top-1/2 -left-4 transform -translate-y-1/2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-full h-8 w-8 z-10"
        onClick={() => setRightCollapsed(!rightCollapsed)}
      >
        {rightCollapsed ? <ArrowLeft size={16} /> : <ArrowRight size={16} />}
      </Button>

      {!rightCollapsed && (
        <div className="w-full p-4">
          <h2 className="text-xl font-semibold mb-6 text-left"><FaRegClone className="inline-block mr-3 text-[16px]" />Template</h2>
          <div className="grid grid-cols-2 gap-4">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="bg-neutral-800 border border-neutral-700 aspect-[3/4] rounded-lg flex items-center justify-center text-neutral-500 hover:bg-neutral-700 hover:border-blue-500 cursor-pointer transition-colors">
                Template {i}
              </div>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
} 