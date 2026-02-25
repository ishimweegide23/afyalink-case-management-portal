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
import UserAvatar from '../../components/shared/UserAvatar';
import {
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
  HiOutlineLockClosed,
  HiOutlineTrash,
  HiOutlinePlus,
} from 'react-icons/hi';

const STATUS_PILLS = [
  { value: '', label: 'All', icon: HiOutlineFolder, color: 'text-gray-500' },
  { value: CASE_STATUSES.OPEN, label: 'Open', icon: HiOutlineFolderOpen, color: 'text-blue-500' },
  { value: CASE_STATUSES.IN_PROGRESS, label: 'In Progress', icon: HiOutlineLightningBolt, color: 'text-amber-500' },
  { value: CASE_STATUSES.CLOSED, label: 'Closed', icon: HiOutlineClipboardCheck, color: 'text-emerald-500' },
];

const PRIORITY_PILLS = [
  { value: '', label: 'All' },
  { value: CASE_PRIORITIES.HIGH, label: 'High' },
  { value: CASE_PRIORITIES.MEDIUM, label: 'Medium' },
  { value: CASE_PRIORITIES.LOW, label: 'Low' },
];

function StatCard({ icon: Icon, label, value, color, bgColor, borderColor, onClick, active }) {
  return (
    <button onClick={onClick} type="button"
      className={`relative text-left overflow-hidden rounded-2xl border ${active ? 'border-primary ring-2 ring-primary/20' : borderColor || 'border-gray-100'} bg-white p-5 shadow-sm hover:shadow-md transition-all`}>
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
    </button>
  );
}

export default function AdminCasesPage() {
  const navigate = useNavigate();
  const { refresh: refreshNotifs } = useNotifications();
  const [cases, setCases] = useState([]);
  const [allCases, setAllCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const { keyword, debouncedKeyword, handleSearch } = useSearch();
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
  const [deleteModal, setDeleteModal] = useState({ open: false, caseData: null });
  const [deleting, setDeleting] = useState(false);

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
      if (debouncedKeyword) res = await caseApi.search({ keyword: debouncedKeyword, ...params });
      else if (statusFilter) res = await caseApi.getByStatus(statusFilter, params);
      else res = await caseApi.getAll(params);
      const d = res?.data ?? res;
      const list = Array.isArray(d?.content) ? d.content : (Array.isArray(d) ? d : []);
      setCases(list);
      pagination.updateFromResponse(d);
    } catch (e) {
      const msg = (e && typeof e === 'object' && e.message) ? e.message : (typeof e === 'string' ? e : null);
      toast.error(msg || 'Failed to load cases');
      setCases([]);
    } finally { setLoading(false); }
  }, [debouncedKeyword, statusFilter, pagination.page, pagination.size, pagination.updateFromResponse]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    (async () => {
      try { const r = await caseApi.getAll({ page: 0, size: 500 }); setAllCases((r?.data ?? r)?.content || []); } catch {}
    })();
  }, []);

  const refreshAll = useCallback(async () => {
    fetchData();
    refreshNotifs();
    try { const r = await caseApi.getAll({ page: 0, size: 500 }); setAllCases((r?.data ?? r)?.content || []); } catch {}
  }, [fetchData, refreshNotifs]);

  const stats = useMemo(() => {
    const src = allCases.length > 0 ? allCases : cases;
    return {
      total: src.length,
      open: src.filter((c) => c.status === CASE_STATUSES.OPEN).length,
      inProgress: src.filter((c) => c.status === CASE_STATUSES.IN_PROGRESS).length,
      closed: src.filter((c) => c.status === CASE_STATUSES.CLOSED).length,
      high: src.filter((c) => c.priority === CASE_PRIORITIES.HIGH).length,
      unassigned: src.filter((c) => !c.assignedSocialWorker && !c.assignedSocialWorkerId).length,
    };
  }, [allCases, cases]);

  const filteredCases = useMemo(() => {
    if (!priorityFilter) return cases;
    return cases.filter((c) => c.priority === priorityFilter);
  }, [cases, priorityFilter]);

  const swCaseCount = useMemo(() => {
    const counts = {};
    (allCases.length > 0 ? allCases : cases).forEach((c) => {
      const id = c.assignedSocialWorker?.id || c.assignedSocialWorkerId;
      if (id) counts[id] = (counts[id] || 0) + 1;
    });
    return counts;
  }, [allCases, cases]);

  const openAssignModal = (caseData) => {
    setAssignForm({
      socialWorkerId: caseData.assignedSocialWorker?.id || caseData.assignedSocialWorkerId || '',
      priority: caseData.priority || CASE_PRIORITIES.MEDIUM,
      dueDate: caseData.dueDate ? caseData.dueDate.split('T')[0] : (caseData.nextFollowUpDate ? caseData.nextFollowUpDate.split('T')[0] : ''),
      note: '',
    });
    setSwSearch('');
    setAssignModal({ open: true, caseData });
  };

  const handleAssign = async () => {
    if (!assignForm.socialWorkerId) { toast.error('Select a social worker'); return; }
    setAssigning(true);
    try {
      await caseApi.update(assignModal.caseData.id, {
        title: assignModal.caseData.title, description: assignModal.caseData.description, status: assignModal.caseData.status,
        priority: assignForm.priority, assignedSocialWorkerId: Number(assignForm.socialWorkerId),
        beneficiaryId: assignModal.caseData.beneficiaryId || assignModal.caseData.beneficiary?.id,
        ...(assignForm.dueDate ? { dueDate: assignForm.dueDate } : {}), ...(assignForm.note ? { assignmentNote: assignForm.note } : {}),
      });
      toast.success(`Case assigned to ${socialWorkers.find((s) => String(s.id) === String(assignForm.socialWorkerId))?.fullName || 'social worker'}`);
      setAssignModal({ open: false, caseData: null });
      refreshAll();
    } catch (e) { toast.error(e?.response?.data?.message || 'Failed to assign'); }
    finally { setAssigning(false); }
  };

  const openCloseModal = (d) => { setCloseNote(''); setCloseModal({ open: true, caseData: d }); };
  const handleCloseCase = async () => {
    setClosing(true);
    try {
      await caseApi.update(closeModal.caseData.id, {
        title: closeModal.caseData.title, description: closeModal.caseData.description, status: CASE_STATUSES.CLOSED,
        priority: closeModal.caseData.priority,
        assignedSocialWorkerId: closeModal.caseData.assignedSocialWorker?.id || closeModal.caseData.assignedSocialWorkerId,
        beneficiaryId: closeModal.caseData.beneficiaryId || closeModal.caseData.beneficiary?.id,
        ...(closeNote ? { closingNote: closeNote } : {}),
      });
      toast.success('Case closed'); setCloseModal({ open: false, caseData: null }); refreshAll();
    } catch (e) { toast.error(e?.response?.data?.message || 'Failed to close'); }
    finally { setClosing(false); }
  };

  const openDeleteModal = (d) => setDeleteModal({ open: true, caseData: d });
  const handleDelete = async () => {
    setDeleting(true);
    try {
      await caseApi.remove(deleteModal.caseData.id);
      toast.success('Case deleted'); setDeleteModal({ open: false, caseData: null }); refreshAll();
    } catch (e) { toast.error(e?.response?.data?.message || 'Failed to delete'); }
    finally { setDeleting(false); }
  };

  const filteredSW = useMemo(() => {
    if (!swSearch.trim()) return socialWorkers;
    const q = swSearch.toLowerCase();
    return socialWorkers.filter((s) => (s.fullName || '').toLowerCase().includes(q) || (s.email || '').toLowerCase().includes(q));
  }, [socialWorkers, swSearch]);
  const selectedSW = socialWorkers.find((s) => String(s.id) === String(assignForm.socialWorkerId));

  const handleStatClick = (status) => { setStatusFilter(status); setPriorityFilter(''); pagination.goToPage(0); };

  const columns = [
    {
      key: 'title', header: 'Case',
      render: (v, row) => (
        <div className="min-w-0">
          <p className="font-semibold text-gray-900 truncate text-sm">{v || 'Untitled'}</p>
          <div className="flex items-center gap-2 mt-0.5">
            {row.caseNumber && <span className="text-[10px] font-mono text-gray-400">{row.caseNumber}</span>}
            {row.beneficiaryName && <span className="text-[11px] text-gray-500">{row.beneficiaryName}</span>}
          </div>
        </div>
      ),
    },
    { key: 'status', header: 'Status', render: (v) => <StatusBadge status={v} /> },
    { key: 'priority', header: 'Priority', render: (v) => <PriorityBadge priority={v} /> },
    {
      key: 'assignedSocialWorker', header: 'Social Worker',
      render: (sw, row) => {
        const n = sw?.fullName || sw?.email;
        if (!n) return <span className="inline-flex items-center gap-1 text-[11px] text-amber-600 bg-amber-50 px-2 py-1 rounded-lg font-medium"><HiOutlineExclamation className="w-3.5 h-3.5" /> Unassigned</span>;
        const sup = row.assignedSocialWorkerSupervisorName;
        return (
          <div className="flex items-center gap-3 min-w-0">
            <UserAvatar user={sw} size="sm" className="flex-shrink-0 ring-2 ring-white shadow-sm" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{n}</p>
              {sup && <p className="text-[11px] text-gray-500 truncate" title={`Supervisor: ${sup}`}>↳ {sup}</p>}
            </div>
          </div>
        );
      },
    },
    {
      key: 'dueDate', header: 'Due Date',
      render: (v, row) => {
        const d = v || row.nextFollowUpDate;
        if (!d) return <span className="text-xs text-gray-400">—</span>;
        const ov = new Date(d) < new Date() && row.status !== CASE_STATUSES.CLOSED;
        return <span className={`text-xs font-medium ${ov ? 'text-red-600' : 'text-gray-600'}`}>{formatDate(d)}{ov && <span className="ml-1 text-[10px]">(overdue)</span>}</span>;
      },
    },
    { key: 'updatedAt', header: 'Last Update', render: (v) => <span className="text-xs text-gray-500">{v ? formatRelativeTime(v) : '—'}</span> },
    {
      key: 'actions', header: '',
      render: (_, row) => (
        <div className="flex items-center gap-0.5">
          <button onClick={(e) => { e.stopPropagation(); navigate(`/admin/cases/${row.id}`); }} className="p-2 rounded-lg hover:bg-primary-50 text-gray-400 hover:text-primary transition-colors" title="View"><HiOutlineEye className="w-4 h-4" /></button>
          <button onClick={(e) => { e.stopPropagation(); openAssignModal(row); }} className="p-2 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors" title={row.assignedSocialWorker ? 'Reassign' : 'Assign'}>
            {row.assignedSocialWorker ? <HiOutlineSwitchHorizontal className="w-4 h-4" /> : <HiOutlineUserAdd className="w-4 h-4" />}
          </button>
          {row.status !== CASE_STATUSES.CLOSED && <button onClick={(e) => { e.stopPropagation(); openCloseModal(row); }} className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors" title="Close"><HiOutlineLockClosed className="w-4 h-4" /></button>}
          <button onClick={(e) => { e.stopPropagation(); openDeleteModal(row); }} className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors" title="Delete"><HiOutlineTrash className="w-4 h-4" /></button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        badge="Case Management"
        badgeIcon={HiOutlineFolder}
        title="All Cases"
        subtitle="Overview of all registered cases in the system"
        action={
          <div className="flex items-center gap-2">
            <Button variant="header" onClick={() => navigate('/admin/cases/new')} className="gap-2"><HiOutlinePlus className="w-4 h-4" /> New Case</Button>
            <button onClick={refreshAll} className="p-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white transition-colors" title="Refresh"><HiOutlineRefresh className="w-5 h-5" /></button>
          </div>
        }
      />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard icon={HiOutlineFolder} label="Total" value={stats.total} color="text-primary" bgColor="bg-primary-50" borderColor="border-primary-100" onClick={() => handleStatClick('')} active={statusFilter === '' && !priorityFilter} />
        <StatCard icon={HiOutlineFolderOpen} label="Open" value={stats.open} color="text-blue-500" bgColor="bg-blue-50" borderColor="border-blue-100" onClick={() => handleStatClick(CASE_STATUSES.OPEN)} active={statusFilter === CASE_STATUSES.OPEN} />
        <StatCard icon={HiOutlineLightningBolt} label="In Progress" value={stats.inProgress} color="text-amber-500" bgColor="bg-amber-50" borderColor="border-amber-100" onClick={() => handleStatClick(CASE_STATUSES.IN_PROGRESS)} active={statusFilter === CASE_STATUSES.IN_PROGRESS} />
        <StatCard icon={HiOutlineClipboardCheck} label="Closed" value={stats.closed} color="text-emerald-500" bgColor="bg-emerald-50" borderColor="border-emerald-100" onClick={() => handleStatClick(CASE_STATUSES.CLOSED)} active={statusFilter === CASE_STATUSES.CLOSED} />
        <StatCard icon={HiOutlineExclamation} label="High Priority" value={stats.high} color="text-red-500" bgColor="bg-red-50" borderColor="border-red-100" onClick={() => { setStatusFilter(''); setPriorityFilter(CASE_PRIORITIES.HIGH); pagination.goToPage(0); }} active={priorityFilter === CASE_PRIORITIES.HIGH} />
        <StatCard icon={HiOutlineUserAdd} label="Unassigned" value={stats.unassigned} color="text-violet-500" bgColor="bg-violet-50" borderColor="border-violet-100" onClick={() => handleStatClick('')} active={false} />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-3 flex-1">
              <SearchBar value={keyword} onChange={handleSearch} placeholder="Search cases..." className="flex-1 max-w-md" />
              <button onClick={() => setShowFilters(!showFilters)} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${showFilters || statusFilter || priorityFilter ? 'bg-primary-50 border-primary-200 text-primary' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                <HiOutlineFilter className="w-4 h-4" /> Filters
                {(statusFilter || priorityFilter) && <span className="w-5 h-5 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center">{(statusFilter ? 1 : 0) + (priorityFilter ? 1 : 0)}</span>}
              </button>
            </div>
            {!loading && <p className="text-sm text-gray-500"><span className="font-semibold text-gray-700">{pagination.totalElements}</span> case{pagination.totalElements !== 1 ? 's' : ''}</p>}
          </div>
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap items-center gap-3">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Status:</span>
              {STATUS_PILLS.map((o) => { const I = o.icon; return <button key={o.value} onClick={() => { setStatusFilter(o.value); pagination.goToPage(0); }} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${statusFilter === o.value ? 'bg-primary text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}><I className={`w-3.5 h-3.5 ${statusFilter === o.value ? 'text-white' : o.color}`} />{o.label}</button>; })}
              <div className="w-px h-6 bg-gray-200 mx-1" />
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Priority:</span>
              {PRIORITY_PILLS.map((o) => <button key={o.value} onClick={() => setPriorityFilter(o.value)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${priorityFilter === o.value ? 'bg-primary text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}>{o.label}</button>)}
              {(statusFilter || priorityFilter) && <><div className="w-px h-6 bg-gray-200 mx-1" /><button onClick={() => { setStatusFilter(''); setPriorityFilter(''); }} className="text-xs text-red-500 hover:text-red-700 font-semibold flex items-center gap-1"><HiOutlineX className="w-3.5 h-3.5" /> Clear</button></>}
            </div>
          )}
        </div>

        <div className="p-6">
          <Table columns={columns} data={filteredCases} loading={loading} emptyMessage="No cases found." onRowClick={(row) => navigate(`/admin/cases/${row.id}`)} />
          {!loading && filteredCases.length > 0 && <Pagination page={pagination.page} totalPages={pagination.totalPages} totalElements={pagination.totalElements} onPageChange={pagination.goToPage} className="mt-6" />}
        </div>
      </div>

      {/* Assign Modal */}
      <Modal isOpen={assignModal.open} onClose={() => setAssignModal({ open: false, caseData: null })} title={assignModal.caseData?.assignedSocialWorker ? 'Reassign Case' : 'Assign Case'} size="md"
        footer={<><Button variant="ghost" onClick={() => setAssignModal({ open: false, caseData: null })}>Cancel</Button><Button onClick={handleAssign} disabled={assigning || !assignForm.socialWorkerId}>{assigning ? <><Spinner size="xs" className="mr-2" /> Assigning...</> : assignModal.caseData?.assignedSocialWorker ? 'Reassign' : 'Assign'}</Button></>}>
        {assignModal.caseData && (
          <div className="space-y-5">
            <div className="rounded-xl bg-gradient-to-r from-slate-50 to-gray-50 border border-gray-100 p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0"><HiOutlineFolder className="w-5 h-5 text-primary" /></div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-gray-900 text-sm">{assignModal.caseData.title}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {assignModal.caseData.caseNumber && <span className="text-[11px] font-mono text-gray-500 bg-white px-2 py-0.5 rounded border border-gray-200">{assignModal.caseData.caseNumber}</span>}
                    <StatusBadge status={assignModal.caseData.status} />
                  </div>
                  {assignModal.caseData.assignedSocialWorker && <p className="text-xs text-gray-500 mt-1">Currently: <span className="font-medium text-amber-600">{assignModal.caseData.assignedSocialWorker.fullName || assignModal.caseData.assignedSocialWorker.email}</span></p>}
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Social Worker</label>
              {selectedSW ? (
                <div className="flex items-center justify-between p-3 rounded-xl border-2 border-primary-200 bg-primary-50/30">
                  <div className="flex items-center gap-3"><UserAvatar user={selectedSW} size="sm" /><div><p className="text-sm font-semibold text-gray-900">{selectedSW.fullName}</p><p className="text-[11px] text-gray-500">{selectedSW.email}</p></div></div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-semibold text-gray-500 bg-white px-2 py-0.5 rounded-full border border-gray-200">{swCaseCount[selectedSW.id] || 0} cases</span>
                    <button onClick={() => setAssignForm((f) => ({ ...f, socialWorkerId: '' }))} className="p-1.5 rounded-lg hover:bg-white text-gray-400 hover:text-red-500 transition-colors"><HiOutlineX className="w-4 h-4" /></button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="relative mb-2"><HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input type="text" value={swSearch} onChange={(e) => setSwSearch(e.target.value)} placeholder="Search social workers..." className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" /></div>
                  <div className="max-h-48 overflow-y-auto rounded-xl border border-gray-200 divide-y divide-gray-50">
                    {loadingSW ? <div className="flex items-center justify-center py-6"><Spinner size="sm" /></div> : filteredSW.length === 0 ? <div className="py-6 text-center text-sm text-gray-500">No social workers found</div> : filteredSW.map((sw) => (
                      <button key={sw.id} onClick={() => setAssignForm((f) => ({ ...f, socialWorkerId: sw.id }))} className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-primary-50/50 transition-colors">
                        <UserAvatar user={sw} size="sm" /><div className="flex-1 min-w-0"><p className="text-sm font-medium text-gray-900 truncate">{sw.fullName}</p><p className="text-[11px] text-gray-500 truncate">{sw.email}</p></div>
                        <span className="text-[10px] font-medium text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full flex-shrink-0">{swCaseCount[sw.id] || 0} cases</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div><label className="block text-sm font-semibold text-gray-700 mb-2">Priority</label><div className="flex items-center gap-2">{Object.values(CASE_PRIORITIES).map((p) => { const a = assignForm.priority === p; const c = { HIGH: a ? 'bg-red-500 text-white border-red-500' : 'border-gray-200 text-gray-600 hover:border-red-200 hover:bg-red-50', MEDIUM: a ? 'bg-amber-500 text-white border-amber-500' : 'border-gray-200 text-gray-600 hover:border-amber-200 hover:bg-amber-50', LOW: a ? 'bg-emerald-500 text-white border-emerald-500' : 'border-gray-200 text-gray-600 hover:border-emerald-200 hover:bg-emerald-50' }; return <button key={p} onClick={() => setAssignForm((f) => ({ ...f, priority: p }))} className={`flex-1 py-2.5 text-sm font-semibold rounded-xl border-2 transition-all ${c[p]}`}>{p}</button>; })}</div></div>
            <div><label className="block text-sm font-semibold text-gray-700 mb-2">Due Date</label><div className="relative"><HiOutlineCalendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" /><input type="date" value={assignForm.dueDate} onChange={(e) => setAssignForm((f) => ({ ...f, dueDate: e.target.value }))} className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" /></div></div>
            <div><label className="block text-sm font-semibold text-gray-700 mb-2">Note <span className="text-gray-400 font-normal">(optional)</span></label><textarea value={assignForm.note} onChange={(e) => setAssignForm((f) => ({ ...f, note: e.target.value }))} placeholder="Instructions for the social worker" rows={3} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none" /></div>
            <div className="rounded-xl bg-blue-50/50 border border-blue-100 px-4 py-3"><p className="text-xs text-blue-600">The assignee will receive a notification and the case will appear in their dashboard.</p></div>
          </div>
        )}
      </Modal>

      {/* Close Modal */}
      <Modal isOpen={closeModal.open} onClose={() => setCloseModal({ open: false, caseData: null })} title="Close Case" size="sm"
        footer={<><Button variant="ghost" onClick={() => setCloseModal({ open: false, caseData: null })}>Cancel</Button><Button variant="danger" onClick={handleCloseCase} disabled={closing}>{closing ? <><Spinner size="xs" className="mr-2" /> Closing...</> : 'Close Case'}</Button></>}>
        {closeModal.caseData && (
          <div className="space-y-4">
            <div className="rounded-xl bg-red-50/50 border border-red-100 p-4"><div className="flex items-start gap-3"><div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0"><HiOutlineLockClosed className="w-5 h-5 text-red-600" /></div><div><p className="text-sm font-semibold text-gray-900">Close this case?</p><p className="text-xs text-gray-500 mt-1">This will mark <strong>{closeModal.caseData.title}</strong> as closed.</p></div></div></div>
            <div><label className="block text-sm font-semibold text-gray-700 mb-2">Closing Note <span className="text-gray-400 font-normal">(optional)</span></label><textarea value={closeNote} onChange={(e) => setCloseNote(e.target.value)} placeholder="Reason or summary..." rows={3} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-300 resize-none" /></div>
          </div>
        )}
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={deleteModal.open} onClose={() => setDeleteModal({ open: false, caseData: null })} title="Delete Case" size="sm"
        footer={<><Button variant="ghost" onClick={() => setDeleteModal({ open: false, caseData: null })}>Cancel</Button><Button variant="danger" onClick={handleDelete} disabled={deleting}>{deleting ? <><Spinner size="xs" className="mr-2" /> Deleting...</> : 'Delete Case'}</Button></>}>
        {deleteModal.caseData && (
          <div className="rounded-xl bg-red-50/50 border border-red-100 p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0"><HiOutlineTrash className="w-5 h-5 text-red-600" /></div>
              <div><p className="text-sm font-semibold text-gray-900">Delete this case permanently?</p><p className="text-xs text-gray-500 mt-1">This will permanently remove <strong>{deleteModal.caseData.title}</strong> and all associated data. This action cannot be undone.</p></div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
