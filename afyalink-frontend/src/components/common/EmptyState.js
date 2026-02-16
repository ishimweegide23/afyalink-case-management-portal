import React from 'react';
import { HiOutlineInbox } from 'react-icons/hi';

export default function EmptyState({ message = 'No data found', icon: Icon = HiOutlineInbox, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-gray-400" />
      </div>
      <p className="text-gray-500 text-sm mb-4">{message}</p>
      {action}
    </div>
  );
}
