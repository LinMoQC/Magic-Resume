"use client";

import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * 左侧表单的折叠分区 —— 与右侧 AccordionSection 视觉一致,
 * 但把拖拽手柄(useSortable)并进分区头,避免「点头展开」与「拖拽排序」冲突。
 */
export default function FormSection({
  sectionId,
  icon,
  title,
  open,
  onToggle,
  registerRef,
  disabled = false,
  children,
}: {
  sectionId: string;
  icon: React.ReactNode;
  title: string;
  open: boolean;
  onToggle: () => void;
  registerRef?: (el: HTMLElement | null) => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: sectionId,
    disabled,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={(el) => {
        setNodeRef(el);
        registerRef?.(el);
      }}
      style={style}
      data-section={sectionId}
      className="scroll-mt-4 border-b border-white/[0.06] last:border-b-0"
    >
      <div className="group flex items-center gap-1.5 py-3">
        <button
          type="button"
          aria-label="drag"
          {...attributes}
          {...listeners}
          className={cn(
            "flex h-7 w-5 shrink-0 items-center justify-center text-neutral-600 transition-colors duration-150",
            disabled ? "invisible cursor-default" : "cursor-grab hover:text-neutral-300 active:cursor-grabbing",
          )}
        >
          <GripVertical size={13} />
        </button>

        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          className="flex flex-1 items-center gap-2.5 py-0.5 text-left"
        >
          <span
            className={cn(
              "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors duration-150",
              open ? "bg-sky-400/10 text-sky-300" : "bg-white/[0.04] text-neutral-400 group-hover:text-neutral-200",
            )}
          >
            {icon}
          </span>
          <span
            className={cn(
              "flex-1 truncate text-[14px] font-semibold tracking-tight transition-colors duration-150",
              open ? "text-white" : "text-neutral-300 group-hover:text-white",
            )}
          >
            {title}
          </span>
          <ChevronDown
            size={16}
            className={cn(
              "shrink-0 text-neutral-500 transition-transform duration-200 group-hover:text-neutral-300",
              open && "rotate-180",
            )}
          />
        </button>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="pb-5 pl-[26px] pr-1 pt-0.5">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
