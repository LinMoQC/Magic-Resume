"use client";
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { FaTrash } from 'react-icons/fa';
import type { InfoType } from '@/store/useResumeStore';

type CustomField = {
  icon: string;
  name: string;
  value: string;
};

type BasicFormProps = {
  info: InfoType;
  updateInfo: (key: keyof InfoType, value: any) => void;
  addCustomField: (field: CustomField) => void;
  removeCustomField: (index: number) => void;
};

export default function BasicForm({ 
  info, 
  updateInfo,
  addCustomField,
  removeCustomField
}: BasicFormProps) {
  const handleInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateInfo(e.target.name as keyof InfoType, e.target.value);
  };
  
  const handleCustomFieldChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const updatedCustomFields = [...info.customFields];
    updatedCustomFields[index] = { ...updatedCustomFields[index], [e.target.name]: e.target.value };
    updateInfo('customFields', updatedCustomFields);
  };

  const handleAddCustom = () => {
    addCustomField({ icon: '', name: '', value: '' });
  };

  type BasicField = {
    name: keyof Omit<InfoType, 'customFields' | 'summary'>;
    label: string;
    type?: string;
    placeholder?: string;
  };

  const basicFields: BasicField[] = [
    { name: 'avatar', label: 'Avatar', placeholder: 'https://...' },
    { name: 'fullName', label: 'Full Name' },
    { name: 'headline', label: 'Headline' },
    { name: 'email', label: 'Email', type: 'email' },
    { name: 'website', label: 'Website' },
    { name: 'phone', label: 'Phone' },
    { name: 'location', label: 'Location' },
  ];

  return (
    <div className="flex flex-col gap-4">
      {basicFields.map((field) => {
        if (field.name === 'avatar') {
          return (
            <div key={field.name} className="flex flex-col gap-3">
              <div className="flex items-center gap-4">
                <img
                  src={info.avatar || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${info.fullName || 'placeholder'}`}
                  alt="Avatar"
                  className="w-10 h-10 rounded-full object-cover bg-neutral-200"
                  onError={(e) => {
                    e.currentTarget.onerror = null; // Prevent infinite loop
                    e.currentTarget.src = `https://api.dicebear.com/7.x/pixel-art/svg?seed=${info.fullName || 'placeholder'}`;
                  }}
                />
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

      <h3 className="text-lg font-semibold mt-4">Custom Fields</h3>
      {info.customFields.map((field, index) => (
        <div key={index} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-end">
          <Input 
            placeholder="Field Name (e.g., LinkedIn)"
            name="name" 
            value={field.name} 
            onChange={(e) => handleCustomFieldChange(index, e)} 
          />
          <Input 
            placeholder="Value (e.g., your-linkedin-url)"
            name="value" 
            value={field.value} 
            onChange={(e) => handleCustomFieldChange(index, e)} 
          />
          <Button variant="outline" onClick={() => removeCustomField(index)}>
            <FaTrash />
          </Button>
        </div>
      ))}
      <Button onClick={handleAddCustom} variant="outline" className='text-white inline-flex w-full scale-100 items-center justify-center rounded-sm text-sm font-medium ring-offset-background transition-[transform,background-color] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-offset-2 active:scale-95 disabled:pointer-events-none disabled:opacity-50 border border-secondary bg-transparent hover:text-secondary-foreground h-9 px-5 gap-x-2 border-dashed py-6 leading-relaxed hover:bg-secondary-accent' style={{borderColor: 'rgba(255, 255, 255, 0.2)'}}>Add Custom Field</Button>
    </div>
  );
} 