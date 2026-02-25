import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'react-toastify';
import { auditLogApi } from '../../api/auditLogApi';
import { userApi } from '../../api/userApi';
import Table from '../../components/common/Table';
import Pagination from '../../components/common/Pagination';
import SearchBar from '../../components/common/SearchBar';
import Spinner from '../../components/common/Spinner';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import Avatar from '../../components/shared/Avatar';
import { formatDateTime, formatRelativeTime } from '../../utils/formatDate';
import {
  HiOutlineClipboardList,
  HiOutlineDownload,
  HiOutlineFilter,
  HiOutlineX,
  HiOutlineEye,
  HiOutlineUserAdd,
  HiOutlinePencilAlt,
  HiOutlineTrash,
  HiOutlineLogin,
  HiOutlineLogout,
  HiOutlineDocumentReport,
  HiOutlineInformationCircle,
  HiOutlineChevronRight,
  HiOutlineUserGroup,
  HiOutlineChartBar,
  HiOutlineRefresh,
} from 'react-icons/hi';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import ExportAuditLogsModal from '../../components/admin/ExportAuditLogsModal';

// Action type colors and icons
const ACTION_CONFIG = {
  CREATE: { color: '#10B981', icon: HiOutlineUserAdd, label: 'Created', bg: 'bg-green-100 text-green-700' },
  UPDATE: { color: '#F59E0B', icon: HiOutlinePencilAlt, label: 'Updated', bg: 'bg-amber-100 text-amber-700' },
  DELETE: { color: '#EF4444', icon: HiOutlineTrash, label: 'Deleted', bg: 'bg-red-100 text-red-700' },
  LOGIN: { color: '#3B82F6', icon: HiOutlineLogin, label: 'Login', bg: 'bg-blue-100 text-blue-700' },
  LOGOUT: { color: '#6B7280', icon: HiOutlineLogout, label: 'Logout', bg: 'bg-gray-100 text-gray-700' },
  EXPORT: { color: '#8B5CF6', icon: HiOutlineDownload, label: 'Export', bg: 'bg-purple-100 text-purple-700' },
  REPORT: { color: '#0D9488', icon: HiOutlineDocumentReport, label: 'Report', bg: 'bg-teal-100 text-teal-700' },
  DEFAULT: { color: '#6B7280', icon: HiOutlineInformationCircle, label: 'Action', bg: 'bg-gray-100 text-gray-700' },
};

// Entity type colors
const ENTITY_CONFIG = {
  USER: { icon: HiOutlineUserGroup, label: 'User' },
  BENEFICIARY: { icon: HiOutlineUserGroup, label: 'Beneficiary' },
  CASE: { icon: HiOutlineClipboardList, label: 'Case' },
  CASEENTRY: { icon: HiOutlineClipboardList, label: 'Case Entry' },
  INTERVENTION: { icon: HiOutlineChartBar, label: 'Intervention' },
  REPORT: { icon: HiOutlineDocumentReport, label: 'Report' },
  DOCUMENT: { icon: HiOutlineDocumentReport, label: 'Document' },
  MESSAGE: { icon: HiOutlineInformationCircle, label: 'Message' },
  ORGANIZATIONREPORT: { icon: HiOutlineDocumentReport, label: 'Org Report' },
  DEFAULT: { icon: HiOutlineInformationCircle, label: 'Entity' },
};

function unwrapPage(res) {
  if (res == null) return { content: [], totalPages: 0, totalElements: 0 };
  const inner = res.data !== undefined ? res.data : res;
  return {
    content: Array.isArray(inner?.content) ? inner.content : [],
    totalPages: inner?.totalPages ?? 0,
    totalElements: inner?.totalElements ?? 0,
  };
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [selectedLog, setSelectedLog] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [users, setUsers] = useState([]);
  
  // Filters
  const [filters, setFilters] = useState({
    action: '',
    entityType: '',
    userId: '',
    startDate: '',
    endDate: '',
  });
  
  const [keyword, setKeyword] = useState('');
  const [debouncedKeyword, setDebouncedKeyword] = useState('');
  const [page, setPage] = useState(0);
  const [size] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Fetch users for filter dropdown
  useEffect(() => {
    userApi.getAll({ page: 0, size: 100 })
      .then(res => {
        const data = res?.data?.content || res?.content || [];
        setUsers(Array.isArray(data) ? data : []);
      })
      .catch(() => setUsers([]));
  }, []);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedKeyword(keyword);
      setPage(0);
    }, 500);
    return () => clearTimeout(timer);
  }, [keyword]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await auditLogApi.getStats();
      setStats(res?.data ?? res);
    } catch (error) {
      console.error('Failed to fetch stats', error);
    }
  }, []);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        size,
        keyword: debouncedKeyword || undefined,
        action: filters.action || undefined,
        entityType: filters.entityType || undefined,
        userId: filters.userId || undefined,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
      };
      
      const res = await auditLogApi.getAll(params);
      const data = unwrapPage(res);
      setLogs(data.content);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
    } catch (error) {
      toast.error('Failed to load audit logs');
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [page, size, debouncedKeyword, filters]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(0);
  };

  const clearFilters = () => {
    setFilters({ action: '', entityType: '', userId: '', startDate: '', endDate: '' });
    setKeyword('');
    setPage(0);
  };

  const hasActiveFilters = Object.values(filters).some(v => v);
  const activeFilterCount = Object.values(filters).filter(v => v).length;

  const getActionConfig = (action) => {
    return ACTION_CONFIG[action] || ACTION_CONFIG.DEFAULT;
  };

  const getEntityConfig = (entityType) => {
    if (!entityType) return ENTITY_CONFIG.DEFAULT;
    const key = entityType.toUpperCase().replace(/[^A-Z]/g, '');
    return ENTITY_CONFIG[key] || { ...ENTITY_CONFIG.DEFAULT, label: entityType };
  };

  // Prepare chart data
  const actionDistribution = useMemo(() => {
    const counts = {};
    logs.forEach(log => {
      const action = log.action || 'DEFAULT';
      counts[action] = (counts[action] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({
      name: ACTION_CONFIG[name]?.label || name,
      value,
      color: ACTION_CONFIG[name]?.color || '#6B7280',
    }));
  }, [logs]);

  const columns = [
    {
      key: 'action',
      header: 'Action',
      render: (action, row) => {
        const config = getActionConfig(action);
        const Icon = config.icon;
        return (
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg ${config.bg}`}>
              <Icon className="w-3.5 h-3.5" style={{ color: config.color }} />
            </div>
            <span className="font-medium text-gray-900">{config.label}</span>
          </div>
        );
      },
    },
    {
      key: 'performedBy',
      header: 'User',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <Avatar name={row.performedByName || row.userEmail} size="sm" />
          <div>
            <p className="text-sm font-medium text-gray-900">{row.performedByName || '—'}</p>
            <p className="text-xs text-gray-400">{row.userEmail || '—'}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'objectType',
      header: 'Entity',
      render: (objectType) => {
        const config = getEntityConfig(objectType);
        const Icon = config.icon;
        return (
          <div className="flex items-center gap-1.5">
            <Icon className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-sm text-gray-600">{config.label || objectType || '—'}</span>
          </div>
        );
      },
    },
    {
      key: 'objectId',
      header: 'Entity ID',
      render: (id) => (
        <span className="font-mono text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
          {id || '—'}
        </span>
      ),
    },
    {
      key: 'details',
      header: 'Changes',
      render: (_, row) => {
        // If we have actual before/after data, show it
        if (row.oldValues && row.newValues) {
          return (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
              Modified
            </span>
          );
        }
        if (row.newValues) {
          return (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
              Created
            </span>
          );
        }
        if (row.oldValues) {
          return (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 bg-red-50 border border-red-200 px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />
              Deleted
            </span>
          );
        }
        // Derive from action type when no values stored
        const action = (row.action || '').toUpperCase();
        if (action === 'CREATE' || action === 'REGISTER') {
          return (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
              Created
            </span>
          );
        }
        if (action === 'UPDATE' || action === 'EDIT') {
          return (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
              Modified
            </span>
          );
        }
        if (action === 'DELETE' || action === 'REMOVE') {
          return (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 bg-red-50 border border-red-200 px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />
              Deleted
            </span>
          );
        }
        if (action === 'LOGIN') {
          return (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block" />
              Session
            </span>
          );
        }
        if (action === 'LOGOUT') {
          return (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-gray-400 inline-block" />
              Session
            </span>
          );
        }
        if (action === 'EXPORT') {
          return (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-purple-700 bg-purple-50 border border-purple-200 px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500 inline-block" />
              Exported
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-teal-700 bg-teal-50 border border-teal-200 px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-500 inline-block" />
            Activity
          </span>
        );
      },
    },
    {
      key: 'createdAt',
      header: 'Time',
      render: (date) => (
        <div>
          <p className="text-sm text-gray-700">{formatDateTime(date)}</p>
          <p className="text-xs text-gray-400">{formatRelativeTime(date)}</p>
        </div>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (_, row) => (
        <button
          onClick={() => {
            setSelectedLog(row);
            setShowDetailModal(true);
          }}
          className="p-1.5 rounded-lg text-gray-400 hover:text-primary hover:bg-gray-100 transition-colors"
          title="View Details"
        >
          <HiOutlineEye className="w-4 h-4" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-primary/10 shadow-xl shadow-primary/10">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary-600 to-secondary opacity-[0.97]" />
        <div
          className="absolute inset-0 opacity-[0.12] pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        <div className="relative px-6 sm:px-8 py-8 sm:py-10 text-white">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-sm text-sm font-semibold mb-3 border border-white/20">
                <HiOutlineClipboardList className="w-4 h-4" />
                Audit Logs
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight drop-shadow-sm">
                System Audit Trail
              </h1>
              <p className="mt-2 text-white/90 text-sm sm:text-base max-w-xl">
                Complete history of all system activities, user actions, and data changes
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setExportModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/20 border border-white/30 text-white hover:bg-white/30 transition-colors text-sm font-semibold"
              >
                <HiOutlineDownload className="w-4 h-4" />
                Export Logs
              </button>
              <button
                onClick={fetchLogs}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/20 border border-white/30 text-white hover:bg-white/30 transition-colors text-sm font-semibold"
              >
                <HiOutlineRefresh className="w-4 h-4" />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center hover:shadow-md transition-all">
            <p className="text-3xl font-extrabold text-primary">{stats.totalLogs?.toLocaleString() || 0}</p>
            <p className="text-xs text-gray-500 uppercase font-bold mt-1">Total Activities</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center hover:shadow-md transition-all">
            <p className="text-3xl font-extrabold text-blue-600">{stats.todayLogs || 0}</p>
            <p className="text-xs text-gray-500 uppercase font-bold mt-1">Today</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center hover:shadow-md transition-all">
            <p className="text-3xl font-extrabold text-purple-600">{stats.uniqueUsers || 0}</p>
            <p className="text-xs text-gray-500 uppercase font-bold mt-1">Active Users</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center hover:shadow-md transition-all">
            <p className="text-3xl font-extrabold text-amber-600">{stats.mostActiveEntity || '—'}</p>
            <p className="text-xs text-gray-500 uppercase font-bold mt-1">Most Active Entity</p>
          </div>
        </div>
      )}

      {/* Action Distribution Chart */}
      {actionDistribution.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <HiOutlineChartBar className="text-primary w-4 h-4" />
            Activity Distribution
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={actionDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#0D9488" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Filters Bar */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-primary transition-colors"
          >
            <HiOutlineFilter className="w-4 h-4" />
            Filters
            {activeFilterCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-xs bg-primary text-white rounded-full">
                {activeFilterCount}
              </span>
            )}
            <HiOutlineChevronRight className={`w-3 h-3 transition-transform ${showFilters ? 'rotate-90' : ''}`} />
          </button>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
            >
              <HiOutlineX className="w-3 h-3" /> Clear all
            </button>
          )}
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 pt-2">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Action Type</label>
              <select
                value={filters.action}
                onChange={(e) => handleFilterChange('action', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value="">All Actions</option>
                <option value="CREATE">Create</option>
                <option value="UPDATE">Update</option>
                <option value="DELETE">Delete</option>
                <option value="LOGIN">Login</option>
                <option value="LOGOUT">Logout</option>
                <option value="EXPORT">Export</option>
                <option value="REPORT">Report</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Entity Type</label>
              <select
                value={filters.entityType}
                onChange={(e) => handleFilterChange('entityType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value="">All Entities</option>
                <option value="USER">User</option>
                <option value="BENEFICIARY">Beneficiary</option>
                <option value="CASE">Case</option>
                <option value="INTERVENTION">Intervention</option>
                <option value="REPORT">Report</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">User</label>
              <select
                value={filters.userId}
                onChange={(e) => handleFilterChange('userId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value="">All Users</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>{user.fullName || user.email}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Start Date</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">End Date</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          </div>
        )}

        {/* Search Bar */}
        <div className="mt-4">
          <SearchBar
            value={keyword}
            onChange={setKeyword}
            placeholder="Search by user, entity, IP address, or details..."
            className="w-full"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <HiOutlineClipboardList className="w-10 h-10 text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">No audit logs found</p>
            <p className="text-sm text-gray-400 mt-1 max-w-md">
              {hasActiveFilters || keyword
                ? "Try adjusting your filters to see more results"
                : "System activities will appear here as users perform actions"}
            </p>
          </div>
        ) : (
          <>
            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
              <p className="text-sm text-gray-500">
                Showing <span className="font-semibold text-gray-700">{logs.length}</span> of{' '}
                <span className="font-semibold text-gray-700">{totalElements}</span> logs
              </p>
              <p className="text-xs text-gray-400">Real-time audit trail</p>
            </div>
            <Table columns={columns} data={logs} />
            {totalPages > 1 && (
              <div className="border-t border-gray-100 px-4 py-3">
                <Pagination
                  page={page}
                  totalPages={totalPages}
                  totalElements={totalElements}
                  onPageChange={setPage}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title="Audit Log Details"
        size="lg"
      >
        {selectedLog && (
          <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
              <div className={`p-2 rounded-xl ${getActionConfig(selectedLog.action).bg}`}>
                {React.createElement(getActionConfig(selectedLog.action).icon, {
                  className: "w-5 h-5",
                  style: { color: getActionConfig(selectedLog.action).color }
                })}
              </div>
              <div>
                <h3 className="font-bold text-gray-900">
                  {getActionConfig(selectedLog.action).label} {getEntityConfig(selectedLog.objectType).label || selectedLog.objectType || ''}
                </h3>
                <p className="text-xs text-gray-400">{formatDateTime(selectedLog.createdAt)}</p>
              </div>
            </div>

            {/* User Info */}
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Performed By</p>
              <div className="flex items-center gap-3">
                <Avatar name={selectedLog.performedByName || selectedLog.userEmail} size="md" />
                <div>
                  <p className="font-medium text-gray-900">{selectedLog.performedByName || '—'}</p>
                  <p className="text-sm text-gray-500">{selectedLog.userEmail || '—'}</p>
                  {selectedLog.ipAddress && (
                    <p className="text-xs text-gray-400 mt-1">IP: {selectedLog.ipAddress}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Entity Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Entity Type</p>
                <p className="text-gray-900">{getEntityConfig(selectedLog.objectType).label || selectedLog.objectType || '—'}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Entity ID</p>
                <code className="text-sm text-gray-900">{selectedLog.objectId || '—'}</code>
              </div>
            </div>

            {/* Changes */}
            {(selectedLog.oldValues || selectedLog.newValues) && (
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Changes</p>
                <div className="space-y-3">
                  {selectedLog.oldValues && (
                    <div>
                      <p className="text-xs font-medium text-red-600 mb-1">Before:</p>
                      <pre className="text-xs bg-white p-2 rounded border border-gray-200 overflow-x-auto whitespace-pre-wrap">
                        {selectedLog.oldValues}
                      </pre>
                    </div>
                  )}
                  {selectedLog.newValues && (
                    <div>
                      <p className="text-xs font-medium text-green-600 mb-1">After:</p>
                      <pre className="text-xs bg-white p-2 rounded border border-gray-200 overflow-x-auto whitespace-pre-wrap">
                        {selectedLog.newValues}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Additional Info */}
            {selectedLog.details && (
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Additional Info</p>
                <p className="text-sm text-gray-700">{selectedLog.details}</p>
              </div>
            )}

            <div className="flex justify-end pt-3">
              <Button variant="outline" onClick={() => setShowDetailModal(false)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Export Modal */}
      <ExportAuditLogsModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        keyword={debouncedKeyword}
        filters={filters}
      />
    </div>
  );
}