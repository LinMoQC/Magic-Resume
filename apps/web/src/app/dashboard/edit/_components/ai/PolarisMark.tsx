import React from 'react';
import { cn } from '@/lib/utils';

/** Shared star geometry — single source of truth for the static mark and the
 *  animated hero avatar so both stay visually identical. */
export const POLARIS_STAR_D =
  'M12 1.5C12.8 7.4 16.6 11.2 22.5 12C16.6 12.8 12.8 16.6 12 22.5C11.2 16.6 7.4 12.8 1.5 12C7.4 11.2 11.2 7.4 12 1.5Z';
export const POLARIS_TWINKLE_D =
  'M18.5 3.5C18.7 5.2 19.3 5.8 21 6C19.3 6.2 18.7 6.8 18.5 8.5C18.3 6.8 17.7 6.2 16 6C17.7 5.8 18.3 5.2 18.5 3.5Z';

export function PolarisGlyph({
  size = 24,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path d={POLARIS_STAR_D} fill="currentColor" />
    </svg>
  );
}

/**
 * Polaris — the lab's guiding-star mark (北极星). A four-pointed north star with
 * a faint twinkle, replacing the old generic robot face. Inherits color from
 * `currentColor`, so the caller's text color drives it; pair with the sky accent.
 * This static variant is used where motion would distract (e.g. the rail).
 */
export default function PolarisMark({
  size = 24,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path d={POLARIS_STAR_D} fill="currentColor" />
      <path d={POLARIS_TWINKLE_D} fill="currentColor" opacity="0.55" />
    </svg>
  );
}

/**
 * The hero Polaris avatar — a breathing north star inside a softly glowing,
 * sky-tinted plate. So the empty canvas opens on a living guiding star, not a
 * robot. Motion 方案 A「呼吸的北极星」: a slow breath + micro-rotate on the star,
 * an out-of-phase twinkle, a periodic specular sheen across the plate, and a
 * one-shot ring that expands on mount. All transform/opacity, all disabled under
 * `prefers-reduced-motion` (design: 动效轻、快、贴元素).
 */
export function PolarisAvatar({ className, rounded = 'rounded-2xl' }: { className?: string; rounded?: string }) {
  return (
    <div className={cn('relative', className)}>
      {/* ambient glow — slow pulse */}
      <div className={cn('absolute inset-0 bg-sky-500/25 blur-xl polaris-glow', rounded)} aria-hidden="true" />
      {/* one-shot ring that expands once when the hero appears */}
      <div className={cn('polaris-ring absolute inset-0 border border-sky-400/40', rounded)} aria-hidden="true" />
      <div className={cn('relative w-14 h-14 overflow-hidden bg-gradient-to-b from-sky-500/15 to-sky-500/[0.04] border border-sky-500/25 flex items-center justify-center text-sky-300', rounded)}>
        {/* specular sheen sweeping across the plate every few seconds */}
        <div className="polaris-sheen pointer-events-none absolute inset-0" aria-hidden="true" />
        {/* the star itself — breathing */}
        <svg
          className="polaris-star relative"
          width={30}
          height={30}
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path d={POLARIS_STAR_D} fill="currentColor" />
          <path className="polaris-twinkle" d={POLARIS_TWINKLE_D} fill="currentColor" />
        </svg>
      </div>
      <style jsx>{`
        .polaris-glow {
          animation: polarisGlow 4s ease-in-out infinite;
        }
        .polaris-star {
          transform-origin: 50% 50%;
          animation: polarisBreath 5s ease-in-out infinite;
        }
        .polaris-twinkle {
          animation: polarisTwinkle 3.2s ease-in-out infinite;
        }
        .polaris-sheen {
          background: linear-gradient(
            115deg,
            transparent 38%,
            rgba(186, 230, 253, 0.18) 49%,
            transparent 60%
          );
          /* Sweep via translateX (compositor-only). Was animating
             background-position, which is paint-bound and caused a periodic
             stutter on each sweep when the main thread was busy. */
          will-change: transform;
          animation: polarisSheen 6s ease-in-out infinite;
        }
        .polaris-ring {
          transform-origin: 50% 50%;
          animation: polarisRing 0.9s ease-out both;
        }
        @keyframes polarisGlow {
          0%,
          100% {
            opacity: 0.5;
          }
          50% {
            opacity: 0.9;
          }
        }
        @keyframes polarisBreath {
          0%,
          100% {
            transform: scale(1) rotate(-1.5deg);
          }
          50% {
            transform: scale(1.05) rotate(1.5deg);
          }
        }
        @keyframes polarisTwinkle {
          0%,
          100% {
            opacity: 0.3;
          }
          50% {
            opacity: 0.78;
          }
        }
        @keyframes polarisSheen {
          0% {
            transform: translateX(-120%);
          }
          55%,
          100% {
            transform: translateX(120%);
          }
        }
        @keyframes polarisRing {
          0% {
            opacity: 0.7;
            transform: scale(0.85);
          }
          100% {
            opacity: 0;
            transform: scale(1.55);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .polaris-glow,
          .polaris-star,
          .polaris-twinkle,
          .polaris-ring {
            animation: none;
          }
          .polaris-twinkle {
            opacity: 0.55;
          }
          .polaris-sheen {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
