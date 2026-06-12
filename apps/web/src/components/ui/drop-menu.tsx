"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';

export interface DropMenuItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  variant?: 'default' | 'danger';
  separator?: boolean;
}

export interface DropMenuProps {
  trigger: React.ReactNode;
  items: DropMenuItem[];
  width?: string;
  side?: 'top' | 'bottom' | 'left' | 'right';
  align?: 'start' | 'center' | 'end';
  gap?: number;
  onOpenChange?: (open: boolean) => void;
}

export function DropMenu({ 
  trigger, 
  items, 
  width = 'w-40', 
  side = 'bottom',
  align = 'end',
  gap = 8,
  onOpenChange
}: DropMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const closeTimerRef = useRef<NodeJS.Timeout>(null);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const updateCoords = useCallback(() => {
    if (!triggerRef.current) return;
    
    const triggerRect = triggerRef.current.getBoundingClientRect();
    const scrollY = window.scrollY;
    const scrollX = window.scrollX;
    
    let top = 0;
    let left = 0;

    // Fixed math for absolute positioning relative to document body
    switch (side) {
      case 'bottom':
        top = triggerRect.bottom + scrollY + gap;
        if (align === 'start') left = triggerRect.left + scrollX;
        else if (align === 'center') left = triggerRect.left + scrollX + triggerRect.width / 2;
        else left = triggerRect.right + scrollX; // end
        break;
      case 'top':
        top = triggerRect.top + scrollY - gap;
        if (align === 'start') left = triggerRect.left + scrollX;
        else if (align === 'center') left = triggerRect.left + scrollX + triggerRect.width / 2;
        else left = triggerRect.right + scrollX;
        break;
      case 'left':
        left = triggerRect.left + scrollX - gap;
        if (align === 'start') top = triggerRect.top + scrollY;
        else if (align === 'center') top = triggerRect.top + scrollY + triggerRect.height / 2;
        else top = triggerRect.bottom + scrollY;
        break;
      case 'right':
        left = triggerRect.right + scrollX + gap;
        if (align === 'start') top = triggerRect.top + scrollY;
        else if (align === 'center') top = triggerRect.top + scrollY + triggerRect.height / 2;
        else top = triggerRect.bottom + scrollY;
        break;
    }

    setCoords({ top, left });
  }, [side, align, gap]);

  useEffect(() => {
    onOpenChange?.(isOpen);
  }, [isOpen, onOpenChange]);

  const handleMouseEnter = () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    closeTimerRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 150);
  };

  useEffect(() => {
    if (isOpen) {
      updateCoords();
      const timer = setTimeout(updateCoords, 0);
      window.addEventListener('scroll', updateCoords, true);
      window.addEventListener('resize', updateCoords);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('scroll', updateCoords, true);
        window.removeEventListener('resize', updateCoords);
      };
    }
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, [isOpen, side, align, gap, updateCoords]);

  // Calculate offsets and transform origin for animation
  const getPositioning = () => {
    let tx = 0;
    let ty = 0;
    let origin = 'center center';
    
    if (side === 'bottom') {
      if (align === 'center') tx = -50;
      else if (align === 'end') tx = -100;
      origin = align === 'start' ? 'top left' : align === 'center' ? 'top center' : 'top right';
    } else if (side === 'top') {
      ty = -100;
      if (align === 'center') tx = -50;
      else if (align === 'end') tx = -100;
      origin = align === 'start' ? 'bottom left' : align === 'center' ? 'bottom center' : 'bottom right';
    } else if (side === 'left') {
      tx = -100;
      if (align === 'center') ty = -50;
      else if (align === 'end') ty = -100;
      origin = align === 'start' ? 'top right' : align === 'center' ? 'center right' : 'bottom right';
    } else if (side === 'right') {
      if (align === 'center') ty = -50;
      else if (align === 'end') ty = -100;
      origin = align === 'start' ? 'top left' : align === 'center' ? 'center left' : 'bottom left';
    }
    
    return { x: `${tx}%`, y: `${ty}%`, origin };
  };

  const { x, y, origin } = getPositioning();

  const menuContent = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, x, y }}
          animate={{ opacity: 1, scale: 1, x, y }}
          exit={{ opacity: 0, scale: 0.95, x, y }}
          transition={{ duration: 0.1 }}
          style={{ 
            position: 'absolute', 
            top: coords.top, 
            left: coords.left,
            zIndex: 9999,
            pointerEvents: 'auto',
            transformOrigin: origin
          }}
          className={`${width} bg-neutral-900/95 backdrop-blur-xl border border-neutral-800/50 text-white rounded-xl p-2 shadow-2xl shadow-black/50 overflow-hidden`}
          onClick={e => e.stopPropagation()}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {items.map((item, index) => (
            <React.Fragment key={index}>
              {item.separator && index > 0 && (
                <div className="bg-neutral-800/50 my-1.5 h-px" />
              )}
              <button
                onClick={() => {
                  item.onClick();
                  setIsOpen(false);
                }}
                className={`w-full cursor-pointer rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200 outline-none group flex items-center text-left ${
                  item.variant === 'danger'
                    ? 'hover:bg-red-500/10 focus:bg-red-500/10 text-red-500/80 hover:text-red-500'
                    : 'hover:bg-neutral-800 focus:bg-neutral-800 text-neutral-300 hover:text-white'
                }`}
              >
                {item.icon && (
                  <span className={`mr-3 h-4 w-4 shrink-0 transition-colors ${
                    item.variant === 'danger'
                      ? 'text-red-500/60 group-hover:text-red-500'
                      : 'text-neutral-500 group-hover:text-white'
                  }`}>
                    {item.icon}
                  </span>
                )}
                <span className="truncate flex-1">
                  {item.label}
                </span>
              </button>
            </React.Fragment>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div 
      className="inline-flex"
      onMouseLeave={handleMouseLeave}
    >
      <div 
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        className="inline-flex items-center justify-center"
      >
        {trigger}
      </div>

      {mounted && createPortal(menuContent, document.body)}
    </div>
  );
}
