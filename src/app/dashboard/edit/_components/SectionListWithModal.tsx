"use client";
import React, { useState } from 'react';
import { Button } from '@/app/components/ui/button';
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
import { FaPlus, FaTrash, FaPen, FaGripVertical, FaRegCopy, FaEye, FaEyeSlash } from 'react-icons/fa';
import { Input } from '@/app/components/ui/input';
import Modal from '@/app/components/ui/Modal';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuPortal
} from '@/app/components/dropdown-menu';
import { DotsHorizontalIcon } from '@radix-ui/react-icons';
import { UniqueIdentifier } from '@dnd-kit/core';
import TiptapEditor from '@/app/components/TiptapEditor';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { Label } from '@/app/components/ui/label';

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
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className={cn("relative flex items-center gap-2 mb-2 p-3 bg-neutral-900 rounded-md")}>
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
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">{t('sections.shared.openMenu')}</span>
            <DotsHorizontalIcon className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuPortal>
          <DropdownMenuContent align="end" className="w-[160px] bg-neutral-900 border-neutral-700 text-white">
            <DropdownMenuItem onSelect={() => toggleVisibility(index)} className="cursor-pointer">
              {item.visible === false ? <FaEyeSlash className="mr-2 h-4 w-4" /> : <FaEye className="mr-2 h-4 w-4" />}
              <span>{item.visible === false ? t('sections.shared.show') : t('sections.shared.hide')}</span>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => handleEdit(index)} className="cursor-pointer">
              <FaPen className="mr-2 h-4 w-4" />
              <span>{t('sections.shared.edit')}</span>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => handleCopy(index)} className="cursor-pointer">
              <FaRegCopy className="mr-2 h-4 w-4" />
              <span>{t('sections.shared.copy')}</span>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => handleDelete(index)} className="text-red-500 cursor-pointer focus:text-red-400 focus:bg-red-500/10">
              <FaTrash className="mr-2 h-4 w-4" />
              <span>{t('sections.shared.remove')}</span>
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
    const currentVisibility = newItems[index].visible;
    newItems[index] = { ...newItems[index], visible: currentVisibility === false ? true : false };
    setItems(newItems);
    const status = newItems[index].visible ? t('sections.shared.show') : t('sections.shared.hide');
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

      <Button variant="outline" onClick={() => handleOpenModal(null, null)} className="inline-flex w-full scale-100 items-center justify-center rounded-sm text-sm font-medium ring-offset-background transition-[transform,background-color] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-offset-2 active:scale-95 disabled:pointer-events-none disabled:opacity-50 border border-secondary bg-transparent hover:text-secondary-foreground h-9 px-5 gap-x-2 border-dashed py-6 leading-relaxed hover:bg-secondary-accent" style={{ borderColor: 'rgba(255,255,255,0.2)' }}>
        <FaPlus className="mr-2" />  {t('sections.shared.addItem')}
      </Button>
      <Modal
        isOpen={isOpen}
        onClose={handleCloseModal}
        title={currentIndex !== null ? t('sections.shared.editTitle', { label: translatedLabel }) : t('sections.shared.addTitle', { label: translatedLabel })}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 p-2">
            {fields.map((field) => (
              <div key={field.name}>
                <Label htmlFor={field.name}>{field.label}</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  placeholder={field.placeholder}
                  value={(currentItem?.[field.name] as string) || ''}
                  onChange={handleInputChange}
                  className="bg-neutral-800 border-neutral-700"
                />
              </div>
            ))}
          </div>
          <TiptapEditor
            content={(currentItem?.[richtextKey] as string) || ''}
            onChange={handleQuillChange}
            placeholder={richtextPlaceholder}
            isPolishing={isPolishing}
            setIsPolishing={setIsPolishing}
          />
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={handleCloseModal}>{t('modals.dynamicForm.cancelButton')}</Button>
          <Button onClick={handleSave}>{t('modals.dynamicForm.saveButton')}</Button>
        </div>
      </Modal>
    </div>
  );
} 