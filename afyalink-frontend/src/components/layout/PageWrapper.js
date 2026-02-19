import React from 'react';

/**
 * Wraps page content with consistent padding, title, and optional actions.
 * Used by all report/analytics and supervisor pages.
 */
export default function PageWrapper({ title, subtitle, children, className = '', actions }) {
  return (
    <div className={`min-h-0 flex flex-col ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
      </div>
      <div className="flex-1 min-h-0">
        {children}
      </div>
    </div>
  );
}
