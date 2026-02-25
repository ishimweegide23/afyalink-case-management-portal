import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { interventionApi } from '../../api/interventionApi';
import { usePagination } from '../../hooks/usePagination';
import { useSearch } from '../../hooks/useSearch';
import Table from '../../components/common/Table';
import Pagination from '../../components/common/Pagination';
import SearchBar from '../../components/common/SearchBar';
import StatusBadge from '../../components/shared/StatusBadge';
import Avatar from '../../components/shared/Avatar';
import { formatDate } from '../../utils/formatDate';
import { formatEnum } from '../../utils/helpers';
import { INTERVENTION_STATUSES, INTERVENTION_TYPES } from '../../utils/constants';
import PageHeader from '../../components/layout/PageHeader';
import {
  HiOutlineClipboardList,
  HiOutlineUserGroup,
  HiOutlineUser,
  HiOutlineCalendar,
  HiOutlineRefresh,
  HiOutlineEye,
  HiOutlineClipboard,
} from 'react-icons/hi';

const STATUS_PILLS = [
  { value: '', label: 'All' },
  ...Object.values(INTERVENTION_STATUSES).map((s) => ({ value: s, label: s.replace(/_/g, ' ') })),
];

const TYPE_PILLS = [
  { value: '', label: 'All types' },
  ...Object.values(INTERVENTION_TYPES || {}).map((t) => ({ value: t, label: formatEnum(t) })),
];

function StatCard({ icon: Icon, label, value, color, bgColor }) {
  return (
    <div className={`rounded-2xl border border-gray-100 bg-white p-5 shadow-sm ${bgColor || ''}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">{label}</p>
          <p className={`text-2xl font-bold mt-1 ${color || 'text-gray-900'}`}>{value}</p>
        </div>
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${bgColor || 'bg-gray-50'}`}>
          <Icon className={`w-6 h-6 ${color || 'text-gray-400'}`} />
        </div>
      </div>
    </div>
  );
}

export default function AdminInterventionsPage() {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const { keyword, debouncedKeyword, handleSearch } = useSearch();
  const pagination = usePagination(20);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: pagination.page, size: pagination.size, sortBy: 'plannedStartDatetime', direction: 'DESC' };
      let res;
      if (debouncedKeyword) res = await interventionApi.search({ keyword: debouncedKeyword, ...params });
      else if (statusFilter) res = await interventionApi.getByStatus(statusFilter, params);
      else if (typeFilter) res = await interventionApi.getByType(typeFilter, params);
      else res = await interventionApi.getAll(params);
      const d = res?.data ?? res;
      setData(Array.isArray(d?.content) ? d.content : []);
      pagination.updateFromResponse(d);
    } catch (e) {
      toast.error('Failed to load interventions');
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedKeyword, statusFilter, typeFilter, pagination.page, pagination.size, pagination.updateFromResponse]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    interventionApi.getStats().then((r) => {
      const s = r?.data ?? r;
      setStats(s);
    }).catch(() => setStats(null));
  }, []);

  const columns = [
    {
      key: 'title',
      header: 'Intervention',
      render: (v, row) => (
        <div className="min-w-0">
          <p className="font-semibold text-gray-900 truncate text-sm">{v || 'Untitled'}</p>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            {row.interventionCode && <span className="text-[10px] font-mono text-gray-400">{row.interventionCode}</span>}
            {row.type && <span className="text-[10px] text-primary-600 bg-primary-50 px-1.5 py-0.5 rounded">{formatEnum(row.type)}</span>}
          </div>
        </div>
      ),
    },
    {
      key: 'caseNumber',
      header: 'Case',
      render: (v, row) => (
        <div className="min-w-0">
          {v ? (
            <button
              onClick={(e) => { e.stopPropagation(); navigate(`/admin/cases/${row.caseId}`); }}
              className="text-left text-sm text-primary hover:underline truncate block"
            >
              {v}
            </button>
          ) : <span className="text-xs text-gray-400">—</span>}
          {row.caseBeneficiaryName && <p className="text-[11px] text-gray-500 truncate">{row.caseBeneficiaryName}</p>}
        </div>
      ),
    },
    {
      key: 'assignedStaff',
      header: 'Staff & Supervisor',
      render: (staff, row) => {
        const list = staff || row.assignedStaff || [];
        if (list.length === 0) {
          const planned = row.plannedBy?.fullName || row.plannedBy?.email;
          if (planned) return <span className="text-sm text-gray-600">Planned by {planned}</span>;
          return <span className="text-xs text-gray-400">—</span>;
        }
        return (
          <div className="space-y-1.5">
            {list.slice(0, 3).map((s) => (
              <div key={s.id || s.userId} className="flex items-center gap-2 min-w-0">
                <Avatar name={s.userFullName} size="xs" className="flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{s.userFullName || s.userEmail}</p>
                  {s.supervisorName && <p className="text-[11px] text-gray-500 truncate">↳ {s.supervisorName}</p>}
                </div>
              </div>
            ))}
            {list.length > 3 && <p className="text-[11px] text-gray-400">+{list.length - 3} more</p>}
          </div>
        );
      },
    },
    {
      key: 'plannedBy',
      header: 'Planned By',
      render: (v) => {
        const n = v?.fullName || v?.email;
        if (!n) return <span className="text-xs text-gray-400">—</span>;
        return <div className="flex items-center gap-2"><Avatar name={n} size="xs" /><span className="text-sm text-gray-700 truncate">{n}</span></div>;
      },
    },
    { key: 'status', header: 'Status', render: (v) => <StatusBadge status={v} /> },
    {
      key: 'plannedStartDatetime',
      header: 'Scheduled',
      render: (v) => <span className="text-sm text-gray-600">{formatDate(v) || '—'}</span>,
    },
    {
      key: 'actions',
      header: '',
      render: (_, row) => (
        <button
          onClick={(e) => { e.stopPropagation(); navigate(`/admin/cases/${row.caseId}`); }}
          className="p-2 rounded-lg hover:bg-primary-50 text-gray-400 hover:text-primary transition-colors"
          title="View case"
        >
          <HiOutlineEye className="w-4 h-4" />
        </button>
      ),
    },
  ];

  const statsData = stats || {};
  const total = typeof statsData.total === 'number' ? statsData.total : data.length;

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        badge="Interventions"
        badgeIcon={HiOutlineClipboardList}
        title="All Interventions"
        subtitle="Full visibility: case, assigned staff, and their supervisors"
        action={
          <button onClick={() => fetchData()} className="p-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white transition-colors" title="Refresh">
            <HiOutlineRefresh className="w-5 h-5" />
          </button>
        }
      />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard icon={HiOutlineClipboardList} label="Total" value={stats?.total ?? '—'} color="text-primary" bgColor="bg-primary-50" />
        <StatCard icon={HiOutlineCalendar} label="Planned" value={stats?.planned ?? '—'} color="text-blue-500" bgColor="bg-blue-50" />
        <StatCard icon={HiOutlineClipboard} label="Scheduled" value={stats?.scheduled ?? '—'} color="text-amber-500" bgColor="bg-amber-50" />
        <StatCard icon={HiOutlineUserGroup} label="In Progress" value={stats?.inProgress ?? '—'} color="text-violet-500" bgColor="bg-violet-50" />
        <StatCard icon={HiOutlineUser} label="Completed" value={stats?.completed ?? '—'} color="text-emerald-500" bgColor="bg-emerald-50" />
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 flex-1">
              <SearchBar value={keyword} onChange={handleSearch} placeholder="Search interventions..." className="flex-1 max-w-md" />
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); setTypeFilter(''); pagination.goToPage(0); }}
                  className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm min-w-[140px] focus:ring-2 focus:ring-primary/30 focus:border-primary"
                >
                  {STATUS_PILLS.map((o) => <option key={o.value || 'all'} value={o.value}>{o.label}</option>)}
                </select>
                {TYPE_PILLS.length > 1 && (
                  <select
                    value={typeFilter}
                    onChange={(e) => { setTypeFilter(e.target.value); setStatusFilter(''); pagination.goToPage(0); }}
                    className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm min-w-[140px] focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  >
                    {TYPE_PILLS.map((o) => <option key={o.value || 'all'} value={o.value}>{o.label}</option>)}
                  </select>
                )}
              </div>
            </div>
            {!loading && <p className="text-sm text-gray-500"><span className="font-semibold text-gray-700">{pagination.totalElements}</span> intervention{pagination.totalElements !== 1 ? 's' : ''}</p>}
          </div>
        </div>
        <div className="p-6">
          <Table
            columns={columns}
            data={data}
            loading={loading}
            emptyMessage="No interventions found."
            onRowClick={(row) => row.caseId && navigate(`/admin/cases/${row.caseId}`)}
          />
          {!loading && data.length > 0 && (
            <Pagination page={pagination.page} totalPages={pagination.totalPages} totalElements={pagination.totalElements} onPageChange={pagination.goToPage} className="mt-6" />
          )}
        </div>
      </div>
    </div>
  );
}
