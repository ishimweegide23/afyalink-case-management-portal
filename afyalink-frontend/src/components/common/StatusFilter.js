import React from 'react';

export default function StatusFilter({ value, onChange, options = [], label = 'Status', allLabel = 'All' }) {
  return (
    <div className="flex items-center gap-2">
      {label && <span className="text-sm font-medium text-gray-600">{label}:</span>}
      <div className="flex gap-1 flex-wrap">
        <button
          onClick={() => onChange('')}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors
            ${!value ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
        >
          {allLabel}
        </button>
        {options.map((opt) => (
          <button
            key={opt.value ?? opt}
            onClick={() => onChange(opt.value ?? opt)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors
              ${value === (opt.value ?? opt) ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            {opt.label ?? opt}
          </button>
        ))}
      </div>
    </div>
  );
}
