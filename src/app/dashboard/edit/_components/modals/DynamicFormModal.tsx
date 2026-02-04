"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { EditorComponents } from '@/lib/utils/componentOptimization';
import { UniqueIdentifier } from '@dnd-kit/core';
import { Textarea } from '@/components/ui/textarea';
import { useTranslation } from 'react-i18next';
import { useResumeStore } from '@/store/useResumeStore';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save } from 'lucide-react';

const TiptapEditor = EditorComponents.TiptapEditor;

type Field = {
  name: string;
  label: string;
  type: string;
  placeholder?: string;
};

interface Item {
  id: UniqueIdentifier;
  [key: string]: string | number;
}

type DynamicFormModalProps<T extends Item> = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: T) => void;
  fields: Field[];
  currentItem: T | null;
  richtextKey?: string;
  richtextPlaceholder?: string;
};

export default function DynamicFormModal<T extends Item>({
  isOpen,
  onClose,
  onSave,
  fields,
  currentItem,
  richtextKey,
  richtextPlaceholder,
}: DynamicFormModalProps<T>) {
  const [formData, setFormData] = useState<Partial<T>>({});
  const [isPolishing, setIsPolishing] = useState(false);
  const { t } = useTranslation();
  const { activeResume } = useResumeStore();

  useEffect(() => {
    if (currentItem) {
      setFormData(currentItem);
    } else {
      const emptyData: Partial<T> = {};
      fields.forEach(field => { 
        (emptyData as Record<string, string>)[field.name] = ''; 
      });
      if(richtextKey) {
        (emptyData as Record<string, string>)[richtextKey] = '';
      }
      setFormData(emptyData);
    }
  }, [currentItem, fields, richtextKey]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleQuillChange = useCallback((content: string) => {
    if (richtextKey) {
      setFormData(prev => ({ ...prev, [richtextKey]: content }));
    }
  }, [richtextKey]);

  const handleSave = useCallback(() => {
    onSave(formData as T);
  }, [onSave, formData]);
  
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-100 backdrop-blur-md"
          />
          <div className="fixed inset-0 z-101 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-2xl max-h-[90vh] bg-[#0A0A0A] border border-neutral-800 rounded-[2rem] shadow-2xl flex flex-col overflow-hidden focus:outline-none pointer-events-auto"
            >
            <div className="flex items-center justify-between p-7 border-b border-neutral-800 bg-neutral-900/20">
              <h2 className="text-2xl font-bold text-white tracking-tight">
                {currentItem ? t('modals.dynamicForm.editTitle') : t('modals.dynamicForm.addTitle')}
              </h2>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-neutral-800 text-neutral-500 hover:text-white transition-all active:scale-90"
                type="button"
              >
                <X size={22} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-8">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {fields.map(field => (
                  <div key={field.name} className="space-y-2">
                    <Label className="text-neutral-400 text-xs uppercase font-bold tracking-widest ml-1" htmlFor={field.name}>
                        {field.label}
                    </Label>
                    {field.type === 'textarea' ? (
                      <Textarea
                        id={field.name}
                        name={field.name}
                        placeholder={field.placeholder}
                        value={String(formData[field.name] || '')}
                        onChange={handleChange}
                        className="bg-neutral-900/50 border-neutral-800 rounded-xl focus:ring-2 focus:ring-sky-500/20 transition-all min-h-[100px]"
                      />
                    ) : (
                      <Input
                        id={field.name}
                        name={field.name}
                        type={field.type}
                        placeholder={field.placeholder}
                        value={String(formData[field.name] || '')}
                        onChange={handleChange}
                        className="bg-neutral-900/50 border-neutral-800 rounded-xl h-11 focus:ring-2 focus:ring-sky-500/20 transition-all"
                      />
                    )}
                  </div>
                ))}
              </div>
              
              {richtextKey && (
                <div className="space-y-3">
                  <Label className="text-neutral-400 text-xs uppercase font-bold tracking-widest ml-1" htmlFor={richtextKey}>
                    {t('modals.dynamicForm.descriptionLabel')}
                  </Label>
                  <div className="rounded-2xl border border-neutral-800 overflow-hidden bg-neutral-900/30">
                    <TiptapEditor
                      content={String(formData[richtextKey] || '')}
                      onChange={handleQuillChange}
                      placeholder={richtextPlaceholder}
                      isPolishing={isPolishing}
                      setIsPolishing={setIsPolishing}
                      themeColor={activeResume?.themeColor}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-neutral-800 bg-neutral-900/20 mt-auto flex justify-end gap-3 px-8">
              <Button 
                variant="ghost" 
                onClick={onClose}
                className="text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-xl px-6"
              >
                {t('modals.dynamicForm.cancelButton')}
              </Button>
              <Button 
                onClick={handleSave}
                className="bg-sky-600 hover:bg-sky-500 text-white rounded-xl px-8 font-bold shadow-lg shadow-sky-500/20 transition-all active:scale-95"
              >
                <Save size={18} className="mr-2" />
                {t('modals.dynamicForm.saveButton')}
              </Button>
            </div>
          </motion.div>
        </div>
        </>
      )}
    </AnimatePresence>
  );
}
 
