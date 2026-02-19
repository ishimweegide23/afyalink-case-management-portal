import React from 'react';

export default function Footer() {
  return (
    <footer className="border-t border-gray-100 dark:border-gray-700 bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm px-6 py-3.5">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-400 dark:text-gray-500">
        <p>&copy; {new Date().getFullYear()} <span className="font-medium text-gray-500 dark:text-gray-400">AfyaLink</span> Case Management Portal</p>
        <p>Supporting vulnerable children, youth &amp; families</p>
      </div>
    </footer>
  );
}
