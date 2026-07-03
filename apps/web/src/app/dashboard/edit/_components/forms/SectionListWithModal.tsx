import React, { useState, useCallback } from 'react';
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
import { DropMenu } from '@/components/ui/drop-menu';
import { DotsHorizontalIcon, Pencil2Icon, CopyIcon, TrashIcon } from '@radix-ui/react-icons';
import { UniqueIdentifier } from '@dnd-kit/core';
import { EditorComponents } from '@/lib/utils/componentOptimization';

const TiptapEditor = EditorComponents.TiptapEditor;
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff } from 'lucide-react';
import { ModalShell } from '@/components/ui/ModalShell';

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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
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

  const menuItems = [
    {
      label: item.visible !== false ? t('sections.shared.hide') : t('sections.shared.show'),
      icon: item.visible !== false ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />,
      onClick: () => toggleVisibility(index),
      separator: true,
    },
    {
      label: t('sections.shared.edit'),
      icon: <Pencil2Icon className="h-4 w-4" />,
      onClick: () => handleEdit(index),
    },
    {
      label: t('sections.shared.copy'),
      icon: <CopyIcon className="h-4 w-4" />,
      onClick: () => handleCopy(index),
    },
    {
      label: t('sections.shared.remove'),
      icon: <TrashIcon className="h-4 w-4" />,
      onClick: () => handleDelete(index),
      variant: 'danger' as const,
      separator: true,
    },
  ];

  return (
    <div ref={setNodeRef} style={style} className={cn("group relative mb-2 flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] p-2.5 transition-colors duration-150 hover:border-white/20", isDragging ? 'opacity-50' : 'opacity-100', item.visible === false && "opacity-50")}>
      <div {...attributes} {...listeners} className={cn("flex h-8 w-5 items-center justify-center text-neutral-600 transition-colors duration-150 hover:text-neutral-300", disabled ? "cursor-default" : "cursor-grab active:cursor-grabbing")}>
        <FaGripVertical size={12} />
      </div>
      <div className="grow">
        {itemRender ? itemRender(item) : (
          <div>
            <p className="font-semibold">{item.title || item.name || item.degree || t('sections.shared.untitled')}</p>
            <p className="text-sm text-neutral-400">{item.subtitle || item.company || item.school || ''}</p>
          </div>
        )}
      </div>
      <DropMenu
        width="w-40"
        side="bottom"
        align="end"
        items={menuItems}
        onOpenChange={setIsMenuOpen}
        trigger={
          <Button 
            variant="ghost" 
            className={cn(
              "h-8 w-8 p-0 outline-none focus:outline-none focus:ring-0 transition-colors",
              isMenuOpen ? "bg-white/10 text-white" : "text-neutral-400 hover:text-white"
            )}
          >
            <span className="sr-only">{t('sections.shared.openMenu')}</span>
            <DotsHorizontalIcon className="h-4 w-4" />
          </Button>
        }
      />
    </div>
  );
}

type Field = { name: string; label: string; placeholder: string; required?: boolean };

interface SectionListWithModalProps<T extends BaseItem> {
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

  const handleOpenModal = useCallback((item: T | null, index: number | null) => {
    setCurrentItem(item ? { ...item } : { id: Date.now().toString(), visible: true, ...fields.reduce((acc, f) => ({ ...acc, [f.name]: '' }), {} as Record<string, string>), [richtextKey]: '' } as T);
    setCurrentIndex(index);
    setIsOpen(true);
    onModalStateChange?.(true);
  }, [fields, richtextKey, onModalStateChange]);

  const handleCloseModal = useCallback(() => {
    setIsOpen(false);
    setCurrentItem(null);
    setCurrentIndex(null);
    onModalStateChange?.(false);
  }, [onModalStateChange]);

  const handleSave = useCallback(() => {
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
  }, [currentItem, fields, richtextKey, items, currentIndex, setItems, handleCloseModal, t, translatedLabel]);

  const handleDelete = useCallback((index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
    toast.success(t('sections.notifications.itemRemoved'));
  }, [items, setItems, t]);

  const handleCopy = useCallback((index: number) => {
    const itemToCopy = items[index];
    const newItem = { ...itemToCopy, id: Date.now().toString() } as T;
    const newItems = [...items.slice(0, index + 1), newItem, ...items.slice(index + 1)];
    setItems(newItems);
    toast.success(t('sections.notifications.itemCopied'));
  }, [items, setItems, t]);

  const toggleVisibility = useCallback((index: number) => {
    const newItems = [...items];
    const item = newItems[index];
    newItems[index] = { ...item, visible: item.visible === false ? true : false };
    setItems(newItems);
    const status = newItems[index].visible !== false ? t('sections.shared.shown') : t('sections.shared.hidden');
    toast.success(t('sections.notifications.visibilityToggled', { status }));
  }, [items, setItems, t]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        setItems(arrayMove(items, oldIndex, newIndex));
      }
    }
  }, [items, setItems]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (currentItem) {
      setCurrentItem({ ...currentItem, [e.target.name]: e.target.value });
    }
  }, [currentItem]);

  const handleQuillChange = useCallback((content: string) => {
    if (currentItem) {
      setCurrentItem({ ...currentItem, [richtextKey]: content });
    }
  }, [currentItem, richtextKey]);

  return (
    <div className={cn(className)}>
      <div className="mt-1">
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
        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={() => handleOpenModal(null, null)}
            className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-[12.5px] font-medium text-neutral-300 transition-colors duration-150 hover:border-sky-400/40 hover:text-white"
          >
            <FaPlus size={11} />
            {t('sections.shared.addItem')}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => handleOpenModal(null, null)}
          className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 bg-white/[0.02] py-3 text-[12.5px] font-medium text-neutral-300 transition-colors duration-150 hover:border-sky-400/40 hover:text-white"
        >
          <FaPlus size={11} />
          {t('sections.shared.addItem')}
        </button>
      )}
      <ModalShell
        open={isOpen}
        onOpenChange={(open) => !open && handleCloseModal()}
        title={
          currentIndex !== null
            ? t('sections.shared.editTitle', { label: translatedLabel })
            : t('sections.shared.addTitle', { label: translatedLabel })
        }
        className="max-h-[88vh] w-[min(680px,92vw)]"
      >
        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto scrollbar-hide px-6 py-6">
          {fields.length > 0 && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {fields.map((field) => (
                <div key={field.name} className="space-y-2">
                  <Label htmlFor={field.name} className="text-[13px] font-medium text-neutral-300">
                    {field.label}
                  </Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    placeholder={field.placeholder}
                    value={(currentItem?.[field.name] as string) || ''}
                    onChange={handleInputChange}
                    className="h-10 rounded-lg border border-white/[0.07] bg-black/20 px-3.5 text-neutral-100 placeholder:text-neutral-600 transition-colors focus-visible:border-sky-500/40 focus-visible:ring-1 focus-visible:ring-sky-500/25 focus-visible:ring-offset-0"
                  />
                </div>
              ))}
            </div>
          )}
          <div className="space-y-2">
            <Label className="text-[13px] font-medium text-neutral-300">
              {t('modals.dynamicForm.descriptionLabel')}
            </Label>
            <div className="overflow-hidden rounded-lg border border-white/[0.07] bg-black/20">
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
        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-white/[0.06] px-6 py-4">
          <button
            type="button"
            onClick={handleCloseModal}
            className="h-9 rounded-lg px-4 text-[13px] text-neutral-400 transition-colors hover:bg-white/[0.06] hover:text-neutral-100"
          >
            {t('modals.dynamicForm.cancelButton')}
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="h-9 rounded-lg bg-sky-500 px-5 text-[13px] font-medium text-white transition-colors hover:bg-sky-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/50"
          >
            {t('modals.dynamicForm.saveButton')}
          </button>
        </div>
      </ModalShell>
    </div>
  );
} 