import React, { useEffect, useState, useCallback } from 'react';
import { documentApi } from '../../api/documentApi';
import { usePagination } from '../../hooks/usePagination';
import { useSearch } from '../../hooks/useSearch';
import Table from '../../components/common/Table';
import Pagination from '../../components/common/Pagination';
import SearchBar from '../../components/common/SearchBar';
import PageHeader from '../../components/layout/PageHeader';
import { formatDate } from '../../utils/formatDate';
import { formatFileSize } from '../../utils/formatFileSize';
import { HiOutlineDocument } from 'react-icons/hi';

export default function DocumentsPage() {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const { keyword, debouncedKeyword, handleSearch } = useSearch();
  const pagination = usePagination();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = debouncedKeyword
        ? await documentApi.search({ keyword: debouncedKeyword, page: pagination.page, size: pagination.size })
        : await documentApi.search({ keyword: '', page: pagination.page, size: pagination.size });
      const d = res?.data;
      setDocs(d?.content || []);
      pagination.updateFromResponse(d);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [debouncedKeyword, pagination.page, pagination.size]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const columns = [
    { key: 'fileName', header: 'File Name', render: (v) => <span className="font-medium text-gray-900">{v}</span> },
    { key: 'fileSize', header: 'Size', render: (v) => formatFileSize(v) },
    { key: 'uploadedByName', header: 'Uploaded By' },
    { key: 'createdAt', header: 'Date', render: (v) => formatDate(v) },
  ];

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        badge="Documents"
        badgeIcon={HiOutlineDocument}
        title="Documents"
        subtitle="Browse and manage uploaded documents"
      />
      <div className="bg-white rounded-2xl border border-gray-100 shadow-md p-6">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <SearchBar value={keyword} onChange={handleSearch} placeholder="Search documents..." className="flex-1 max-w-sm" />
          </div>
          <Table columns={columns} data={docs} loading={loading} emptyMessage="No documents uploaded yet." />
          {!loading && docs.length > 0 && (
            <Pagination page={pagination.page} totalPages={pagination.totalPages} totalElements={pagination.totalElements} onPageChange={pagination.goToPage} className="mt-4" />
          )}
      </div>
    </div>
  );
}
