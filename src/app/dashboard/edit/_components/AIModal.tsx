import React from 'react';
import { Bot, Sparkles, FileText, Briefcase } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

type AIModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

const TABS = [
  { name: '一键优化', icon: <Sparkles size={18} /> },
  { name: '按模块优化', icon: <FileText size={18} /> },
  { name: 'AI匹配', icon: <Briefcase size={18} /> },
];

export default function AIModal({ isOpen, onClose }: AIModalProps) {
  const [activeTab, setActiveTab] = React.useState(TABS[0].name);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] bg-neutral-900 border-neutral-800 text-white flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Bot className="mr-2" />
            AI 简历助手
          </DialogTitle>
          <DialogDescription>
            使用强大的AI模型，智能优化您的简历，提升竞争力。
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Tabs Navigation */}
          <div className="flex border-b border-neutral-700">
            {TABS.map(tab => (
              <button
                key={tab.name}
                onClick={() => setActiveTab(tab.name)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab.name
                    ? 'border-b-2 border-blue-500 text-blue-400'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                {tab.icon}
                {tab.name}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {activeTab === '一键优化' && (
              <div>
                <h3 className="text-lg font-semibold mb-4">一键优化</h3>
                <p className="text-neutral-400 mb-4">输入您的目标职位或一些简单的要求，AI将全面优化您的简历内容。</p>
                {/* Add prompt input and job description input here */}
              </div>
            )}
            {activeTab === '按模块优化' && (
              <div>
                <h3 className="text-lg font-semibold mb-4">按模块优化</h3>
                <p className="text-neutral-400 mb-4">选择您想优化的简历模块，AI将针对性地进行内容润色和改进。</p>
                {/* Add section selection UI here */}
              </div>
            )}
            {activeTab === 'AI匹配' && (
              <div>
                <h3 className="text-lg font-semibold mb-4">AI匹配</h3>
                <p className="text-neutral-400 mb-4">粘贴目标岗位的JD（Job Description），AI会分析您的简历与岗位的匹配度，并提供优化建议。</p>
                {/* Add JD input textarea here */}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 