import React from 'react';

export default function DatePicker({ label, error, className = '', id, register, ...props }) {
  const inputId = id || props.name;
  return (
    <div className={`mb-4 ${className}`}>
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <input
        id={inputId}
        type="date"
        className={`
          w-full px-3 py-2 border rounded-lg text-sm transition-colors bg-white
          focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary
          ${error ? 'border-red-400' : 'border-gray-300'}
        `}
        {...(register || {})}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
