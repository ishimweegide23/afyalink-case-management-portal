// Added inline comments to explain complex state logic
import React from 'react';
import Avatar from '../shared/Avatar';
import { HiOutlineUserGroup, HiOutlineUsers } from 'react-icons/hi';

function getScoreColor(score) {
  if (score >= 80) return 'text-emerald-600 bg-emerald-50';
  if (score >= 60) return 'text-amber-600 bg-amber-50';
  return 'text-red-600 bg-red-50';
}

export default function SupervisorWorkloadCard({ supervisor, onReassign }) {
  const { fullName, email, teamSize, avgTeamPerformance, activeCases, workers = [] } = supervisor || {};
  const scoreColor = getScoreColor(avgTeamPerformance ?? 0);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <Avatar name={fullName} size="lg" />
          <div>
            <p className="font-semibold text-gray-900">{fullName}</p>
            <p className="text-sm text-gray-500">{email}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${scoreColor}`}>
                <HiOutlineUserGroup className="w-3.5 h-3.5" />
                {teamSize ?? 0} workers
              </span>
              {avgTeamPerformance != null && (
                <span className="text-xs text-gray-500">Avg: {avgTeamPerformance}%</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {activeCases != null && (
        <p className="text-sm text-gray-600 mb-3">
          <span className="font-medium">{activeCases}</span> active cases across team
        </p>
      )}

      {workers.length > 0 && (
        <div className="border-t border-gray-100 pt-3">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Team members</p>
          <ul className="space-y-2 max-h-32 overflow-y-auto">
            {workers.slice(0, 6).map((w) => (
              <li key={w.id} className="flex items-center gap-2 text-sm">
                <HiOutlineUsers className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="truncate">{w.fullName}</span>
                <span className={`ml-auto px-2 py-0.5 rounded text-xs font-medium flex-shrink-0 ${getScoreColor(w.overallScore ?? 0)}`}>
                  {w.overallScore ?? 0}%
                </span>
              </li>
            ))}
            {workers.length > 6 && (
              <li className="text-xs text-gray-400">+{workers.length - 6} more</li>
            )}
          </ul>
        </div>
      )}

      {onReassign && (
        <div className="mt-4 pt-3 border-t border-gray-100">
          <button
            type="button"
            onClick={onReassign}
            className="text-sm text-purple-600 font-medium hover:text-purple-700"
          >
            View reassignment options →
          </button>
        </div>
      )}
    </div>
  );
}
