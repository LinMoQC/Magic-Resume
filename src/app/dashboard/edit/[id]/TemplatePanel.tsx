import React from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { FaRegClone } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import templates from '@/templates/config';
import Image from 'next/image';
import { TemplateDSL } from '@/templates/types';
import { motion } from 'framer-motion';

type TemplatePanelProps = {
  rightCollapsed: boolean;
  setRightCollapsed: (collapsed: boolean) => void;
  onSelectTemplate: (templateId: string) => void;
  currentTemplateId: string;
};

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export default function TemplatePanel({ rightCollapsed, setRightCollapsed, onSelectTemplate, currentTemplateId }: TemplatePanelProps) {
  const { t } = useTranslation();

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
          <h2 className="text-xl font-semibold mb-6 text-left"><FaRegClone className="inline-block mr-3 text-[16px]" />{t('templatePanel.title')}</h2>
          <motion.div
            className="grid grid-cols-2 gap-4"
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            {Object.values(templates).map((template: TemplateDSL) => (
              <div
                key={template.id}
                className={`bg-neutral-800 border-2 aspect-[3/4] rounded-lg flex items-end justify-center text-neutral-500 hover:border-blue-500 cursor-pointer transition-all relative group overflow-hidden ${currentTemplateId === template.id ? 'border-blue-500' : 'border-neutral-700'}`}
                onClick={() => onSelectTemplate(template.id)}
              >
                {template.thumbnailUrl ? (
                  <Image
                    src={template.thumbnailUrl}
                    alt={template.name}
                    layout="fill"
                    objectFit="cover"
                    className="transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <span className="text-xs text-center p-2">{template.name}</span>
                )}

                <div className="absolute bottom-10 pt-4 left-0 right-0 z-10 bg-gradient-to-t from-black/80 to-transparent pb-2 text-white text-sm font-medium text-center backdrop-blur-md translate-y-full">
                  {template.name}
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      )}
    </aside>
  );
} 