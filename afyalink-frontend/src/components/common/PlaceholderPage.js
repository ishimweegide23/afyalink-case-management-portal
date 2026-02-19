import React from 'react';
import { HiOutlineCog } from 'react-icons/hi';

export default function PlaceholderPage({ title = 'Coming Soon', description = 'This feature is under development.' }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-20 h-20 bg-primary-50 rounded-full flex items-center justify-center mb-6">
        <HiOutlineCog className="w-10 h-10 text-primary animate-spin-slow" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
      <p className="text-gray-500 max-w-md">{description}</p>
    </div>
  );
}
