"use client";
import React from 'react';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import type { InfoType } from '@/store/useResumeStore';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';

type BasicFormProps = {
  info: InfoType;
  updateInfo: (info: Partial<InfoType>) => void;
};

export default function BasicForm({ 
  info, 
  updateInfo,
}: BasicFormProps) {
  const { t } = useTranslation();
  const handleInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateInfo({ [e.target.name]: e.target.value });
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
    </div>
  );
} 