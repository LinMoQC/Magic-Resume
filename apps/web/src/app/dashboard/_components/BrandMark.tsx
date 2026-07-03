'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';

/**
 * The product logomark — the Magic Resume brand mark, shared with the Astro
 * marketing site (apps/landing). Rendered as a clean point of light on the black
 * workbench: no tile, no border, just the mark scaled to `size`.
 */
export function BrandMark({ size = 34, className }: { size?: number; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn('relative grid place-items-center', className)}
      style={{ width: size, height: size }}
    >
      <Image
        src="/magic-resume-mark.png"
        alt=""
        width={size}
        height={size}
        className="object-contain"
        priority
      />
    </span>
  );
}

/** Wordmark set in the brand typeface (Sora via --font-brand); a confident weight
 *  duo in one bright tone reads sharper than the old washed two-tone gray. */
export function BrandWordmark({ className }: { className?: string }) {
  return (
    <span
      className={cn('select-none whitespace-nowrap text-[15px] leading-none tracking-[-0.01em]', className)}
      style={{ fontFamily: 'var(--font-brand), system-ui, sans-serif' }}
    >
      <span className="font-bold text-neutral-50">{'Magic'}</span>
      <span className="font-normal text-neutral-300">{' Resume'}</span>
    </span>
  );
}
