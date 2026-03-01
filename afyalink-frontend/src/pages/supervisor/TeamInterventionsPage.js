import React, { useEffect, useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import { interventionApi } from '../../api/interventionApi';
import { usePagination } from '../../hooks/usePagination';
import { useSearch } from '../../hooks/useSearch';
import Table from '../../components/common/Table';
import Pagination from '../../components/common/Pagination';
import SearchBar from '../../components/common/SearchBar';
import StatusBadge from '../../components/shared/StatusBadge';
import StatusFilter from '../../components/common/StatusFilter';
import { formatDate } from '../../utils/formatDate';
import { formatEnum } from '../../utils/helpers';
import { INTERVENTION_STATUSES } from '../../utils/constants';
import PageHeader from '../../components/layout/PageHeader';
import { HiOutlineClipboardList } from 'react-icons/hi';

export default function TeamInterventionsPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const { keyword, debouncedKeyword, handleSearch } = useSearch();
  const pagination = usePagination();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      let res;
      if (debouncedKeyword) {
        res = await interventionApi.search({ keyword: debouncedKeyword, page: pagination.page, size: pagination.size });
      } else if (statusFilter) {
        res = await interventionApi.getByStatus(statusFilter, { page: pagination.page, size: pagination.size });
      } else {
        res = await interventionApi.getAll({ page: pagination.page, size: pagination.size });
      }
      const d = res?.data;
      setData(d?.content || []);
      pagination.updateFromResponse(d);
    } catch {
      toast.error('Failed to load interventions');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedKeyword, statusFilter, pagination.page, pagination.size]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const columns = [
    { key: 'title', header: 'Title', render: (v) => <span className="font-medium text-gray-900">{v}</span> },
    { key: 'type', header: 'Type', render: (v) => <span className="text-sm">{formatEnum(v)}</span> },
    { key: 'status', header: 'Status', render: (v) => <StatusBadge status={v} /> },
    { key: 'plannedStartDatetime', header: 'Scheduled', render: (v) => formatDate(v) },
    { key: 'createdAt', header: 'Created', render: (v) => formatDate(v) },
  ];

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        badge="Team Interventions"
        badgeIcon={HiOutlineClipboardList}
        title="Team Interventions"
        subtitle="Review and monitor team intervention activities"
      />
      <div className="bg-white rounded-2xl border border-gray-100 shadow-md p-6">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <SearchBar value={keyword} onChange={handleSearch} placeholder="Search interventions..." className="flex-1 max-w-sm" />
            <StatusFilter value={statusFilter} onChange={(v) => { setStatusFilter(v); pagination.resetPage(); }}
              options={Object.values(INTERVENTION_STATUSES).map((s) => ({ value: s, label: s.replace('_', ' ') }))} />
          </div>
          <Table columns={columns} data={data} loading={loading} emptyMessage="No team interventions found." />
          {!loading && data.length > 0 && (
            <Pagination page={pagination.page} totalPages={pagination.totalPages} totalElements={pagination.totalElements} onPageChange={pagination.goToPage} className="mt-4" />
          )}
      </div>
    </div>
  );
}
