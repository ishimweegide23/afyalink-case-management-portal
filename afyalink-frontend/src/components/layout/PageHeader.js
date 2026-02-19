import React from 'react';

const PATTERN_BG = `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`;

/** Shared classes for native <button> elements inside page headers */
export const PAGE_HEADER_BTN_CLASS =
  'inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-white/20 text-white border border-white/30 hover:bg-white/30 transition-all focus:outline-none focus:ring-2 focus:ring-white/40';

export const PAGE_HEADER_ICON_BTN_CLASS =
  'p-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white border border-white/30 transition-colors focus:outline-none focus:ring-2 focus:ring-white/40';

/**
 * Reusable page header with primary → secondary gradient (matches Reports / Analytics).
 * All text is white; action buttons should use Button variant="header" or PAGE_HEADER_BTN_CLASS.
 */
export default function PageHeader({ badge, badgeIcon: BadgeIcon, title, subtitle, action }) {
  return (
    <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl shadow-xl shadow-primary/25">
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary-600 to-secondary opacity-[0.97]" />
      <div
        className="absolute inset-0 opacity-[0.12] pointer-events-none"
        style={{ backgroundImage: PATTERN_BG }}
      />
      <div className="relative px-6 sm:px-8 py-6 sm:py-8 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
          <div>
            {badge && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-sm text-sm font-semibold mb-3 border border-white/20">
                {BadgeIcon && <BadgeIcon className="w-4 h-4 shrink-0" />}
                {badge}
              </div>
            )}
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-1 text-white">{title}</h1>
            {subtitle && <p className="text-white/90 text-sm sm:text-base max-w-2xl">{subtitle}</p>}
          </div>
          {action && (
            <div className="flex-shrink-0 flex flex-wrap items-center gap-2 text-white">
              {action}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
