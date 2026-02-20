import React from 'react';
import StatusBadge from './StatusBadge';
import { formatDate } from '../../utils/formatDate';
import { formatEnum } from '../../utils/helpers';

export default function CaseEntryItem({ entry, onClick }) {
  return (
    <div
      onClick={() => onClick?.(entry)}
      className="flex items-start gap-4 p-4 bg-white rounded-lg border border-gray-100 hover:shadow-sm cursor-pointer transition-all"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-medium text-gray-400">{formatEnum(entry.entryType)}</span>
          <StatusBadge status={entry.status} />
        </div>
        <p className="text-sm font-medium text-gray-900 truncate">{entry.title}</p>
        {entry.content && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{entry.content}</p>}
      </div>
      <span className="text-xs text-gray-400 whitespace-nowrap">{formatDate(entry.createdAt)}</span>
    </div>
  );
}
