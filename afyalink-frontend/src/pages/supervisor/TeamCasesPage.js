import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { toast } from 'react-toastify';
import { caseApi } from '../../api/caseApi';
import { caseEntryApi } from '../../api/caseEntryApi';
import { interventionApi } from '../../api/interventionApi';
import { documentApi } from '../../api/documentApi';
import { userApi } from '../../api/userApi';
import { useNotifications } from '../../context/NotificationContext';
import { useSearch } from '../../hooks/useSearch';
import { CASE_STATUSES, CASE_PRIORITIES, CASE_ENTRY_TYPES, CASE_ENTRY_STATUSES, USER_ROLES } from '../../utils/constants';
import { formatDate, formatRelativeTime } from '../../utils/formatDate';
import SearchBar from '../../components/common/SearchBar';
import StatusBadge from '../../components/shared/StatusBadge';
import PriorityBadge from '../../components/shared/PriorityBadge';
import Modal from '../../components/common/Modal';
import PageHeader from '../../components/layout/PageHeader';
import Button from '../../components/common/Button';
import Spinner from '../../components/common/Spinner';
import Avatar from '../../components/shared/Avatar';
import {
  HiOutlineFolder, HiOutlineFolderOpen, HiOutlineClipboardCheck, HiOutlineExclamation,
  HiOutlineEye, HiOutlineUserAdd, HiOutlineSearch, HiOutlineRefresh,
  HiOutlineCalendar, HiOutlineSwitchHorizontal, HiOutlineX,
  HiOutlineLockClosed, HiOutlineBell, HiOutlineClipboardList,
  HiOutlinePaperClip, HiOutlineCheckCircle, HiOutlineClock, HiOutlineUser,
  HiOutlineChartBar, HiOutlineDownload,
  HiOutlineCheck, HiOutlineTrendingUp,
} from 'react-icons/hi';

/* ============ Helpers ============ */
const pct = (v) => (v != null ? v : 0);
const arr = (v) => (Array.isArray(v) ? v : []);
const extract = (res) => { const r = res?.data ?? res; return arr(r?.content ?? r); };

function ProgressBar({ value, className = '' }) {
  const v = Math.min(100, Math.max(0, pct(value)));
  const color = v >= 80 ? 'bg-emerald-500' : v >= 50 ? 'bg-primary' : v >= 25 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div className={`h-2 bg-gray-100 rounded-full overflow-hidden ${className}`}>
      <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${v}%` }} />
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color, bgColor, borderColor, onClick, active }) {
  return (
    <button onClick={onClick} type="button" className={`relative text-left overflow-hidden rounded-2xl border ${active ? 'border-primary ring-2 ring-primary/20' : borderColor} bg-white p-5 shadow-sm hover:shadow-md transition-all w-full`}>
      <div className="flex items-center justify-between">
        <div><p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">{label}</p><p className="text-2xl font-bold text-gray-900 mt-1">{value}</p></div>
        <div className={`w-12 h-12 rounded-2xl ${bgColor} flex items-center justify-center`}><Icon className={`w-6 h-6 ${color}`} /></div>
      </div>
    </button>
  );
}

function TabButton({ active, children, onClick }) {
  return (
    <button onClick={onClick} className={`px-4 py-2.5 text-sm font-semibold rounded-xl transition-all whitespace-nowrap ${active ? 'bg-primary text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}>{children}</button>
  );
}

/* ============ Component ============ */
export default function TeamCasesPage() {
  const { refresh: refreshNotifs } = useNotifications();
  const { keyword, debouncedKeyword, handleSearch, clearSearch } = useSearch();

  const [allCases, setAllCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [showReminders, setShowReminders] = useState(false);

  const [socialWorkers, setSocialWorkers] = useState([]);
  const [loadingSW, setLoadingSW] = useState(false);

  // Detail modal
  const [selectedCase, setSelectedCase] = useState(null);
  const [detailTab, setDetailTab] = useState('overview');
  const [caseEntries, setCaseEntries] = useState([]);
  const [caseInterventions, setCaseInterventions] = useState([]);
  const [caseDocs, setCaseDocs] = useState([]);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Assign modal
  const [assignModal, setAssignModal] = useState({ open: false, caseData: null });
  const [assignForm, setAssignForm] = useState({ socialWorkerId: '', priority: '', dueDate: '', note: '' });
  const [assigning, setAssigning] = useState(false);
  const [swSearch, setSwSearch] = useState('');

  // Close modal
  const [closeModal, setCloseModal] = useState({ open: false, caseData: null });
  const [closeNote, setCloseNote] = useState('');
  const [closing, setClosing] = useState(false);

  /* ---- Fetch social workers ---- */
  useEffect(() => {
    (async () => {
      setLoadingSW(true);
      try { const r = await userApi.getByRole(USER_ROLES.SOCIAL_WORKER, { page: 0, size: 200 }); setSocialWorkers((r?.data ?? r)?.content || []); }
      catch { setSocialWorkers([]); }
      finally { setLoadingSW(false); }
    })();
  }, []);

  /* ---- Fetch cases ---- */
  const fetchCases = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: 0, size: 200, sortBy: 'updatedAt', direction: 'DESC' };
      let res;
      if (debouncedKeyword) res = await caseApi.search({ keyword: debouncedKeyword, ...params });
      else res = await caseApi.getAll(params);
      const d = res?.data ?? res;
      const list = d?.content || [];
      setAllCases(list);
    } catch { toast.error('Failed to load cases'); }
    finally { setLoading(false); }
  }, [debouncedKeyword]);

  useEffect(() => { fetchCases(); }, [fetchCases]);

  /* ---- Filters ---- */
  const filteredCases = useMemo(() => {
    let list = allCases;
    if (statusFilter !== 'all') list = list.filter((c) => c.status === statusFilter);
    if (priorityFilter !== 'all') list = list.filter((c) => c.priority === priorityFilter);
    if (debouncedKeyword) {
      const q = debouncedKeyword.toLowerCase();
      list = list.filter((c) =>
        (c.title || '').toLowerCase().includes(q) || (c.beneficiaryName || '').toLowerCase().includes(q) ||
        (c.caseNumber || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [allCases, statusFilter, priorityFilter, debouncedKeyword]);

  /* ---- Stats ---- */
  const stats = useMemo(() => ({
    total: allCases.length,
    open: allCases.filter((c) => c.status === CASE_STATUSES.OPEN).length,
    inProgress: allCases.filter((c) => c.status === CASE_STATUSES.IN_PROGRESS).length,
    closed: allCases.filter((c) => c.status === CASE_STATUSES.CLOSED).length,
    high: allCases.filter((c) => c.priority === CASE_PRIORITIES.HIGH).length,
  }), [allCases]);

  /* ---- Reminders ---- */
  const reminders = useMemo(() => {
    const today = new Date();
    const items = [];
    allCases.forEach((c) => {
      if (c.status === CASE_STATUSES.CLOSED) return;
      const nf = c.nextFollowUpDate ? new Date(c.nextFollowUpDate) : null;
      if (nf) {
        const diff = Math.ceil((nf - today) / 86400000);
        if (diff < 0) items.push({ type: 'overdue', case: c, date: c.nextFollowUpDate });
        else if (diff <= 7) items.push({ type: 'follow-up', case: c, days: diff, date: c.nextFollowUpDate });
      }
    });
    return items;
  }, [allCases]);

  /* ---- Open case detail ---- */
  const openDetail = async (c) => {
    setSelectedCase(c);
    setDetailTab('overview');
    setLoadingDetail(true);
    try {
      const [entRes, intRes, docRes] = await Promise.allSettled([
        caseEntryApi.getAll(c.id, { page: 0, size: 100 }),
        interventionApi.getByCase(c.id, { page: 0, size: 100 }),
        documentApi.getByCase(c.id, { page: 0, size: 100 }),
      ]);
      setCaseEntries(entRes.status === 'fulfilled' ? extract(entRes.value) : []);
      setCaseInterventions(intRes.status === 'fulfilled' ? extract(intRes.value) : []);
      setCaseDocs(docRes.status === 'fulfilled' ? extract(docRes.value) : []);
    } catch { /* silent */ }
    finally { setLoadingDetail(false); }
  };

  const closeDetail = () => { setSelectedCase(null); setCaseEntries([]); setCaseInterventions([]); setCaseDocs([]); };

  const tasks = caseEntries.filter((e) => e.type === CASE_ENTRY_TYPES.TASK);
  const notes = caseEntries.filter((e) => e.type === CASE_ENTRY_TYPES.NOTE);
  const milestones = caseEntries.filter((e) => e.type === CASE_ENTRY_TYPES.MILESTONE);
  const completedTasks = tasks.filter((t) => t.status === CASE_ENTRY_STATUSES.COMPLETED).length;

  /* ---- Assign ---- */
  const swCaseCount = useMemo(() => {
    const c = {};
    allCases.forEach((cs) => { const id = cs.assignedSocialWorker?.id || cs.assignedSocialWorkerId; if (id) c[id] = (c[id] || 0) + 1; });
    return c;
  }, [allCases]);

  const openAssignModal = (cd) => {
    setAssignForm({ socialWorkerId: cd.assignedSocialWorker?.id || cd.assignedSocialWorkerId || '', priority: cd.priority || 'MEDIUM', dueDate: cd.nextFollowUpDate ? String(cd.nextFollowUpDate).split('T')[0] : '', note: '' });
    setSwSearch('');
    setAssignModal({ open: true, caseData: cd });
  };

  const handleAssign = async () => {
    if (!assignForm.socialWorkerId) { toast.error('Select a social worker'); return; }
    setAssigning(true);
    try {
      await caseApi.update(assignModal.caseData.id, {
        title: assignModal.caseData.title, description: assignModal.caseData.description, status: assignModal.caseData.status,
        priority: assignForm.priority, assignedSocialWorkerId: Number(assignForm.socialWorkerId),
        beneficiaryId: assignModal.caseData.beneficiaryId || assignModal.caseData.beneficiary?.id,
        ...(assignForm.dueDate ? { nextFollowUpDate: assignForm.dueDate } : {}), ...(assignForm.note ? { assignmentNote: assignForm.note } : {}),
      });
      toast.success(`Case assigned to ${socialWorkers.find((s) => String(s.id) === String(assignForm.socialWorkerId))?.fullName || 'social worker'}`);
      setAssignModal({ open: false, caseData: null }); fetchCases(); refreshNotifs();
    } catch (e) { toast.error(e?.response?.data?.message || 'Failed to assign'); }
    finally { setAssigning(false); }
  };

  /* ---- Close case ---- */
  const openCloseModal = (cd) => { setCloseNote(''); setCloseModal({ open: true, caseData: cd }); };
  const handleCloseCase = async () => {
    setClosing(true);
    try {
      await caseApi.update(closeModal.caseData.id, {
        title: closeModal.caseData.title, description: closeModal.caseData.description, status: CASE_STATUSES.CLOSED,
        priority: closeModal.caseData.priority, assignedSocialWorkerId: closeModal.caseData.assignedSocialWorker?.id || closeModal.caseData.assignedSocialWorkerId,
        beneficiaryId: closeModal.caseData.beneficiaryId || closeModal.caseData.beneficiary?.id,
        ...(closeNote ? { closingNote: closeNote } : {}),
      });
      toast.success('Case closed'); setCloseModal({ open: false, caseData: null }); fetchCases(); refreshNotifs();
    } catch (e) { toast.error(e?.response?.data?.message || 'Failed to close case'); }
    finally { setClosing(false); }
  };

  const filteredSW = useMemo(() => { if (!swSearch.trim()) return socialWorkers; const q = swSearch.toLowerCase(); return socialWorkers.filter((s) => (s.fullName || '').toLowerCase().includes(q) || (s.email || '').toLowerCase().includes(q)); }, [socialWorkers, swSearch]);
  const selectedSW = socialWorkers.find((s) => String(s.id) === String(assignForm.socialWorkerId));

  /* ============ RENDER ============ */
  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        badge="Case Files"
        badgeIcon={HiOutlineFolder}
        title="Team Cases"
        subtitle="Monitor team case files and progress"
        action={
          <div className="flex items-center gap-2">
            <button onClick={() => setShowReminders(!showReminders)} className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/30 text-sm font-medium transition-all ${showReminders ? 'bg-white/30 text-white' : 'bg-white/20 text-white hover:bg-white/30'}`}>
              <HiOutlineBell className="w-4 h-4" /> Reminders
              {reminders.length > 0 && <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">{reminders.length}</span>}
            </button>
            <button onClick={() => { clearSearch(); setStatusFilter('all'); setPriorityFilter('all'); fetchCases(); }} className="p-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white transition-colors" title="Refresh"><HiOutlineRefresh className="w-5 h-5" /></button>
          </div>
        }
      />

      {/* Reminders */}
      {showReminders && reminders.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5 space-y-3">
          <h3 className="font-bold text-amber-900 flex items-center gap-2"><HiOutlineBell className="w-5 h-5" /> Active Reminders ({reminders.length})</h3>
          {reminders.slice(0, 6).map((r, i) => (
            <div key={i} className="flex items-start gap-3 bg-white rounded-xl p-3 border border-amber-100">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${r.type === 'overdue' ? 'bg-red-100' : 'bg-amber-100'}`}>
                {r.type === 'overdue' ? <HiOutlineExclamation className="w-4 h-4 text-red-600" /> : <HiOutlineClock className="w-4 h-4 text-amber-600" />}
              </div>
              <div>
                {r.type === 'follow-up' && <p className="text-sm"><strong>{r.case.beneficiaryName || r.case.title}</strong> — Follow-up in <span className="font-bold text-amber-700">{r.days} day{r.days !== 1 ? 's' : ''}</span> ({formatDate(r.date)})</p>}
                {r.type === 'overdue' && <p className="text-sm text-red-700"><strong>{r.case.beneficiaryName || r.case.title}</strong> — <span className="font-bold">Overdue!</span> Due {formatDate(r.date)}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard icon={HiOutlineFolder} label="Total Cases" value={stats.total} color="text-primary" bgColor="bg-primary-50" borderColor="border-primary-100" onClick={() => setStatusFilter('all')} active={statusFilter === 'all'} />
        <StatCard icon={HiOutlineFolderOpen} label="Open" value={stats.open} color="text-blue-500" bgColor="bg-blue-50" borderColor="border-blue-100" onClick={() => setStatusFilter(CASE_STATUSES.OPEN)} active={statusFilter === CASE_STATUSES.OPEN} />
        <StatCard icon={HiOutlineTrendingUp} label="In Progress" value={stats.inProgress} color="text-amber-500" bgColor="bg-amber-50" borderColor="border-amber-100" onClick={() => setStatusFilter(CASE_STATUSES.IN_PROGRESS)} active={statusFilter === CASE_STATUSES.IN_PROGRESS} />
        <StatCard icon={HiOutlineClipboardCheck} label="Closed" value={stats.closed} color="text-emerald-500" bgColor="bg-emerald-50" borderColor="border-emerald-100" onClick={() => setStatusFilter(CASE_STATUSES.CLOSED)} active={statusFilter === CASE_STATUSES.CLOSED} />
        <StatCard icon={HiOutlineExclamation} label="High Priority" value={stats.high} color="text-red-500" bgColor="bg-red-50" borderColor="border-red-100" onClick={() => { setStatusFilter('all'); setPriorityFilter(CASE_PRIORITIES.HIGH); }} active={priorityFilter === CASE_PRIORITIES.HIGH} />
      </div>

      {/* Search & Filters */}
      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3">
          <SearchBar value={keyword} onChange={handleSearch} placeholder="Search by case ID, beneficiary, or title..." className="flex-1" />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary">
            <option value="all">All Status</option>
            <option value={CASE_STATUSES.OPEN}>Open</option>
            <option value={CASE_STATUSES.IN_PROGRESS}>In Progress</option>
            <option value={CASE_STATUSES.CLOSED}>Closed</option>
          </select>
          <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary">
            <option value="all">All Priority</option>
            <option value={CASE_PRIORITIES.HIGH}>High</option>
            <option value={CASE_PRIORITIES.MEDIUM}>Medium</option>
            <option value={CASE_PRIORITIES.LOW}>Low</option>
          </select>
        </div>
      </div>

      {/* Case Cards */}
      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : filteredCases.length === 0 ? (
        <div className="rounded-2xl border border-gray-100 bg-white p-16 text-center shadow-sm">
          <HiOutlineFolder className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No cases found</p>
          <p className="text-sm text-gray-400 mt-1">Try adjusting your filters or search</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredCases.map((c) => {
            const sw = c.assignedSocialWorker;
            const swName = sw?.fullName || sw?.email || '—';
            const progress = pct(c.progressPercent);
            const isOverdue = c.nextFollowUpDate && new Date(c.nextFollowUpDate) < new Date() && c.status !== CASE_STATUSES.CLOSED;
            return (
              <div key={c.id} className="rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-lg transition-shadow">
                <div className="p-6">
                  <div className="flex flex-col lg:flex-row gap-5">
                    {/* Left: Info */}
                    <div className="flex-1 space-y-3 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            <h3 className="text-lg font-bold text-gray-900">{c.beneficiaryName || c.title}</h3>
                            {c.caseNumber && <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-0.5 rounded-lg border border-gray-200">{c.caseNumber}</span>}
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <StatusBadge status={c.status} />
                            <PriorityBadge priority={c.priority} />
                            {c.title && c.beneficiaryName && <span className="text-xs text-gray-500 bg-gray-50 px-2 py-0.5 rounded-lg">{c.title}</span>}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 text-sm">
                        <div className="flex items-center gap-2 text-gray-600"><HiOutlineUser className="w-4 h-4 flex-shrink-0" /><span className="truncate">{swName}</span></div>
                        <div className="flex items-center gap-2 text-gray-600"><HiOutlineCalendar className="w-4 h-4 flex-shrink-0" /><span>Next: {c.nextFollowUpDate ? formatDate(c.nextFollowUpDate) : '—'}</span></div>
                        <div className="flex items-center gap-2 text-gray-600"><HiOutlineClock className="w-4 h-4 flex-shrink-0" /><span>{c.updatedAt ? formatRelativeTime(c.updatedAt) : '—'}</span></div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <HiOutlineCalendar className="w-4 h-4 flex-shrink-0" />
                          <span className={isOverdue ? 'text-red-600 font-semibold' : ''}>{c.nextFollowUpDate ? formatDate(c.nextFollowUpDate) : '—'}{isOverdue && ' (overdue)'}</span>
                        </div>
                      </div>

                      {/* Progress */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-gray-500">Case Progress</span>
                          <span className="text-sm font-bold text-gray-900">{progress}%</span>
                        </div>
                        <ProgressBar value={progress} />
                      </div>

                      {/* Quick stats */}
                      <div className="flex gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1"><HiOutlineClipboardList className="w-3.5 h-3.5" /> {c.interventionCount ?? 0} interventions</span>
                        <span className="flex items-center gap-1"><HiOutlineCheckCircle className="w-3.5 h-3.5" /> {c.completedTaskCount ?? 0}/{c.totalTaskCount ?? 0} tasks</span>
                        <span className="flex items-center gap-1"><HiOutlinePaperClip className="w-3.5 h-3.5" /> {c.documentCount ?? 0} files</span>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex lg:flex-col gap-2 justify-end flex-shrink-0">
                      <Button variant="outline" size="sm" onClick={() => openDetail(c)} className="gap-1.5"><HiOutlineEye className="w-4 h-4" /><span className="lg:hidden">View</span></Button>
                      <Button variant="outline" size="sm" onClick={() => openAssignModal(c)} className="gap-1.5">
                        {c.assignedSocialWorker ? <HiOutlineSwitchHorizontal className="w-4 h-4" /> : <HiOutlineUserAdd className="w-4 h-4" />}
                        <span className="lg:hidden">{c.assignedSocialWorker ? 'Reassign' : 'Assign'}</span>
                      </Button>
                      {c.status !== CASE_STATUSES.CLOSED && (
                        <Button variant="outline" size="sm" onClick={() => openCloseModal(c)} className="gap-1.5 text-red-500 hover:bg-red-50 hover:text-red-600 border-red-200"><HiOutlineLockClosed className="w-4 h-4" /><span className="lg:hidden">Close</span></Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ===== CASE DETAIL MODAL ===== */}
      <Modal isOpen={!!selectedCase} onClose={closeDetail} title={selectedCase ? `Case: ${selectedCase.beneficiaryName || selectedCase.title}` : ''} size="full">
        {selectedCase && (
          <div className="space-y-5 -mx-2">
            {/* Header info */}
            <div className="flex flex-wrap items-center gap-2 px-2">
              <StatusBadge status={selectedCase.status} />
              <PriorityBadge priority={selectedCase.priority} />
              {selectedCase.caseNumber && <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{selectedCase.caseNumber}</span>}
              <span className="text-xs text-gray-400">Opened {formatDate(selectedCase.openedAt || selectedCase.createdAt)}</span>
              <span className="text-xs text-gray-400">Assigned to {selectedCase.assignedSocialWorker?.fullName || '—'}</span>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 px-2">
              {['overview', 'history', 'notes', 'tasks', 'milestones', 'attachments'].map((t) => (
                <TabButton key={t} active={detailTab === t} onClick={() => setDetailTab(t)}>{t.charAt(0).toUpperCase() + t.slice(1)}</TabButton>
              ))}
            </div>

            {loadingDetail ? (
              <div className="flex justify-center py-12"><Spinner size="md" /></div>
            ) : (
              <div className="px-2">
                {/* OVERVIEW */}
                {detailTab === 'overview' && (
                  <div className="space-y-4">
                    <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-5">
                      <h4 className="font-semibold text-gray-900 mb-3">Beneficiary Information</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                        {[
                          { icon: HiOutlineUser, label: 'Name', value: selectedCase.beneficiaryName || '—' },
                          { icon: HiOutlineUser, label: 'Assigned To', value: selectedCase.assignedSocialWorker?.fullName || '—' },
                          { icon: HiOutlineCalendar, label: 'Opened', value: formatDate(selectedCase.openedAt || selectedCase.createdAt) },
                          { icon: HiOutlineCalendar, label: 'Due Date', value: selectedCase.nextFollowUpDate ? formatDate(selectedCase.nextFollowUpDate) : '—' },
                          { icon: HiOutlineCalendar, label: 'Next Follow-up', value: selectedCase.nextFollowUpDate ? formatDate(selectedCase.nextFollowUpDate) : '—' },
                          { icon: HiOutlineCalendar, label: 'Closed', value: selectedCase.closedAt ? formatDate(selectedCase.closedAt) : '—' },
                          { icon: HiOutlineChartBar, label: 'Progress', value: `${pct(selectedCase.progressPercent)}%` },
                          { icon: HiOutlineUser, label: 'Created By', value: selectedCase.createdBy?.fullName || '—' },
                        ].map((item, i) => (
                          <div key={i}><p className="text-gray-500 text-xs flex items-center gap-1"><item.icon className="w-3.5 h-3.5" />{item.label}</p><p className="font-medium text-gray-900 mt-0.5">{item.value}</p></div>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-5">
                      <h4 className="font-semibold text-gray-900 mb-3">Case Progress</h4>
                      <div className="flex items-center justify-between mb-2"><span className="text-sm text-gray-500">Overall Progress</span><span className="text-lg font-bold">{pct(selectedCase.progressPercent)}%</span></div>
                      <ProgressBar value={selectedCase.progressPercent} className="h-3" />
                    </div>
                    {selectedCase.description && (
                      <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-5">
                        <h4 className="font-semibold text-gray-900 mb-2">Description</h4>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedCase.description}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* HISTORY (Interventions) */}
                {detailTab === 'history' && (
                  <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-5">
                    <h4 className="font-semibold text-gray-900 mb-4">Intervention History</h4>
                    {caseInterventions.length === 0 ? <p className="text-sm text-gray-400">No interventions recorded yet.</p> : (
                      <div className="space-y-4">
                        {caseInterventions.map((iv, idx) => (
                          <div key={iv.id} className="relative pb-4">
                            {idx !== caseInterventions.length - 1 && <div className="absolute left-2 top-8 bottom-0 w-0.5 bg-gray-200" />}
                            <div className="flex gap-3">
                              <div className="w-4 h-4 rounded-full bg-primary mt-1 flex-shrink-0" />
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-1"><h5 className="font-semibold text-gray-900 text-sm">{iv.title || iv.type?.replace('_', ' ') || 'Intervention'}</h5><StatusBadge status={iv.status} /></div>
                                <p className="text-xs text-gray-500">{formatDate(iv.scheduledDate || iv.createdAt)}</p>
                                {iv.description && <p className="text-sm text-gray-700 mt-1">{iv.description}</p>}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* NOTES */}
                {detailTab === 'notes' && (
                  <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-5">
                    <h4 className="font-semibold text-gray-900 mb-4">Progress Notes</h4>
                    {notes.length === 0 ? <p className="text-sm text-gray-400">No progress notes recorded yet.</p> : (
                      <div className="space-y-3">
                        {notes.map((n) => (
                          <div key={n.id} className="bg-white rounded-xl border border-gray-100 p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <Avatar name={n.createdBy?.fullName || n.authorName || 'User'} size="xs" />
                              <div><p className="text-sm font-medium">{n.createdBy?.fullName || n.authorName || 'User'}</p><p className="text-[11px] text-gray-500">{formatDate(n.createdAt)}</p></div>
                            </div>
                            <p className="text-sm text-gray-700">{n.content || n.description || n.title}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* TASKS */}
                {detailTab === 'tasks' && (
                  <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-gray-900">Tasks & Follow-ups</h4>
                      <span className="text-sm text-gray-500">{completedTasks}/{tasks.length} completed</span>
                    </div>
                    {tasks.length === 0 ? <p className="text-sm text-gray-400">No tasks created yet.</p> : (
                      <div className="space-y-2">
                        {tasks.map((t) => {
                          const done = t.status === CASE_ENTRY_STATUSES.COMPLETED;
                          const overdue = t.dueDate && new Date(t.dueDate) < new Date() && !done;
                          return (
                            <div key={t.id} className={`flex items-start gap-3 p-4 rounded-xl border ${overdue ? 'border-red-200 bg-red-50/50' : 'border-gray-100 bg-white'}`}>
                              <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${done ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300'}`}>
                                {done && <HiOutlineCheck className="w-3 h-3 text-white" />}
                              </div>
                              <div className="flex-1">
                                <p className={`font-medium text-sm ${done ? 'line-through text-gray-400' : 'text-gray-900'}`}>{t.title || t.content || 'Task'}</p>
                                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                  {t.dueDate && <span className="flex items-center gap-1"><HiOutlineCalendar className="w-3 h-3" /> Due: {formatDate(t.dueDate)}</span>}
                                  <span><StatusBadge status={t.status} /></span>
                                </div>
                              </div>
                              {done && <HiOutlineCheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* MILESTONES */}
                {detailTab === 'milestones' && (
                  <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-5">
                    <h4 className="font-semibold text-gray-900 mb-4">Progress Milestones</h4>
                    {milestones.length === 0 ? <p className="text-sm text-gray-400">No milestones defined yet.</p> : (
                      <div className="space-y-4">
                        {milestones.map((m) => (
                          <div key={m.id} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div><p className="font-medium text-gray-900 text-sm">{m.title || m.content || 'Milestone'}</p>{m.dueDate && <p className="text-xs text-gray-500">Target: {formatDate(m.dueDate)}</p>}</div>
                              <StatusBadge status={m.status} />
                            </div>
                            <ProgressBar value={m.status === CASE_ENTRY_STATUSES.COMPLETED ? 100 : m.status === CASE_ENTRY_STATUSES.IN_PROGRESS ? 50 : 10} />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ATTACHMENTS */}
                {detailTab === 'attachments' && (
                  <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-5">
                    <h4 className="font-semibold text-gray-900 mb-4">Attachments & Documents</h4>
                    {caseDocs.length === 0 ? <p className="text-sm text-gray-400">No documents attached yet.</p> : (
                      <div className="space-y-2">
                        {caseDocs.map((d) => (
                          <div key={d.id} className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
                            <div className="flex items-center gap-3">
                              <HiOutlinePaperClip className="w-5 h-5 text-gray-400" />
                              <div><p className="font-medium text-sm">{d.originalFilename || d.fileName || d.name || 'Document'}</p><p className="text-[11px] text-gray-500">{d.fileSize ? `${(d.fileSize / 1024).toFixed(0)} KB` : ''} {d.createdAt ? `• ${formatDate(d.createdAt)}` : ''}</p></div>
                            </div>
                            <button className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-primary transition-colors"><HiOutlineDownload className="w-4 h-4" /></button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* ===== ASSIGN MODAL ===== */}
      <Modal isOpen={assignModal.open} onClose={() => setAssignModal({ open: false, caseData: null })} title={assignModal.caseData?.assignedSocialWorker ? 'Reassign Case' : 'Assign Case'} size="md"
        footer={<><Button variant="ghost" onClick={() => setAssignModal({ open: false, caseData: null })}>Cancel</Button><Button onClick={handleAssign} disabled={assigning || !assignForm.socialWorkerId}>{assigning ? <><Spinner size="xs" className="mr-2" /> Assigning...</> : 'Assign'}</Button></>}>
        {assignModal.caseData && (
          <div className="space-y-5">
            <div className="rounded-xl bg-gray-50 border border-gray-100 p-4 flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0"><HiOutlineFolder className="w-5 h-5 text-primary" /></div>
              <div><p className="font-semibold text-sm">{assignModal.caseData.title}</p><div className="flex items-center gap-2 mt-1 flex-wrap">{assignModal.caseData.caseNumber && <span className="text-[11px] font-mono text-gray-500 bg-white px-2 py-0.5 rounded border">{assignModal.caseData.caseNumber}</span>}<StatusBadge status={assignModal.caseData.status} /></div>{assignModal.caseData.assignedSocialWorker && <p className="text-xs text-gray-500 mt-1">Currently: <span className="font-medium text-amber-600">{assignModal.caseData.assignedSocialWorker.fullName}</span></p>}</div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Social Worker</label>
              {selectedSW ? (
                <div className="flex items-center justify-between p-3 rounded-xl border-2 border-primary-200 bg-primary-50/30">
                  <div className="flex items-center gap-3"><Avatar name={selectedSW.fullName} size="sm" /><div><p className="text-sm font-semibold">{selectedSW.fullName}</p><p className="text-[11px] text-gray-500">{selectedSW.email}</p></div></div>
                  <button onClick={() => setAssignForm((f) => ({ ...f, socialWorkerId: '' }))} className="p-1.5 rounded-lg hover:bg-white text-gray-400 hover:text-red-500"><HiOutlineX className="w-4 h-4" /></button>
                </div>
              ) : (
                <div>
                  <div className="relative mb-2"><HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input type="text" value={swSearch} onChange={(e) => setSwSearch(e.target.value)} placeholder="Search..." className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" /></div>
                  <div className="max-h-48 overflow-y-auto rounded-xl border border-gray-200 divide-y divide-gray-50">
                    {loadingSW ? <div className="py-6 text-center"><Spinner size="sm" /></div> : filteredSW.map((sw) => (
                      <button key={sw.id} onClick={() => setAssignForm((f) => ({ ...f, socialWorkerId: sw.id }))} className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-primary-50/50 transition-colors">
                        <Avatar name={sw.fullName} size="sm" /><div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{sw.fullName}</p><p className="text-[11px] text-gray-500 truncate">{sw.email}</p></div>
                        <span className="text-[10px] text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">{swCaseCount[sw.id] || 0} cases</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div><label className="block text-sm font-semibold text-gray-700 mb-2">Priority</label><div className="flex gap-2">{Object.values(CASE_PRIORITIES).map((p) => { const a = assignForm.priority === p; const cl = { HIGH: a ? 'bg-red-500 text-white border-red-500' : 'border-gray-200 hover:bg-red-50', MEDIUM: a ? 'bg-amber-500 text-white border-amber-500' : 'border-gray-200 hover:bg-amber-50', LOW: a ? 'bg-emerald-500 text-white border-emerald-500' : 'border-gray-200 hover:bg-emerald-50' }; return <button key={p} onClick={() => setAssignForm((f) => ({ ...f, priority: p }))} className={`flex-1 py-2.5 text-sm font-semibold rounded-xl border-2 transition-all ${cl[p]}`}>{p}</button>; })}</div></div>
            <div><label className="block text-sm font-semibold text-gray-700 mb-2">Due Date</label><input type="date" value={assignForm.dueDate} onChange={(e) => setAssignForm((f) => ({ ...f, dueDate: e.target.value }))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" /></div>
            <div><label className="block text-sm font-semibold text-gray-700 mb-2">Note <span className="font-normal text-gray-400">(optional)</span></label><textarea value={assignForm.note} onChange={(e) => setAssignForm((f) => ({ ...f, note: e.target.value }))} rows={3} placeholder="Instructions for the social worker" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none" /></div>
          </div>
        )}
      </Modal>

      {/* ===== CLOSE MODAL ===== */}
      <Modal isOpen={closeModal.open} onClose={() => setCloseModal({ open: false, caseData: null })} title="Close Case" size="sm"
        footer={<><Button variant="ghost" onClick={() => setCloseModal({ open: false, caseData: null })}>Cancel</Button><Button variant="danger" onClick={handleCloseCase} disabled={closing}>{closing ? <><Spinner size="xs" className="mr-2" /> Closing...</> : 'Close Case'}</Button></>}>
        {closeModal.caseData && (
          <div className="space-y-4">
            <div className="rounded-xl bg-red-50/50 border border-red-100 p-4 flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0"><HiOutlineLockClosed className="w-5 h-5 text-red-600" /></div>
              <div><p className="text-sm font-semibold">Close this case?</p><p className="text-xs text-gray-500 mt-1"><strong>{closeModal.caseData.title}</strong> will be marked as closed.</p></div>
            </div>
            <textarea value={closeNote} onChange={(e) => setCloseNote(e.target.value)} rows={3} placeholder="Closing note (optional)" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-300 resize-none" />
          </div>
        )}
      </Modal>
    </div>
  );
}
