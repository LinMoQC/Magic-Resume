"use client";

import React, { useState, useEffect } from 'react';
import Modal from '@/app/components/ui/Modal';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { EditorComponents } from '@/lib/componentOptimization';

const TiptapEditor = EditorComponents.TiptapEditor;
import { UniqueIdentifier } from '@dnd-kit/core';
import { Textarea } from '@/app/components/ui/textarea';
import { useTranslation } from 'react-i18next';
import { useResumeStore } from '@/store/useResumeStore';

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleQuillChange = (content: string) => {
    if (richtextKey) {
      setFormData(prev => ({ ...prev, [richtextKey]: content }));
    }
  };

  const handleSave = () => {
    onSave(formData as T);
  };
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={currentItem ? t('modals.dynamicForm.editTitle') : t('modals.dynamicForm.addTitle')}
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 p-2">
          {fields.map(field => (
            <div key={field.name}>
              <Label htmlFor={field.name}>{field.label}</Label>
              {field.type === 'textarea' ? (
                <Textarea
                  id={field.name}
                  name={field.name}
                  placeholder={field.placeholder}
                  value={String(formData[field.name] || '')}
                  onChange={handleChange}
                  className="bg-neutral-800 border-neutral-700"
                />
              ) : (
                <Input
                  id={field.name}
                  name={field.name}
                  type={field.type}
                  placeholder={field.placeholder}
                  value={String(formData[field.name] || '')}
                  onChange={handleChange}
                  className="bg-neutral-800 border-neutral-700"
                />
              )}
            </div>
          ))}
        </div>
        {richtextKey && (
          <div>
            <Label htmlFor={richtextKey}>{t('modals.dynamicForm.descriptionLabel')}</Label>
            <TiptapEditor
              content={String(formData[richtextKey] || '')}
              onChange={handleQuillChange}
              placeholder={richtextPlaceholder}
              isPolishing={isPolishing}
              setIsPolishing={setIsPolishing}
              themeColor={activeResume?.themeColor}
            />
          </div>
        )}
      </div>
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>{t('modals.dynamicForm.cancelButton')}</Button>
        <Button onClick={handleSave}>{t('modals.dynamicForm.saveButton')}</Button>
      </div>
    </Modal>
  );
} 
