import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { userApi } from '../../api/userApi';
import { usePagination } from '../../hooks/usePagination';
import { useSearch } from '../../hooks/useSearch';
import Table from '../../components/common/Table';
import Pagination from '../../components/common/Pagination';
import SearchBar from '../../components/common/SearchBar';
import Button from '../../components/common/Button';
import PageHeader from '../../components/layout/PageHeader';
import RoleBadge from '../../components/shared/RoleBadge';
import StatusBadge from '../../components/shared/StatusBadge';
import UserAvatar from '../../components/shared/UserAvatar';
import Modal from '../../components/common/Modal';
import { formatDate } from '../../utils/formatDate';
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineEye, HiOutlineUsers } from 'react-icons/hi';

export default function UserManagementPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState(null);
  const { keyword, debouncedKeyword, handleSearch } = useSearch();
  const pagination = usePagination();

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = debouncedKeyword
        ? await userApi.search({ keyword: debouncedKeyword, page: pagination.page, size: pagination.size })
        : await userApi.getAll({ page: pagination.page, size: pagination.size });
      const data = res?.data;
      setUsers(data?.content || []);
      pagination.updateFromResponse(data);
    } catch {
      toast.error('Failed to load users');
    } finally { setLoading(false); }
  }, [debouncedKeyword, pagination.page, pagination.size]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleDelete = async () => {
    if (!deleteModal) return;
    try {
      await userApi.remove(deleteModal.id);
      toast.success('User deleted');
      setDeleteModal(null);
      fetchUsers();
    } catch { toast.error('Failed to delete user'); }
  };

  const columns = [
    {
      key: 'avatar',
      header: '',
      render: (_, row) => (
        <UserAvatar user={row} size="sm" />
      ),
      width: '48px',
    },
    { key: 'fullName', header: 'Name', render: (val) => <span className="font-medium text-gray-900">{val}</span> },
    { key: 'email', header: 'Email' },
    {
      key: 'district',
      header: 'District',
      render: (_, row) => (
        <span className="text-gray-600 text-sm">
          {row.assignedDistrict || row.district || '—'}
        </span>
      ),
    },
    { key: 'role', header: 'Role', render: (val) => <RoleBadge role={val} /> },
    { key: 'active', header: 'Status', render: (val) => <StatusBadge status={val !== false ? 'ACTIVE' : 'CLOSED'} /> },
    { key: 'createdAt', header: 'Created', render: (val) => formatDate(val) },
    {
      key: 'actions', header: 'Actions',
      render: (_, row) => (
        <div className="flex items-center gap-1">
          <button onClick={(e) => { e.stopPropagation(); navigate(`/admin/users/${row.id}`); }}
            className="p-1.5 hover:bg-blue-50 rounded-lg transition-colors"><HiOutlineEye className="w-4 h-4 text-blue-600" /></button>
          <button onClick={(e) => { e.stopPropagation(); navigate(`/admin/users/${row.id}/edit`); }}
            className="p-1.5 hover:bg-yellow-50 rounded-lg transition-colors"><HiOutlinePencil className="w-4 h-4 text-yellow-600" /></button>
          <button onClick={(e) => { e.stopPropagation(); setDeleteModal(row); }}
            className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"><HiOutlineTrash className="w-4 h-4 text-red-500" /></button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        badge="User Management"
        badgeIcon={HiOutlineUsers}
        title="User Management"
        subtitle="Manage all system users"
        action={<Link to="/admin/users/create"><Button variant="header" icon={HiOutlinePlus}>Add User</Button></Link>}
      />
      <div className="bg-white rounded-2xl border border-gray-100 shadow-md p-6">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <SearchBar value={keyword} onChange={handleSearch} placeholder="Search users..." className="flex-1 max-w-sm" />
          </div>
          <Table columns={columns} data={users} loading={loading} onRowClick={(row) => navigate(`/admin/users/${row.id}`)} emptyMessage="No users found." />
          {!loading && users.length > 0 && (
            <Pagination page={pagination.page} totalPages={pagination.totalPages} totalElements={pagination.totalElements} onPageChange={pagination.goToPage} className="mt-4" />
          )}
      </div>

      <Modal isOpen={!!deleteModal} onClose={() => setDeleteModal(null)} title="Delete User"
        footer={<><Button variant="ghost" onClick={() => setDeleteModal(null)}>Cancel</Button><Button variant="danger" onClick={handleDelete}>Delete</Button></>}
      >
        <p className="text-gray-600">Are you sure you want to delete <span className="font-semibold">{deleteModal?.fullName}</span>?</p>
      </Modal>
    </div>
  );
}
