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
import { FaPlus, FaTrash, FaPen, FaGripVertical, FaRegCopy, FaEye, FaEyeSlash } from 'react-icons/fa';
import { Input } from '@/components/ui/input';
import Modal from '@/components/ui/Modal';
import { toast } from 'sonner';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { DotsHorizontalIcon } from '@radix-ui/react-icons';
import { UniqueIdentifier } from '@dnd-kit/core';
import TiptapEditor from '@/components/ui/TiptapEditor';
import { cn } from '@/lib/utils';

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
};

function SortableItem<T extends BaseItem>({ id, item, index, handleEdit, handleDelete, handleCopy, toggleVisibility, itemRender }: SortableItemProps<T>) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className={cn("flex items-center gap-2 mb-2 p-3 bg-neutral-900 rounded-md")}>
      <div {...attributes} {...listeners} className="cursor-grab p-2">
        <FaGripVertical />
      </div>
      <div className="flex-grow">
        {itemRender ? itemRender(item) : (
          <div>
            <p className="font-semibold">{item.title || item.name || item.degree || 'Untitled'}</p>
            <p className="text-sm text-neutral-400">{item.subtitle || item.company || item.school || ''}</p>
          </div>
        )}
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <DotsHorizontalIcon className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[160px] bg-neutral-900 border-neutral-700 text-white">
          <DropdownMenuItem onSelect={() => toggleVisibility(index)} className="cursor-pointer">
            {item.visible === false ? <FaEyeSlash className="mr-2 h-4 w-4" /> : <FaEye className="mr-2 h-4 w-4" />}
            <span>{item.visible === false ? 'Show' : 'Hide'}</span>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => handleEdit(index)} className="cursor-pointer">
            <FaPen className="mr-2 h-4 w-4" />
            <span>Edit</span>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => handleCopy(index)} className="cursor-pointer">
            <FaRegCopy className="mr-2 h-4 w-4" />
            <span>Copy</span>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => handleDelete(index)} className="text-red-500 cursor-pointer focus:text-red-400 focus:bg-red-500/10">
            <FaTrash className="mr-2 h-4 w-4" />
            <span>Remove</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
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
}: SectionListWithModalProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<T | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number | null>(null);

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
  };

  const handleCloseModal = () => {
    setIsOpen(false);
    setCurrentItem(null);
    setCurrentIndex(null);
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
      toast.error(`请填写以下必填项：${missingLabels}`);
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
    toast.success(`${label} section ${currentIndex !== null ? 'updated' : 'added'} successfully.`);
  };

  const handleDelete = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
    toast.success('Item removed successfully.');
  };

  const handleCopy = (index: number) => {
    const itemToCopy = items[index];
    const newItem = { ...itemToCopy, id: Date.now().toString() } as T;
    const newItems = [...items.slice(0, index + 1), newItem, ...items.slice(index + 1)];
    setItems(newItems);
    toast.success('Item copied successfully.');
  };

  const toggleVisibility = (index: number) => {
    const newItems = [...items];
    const currentVisibility = newItems[index].visible;
    newItems[index] = { ...newItems[index], visible: currentVisibility === false ? true : false };
    setItems(newItems);
    toast.success(`Item visibility ${newItems[index].visible ? 'shown' : 'hidden'}.`);
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
      <h2 className="text-xl font-bold flex items-center gap-3 mb-6">
        {React.createElement(icon, { className: "w-4 h-4" })} {label}
      </h2>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items} strategy={verticalListSortingStrategy}>
          {items.map((item, index) => (
            <SortableItem<T>
              key={item.id}
              id={item.id}
              item={item}
              index={index}
              handleEdit={() => handleOpenModal(item, index)}
              handleDelete={() => handleDelete(index)}
              handleCopy={() => handleCopy(index)}
              toggleVisibility={() => toggleVisibility(index)}
              itemRender={itemRender}
              label={label}
            />
          ))}
        </SortableContext>
      </DndContext>
      
      <Button variant="outline" onClick={() => handleOpenModal(null, null)} className="inline-flex w-full scale-100 items-center justify-center rounded-sm text-sm font-medium ring-offset-background transition-[transform,background-color] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-offset-2 active:scale-95 disabled:pointer-events-none disabled:opacity-50 border border-secondary bg-transparent hover:text-secondary-foreground h-9 px-5 gap-x-2 border-dashed py-6 leading-relaxed hover:bg-secondary-accent" style={{borderColor: 'rgba(255,255,255,0.2)'}}>
        <FaPlus className="mr-2" /> Add Item
      </Button>

      <Modal isOpen={isOpen} onClose={handleCloseModal} title={currentIndex !== null ? `Edit ${label}` : `Add ${label}`}>
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 px-2">
            {fields.map((field, index) => (
              <div key={`${field.name}-${index}`}>
                <label className="block text-sm font-medium mb-1" htmlFor={field.name}>{field.label}</label>
                <Input
                  id={field.name}
                  name={field.name}
                  value={String(currentItem?.[field.name] ?? '')}
                  onChange={handleInputChange}
                  placeholder={field.placeholder}
                  className="bg-neutral-800 border-neutral-700"
                />
              </div>
            ))}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{richtextKey.charAt(0).toUpperCase() + richtextKey.slice(1)}</label>
            <TiptapEditor
              content={String(currentItem?.[richtextKey] ?? '')}
              onChange={handleQuillChange}
              placeholder={richtextPlaceholder}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button onClick={handleCloseModal} variant="ghost">Cancel</Button>
            <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white">Save</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
} 