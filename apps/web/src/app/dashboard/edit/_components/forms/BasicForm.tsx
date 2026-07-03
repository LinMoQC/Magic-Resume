"use client";
import React from 'react';
import type { InfoType } from '@/types/frontend/resume';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2 } from 'lucide-react';
import { TextField, AvatarField, FieldLabel, fieldInputClass } from './fields';

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

  const textFields: BasicField[] = [
    { name: 'fullName', label: t('basicForm.fields.fullName') },
    { name: 'headline', label: t('basicForm.fields.headline') },
    { name: 'email', label: t('basicForm.fields.email'), type: 'email' },
    { name: 'website', label: t('basicForm.fields.website') },
    { name: 'phoneNumber', label: t('basicForm.fields.phoneNumber') },
    { name: 'address', label: t('basicForm.fields.address') },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <FieldLabel htmlFor="avatar">{t('basicForm.fields.avatar')}</FieldLabel>
        <AvatarField
          value={info.avatar}
          onChange={handleInfoChange}
          alt={t('basicForm.avatarAlt')}
        />
      </div>

      {textFields.map((field) => (
        <TextField
          key={field.name}
          name={field.name}
          label={field.label}
          type={field.type}
          value={info[field.name]}
          onChange={handleInfoChange}
          placeholder={field.placeholder}
        />
      ))}

      {enableCustomFields && (
        <div className="flex flex-col gap-2.5 pt-1">
          <FieldLabel>{t('basicForm.customFields.title')}</FieldLabel>
          <div className="flex flex-col gap-2">
            {customFields.map(field => (
              <div key={field.id} className="grid grid-cols-[1fr_1fr_auto] items-center gap-2">
                <input
                  value={field.name}
                  onChange={(e) => handleCustomFieldChange(field.id, 'name', e.target.value)}
                  placeholder={t('basicForm.customFields.namePlaceholder')}
                  className={fieldInputClass}
                />
                <input
                  value={field.value}
                  onChange={(e) => handleCustomFieldChange(field.id, 'value', e.target.value)}
                  placeholder={t('basicForm.customFields.valuePlaceholder')}
                  className={fieldInputClass}
                />
                <button
                  type="button"
                  onClick={() => handleRemoveCustomField(field.id)}
                  aria-label={t('common.delete')}
                  title={t('common.delete')}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-neutral-400 transition-colors duration-150 hover:border-red-500/40 hover:text-red-400"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={handleAddCustomField}
            className="flex w-fit items-center gap-2 rounded-lg border border-dashed border-white/15 bg-white/[0.02] px-3 py-2 text-[12.5px] font-medium text-neutral-300 transition-colors duration-150 hover:border-sky-400/40 hover:text-white"
          >
            <Plus size={14} />
            {t('basicForm.customFields.addButton')}
          </button>
        </div>
      )}
    </div>
  );
}
