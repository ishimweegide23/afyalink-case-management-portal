import React from 'react';

export default function Input({
  label,
  error,
  className = '',
  id,
  register,
  rightAddon,
  ...props
}) {
  const inputId = id || props.name;
  const hasRightAddon = !!rightAddon;
  return (
    <div className={`mb-4 ${className}`}>
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={inputId}
          className={`
            w-full px-3 py-2 border rounded-lg text-sm transition-colors bg-white dark:bg-gray-800
            text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500
            focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary
            ${error ? 'border-red-400 focus:ring-red-200' : 'border-gray-300 dark:border-gray-600'}
            ${hasRightAddon ? 'pr-10' : ''}
          `}
          {...(register || {})}
          {...props}
        />
        {hasRightAddon && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center text-gray-400 hover:text-gray-600 focus-within:text-primary">
            {rightAddon}
          </div>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
