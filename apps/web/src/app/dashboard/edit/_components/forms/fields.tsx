"use client";

import React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ *
 * 左侧表单的统一控件 —— 与右侧自定义面板同一套深色工作台 + sky 风格。
 * 不改全站共享的 @/components/ui/input,这里是编辑器面板专用控件。
 * ------------------------------------------------------------------ */

export const fieldInputClass =
  "h-9 w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 text-[13px] text-neutral-100 outline-none transition-colors duration-150 placeholder:text-neutral-600 hover:border-white/20 focus:border-sky-400/60 focus:bg-white/[0.06]";

export function FieldLabel({
  htmlFor,
  children,
  className,
}: {
  htmlFor?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className={cn("text-[12px] font-medium text-neutral-400", className)}
    >
      {children}
    </label>
  );
}

export function TextField({
  label,
  name,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label?: string;
  name?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <FieldLabel htmlFor={name}>{label}</FieldLabel>}
      <input
        id={name}
        name={name}
        type={type}
        value={value ?? ""}
        onChange={onChange}
        placeholder={placeholder}
        spellCheck={false}
        className={fieldInputClass}
      />
    </div>
  );
}

export function AvatarField({
  value,
  onChange,
  name = "avatar",
  alt,
  placeholder = "https://...",
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  name?: string;
  alt: string;
  placeholder?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      {value ? (
        <Image
          src={value}
          alt={alt}
          width={40}
          height={40}
          unoptimized
          className="h-10 w-10 shrink-0 rounded-full border border-white/10 object-cover"
        />
      ) : (
        <div className="h-10 w-10 shrink-0 rounded-full border border-white/10 bg-white/[0.04]" />
      )}
      <input
        id={name}
        name={name}
        type="text"
        value={value ?? ""}
        onChange={onChange}
        placeholder={placeholder}
        spellCheck={false}
        className={fieldInputClass}
      />
    </div>
  );
}
