'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useReducedMotion } from 'framer-motion';
import { FileText, Bell, BookOpenText, ChevronLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import AccountMenu from '@/components/shared/AccountMenu';
import { useAppUser } from '@/lib/auth';
import { isCloudMode } from '@/lib/config/app';
import { useNotifications } from '@/hooks/useNotifications';
import { BrandMark, BrandWordmark } from './BrandMark';

const RAIL_WIDTH = 60;
const PANEL_WIDTH = 232;
const STORAGE_KEY = 'dashboard:sidebar-collapsed';
const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';
const DUR = 300;

/**
 * Top-level navigation — one nav model, two forms that morph smoothly between a
 * 232px labelled panel and a 60px icon rail. The morph is the point: icons live in
 * fixed 36px columns so they never jump; only the panel width and the label
 * reveals animate, and they share the same 300ms curve so everything moves as one.
 * Collapse preference persists; the first paint is transition-free (no collapse
 * animation on load) and stilled under reduced-motion. Editor pages own their
 * OutlineRail, so this returns null there.
 *
 * The animated `transition` is applied via inline style (not Tailwind arbitrary
 * classes, which can't be generated from runtime-interpolated strings).
 */
export default function DashboardSidebar() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const { user } = useAppUser();
  const reduce = useReducedMotion();

  const [mounted, setMounted] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [animReady, setAnimReady] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      if (localStorage.getItem(STORAGE_KEY) === '1') setCollapsed(true);
    } catch {
      /* ignore */
    }
    // Enable transitions only after the initial (persisted) state has painted, so
    // reloading with a collapsed pref doesn't animate the collapse on load.
    const raf = requestAnimationFrame(() => requestAnimationFrame(() => setAnimReady(true)));
    return () => cancelAnimationFrame(raf);
  }, []);

  const toggle = () =>
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, next ? '1' : '0');
      } catch {
        /* ignore */
      }
      return next;
    });

  if (pathname.includes('/edit')) return null;

  const anim = animReady && !reduce;
  const labelStyle: React.CSSProperties | undefined = anim
    ? { transition: `max-width ${DUR}ms ${EASE}, opacity ${DUR}ms ${EASE}` }
    : undefined;
  // i18n labels resolve client-side; keep them empty until mount so SSR and the
  // first client render agree (icons are language-independent and render on both).
  const label = (key: string) => (mounted ? t(key) : undefined);

  const name = user?.fullName ?? null;
  const email = user?.primaryEmailAddress?.emailAddress ?? null;

  return (
    <aside
      className="group relative z-30 h-full shrink-0 border-r border-white/[0.06] bg-desk"
      style={{
        width: collapsed ? RAIL_WIDTH : PANEL_WIDTH,
        transition: anim ? `width ${DUR}ms ${EASE}` : undefined,
      }}
    >
      <div className="flex h-full flex-col overflow-hidden px-3 py-4">
        {/* brand */}
        <Link
          href="/dashboard"
          aria-label={label('common.logoAlt')}
          className="flex items-center rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-sky-400/40"
        >
          <span className="grid w-9 shrink-0 place-items-center">
            <BrandMark size={28} />
          </span>
          <span
            className={cn('overflow-hidden pl-2', collapsed ? 'max-w-0 opacity-0' : 'max-w-[160px] opacity-100')}
            style={labelStyle}
          >
            <BrandWordmark />
          </span>
        </Link>

        <div className="my-4 h-px bg-white/[0.06]" />

        {/* nav */}
        <nav className="flex flex-col gap-1">
          <NavItem
            href="/dashboard"
            label={label('sidebar.resumes')}
            active={pathname === '/dashboard'}
            icon={<FileText size={18} />}
            collapsed={collapsed}
            labelStyle={labelStyle}
          />
          <NavItem
            href="/knowledge/timelines"
            label={label('sidebar.knowledge')}
            active={pathname.startsWith('/knowledge')}
            icon={<BookOpenText size={18} />}
            collapsed={collapsed}
            labelStyle={labelStyle}
          />
          {isCloudMode && (
            <NavNotifications
              label={label('sidebar.notifications')}
              active={pathname === '/dashboard/notifications'}
              collapsed={collapsed}
              labelStyle={labelStyle}
            />
          )}
        </nav>

        <div className="flex-1" />

        {/* account — the whole row is the trigger (name/email live inside the button).
            Cloud mode resolves the user async; show a skeleton row until it lands so
            the footer never flashes a lone, unlabelled avatar icon. */}
        <div className="h-px bg-white/[0.06]" />
        <div className="mt-3">
          {isCloudMode && !user ? (
            <AccountRowSkeleton collapsed={collapsed} labelStyle={labelStyle} />
          ) : (
            <AccountMenu
              placement={collapsed ? 'right' : 'up'}
              label={
                !collapsed && (name || email) ? (
                  <span
                    className="block max-w-[142px] overflow-hidden pl-1 text-left opacity-100"
                    style={labelStyle}
                  >
                    {name && <span className="block truncate text-[13px] font-medium text-neutral-100">{name}</span>}
                    {email && <span className="block truncate text-[11px] text-neutral-500">{email}</span>}
                  </span>
                ) : undefined
              }
            />
          )}
        </div>
      </div>

      {/* hover-revealed edge toggle — floats on the divider seam, tracks the animating edge */}
      <button
        type="button"
        onClick={toggle}
        aria-label={label(collapsed ? 'common.expand' : 'common.collapse')}
        className="absolute right-0 top-[76px] z-40 flex h-6 w-6 -translate-y-1/2 translate-x-1/2 items-center justify-center rounded-full border border-white/10 bg-neutral-900 text-neutral-400 opacity-0 shadow-md shadow-black/50 transition-opacity duration-200 hover:text-sky-300 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/40 group-hover:opacity-100"
      >
        <ChevronLeft className={cn('h-3.5 w-3.5 transition-transform duration-300', collapsed && 'rotate-180')} />
      </button>
    </aside>
  );
}

/** Placeholder for the account footer while the user resolves. Mirrors the real
 *  row: avatar in a fixed 36px column + name/email lines that collapse with the panel. */
function AccountRowSkeleton({
  collapsed,
  labelStyle,
}: {
  collapsed: boolean;
  labelStyle?: React.CSSProperties;
}) {
  return (
    <div className="flex h-11 items-center rounded-xl px-2">
      <span className="grid w-9 shrink-0 place-items-center">
        <span className="h-8 w-8 animate-pulse rounded-full bg-white/[0.06] ring-1 ring-white/[0.06]" />
      </span>
      <span
        className={cn(
          'overflow-hidden pl-1',
          collapsed ? 'max-w-0 opacity-0' : 'max-w-[142px] opacity-100',
        )}
        style={labelStyle}
      >
        <span className="block h-3 w-24 animate-pulse rounded bg-white/[0.06]" />
        <span className="mt-1.5 block h-2.5 w-28 animate-pulse rounded bg-white/[0.04]" />
      </span>
    </div>
  );
}

/** One nav destination. Icon lives in a fixed 36px column (never moves); the label
 *  slides open/closed via max-width so the collapsed pill sizes to the icon alone. */
function NavItem({
  href,
  label,
  active,
  icon,
  collapsed,
  labelStyle,
  dot = false,
}: {
  href: string;
  label?: string;
  active: boolean;
  icon: React.ReactNode;
  collapsed: boolean;
  labelStyle?: React.CSSProperties;
  dot?: boolean;
}) {
  return (
    <Link
      href={href}
      title={collapsed ? label : undefined}
      aria-label={label}
      className={cn(
        'group/nav relative flex h-9 items-center rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-sky-400/40',
        active ? '' : 'hover:bg-white/[0.04]',
      )}
    >
      {active && <span aria-hidden className="absolute inset-0 rounded-xl bg-sky-400/10" />}
      <span
        className={cn(
          'relative z-[1] grid w-9 shrink-0 place-items-center transition-colors duration-150',
          active ? 'text-sky-300' : 'text-neutral-500 group-hover/nav:text-neutral-200',
        )}
      >
        {icon}
        {dot && <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-sky-400 ring-2 ring-desk" />}
      </span>
      <span
        className={cn(
          'relative z-[1] overflow-hidden whitespace-nowrap pl-1 text-sm',
          collapsed ? 'max-w-0 opacity-0' : 'max-w-[150px] opacity-100',
          active ? 'text-sky-200' : 'text-neutral-400 group-hover/nav:text-neutral-100',
        )}
        style={labelStyle}
      >
        {label}
      </span>
    </Link>
  );
}

/** Cloud-only: isolates the Clerk-backed useNotifications hook behind an isCloudMode gate. */
function NavNotifications({
  label,
  active,
  collapsed,
  labelStyle,
}: {
  label?: string;
  active: boolean;
  collapsed: boolean;
  labelStyle?: React.CSSProperties;
}) {
  const { unreadCount } = useNotifications();
  return (
    <NavItem
      href="/dashboard/notifications"
      label={label}
      active={active}
      icon={<Bell size={18} />}
      collapsed={collapsed}
      dot={unreadCount > 0}
      labelStyle={labelStyle}
    />
  );
}
