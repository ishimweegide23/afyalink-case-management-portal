import React, { useEffect, useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import { interventionApi } from '../../api/interventionApi';
import usePagination from '../../hooks/usePagination';
import useSearch from '../../hooks/useSearch';
import Table from '../../components/common/Table';
import Pagination from '../../components/common/Pagination';
import SearchBar from '../../components/common/SearchBar';
import StatusBadge from '../../components/shared/StatusBadge';
import { formatDate } from '../../utils/formatDate';
import { formatEnum } from '../../utils/helpers';
import PageHeader from '../../components/layout/PageHeader';
import { HiOutlineClipboardList } from 'react-icons/hi';

export default function InterventionReviewPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const { keyword, debouncedKeyword, handleSearch } = useSearch();
  const pagination = usePagination();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      let res;
      if (debouncedKeyword) {
        res = await interventionApi.search({
          keyword: debouncedKeyword,
          page: pagination.page,
          size: pagination.size,
        });
      } else {
        res = await interventionApi.getAll({
          page: pagination.page,
          size: pagination.size,
          sortBy: 'createdAt',
          direction: 'DESC',
        });
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
  }, [debouncedKeyword, pagination.page, pagination.size]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const columns = [
    { key: 'title', header: 'Title', render: (v) => <span className="font-medium text-gray-900">{v}</span> },
    { key: 'type', header: 'Type', render: (v) => <span className="text-sm">{formatEnum(v)}</span> },
    { key: 'status', header: 'Status', render: (v) => <StatusBadge status={v} /> },
    { key: 'plannedStartDatetime', header: 'Scheduled Date', render: (v) => formatDate(v) },
    { key: 'createdAt', header: 'Created', render: (v) => formatDate(v) },
  ];

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        badge="Intervention Review"
        badgeIcon={HiOutlineClipboardList}
        title="Intervention Review"
        subtitle="Review interventions submitted by social workers"
      />
      <div className="bg-white rounded-2xl border border-gray-100 shadow-md p-6">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <SearchBar value={keyword} onChange={handleSearch} placeholder="Search interventions..." className="flex-1 max-w-sm" />
          </div>
          <Table columns={columns} data={data} loading={loading} emptyMessage="No interventions found." />
          {!loading && data.length > 0 && (
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
