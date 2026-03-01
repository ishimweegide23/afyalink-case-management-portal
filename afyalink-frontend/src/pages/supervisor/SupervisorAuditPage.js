import React, { useEffect, useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import { auditLogApi } from '../../api/auditLogApi';
import usePagination from '../../hooks/usePagination';
import useSearch from '../../hooks/useSearch';
import Table from '../../components/common/Table';
import Pagination from '../../components/common/Pagination';
import SearchBar from '../../components/common/SearchBar';
import { formatDateTime } from '../../utils/formatDate';
import PageHeader from '../../components/layout/PageHeader';
import { HiOutlineShieldCheck } from 'react-icons/hi';

export default function SupervisorAuditPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const { keyword, debouncedKeyword, handleSearch } = useSearch();
  const pagination = usePagination();

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = debouncedKeyword
        ? await auditLogApi.search({
            keyword: debouncedKeyword,
            page: pagination.page,
            size: pagination.size,
          })
        : await auditLogApi.getAll({
            page: pagination.page,
            size: pagination.size,
            sortBy: 'createdAt',
            direction: 'DESC',
          });
      const data = res?.data ?? res;
      setLogs(data?.content || []);
      pagination.updateFromResponse(data);
    } catch {
      toast.error('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedKeyword, pagination.page, pagination.size]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const columns = [
    { key: 'action', header: 'Action', render: (v) => <span className="font-semibold text-gray-900">{v}</span> },
    { key: 'performedByName', header: 'Performed By', render: (v, row) => v || row.userEmail || '—' },
    { key: 'objectType', header: 'Entity Type', render: (v) => v || '—' },
    { key: 'objectId', header: 'Entity ID', render: (v) => (v ? <span className="font-mono text-xs">{v}</span> : '—') },
    { key: 'createdAt', header: 'Time', render: (v) => <span className="text-gray-600 whitespace-nowrap">{formatDateTime(v)}</span> },
  ];

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        badge="Audit Trail"
        badgeIcon={HiOutlineShieldCheck}
        title="Supervisor Audit"
        subtitle="Audit trail for supervisor activities"
      />
      <div className="bg-white rounded-2xl border border-gray-100 shadow-md p-6">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <SearchBar value={keyword} onChange={handleSearch} placeholder="Search audit logs..." className="flex-1 max-w-sm" />
          </div>
          <Table
            columns={columns}
            data={logs}
            loading={loading}
            emptyMessage="No audit logs yet. Activity will appear here as users make changes."
          />
          {!loading && logs.length > 0 && (
            <Pagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              totalElements={pagination.totalElements}
              onPageChange={pagination.goToPage}
              className="mt-4"
            />
          )}
      </div>
    </div>
  );
}
