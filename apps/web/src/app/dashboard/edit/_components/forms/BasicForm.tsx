"use client";
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import type { InfoType } from '@/types/frontend/resume';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2 } from 'lucide-react';

type BasicFormProps = {
  info: InfoType;
  updateInfo: (info: Partial<InfoType>) => void;
  enableCustomFields?: boolean;
};

export default function BasicForm({ 
  info, 
  updateInfo,
  enableCustomFields = false,
}: BasicFormProps) {
  const { t } = useTranslation();

  const customFields = info.customFields || [];

  const handleInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateInfo({ [e.target.name]: e.target.value });
  };

  const handleCustomFieldChange = (id: string, key: 'name' | 'value', value: string) => {
    const nextCustomFields = customFields.map(field =>
      field.id === id ? { ...field, [key]: value } : field
    );
    updateInfo({ customFields: nextCustomFields });
  };

  const handleAddCustomField = () => {
    updateInfo({
      customFields: [
        ...customFields,
        { id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, name: '', value: '' },
      ],
    });
  };

  const handleRemoveCustomField = (id: string) => {
    updateInfo({
      customFields: customFields.filter(field => field.id !== id),
    });
  };
  
  type BasicField = {
    name: keyof Omit<InfoType, 'customFields'>;
    label: string;
    type?: string;
    placeholder?: string;
  };

  const basicFields: BasicField[] = [
    { name: 'avatar', label: t('basicForm.fields.avatar'), placeholder: 'https://...' },
    { name: 'fullName', label: t('basicForm.fields.fullName') },
    { name: 'headline', label: t('basicForm.fields.headline') },
    { name: 'email', label: t('basicForm.fields.email'), type: 'email' },
    { name: 'website', label: t('basicForm.fields.website') },
    { name: 'phoneNumber', label: t('basicForm.fields.phoneNumber') },
    { name: 'address', label: t('basicForm.fields.address') },
  ];

  return (
    <div className="flex flex-col gap-4">
      {basicFields.map((field) => {
        if (field.name === 'avatar') {
          return (
            <div key={field.name} className="flex flex-col gap-3">
              <div className="flex items-center gap-4">
                {info.avatar ? <Image
                  src={info.avatar}
                  alt={t('basicForm.avatarAlt')}
                  width={40}
                  height={40}
                  className="w-10 h-10 rounded-full object-cover bg-neutral-200"
                  unoptimized
                /> : <div className="w-10 h-10 rounded-full bg-neutral-200" />}
                <Input
                  id={field.name}
                  name={field.name}
                  type={field.type || 'text'}
                  value={info[field.name]}
                  onChange={handleInfoChange}
                  placeholder={field.placeholder}
                  className="flex-1"
                />
              </div>
            </div>
          );
        }
        return (
          <div key={field.name} className="flex flex-col gap-3">
            <Label htmlFor={field.name}>{field.label}</Label>
            <Input
              id={field.name}
              name={field.name}
              type={field.type || 'text'}
              value={info[field.name]}
              onChange={handleInfoChange}
              placeholder={field.placeholder}
            />
          </div>
        );
      })}

      {enableCustomFields && (
        <div className="flex flex-col gap-3 pt-2">
          <Label>{t('basicForm.customFields.title')}</Label>
          <div className="flex flex-col gap-2">
            {customFields.map(field => (
              <div key={field.id} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center">
                <Input
                  value={field.name}
                  onChange={(e) => handleCustomFieldChange(field.id, 'name', e.target.value)}
                  placeholder={t('basicForm.customFields.namePlaceholder')}
                />
                <Input
                  value={field.value}
                  onChange={(e) => handleCustomFieldChange(field.id, 'value', e.target.value)}
                  placeholder={t('basicForm.customFields.valuePlaceholder')}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveCustomField(field.id)}
                  aria-label={t('common.delete')}
                  title={t('common.delete')}
                  className="h-10 w-10 border border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            ))}
          </div>
          <Button
            type="button"
            variant="ghost"
            onClick={handleAddCustomField}
            className="w-fit border border-zinc-700 bg-zinc-900 text-zinc-100 hover:bg-zinc-800"
          >
            <Plus size={14} className="mr-2" />
            {t('basicForm.customFields.addButton')}
          </Button>
        </div>
      )}
    </div>
  );
} 