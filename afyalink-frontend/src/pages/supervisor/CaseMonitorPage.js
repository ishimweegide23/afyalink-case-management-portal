import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { caseApi } from '../../api/caseApi';
import { userApi } from '../../api/userApi';
import { useNotifications } from '../../context/NotificationContext';
import { usePagination } from '../../hooks/usePagination';
import { useSearch } from '../../hooks/useSearch';
import { CASE_STATUSES, CASE_PRIORITIES, USER_ROLES } from '../../utils/constants';
import { formatDate, formatRelativeTime } from '../../utils/formatDate';
import Table from '../../components/common/Table';
import Pagination from '../../components/common/Pagination';
import SearchBar from '../../components/common/SearchBar';
import StatusBadge from '../../components/shared/StatusBadge';
import PriorityBadge from '../../components/shared/PriorityBadge';
import Modal from '../../components/common/Modal';
import PageHeader from '../../components/layout/PageHeader';
import Button from '../../components/common/Button';
import Spinner from '../../components/common/Spinner';
import Avatar from '../../components/shared/Avatar';
import {
  HiOutlineChartBar,
  HiOutlineFolder,
  HiOutlineFolderOpen,
  HiOutlineClipboardCheck,
  HiOutlineExclamation,
  HiOutlineEye,
  HiOutlineUserAdd,
  HiOutlineSearch,
  HiOutlineFilter,
  HiOutlineRefresh,
  HiOutlineCalendar,
  HiOutlineSwitchHorizontal,
  HiOutlineX,
  HiOutlineLightningBolt,
  HiOutlineBan,
  HiOutlineLockClosed,
} from 'react-icons/hi';

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses', icon: HiOutlineFolder, color: 'text-gray-500' },
  { value: CASE_STATUSES.OPEN, label: 'Open', icon: HiOutlineFolderOpen, color: 'text-blue-500' },
  { value: CASE_STATUSES.IN_PROGRESS, label: 'In Progress', icon: HiOutlineLightningBolt, color: 'text-amber-500' },
  { value: CASE_STATUSES.CLOSED, label: 'Closed', icon: HiOutlineClipboardCheck, color: 'text-emerald-500' },
];

const PRIORITY_OPTIONS = [
  { value: '', label: 'All' },
  { value: CASE_PRIORITIES.HIGH, label: 'High' },
  { value: CASE_PRIORITIES.MEDIUM, label: 'Medium' },
  { value: CASE_PRIORITIES.LOW, label: 'Low' },
];

function StatCard({ icon: Icon, label, value, color, bgColor, borderColor }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl border ${borderColor || 'border-gray-100'} bg-white p-5 shadow-sm hover:shadow-md transition-shadow`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div className={`w-12 h-12 rounded-2xl ${bgColor || 'bg-gray-50'} flex items-center justify-center`}>
          <Icon className={`w-6 h-6 ${color || 'text-gray-400'}`} />
        </div>
      </div>
      <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${color?.replace('text-', 'from-') || 'from-gray-200'} to-transparent opacity-40`} />
    </div>
  );
}

export default function CaseMonitorPage() {
  const { refresh: refreshNotifs } = useNotifications();
  const navigate = useNavigate();
  const [cases, setCases] = useState([]);
  const [allCasesRaw, setAllCasesRaw] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const { keyword, debouncedKeyword, handleSearch, clearSearch } = useSearch();
  const pagination = usePagination();

  const [socialWorkers, setSocialWorkers] = useState([]);
  const [loadingSW, setLoadingSW] = useState(false);

  const [assignModal, setAssignModal] = useState({ open: false, caseData: null });
  const [assignForm, setAssignForm] = useState({ socialWorkerId: '', priority: '', dueDate: '', note: '' });
  const [assigning, setAssigning] = useState(false);
  const [swSearch, setSwSearch] = useState('');

  const [closeModal, setCloseModal] = useState({ open: false, caseData: null });
  const [closeNote, setCloseNote] = useState('');
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    (async () => {
      setLoadingSW(true);
      try {
        const res = await userApi.getByRole(USER_ROLES.SOCIAL_WORKER, { page: 0, size: 200 });
        const raw = res?.data ?? res;
        setSocialWorkers(raw?.content || (Array.isArray(raw) ? raw : []));
      } catch { setSocialWorkers([]); }
      finally { setLoadingSW(false); }
    })();
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: pagination.page, size: pagination.size, sortBy: 'updatedAt', direction: 'DESC' };
      let res;
      if (debouncedKeyword) {
        res = await caseApi.search({ keyword: debouncedKeyword, ...params });
      } else if (statusFilter) {
        res = await caseApi.getByStatus(statusFilter, params);
      } else {
        res = await caseApi.getAll(params);
      }
      const d = res?.data ?? res;
      setCases(d?.content || []);
      pagination.updateFromResponse(d);
    } catch {
      toast.error('Failed to load cases');
    } finally {
      setLoading(false);
    }
  }, [debouncedKeyword, statusFilter, pagination.page, pagination.size]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    (async () => {
      try {
        const res = await caseApi.getAll({ page: 0, size: 500 });
        const d = res?.data ?? res;
        setAllCasesRaw(d?.content || []);
      } catch { /* silent */ }
    })();
  }, []);

  const stats = useMemo(() => {
    const src = allCasesRaw.length > 0 ? allCasesRaw : cases;
    return {
      total: src.length,
      open: src.filter((c) => c.status === CASE_STATUSES.OPEN).length,
      inProgress: src.filter((c) => c.status === CASE_STATUSES.IN_PROGRESS).length,
      closed: src.filter((c) => c.status === CASE_STATUSES.CLOSED).length,
      high: src.filter((c) => c.priority === CASE_PRIORITIES.HIGH).length,
      unassigned: src.filter((c) => !c.assignedSocialWorker && !c.assignedSocialWorkerId).length,
    };
  }, [allCasesRaw, cases]);

  const filteredCases = useMemo(() => {
    if (!priorityFilter) return cases;
    return cases.filter((c) => c.priority === priorityFilter);
  }, [cases, priorityFilter]);

  /* ---- Assign / Reassign ---- */
  const openAssignModal = (caseData) => {
    setAssignForm({
      socialWorkerId: caseData.assignedSocialWorker?.id || caseData.assignedSocialWorkerId || '',
      priority: caseData.priority || CASE_PRIORITIES.MEDIUM,
      dueDate: caseData.nextFollowUpDate ? String(caseData.nextFollowUpDate).split('T')[0] : '',
      note: '',
    });
    setSwSearch('');
    setAssignModal({ open: true, caseData });
  };

  const handleAssign = async () => {
    if (!assignForm.socialWorkerId) {
      toast.error('Please select a social worker');
      return;
    }
    setAssigning(true);
    try {
      const payload = {
        title: assignModal.caseData.title,
        description: assignModal.caseData.description,
        status: assignModal.caseData.status,
        priority: assignForm.priority,
        assignedSocialWorkerId: Number(assignForm.socialWorkerId),
        beneficiaryId: assignModal.caseData.beneficiaryId || assignModal.caseData.beneficiary?.id,
      };
      if (assignForm.dueDate) payload.nextFollowUpDate = assignForm.dueDate;
      if (assignForm.note) payload.assignmentNote = assignForm.note;

      await caseApi.update(assignModal.caseData.id, payload);

      const swName = socialWorkers.find((sw) => String(sw.id) === String(assignForm.socialWorkerId))?.fullName || 'Social worker';
      toast.success(`Case assigned to ${swName}`);
      setAssignModal({ open: false, caseData: null });

      fetchData();
      refreshNotifs();

      try {
        const res = await caseApi.getAll({ page: 0, size: 500 });
        setAllCasesRaw((res?.data ?? res)?.content || []);
      } catch { /* silent */ }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to assign case');
    } finally {
      setAssigning(false);
    }
  };

  /* ---- Close Case ---- */
  const openCloseModal = (caseData) => {
    setCloseNote('');
    setCloseModal({ open: true, caseData });
  };

  const handleCloseCase = async () => {
    setClosing(true);
    try {
      const payload = {
        title: closeModal.caseData.title,
        description: closeModal.caseData.description,
        status: CASE_STATUSES.CLOSED,
        priority: closeModal.caseData.priority,
        assignedSocialWorkerId: closeModal.caseData.assignedSocialWorker?.id || closeModal.caseData.assignedSocialWorkerId,
        beneficiaryId: closeModal.caseData.beneficiaryId || closeModal.caseData.beneficiary?.id,
      };
      if (closeNote) payload.closingNote = closeNote;

      await caseApi.update(closeModal.caseData.id, payload);
      toast.success('Case closed successfully');
      setCloseModal({ open: false, caseData: null });

      fetchData();
      refreshNotifs();

      try {
        const res = await caseApi.getAll({ page: 0, size: 500 });
        setAllCasesRaw((res?.data ?? res)?.content || []);
      } catch { /* silent */ }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to close case');
    } finally {
      setClosing(false);
    }
  };

  /* ---- Social Worker helpers ---- */
  const filteredSW = useMemo(() => {
    if (!swSearch.trim()) return socialWorkers;
    const q = swSearch.toLowerCase();
    return socialWorkers.filter((sw) =>
      (sw.fullName || '').toLowerCase().includes(q) || (sw.email || '').toLowerCase().includes(q)
    );
  }, [socialWorkers, swSearch]);

  const selectedSW = socialWorkers.find((sw) => String(sw.id) === String(assignForm.socialWorkerId));

  const swCaseCount = useMemo(() => {
    const counts = {};
    const src = allCasesRaw.length > 0 ? allCasesRaw : cases;
    src.forEach((c) => {
      const id = c.assignedSocialWorker?.id || c.assignedSocialWorkerId;
      if (id) counts[id] = (counts[id] || 0) + 1;
    });
    return counts;
  }, [allCasesRaw, cases]);

  /* ---- Table columns ---- */
  const columns = [
    {
      key: 'title',
      header: 'Case',
      render: (v, row) => (
        <div className="min-w-0">
          <p className="font-semibold text-gray-900 truncate text-sm">{v || 'Untitled'}</p>
          <div className="flex items-center gap-2 mt-0.5">
            {row.caseNumber && (
              <span className="text-[10px] font-mono text-gray-400">{row.caseNumber}</span>
            )}
            {row.beneficiaryName && (
              <span className="text-[11px] text-gray-500">{row.beneficiaryName}</span>
            )}
          </div>
        </div>
      ),
    },
    { key: 'status', header: 'Status', render: (v) => <StatusBadge status={v} /> },
    { key: 'priority', header: 'Priority', render: (v) => <PriorityBadge priority={v} /> },
    {
      key: 'assignedSocialWorker',
      header: 'Assigned To',
      render: (sw) => {
        const name = sw?.fullName || sw?.email;
        if (!name) return (
          <span className="inline-flex items-center gap-1 text-[11px] text-amber-600 bg-amber-50 px-2 py-1 rounded-lg font-medium">
            <HiOutlineExclamation className="w-3.5 h-3.5" /> Unassigned
          </span>
        );
        return (
          <div className="flex items-center gap-2">
            <Avatar name={name} size="xs" />
            <span className="text-sm text-gray-700 truncate">{name}</span>
          </div>
        );
      },
    },
    {
      key: 'dueDate',
      header: 'Due Date',
      render: (v, row) => {
        const dateVal = v || row.nextFollowUpDate;
        if (!dateVal) return <span className="text-xs text-gray-400">—</span>;
        const isOverdue = new Date(dateVal) < new Date() && row.status !== CASE_STATUSES.CLOSED;
        return (
          <span className={`text-xs font-medium ${isOverdue ? 'text-red-600' : 'text-gray-600'}`}>
            {formatDate(dateVal)}
            {isOverdue && <span className="ml-1 text-[10px] text-red-500">(overdue)</span>}
          </span>
        );
      },
    },
    {
      key: 'updatedAt',
      header: 'Last Update',
      render: (v) => <span className="text-xs text-gray-500">{v ? formatRelativeTime(v) : '—'}</span>,
    },
    {
      key: 'actions',
      header: '',
      render: (_, row) => (
        <div className="flex items-center gap-0.5">
          <button
            onClick={(e) => { e.stopPropagation(); navigate(`/supervisor/cases/${row.id}`); }}
            className="p-2 rounded-lg hover:bg-primary-50 text-gray-400 hover:text-primary transition-colors"
            title="View details"
          >
            <HiOutlineEye className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); openAssignModal(row); }}
            className="p-2 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors"
            title={row.assignedSocialWorker ? 'Reassign case' : 'Assign case'}
          >
            {row.assignedSocialWorker ? (
              <HiOutlineSwitchHorizontal className="w-4 h-4" />
            ) : (
              <HiOutlineUserAdd className="w-4 h-4" />
            )}
          </button>
          {row.status !== CASE_STATUSES.CLOSED && (
            <button
              onClick={(e) => { e.stopPropagation(); openCloseModal(row); }}
              className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
              title="Close case"
            >
              <HiOutlineLockClosed className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        badge="Case Monitor"
        badgeIcon={HiOutlineChartBar}
        title="Case Monitor"
        subtitle="Monitor, assign, and manage all cases"
        action={
          <button
            onClick={() => { clearSearch(); setStatusFilter(''); setPriorityFilter(''); }}
            className="p-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white transition-colors"
            title="Refresh"
          >
            <HiOutlineRefresh className="w-5 h-5" />
          </button>
        }
      />
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard icon={HiOutlineFolder} label="Total" value={stats.total} color="text-primary" bgColor="bg-primary-50" borderColor="border-primary-100" />
        <StatCard icon={HiOutlineFolderOpen} label="Open" value={stats.open} color="text-blue-500" bgColor="bg-blue-50" borderColor="border-blue-100" />
        <StatCard icon={HiOutlineLightningBolt} label="In Progress" value={stats.inProgress} color="text-amber-500" bgColor="bg-amber-50" borderColor="border-amber-100" />
        <StatCard icon={HiOutlineClipboardCheck} label="Closed" value={stats.closed} color="text-emerald-500" bgColor="bg-emerald-50" borderColor="border-emerald-100" />
        <StatCard icon={HiOutlineExclamation} label="High Priority" value={stats.high} color="text-red-500" bgColor="bg-red-50" borderColor="border-red-100" />
        <StatCard icon={HiOutlineUserAdd} label="Unassigned" value={stats.unassigned} color="text-violet-500" bgColor="bg-violet-50" borderColor="border-violet-100" />
      </div>

      {/* Main card */}
      <div className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-md">
        {/* Toolbar */}
        <div className="px-6 py-4 border-b border-gray-50 bg-white">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-3 flex-1">
              <SearchBar value={keyword} onChange={handleSearch} placeholder="Search by title, beneficiary, case number..." className="flex-1 max-w-md" />
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                  showFilters || statusFilter || priorityFilter
                    ? 'bg-primary-50 border-primary-200 text-primary'
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <HiOutlineFilter className="w-4 h-4" />
                Filters
                {(statusFilter || priorityFilter) && (
                  <span className="w-5 h-5 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {(statusFilter ? 1 : 0) + (priorityFilter ? 1 : 0)}
                  </span>
                )}
              </button>
            </div>
            {!loading && (
              <p className="text-sm text-gray-500">
                <span className="font-semibold text-gray-700">{pagination.totalElements}</span> case{pagination.totalElements !== 1 ? 's' : ''}
              </p>
            )}
          </div>

          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Status:</span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {STATUS_OPTIONS.map((opt) => {
                    const IconS = opt.icon;
                    const isActive = statusFilter === opt.value;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => { setStatusFilter(opt.value); pagination.goToPage(0); }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          isActive ? 'bg-primary text-white shadow-sm' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        <IconS className={`w-3.5 h-3.5 ${isActive ? 'text-white' : opt.color}`} />
                        {opt.label}
                      </button>
                    );
                  })}
                </div>

                <div className="w-px h-6 bg-gray-200 mx-1" />

                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Priority:</span>
                <div className="flex items-center gap-1.5">
                  {PRIORITY_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setPriorityFilter(opt.value)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        priorityFilter === opt.value ? 'bg-primary text-white shadow-sm' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                {(statusFilter || priorityFilter) && (
                  <>
                    <div className="w-px h-6 bg-gray-200 mx-1" />
                    <button
                      onClick={() => { setStatusFilter(''); setPriorityFilter(''); }}
                      className="text-xs text-red-500 hover:text-red-700 font-semibold flex items-center gap-1"
                    >
                      <HiOutlineX className="w-3.5 h-3.5" /> Clear
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="p-6">
          <Table
            columns={columns}
            data={filteredCases}
            loading={loading}
            emptyMessage="No cases found matching your criteria."
            onRowClick={(row) => navigate(`/supervisor/cases/${row.id}`)}
          />
          {!loading && filteredCases.length > 0 && (
            <Pagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              totalElements={pagination.totalElements}
              onPageChange={pagination.goToPage}
              className="mt-6"
            />
          )}
        </div>
      </div>

      {/* ===== Assign / Reassign Modal ===== */}
      <Modal
        isOpen={assignModal.open}
        onClose={() => setAssignModal({ open: false, caseData: null })}
        title={assignModal.caseData?.assignedSocialWorker ? 'Reassign Case' : 'Assign Case'}
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setAssignModal({ open: false, caseData: null })}>Cancel</Button>
            <Button onClick={handleAssign} disabled={assigning || !assignForm.socialWorkerId}>
              {assigning ? <><Spinner size="xs" className="mr-2" /> Assigning...</> : (assignModal.caseData?.assignedSocialWorker ? 'Reassign' : 'Assign')}
            </Button>
          </>
        }
      >
        {assignModal.caseData && (
          <div className="space-y-5">
            {/* Case preview */}
            <div className="rounded-xl bg-gradient-to-r from-slate-50 to-gray-50 border border-gray-100 p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
                  <HiOutlineFolder className="w-5 h-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-gray-900 text-sm">{assignModal.caseData.title}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {assignModal.caseData.caseNumber && (
                      <span className="text-[11px] font-mono text-gray-500 bg-white px-2 py-0.5 rounded border border-gray-200">{assignModal.caseData.caseNumber}</span>
                    )}
                    <StatusBadge status={assignModal.caseData.status} />
                  </div>
                  {assignModal.caseData.beneficiaryName && (
                    <p className="text-xs text-gray-500 mt-1.5">Beneficiary: <span className="font-medium text-gray-700">{assignModal.caseData.beneficiaryName}</span></p>
                  )}
                  {assignModal.caseData.assignedSocialWorker && (
                    <p className="text-xs text-gray-500 mt-1">Currently assigned: <span className="font-medium text-amber-600">{assignModal.caseData.assignedSocialWorker.fullName || assignModal.caseData.assignedSocialWorker.email}</span></p>
                  )}
                </div>
              </div>
            </div>

            {/* Social Worker Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {assignModal.caseData.assignedSocialWorker ? 'Reassign to Social Worker' : 'Select Social Worker'}
              </label>
              {selectedSW ? (
                <div className="flex items-center justify-between p-3 rounded-xl border-2 border-primary-200 bg-primary-50/30">
                  <div className="flex items-center gap-3">
                    <Avatar name={selectedSW.fullName} size="sm" />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{selectedSW.fullName}</p>
                      <p className="text-[11px] text-gray-500">{selectedSW.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {swCaseCount[selectedSW.id] != null && (
                      <span className="text-[10px] font-semibold text-gray-500 bg-white px-2 py-0.5 rounded-full border border-gray-200">
                        {swCaseCount[selectedSW.id] || 0} active case{(swCaseCount[selectedSW.id] || 0) !== 1 ? 's' : ''}
                      </span>
                    )}
                    <button
                      onClick={() => setAssignForm((f) => ({ ...f, socialWorkerId: '' }))}
                      className="p-1.5 rounded-lg hover:bg-white text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <HiOutlineX className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="relative mb-2">
                    <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={swSearch}
                      onChange={(e) => setSwSearch(e.target.value)}
                      placeholder="Search social workers by name or email..."
                      className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    />
                  </div>
                  <div className="max-h-48 overflow-y-auto rounded-xl border border-gray-200 divide-y divide-gray-50">
                    {loadingSW ? (
                      <div className="flex items-center justify-center py-6"><Spinner size="sm" /></div>
                    ) : filteredSW.length === 0 ? (
                      <div className="py-6 text-center text-sm text-gray-500">No social workers found</div>
                    ) : (
                      filteredSW.map((sw) => (
                        <button
                          key={sw.id}
                          onClick={() => setAssignForm((f) => ({ ...f, socialWorkerId: sw.id }))}
                          className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-primary-50/50 transition-colors"
                        >
                          <Avatar name={sw.fullName} size="sm" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{sw.fullName}</p>
                            <p className="text-[11px] text-gray-500 truncate">{sw.email}</p>
                          </div>
                          <span className="text-[10px] font-medium text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full flex-shrink-0">
                            {swCaseCount[sw.id] || 0} cases
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Priority</label>
              <div className="flex items-center gap-2">
                {Object.values(CASE_PRIORITIES).map((p) => {
                  const isActive = assignForm.priority === p;
                  const colors = {
                    HIGH: isActive ? 'bg-red-500 text-white border-red-500 shadow-red-200' : 'border-gray-200 text-gray-600 hover:border-red-200 hover:bg-red-50',
                    MEDIUM: isActive ? 'bg-amber-500 text-white border-amber-500 shadow-amber-200' : 'border-gray-200 text-gray-600 hover:border-amber-200 hover:bg-amber-50',
                    LOW: isActive ? 'bg-emerald-500 text-white border-emerald-500 shadow-emerald-200' : 'border-gray-200 text-gray-600 hover:border-emerald-200 hover:bg-emerald-50',
                  };
                  return (
                    <button
                      key={p}
                      onClick={() => setAssignForm((f) => ({ ...f, priority: p }))}
                      className={`flex-1 py-2.5 text-sm font-semibold rounded-xl border-2 transition-all ${isActive ? 'shadow-sm' : ''} ${colors[p]}`}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Due Date</label>
              <div className="relative">
                <HiOutlineCalendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  type="date"
                  value={assignForm.dueDate}
                  onChange={(e) => setAssignForm((f) => ({ ...f, dueDate: e.target.value }))}
                  className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>
            </div>

            {/* Note */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Note <span className="text-gray-400 font-normal">(optional)</span></label>
              <textarea
                value={assignForm.note}
                onChange={(e) => setAssignForm((f) => ({ ...f, note: e.target.value }))}
                placeholder="Add instructions or context for the social worker"
                rows={3}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
              />
            </div>

            <div className="rounded-xl bg-blue-50/50 border border-blue-100 px-4 py-3">
              <p className="text-xs text-blue-600">
                The assignee will receive a notification and the case will appear in their dashboard.
              </p>
            </div>
          </div>
        )}
      </Modal>

      {/* ===== Close Case Modal ===== */}
      <Modal
        isOpen={closeModal.open}
        onClose={() => setCloseModal({ open: false, caseData: null })}
        title="Close Case"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setCloseModal({ open: false, caseData: null })}>Cancel</Button>
            <Button variant="danger" onClick={handleCloseCase} disabled={closing}>
              {closing ? <><Spinner size="xs" className="mr-2" /> Closing...</> : 'Close Case'}
            </Button>
          </>
        }
      >
        {closeModal.caseData && (
          <div className="space-y-4">
            <div className="rounded-xl bg-red-50/50 border border-red-100 p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                  <HiOutlineLockClosed className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Are you sure you want to close this case?</p>
                  <p className="text-xs text-gray-500 mt-1">This will mark <strong>{closeModal.caseData.title}</strong> as closed. The assigned social worker will be notified.</p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Closing Note <span className="text-gray-400 font-normal">(optional)</span></label>
              <textarea
                value={closeNote}
                onChange={(e) => setCloseNote(e.target.value)}
                placeholder="Reason for closing or final summary..."
                rows={3}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-300 resize-none"
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
