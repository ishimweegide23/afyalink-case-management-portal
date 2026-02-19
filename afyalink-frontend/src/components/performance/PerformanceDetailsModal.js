import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Avatar from '../shared/Avatar';
import { performanceApi } from '../../api/performanceApi';
import Spinner from '../common/Spinner';
import {
  HiOutlineUsers,
  HiOutlineClipboardList,
  HiOutlineDocumentReport,
  HiOutlineExclamation,
  HiOutlineThumbUp,
} from 'react-icons/hi';

const TIME_RANGE_LABELS = { week: 'Last 7 Days', month: 'Last 30 Days', quarter: 'Last 90 Days' };

function MetricRow({ icon: Icon, label, value, sub }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="w-5 h-5 text-gray-400" />}
        <span className="text-sm text-gray-600">{label}</span>
      </div>
      <div className="text-right">
        <span className="font-semibold text-gray-900">{value}</span>
        {sub && <p className="text-xs text-gray-500">{sub}</p>}
      </div>
    </div>
  );
}

export default function PerformanceDetailsModal({ isOpen, onClose, user, timeRange = 'week' }) {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !user?.id) return;
    setLoading(true);
    setDetails(null);
    performanceApi
      .getPerformanceDetails(user.id, timeRange)
      .then((res) => setDetails(res?.data ?? res))
      .catch(() => setDetails(null))
      .finally(() => setLoading(false));
  }, [isOpen, user?.id, timeRange]);

  if (!isOpen) return null;

  const d = details;
  const metrics = d?.user?.metrics;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Performance Details" size="xl">
      <div className="space-y-6">
        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : !d ? (
          <p className="text-gray-500 text-center py-8">Failed to load details</p>
        ) : (
          <>
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
              <Avatar name={d.user?.fullName} size="lg" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{d.user?.fullName}</h3>
                <p className="text-sm text-gray-500">{d.user?.email}</p>
                <p className="text-sm text-gray-500 mt-1">{TIME_RANGE_LABELS[timeRange] || timeRange}</p>
              </div>
              {metrics && (
                <div className={`ml-auto px-4 py-2 rounded-xl font-bold text-lg ${
                  (metrics.overallScore >= 80 && 'text-emerald-600 bg-emerald-50') ||
                  (metrics.overallScore >= 60 && 'text-amber-600 bg-amber-50') ||
                  'text-red-600 bg-red-50'
                }`}>
                  {metrics.overallScore}% Overall
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <HiOutlineClipboardList className="w-5 h-5" />
                  Cases & Tasks
                </h4>
                <div className="space-y-0">
                  <MetricRow icon={HiOutlineClipboardList} label="Assigned" value={d.casesAssigned ?? 0} />
                  <MetricRow label="Active" value={d.casesActive ?? 0} />
                  <MetricRow label="Completed" value={d.casesCompleted ?? 0} />
                  <MetricRow label="Overdue Tasks" value={d.overdueTasks ?? 0} />
                  <MetricRow label="Tasks Completed" value={d.tasksCompleted ?? 0} />
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <HiOutlineDocumentReport className="w-5 h-5" />
                  Reports & Interventions
                </h4>
                <div className="space-y-0">
                  <MetricRow label="Reports" value={`${d.reportsSubmitted ?? 0} / ${d.reportsExpected ?? 0}`} sub={`${d.reportSubmissionRate ?? 0}% on time`} />
                  <MetricRow label="Interventions Completed" value={d.interventionsCompleted ?? 0} />
                  <MetricRow label="Success Rate" value={`${d.interventionSuccessRate ?? 0}%`} />
                  <MetricRow label="Avg Response" value={`${(d.avgResponseHours ?? 0).toFixed(1)} hrs`} />
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <HiOutlineUsers className="w-5 h-5" />
                  Beneficiaries
                </h4>
                <MetricRow label="Registered (period)" value={d.beneficiariesRegistered ?? 0} />
                <MetricRow label="Total Managed" value={d.totalBeneficiaries ?? 0} />
              </div>
            </div>

            {d.trendData?.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Performance Trend</h4>
                <div className="flex items-end gap-1 h-24">
                  {d.trendData.slice(-14).map((t, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-indigo-100 rounded-t min-h-[4px]"
                      style={{ height: `${Math.max(4, (t.value || 0))}%` }}
                      title={`${t.date}: ${t.value}%`}
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <HiOutlineExclamation className="w-5 h-5 text-amber-500" />
                  Warning History
                </h4>
                {!d.warningHistory?.length ? (
                  <p className="text-sm text-gray-500">No warnings issued</p>
                ) : (
                  <ul className="space-y-2">
                    {d.warningHistory.map((w) => (
                      <li key={w.id} className="text-sm p-2 bg-amber-50 rounded-lg">
                        <span className="font-medium">{w.warningType?.replace(/_/g, ' ')}</span>
                        <p className="text-gray-600 truncate">{w.message}</p>
                        <p className="text-xs text-gray-400">{w.createdAt}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <HiOutlineThumbUp className="w-5 h-5 text-emerald-500" />
                  Compliment History
                </h4>
                {!d.complimentHistory?.length ? (
                  <p className="text-sm text-gray-500">No compliments yet</p>
                ) : (
                  <ul className="space-y-2">
                    {d.complimentHistory.map((w) => (
                      <li key={w.id} className="text-sm p-2 bg-emerald-50 rounded-lg">
                        <p className="text-gray-700 truncate">{w.message}</p>
                        <p className="text-xs text-gray-400">{w.createdAt}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
