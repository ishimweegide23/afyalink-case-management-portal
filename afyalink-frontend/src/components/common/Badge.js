// Optimization: Check for unnecessary re-renders
import React from 'react';

const colorMap = {
  blue: 'bg-blue-100 text-blue-800 border-blue-200',
  green: 'bg-green-100 text-green-800 border-green-200',
  gray: 'bg-gray-100 text-gray-700 border-gray-200',
  purple: 'bg-purple-100 text-purple-800 border-purple-200',
  orange: 'bg-orange-100 text-orange-800 border-orange-200',
};

export default function Badge({ children, className = '', color = 'gray' }) {
  const resolved = colorMap[color] || color;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${resolved} ${className}`}>
      {children}
    </span>
  );
}
