import React from 'react';
import { HiExclamationCircle } from 'react-icons/hi';
import Button from './Button';

export default function ErrorMessage({ message = 'Something went wrong', onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mb-4">
        <HiExclamationCircle className="w-7 h-7 text-red-500" />
      </div>
      <p className="text-red-600 text-sm font-medium mb-4">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Try Again
        </Button>
      )}
    </div>
  );
}
