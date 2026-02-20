import React from 'react';
import Avatar from '../shared/Avatar';
import RoleBadge from './RoleBadge';

export default function StaffAssignmentRow({ staff, onRemove }) {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <div className="flex items-center gap-3">
        <Avatar name={staff.fullName} size="sm" />
        <div>
          <p className="text-sm font-medium text-gray-900">{staff.fullName}</p>
          <p className="text-xs text-gray-400">{staff.roleInIntervention || 'Team Member'}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <RoleBadge role={staff.role} />
        {onRemove && (
          <button onClick={() => onRemove(staff)} className="text-xs text-red-500 hover:text-red-700">
            Remove
          </button>
        )}
      </div>
    </div>
  );
}
