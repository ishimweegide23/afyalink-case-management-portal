import React from 'react';

export default function StatCard({ title, value, icon: Icon, color = 'primary', trend, className = '' }) {
  const colorMap = {
    primary: 'bg-primary-50 text-primary',
    secondary: 'bg-green-50 text-secondary',
    warning: 'bg-yellow-50 text-yellow-600',
    danger: 'bg-red-50 text-red-600',
    info: 'bg-cyan-50 text-cyan-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  return (
    <div className={`bg-white rounded-xl shadow-card border border-gray-100 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorMap[color] || colorMap.primary}`}>
          {Icon && <Icon className="w-6 h-6" />}
        </div>
        {trend && (
          <span className={`text-xs font-medium px-2 py-1 rounded-full
            ${trend > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {trend > 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-gray-900">{value ?? '—'}</p>
      <p className="text-sm text-gray-500 mt-1">{title}</p>
    </div>
  );
}
