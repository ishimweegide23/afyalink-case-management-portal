import React from 'react';

const sizeMap = {
  xs: 'w-3 h-3 border-[1.5px]',
  sm: 'w-4 h-4 border-2',
  md: 'w-8 h-8 border-3',
  lg: 'w-12 h-12 border-4',
};

export default function Spinner({ size = 'md', className = '' }) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div
        className={`${sizeMap[size]} rounded-full border-primary/30 border-t-primary animate-spin`}
      />
    </div>
  );
}
