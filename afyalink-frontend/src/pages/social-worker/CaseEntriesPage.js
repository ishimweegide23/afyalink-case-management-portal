import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { caseEntryApi } from '../../api/caseEntryApi';
import { usePagination } from '../../hooks/usePagination';
import { useSearch } from '../../hooks/useSearch';
import Table from '../../components/common/Table';
import Pagination from '../../components/common/Pagination';
import SearchBar from '../../components/common/SearchBar';
import Button from '../../components/common/Button';
import PageHeader from '../../components/layout/PageHeader';
import StatusBadge from '../../components/shared/StatusBadge';
import { formatDate } from '../../utils/formatDate';
import { formatEnum } from '../../utils/helpers';
import { HiArrowLeft, HiOutlinePlus, HiOutlineDocumentText } from 'react-icons/hi';

export default function CaseEntriesPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const { keyword, debouncedKeyword, handleSearch } = useSearch();
  const pagination = usePagination();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = debouncedKeyword
        ? await caseEntryApi.search(id, { keyword: debouncedKeyword, page: pagination.page, size: pagination.size })
        : await caseEntryApi.getAll(id, { page: pagination.page, size: pagination.size });
      const d = res?.data;
      setEntries(d?.content || []);
      pagination.updateFromResponse(d);
    } catch { toast.error('Failed to load entries'); }
    finally { setLoading(false); }
  }, [id, debouncedKeyword, pagination.page, pagination.size]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const columns = [
    { key: 'title', header: 'Title', render: (v) => <span className="font-medium text-gray-900">{v}</span> },
    { key: 'type', header: 'Type', render: (v) => <span className="text-sm">{formatEnum(v)}</span> },
    { key: 'status', header: 'Status', render: (v) => <StatusBadge status={v} /> },
    { key: 'createdAt', header: 'Date', render: (v) => formatDate(v) },
  ];

  return (
    <div className="space-y-6 pb-8">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-gray-500 hover:text-primary font-medium transition-colors">
        <HiArrowLeft className="w-4 h-4" /> Back to Case
      </button>
      <PageHeader
        badge="Case Entries"
        badgeIcon={HiOutlineDocumentText}
        title="Case Entries"
        subtitle="Notes and TASKS for this case. Create a TASK to add to-dos that appear in your Schedule."
        action={
          <Link to={`/social-worker/cases/${id}/entries/create`}>
            <Button variant="header" icon={HiOutlinePlus} size="sm">Add Entry</Button>
          </Link>
        }
      />
      <div className="bg-white rounded-2xl border border-gray-100 shadow-md p-6">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <SearchBar value={keyword} onChange={handleSearch} placeholder="Search entries..." className="flex-1 max-w-sm" />
          </div>
          <Table columns={columns} data={entries} loading={loading} emptyMessage="No entries yet. Add your first case entry." />
          {!loading && entries.length > 0 && (
            <Pagination page={pagination.page} totalPages={pagination.totalPages} totalElements={pagination.totalElements} onPageChange={pagination.goToPage} className="mt-4" />
          )}
      </div>
    </div>
  );
}
