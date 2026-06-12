'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Plus } from 'lucide-react';

interface CommentMarkerProps {
    x: number; // Percentage 0-100
    y: number; // Percentage 0-100
    active?: boolean;
    isDraft?: boolean;
    onClick?: () => void;
    avatarUrl?: string; // Optional user avatar
    index?: number;
    onDragEnd?: (newX: number, newY: number) => void;
    onDragStart?: () => void;
    containerRef?: React.RefObject<HTMLDivElement | null>;
    color?: string;
    readOnly?: boolean;
}

export const CommentMarker = ({
    x,
    y,
    active,
    isDraft,
    onClick,
    avatarUrl,
    index,
    onDragEnd,
    onDragStart,
    containerRef,
    color,
    readOnly = false
}: CommentMarkerProps) => {
    const buttonRef = React.useRef<HTMLButtonElement>(null);
    const isDragging = React.useRef(false);

    return (
        <motion.button
            ref={buttonRef}
            drag={!isDraft && !readOnly} // Disable drag in readOnly mode
            dragMomentum={false}
            dragElastic={0.1} // Slight elasticity for better feel
            dragConstraints={containerRef} // Constrain to resume container
            whileHover={!isDraft ? { scale: 1.15 } : undefined} // Scale on hover
            whileTap={!isDraft ? { scale: 0.95 } : undefined} // Scale down on click
            transition={{
                duration: 0.2, // Default for scale, opacity
                x: { duration: 0 }, // Instant for position types to prevent jump on drag release
                y: { duration: 0 }
            }}
            onPointerDown={(e) => e.stopPropagation()} // Prevent container click event
            onMouseDown={(e) => e.stopPropagation()} // Prevent parent pan/zoom handlers from receiving mousedown
            onMouseUp={(e) => e.stopPropagation()} // Prevent container mouseup event (new draft)
            onDragStart={() => {
                isDragging.current = true;
                onDragStart?.();
            }}
            onDragEnd={(_, info) => {
                const parent = buttonRef.current?.offsetParent as HTMLElement;
                if (!parent || !onDragEnd) return;

                const parentRect = parent.getBoundingClientRect();
                const buttonRect = buttonRef.current?.getBoundingClientRect();

                if (!buttonRect) return;
                
                // Calculate center relative to parent based on the actual element position
                // This accounts for where the user grabbed the element (offset)
                const centerX = buttonRect.left + buttonRect.width / 2;
                const centerY = buttonRect.top + buttonRect.height / 2;

                console.log('--- Drag Debug ---');
                console.log('Pointer (Page):', info.point);
                console.log('Parent Rect:', parentRect);
                console.log('Button Rect (Screen):', buttonRect);
                console.log('Calculated Center (Screen):', centerX, centerY);

                let newX = ((centerX - parentRect.left) / parentRect.width) * 100;
                let newY = ((centerY - parentRect.top) / parentRect.height) * 100;

                console.log('New X %:', newX);
                console.log('New Y %:', newY);

                // Clamp to bounds (0-100%)
                newX = Math.max(0, Math.min(100, newX));
                newY = Math.max(0, Math.min(100, newY));

                onDragEnd(newX, newY);
                
                // Reset dragging flag after a short delay to prevent onClick from firing immediately
                setTimeout(() => {
                    isDragging.current = false;
                }, 50);
            }}
            className={cn(
                "absolute z-20 flex items-center justify-center rounded-full shadow-md focus:outline-none -ml-4 -mt-4",
                // Remove bg colors from classes since we use inline style for custom color
                isDraft ? "w-8 h-8 text-white" : "w-8 h-8 text-neutral-900 border border-neutral-200 dark:border-neutral-700 dark:text-white", 
                active && "scale-110 ring-2 ring-blue-500 ring-offset-2",
                "pointer-events-auto",
                readOnly && "cursor-pointer" // Show pointer cursor in readOnly mode indicating clickability
            )}
            style={{ 
                left: `${x}%`, 
                top: `${y}%`,
                backgroundColor: color || (isDraft ? '#3b82f6' : '#ffffff')
            }}
            initial={{ scale: 0, opacity: 0, x: 0, y: 0 }}
            animate={{ 
                scale: active ? 1.1 : 1, 
                opacity: 1,
                x: 0, // Reset transform x after drag
                y: 0  // Reset transform y after drag
            }}
            exit={{ scale: 0, opacity: 0, x: 0, y: 0 }}
            onClick={(e) => {
                e.stopPropagation();
                if (isDragging.current) return;
                onClick?.();
            }}
            type="button"
        >
            {isDraft ? (
                <Plus size={16} strokeWidth={3} />
            ) : avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt="User" className="w-full h-full rounded-full object-cover" />
            ) : (
                <span className="text-xs font-bold">{index || 1}</span>
            )}
            
            {/* Ripple effect for draft */}
            {isDraft && (
                <span className="absolute inset-0 rounded-full bg-blue-400 opacity-75 animate-ping" />
            )}
        </motion.button>
    );
};
