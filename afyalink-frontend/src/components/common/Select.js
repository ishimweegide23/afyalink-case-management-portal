import React from 'react';

export default function Select({
  label,
  error,
  options = [],
  placeholder = 'Select...',
  className = '',
  id,
  register,
  value,
  onChange,
  ...props
}) {
  const selectId = id || props.name;
  const useValue = value !== undefined && value !== null;
  const useOnChange = onChange || (register && register.onChange);
  const selectProps = {
    ...(register || {}),
    ...props,
    ...(useValue && !useOnChange ? { defaultValue: value } : useValue && useOnChange ? { value, onChange } : {}),
  };
  return (
    <div className={`mb-4 ${className}`}>
      {label && (
        <label htmlFor={selectId} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={`
          w-full px-3 py-2 border rounded-lg text-sm transition-colors bg-white dark:bg-gray-800 appearance-none
          text-gray-900 dark:text-gray-100
          focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary
          ${error ? 'border-red-400' : 'border-gray-300 dark:border-gray-600'}
        `}
        {...selectProps}
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value ?? opt} value={opt.value ?? opt}>
            {opt.label ?? opt}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
