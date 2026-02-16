import React from 'react';
import Spinner from './Spinner';

const variants = {
  primary: 'bg-primary text-white hover:bg-primary-700 shadow-sm',
  secondary: 'bg-secondary text-white hover:bg-secondary-700 shadow-sm',
  /** Semi-transparent control on gradient page headers (white text, visible on teal/indigo) */
  header: 'bg-white/20 text-white border border-white/30 hover:bg-white/30 shadow-none focus:ring-white/40',
  outline: 'border-2 border-primary text-primary hover:bg-primary-50',
  ghost: 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
  danger: 'bg-red-600 text-white hover:bg-red-700 shadow-sm',
  'outline-danger': 'border-2 border-red-500 text-red-600 hover:bg-red-50',
};

const sizes = {
  sm: 'px-3 py-1.5 text-xs rounded-md',
  md: 'px-4 py-2 text-sm rounded-lg',
  lg: 'px-6 py-2.5 text-base rounded-lg',
  xl: 'px-8 py-3 text-lg rounded-xl',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className = '',
  type = 'button',
  icon: Icon,
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center gap-2 font-medium transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary/30
        ${variants[variant] || variants.primary}
        ${sizes[size] || sizes.md}
        ${className}
      `}
      {...props}
    >
      {loading ? <Spinner size="sm" /> : Icon ? <Icon className="w-4 h-4" /> : null}
      {children}
    </button>
  );
}
