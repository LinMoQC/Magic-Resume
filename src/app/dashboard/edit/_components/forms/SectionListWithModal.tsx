"use client";
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FaPlus, FaGripVertical } from 'react-icons/fa';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuPortal,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { DotsHorizontalIcon, Pencil2Icon, CopyIcon, TrashIcon } from '@radix-ui/react-icons';
import { UniqueIdentifier } from '@dnd-kit/core';
import { EditorComponents } from '@/lib/utils/componentOptimization';

const TiptapEditor = EditorComponents.TiptapEditor;
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { Label } from '@/components/ui/label';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

import { useResumeStore } from '@/store/useResumeStore';

interface BaseItem {
  id: UniqueIdentifier;
  visible?: boolean;
  [key: string]: string | number | boolean | undefined;
}

type SortableItemProps<T extends BaseItem> = {
  id: UniqueIdentifier;
  item: T;
  index: number;
  handleEdit: (index: number) => void;
  handleDelete: (index: number) => void;
  handleCopy: (index: number) => void;
  toggleVisibility: (index: number) => void;
  itemRender?: (item: T) => React.ReactNode;
  label: string;
  disabled?: boolean;
};

function SortableItem<T extends BaseItem>({ id, item, index, handleEdit, handleDelete, handleCopy, toggleVisibility, itemRender, disabled }: SortableItemProps<T>) {
  const { t } = useTranslation();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className={cn("relative flex items-center gap-2 mb-2 p-3 bg-neutral-900 rounded-md border border-zinc-800",isDragging ? 'opacity-50' : 'opacity-100', item.visible === false && "opacity-50")}>
      <div {...attributes} {...listeners} className={cn("p-2", disabled ? "cursor-default" : "cursor-grab")}>
        <FaGripVertical />
      </div>
      <div className="flex-grow">
        {itemRender ? itemRender(item) : (
          <div>
            <p className="font-semibold">{item.title || item.name || item.degree || t('sections.shared.untitled')}</p>
            <p className="text-sm text-neutral-400">{item.subtitle || item.company || item.school || ''}</p>
          </div>
        )}
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0 outline-none focus:outline-none focus:ring-0">
            <span className="sr-only">{t('sections.shared.openMenu')}</span>
            <DotsHorizontalIcon className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuPortal>
          <DropdownMenuContent align="end" className="w-[160px] bg-neutral-900 border-neutral-700 text-white">
            <DropdownMenuCheckboxItem
              checked={item.visible !== false}
              onCheckedChange={() => toggleVisibility(index)}
              className="cursor-pointer"
            >
              <span className='ml-2'>{t('sections.shared.visible')}</span>
            </DropdownMenuCheckboxItem>
            <DropdownMenuSeparator className="bg-neutral-700" />
            <DropdownMenuItem onSelect={() => handleEdit(index)} className="cursor-pointer">
              <Pencil2Icon className="mr-2 h-4 w-4" />
              {t('sections.shared.edit')}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => handleCopy(index)} className="cursor-pointer">
              <CopyIcon className="mr-2 h-4 w-4" />
              {t('sections.shared.copy')}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => handleDelete(index)} className="text-red-500 cursor-pointer focus:text-red-400 focus:bg-red-500/10">
              <TrashIcon className="mr-2 h-4 w-4" />
              {t('sections.shared.remove')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenuPortal>
      </DropdownMenu>
    </div>
  );
}

type Field = { name: string; label: string; placeholder: string; required?: boolean };

interface SectionListWithModalProps<T extends BaseItem> {
  icon: React.ElementType;
  label: string;
  fields: Field[];
  richtextKey: string;
  richtextPlaceholder: string;
  items: T[];
  setItems: (items: T[]) => void;
  itemRender?: (item: T) => React.ReactNode;
  className?: string;
  onModalStateChange?: (isOpen: boolean) => void;
}

export default function SectionListWithModal<T extends BaseItem>({
  icon,
  label,
  fields,
  richtextKey,
  richtextPlaceholder,
  items,
  setItems,
  itemRender,
  className,
  onModalStateChange,
}: SectionListWithModalProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<T | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number | null>(null);
  const [isPolishing, setIsPolishing] = useState(false);
  const { t } = useTranslation();
  const { activeResume } = useResumeStore();

  const translatedLabel = t(label);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleOpenModal = (item: T | null, index: number | null) => {
    setCurrentItem(item ? { ...item } : { id: Date.now().toString(), visible: true, ...fields.reduce((acc, f) => ({ ...acc, [f.name]: '' }), {} as Record<string, string>), [richtextKey]: '' } as T);
    setCurrentIndex(index);
    setIsOpen(true);
    onModalStateChange?.(true);
  };

  const handleCloseModal = () => {
    setIsOpen(false);
    setCurrentItem(null);
    setCurrentIndex(null);
    onModalStateChange?.(false);
  };

  const handleSave = () => {
    if (!currentItem) return;

    const requiredFieldNames = fields
      .filter(f => f.required)
      .map(f => f.name)
      .filter(f => f !== richtextKey);
    const missingFieldNames = requiredFieldNames.filter(fieldName => {
      const value = currentItem[fieldName];
      return typeof value !== 'string' || !value.trim();
    });

    if (missingFieldNames.length > 0) {
      const missingLabels = missingFieldNames
        .map(name => fields.find(f => f.name === name)?.label || name)
        .join(', ');
      toast.error(t('sections.notifications.requiredFields', { fields: missingLabels }));
      return;
    }

    const newItems = [...items];
    if (currentIndex !== null && items[currentIndex]) {
      newItems[currentIndex] = currentItem;
    } else {
      newItems.push(currentItem);
    }
    setItems(newItems as T[]);
    handleCloseModal();
    const notificationMessage = currentIndex !== null
      ? t('sections.notifications.sectionUpdated', { label: translatedLabel })
      : t('sections.notifications.sectionAdded', { label: translatedLabel });
    toast.success(notificationMessage);
  };

  const handleDelete = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
    toast.success(t('sections.notifications.itemRemoved'));
  };

  const handleCopy = (index: number) => {
    const itemToCopy = items[index];
    const newItem = { ...itemToCopy, id: Date.now().toString() } as T;
    const newItems = [...items.slice(0, index + 1), newItem, ...items.slice(index + 1)];
    setItems(newItems);
    toast.success(t('sections.notifications.itemCopied'));
  };

  const toggleVisibility = (index: number) => {
    const newItems = [...items];
    const item = newItems[index];
    newItems[index] = { ...item, visible: item.visible === false ? true : false };
    setItems(newItems);
    const status = newItems[index].visible !== false ? t('sections.shared.shown') : t('sections.shared.hidden');
    toast.success(t('sections.notifications.visibilityToggled', { status }));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        setItems(arrayMove(items, oldIndex, newIndex));
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (currentItem) {
      setCurrentItem({ ...currentItem, [e.target.name]: e.target.value });
    }
  };

  const handleQuillChange = (content: string) => {
    if (currentItem) {
      setCurrentItem({ ...currentItem, [richtextKey]: content });
    }
  };

  const baseButtonClasses = "inline-flex items-center justify-center rounded-sm text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border bg-transparent hover:bg-accent hover:text-accent-foreground active:scale-95";

  return (
    <div className={cn("mb-8", className)}>
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold flex items-center gap-3">
          {React.createElement(icon, { className: "w-4 h-4" })} {translatedLabel}
        </h2>
      </div>

      <div className="mt-4">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={items} strategy={verticalListSortingStrategy}>
            {items.map((item, index) => (
              <SortableItem<T>
                key={item.id}
                id={item.id}
                item={item}
                index={index}
                handleEdit={(i) => handleOpenModal(items[i], i)}
                handleDelete={handleDelete}
                handleCopy={handleCopy}
                toggleVisibility={toggleVisibility}
                itemRender={itemRender}
                label={label}
                disabled={items.length === 1}
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>

      {items.length > 0 ? (
        <div className="flex justify-end mt-4">
          <Button
            variant="outline"
            onClick={() => handleOpenModal(null, null)}
            className={cn(baseButtonClasses, "h-9 px-4 py-2 gap-x-2 border border-zinc-800")}
          >
            <FaPlus className="mr-2" />
            {t('sections.shared.addItem')}
          </Button>
        </div>
      ) : (
        <Button
          variant="outline"
          onClick={() => handleOpenModal(null, null)}
          className={cn(baseButtonClasses, "w-full mt-4 h-auto px-5 gap-x-2 border-dashed py-3 leading-relaxed border border-zinc-600")}
        >
          <FaPlus className="mr-2" />
          {t('sections.shared.addItem')}
        </Button>
      )}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseModal}
              className="fixed inset-0 bg-black/60 z-[100] backdrop-blur-md"
            />
            <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="w-full max-w-2xl max-h-[90vh] bg-[#0A0A0A] border border-neutral-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden focus:outline-none pointer-events-auto"
              >
              <div className="flex items-center justify-between p-6 border-b border-neutral-800 bg-neutral-900/20">
                <h2 className="text-xl font-bold text-white tracking-tight">
                    {currentIndex !== null ? t('sections.shared.editTitle', { label: translatedLabel }) : t('sections.shared.addTitle', { label: translatedLabel })}
                </h2>
                <button
                    onClick={handleCloseModal}
                    className="p-2 rounded-full hover:bg-neutral-800 text-neutral-500 hover:text-white transition-all active:scale-90"
                    type="button"
                >
                    <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto hide-scrollbar p-6 space-y-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {fields.map((field) => (
                    <div key={field.name} className="space-y-2">
                      <Label className="text-neutral-400 text-xs uppercase font-bold tracking-widest ml-1" htmlFor={field.name}>
                        {field.label}
                      </Label>
                      <Input
                        id={field.name}
                        name={field.name}
                        placeholder={field.placeholder}
                        value={(currentItem?.[field.name] as string) || ''}
                        onChange={handleInputChange}
                        className="bg-neutral-900 border-neutral-800 rounded-xl h-11 focus:ring-2 focus:ring-sky-500/20 transition-all text-white placeholder:text-neutral-500"
                      />
                    </div>
                  ))}
                </div>
                <div className="space-y-3">
                    <Label className="text-neutral-400 text-xs uppercase font-bold tracking-widest ml-1">
                        {t('modals.dynamicForm.descriptionLabel')}
                    </Label>
                    <div className="rounded-2xl border border-neutral-800 overflow-hidden bg-neutral-900/30">
                        <TiptapEditor
                            content={(currentItem?.[richtextKey] as string) || ''}
                            onChange={handleQuillChange}
                            placeholder={richtextPlaceholder}
                            isPolishing={isPolishing}
                            setIsPolishing={setIsPolishing}
                            themeColor={activeResume?.themeColor}
                        />
                    </div>
                </div>
              </div>
              
              <div className="p-6 border-t border-neutral-800 bg-neutral-900/20 flex justify-end gap-3 px-8">
                <Button 
                    variant="ghost" 
                    onClick={handleCloseModal}
                    className="text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-xl px-6"
                >
                    {t('modals.dynamicForm.cancelButton')}
                </Button>
                <Button 
                    onClick={handleSave}
                    className="bg-sky-600 hover:bg-sky-500 text-white rounded-xl px-8 font-bold shadow-lg shadow-sky-500/20 transition-all active:scale-95"
                >
                    {t('modals.dynamicForm.saveButton')}
                </Button>
              </div>
            </motion.div>
          </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
} 