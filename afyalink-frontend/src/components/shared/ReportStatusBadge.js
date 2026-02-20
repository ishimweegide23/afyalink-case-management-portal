import React from 'react';

const STATUS_COLORS = {
  DRAFT: 'bg-gray-100 text-gray-800 border-gray-200',
  FINAL: 'bg-blue-100 text-blue-800 border-blue-200',
  SUBMITTED: 'bg-teal-100 text-teal-800 border-teal-200',
  APPROVED: 'bg-green-100 text-green-800 border-green-200',
  REJECTED: 'bg-red-100 text-red-800 border-red-200',
  ARCHIVED: 'bg-yellow-100 text-yellow-800 border-yellow-200',
};

const ReportStatusBadge = ({ status, className = '' }) => {
  const defaultColor = 'bg-gray-100 text-gray-800 border-gray-200';
  const colorClass = STATUS_COLORS[status?.toUpperCase()] || defaultColor;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorClass} ${className}`}>
      {status || 'UNKNOWN'}
    </span>
  );
};

export default ReportStatusBadge;
