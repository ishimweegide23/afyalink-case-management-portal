// TODO: Refactor this component to use custom hooks
import React, { useState, useEffect } from 'react';
import { analyticsApi } from '../../api/analyticsApi';
import Spinner from '../../components/common/Spinner';
import Table from '../../components/common/Table';
import PageHeader from '../../components/layout/PageHeader';
import { HiOutlineUsers } from 'react-icons/hi';

export default function StaffWorkloadPage() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      setLoading(true);
      try {
        const res = await analyticsApi.getTeamSummary({ period: 'WEEKLY' });
        const data = res?.data ?? res;
        const list = data?.members;
        if (!cancelled) {
          setMembers(Array.isArray(list) ? list : []);
        }
      } catch {
        if (!cancelled) setMembers([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchData();
    return () => { cancelled = true; };
  }, []);

  const getProgressColor = (pct) => {
    if (pct == null) return 'text-gray-500';
    if (pct >= 70) return 'text-green-600 font-semibold';
    if (pct >= 40) return 'text-amber-600 font-semibold';
    return 'text-red-600 font-semibold';
  };

  const getStatusBadge = (days) => {
    if (days == null || days === undefined) return <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-700">—</span>;
    if (days <= 3) return <span className="px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-800">Active</span>;
    if (days <= 7) return <span className="px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-800">Slow</span>;
    return <span className="px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-800">Inactive</span>;
  };

  const columns = [
    { key: 'workerName', header: 'Worker Name', render: (v) => <span className="font-medium text-gray-900">{v || '—'}</span> },
    { key: 'totalActiveCases', header: 'Active Cases', render: (v) => v ?? '—' },
    { key: 'caseEntriesMade', header: 'Case Entries', render: (v) => v ?? '—' },
    { key: 'interventionsCompleted', header: 'Interventions Completed', render: (v) => v ?? '—' },
    {
      key: 'avgCaseProgress',
      header: 'Avg Progress',
      render: (v) => {
        const pct = v != null ? v.toFixed(1) : '—';
        const color = v != null ? getProgressColor(v) : 'text-gray-500';
        return <span className={color}>{pct !== '—' ? `${pct}%` : pct}</span>;
      },
    },
    {
      key: 'daysSinceLastActivity',
      header: 'Status',
      render: (v) => getStatusBadge(v),
    },
  ];

  const tableData = members.map((m) => ({ ...m, id: m.userId ?? m.workerName }));

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        badge="Staff Workload"
        badgeIcon={HiOutlineUsers}
        title="Staff Workload"
        subtitle="View and manage staff workload distribution"
      />
      <div className="bg-white rounded-2xl border border-gray-100 shadow-md p-6">
          {loading ? (
            <div className="flex justify-center py-16">
              <Spinner size="lg" />
            </div>
          ) : !members.length ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <HiOutlineUsers className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 text-sm">No team members assigned yet</p>
            </div>
          ) : (
            <Table columns={columns} data={tableData} loading={false} emptyMessage="No team members assigned yet" />
          )}
      </div>
    </div>
  );
}
