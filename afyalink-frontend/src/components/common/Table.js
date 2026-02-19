import React from 'react';
import Spinner from './Spinner';
import EmptyState from './EmptyState';

export default function Table({ columns = [], data = [], loading = false, onRowClick, emptyMessage = 'No data found' }) {
  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!data.length) {
    return <EmptyState message={emptyMessage} />;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            {columns.map((col, i) => (
              <th
                key={col.key || i}
                className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"
                style={col.width ? { width: col.width } : {}}
              >
                {col.header ?? col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {data.map((row, rowIdx) => (
            <tr
              key={row.id || rowIdx}
              onClick={() => onRowClick?.(row)}
              className={`hover:bg-primary-50/30 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
            >
              {columns.map((col, colIdx) => (
                <td key={col.key || colIdx} className="px-4 py-3 text-gray-700">
                  {col.render ? col.render(row[col.key], row, rowIdx) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
