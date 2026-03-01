import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { caseApi } from '../../api/caseApi';
import { caseEntryApi } from '../../api/caseEntryApi';
import { interventionApi } from '../../api/interventionApi';
import { documentApi } from '../../api/documentApi';
import { useAuth } from '../../context/AuthContext';
import { useSearch } from '../../hooks/useSearch';
import { CASE_STATUSES, CASE_PRIORITIES, CASE_ENTRY_TYPES, CASE_ENTRY_STATUSES } from '../../utils/constants';
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
  HiOutlineEye, HiOutlinePencil, HiOutlineRefresh, HiOutlinePlus,
  HiOutlineCalendar,
  HiOutlineBell, HiOutlineClipboardList,
  HiOutlinePaperClip, HiOutlineCheckCircle, HiOutlineClock, HiOutlineUser,
  HiOutlineChartBar, HiOutlineDownload, HiOutlineCheck, HiOutlineTrendingUp,
  HiOutlineSave,
  HiOutlineLockClosed,
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
export default function MyCasesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { keyword, debouncedKeyword, handleSearch, clearSearch } = useSearch();

  const [allCases, setAllCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [showReminders, setShowReminders] = useState(false);

  // Detail modal
  const [selectedCase, setSelectedCase] = useState(null);
  const [detailTab, setDetailTab] = useState('overview');
  const [caseEntries, setCaseEntries] = useState([]);
  const [caseInterventions, setCaseInterventions] = useState([]);
  const [caseDocs, setCaseDocs] = useState([]);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Notes
  const [editingNote, setEditingNote] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  const [closeCaseModal, setCloseCaseModal] = useState(false);
  const [closingCase, setClosingCase] = useState(false);
  const [addTaskOpen, setAddTaskOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDue, setNewTaskDue] = useState('');
  const [savingTask, setSavingTask] = useState(false);

  /* ---- Fetch cases (backend filters by role automatically) ---- */
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
    setEditingNote(false);
    setNewNote('');
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

  const closeDetail = () => {
    setSelectedCase(null);
    setCaseEntries([]);
    setCaseInterventions([]);
    setCaseDocs([]);
    setCloseCaseModal(false);
    setAddTaskOpen(false);
    setNewTaskTitle('');
    setNewTaskDue('');
  };

  /** Refresh case row + modal from API so progress / status match backend after tasks or interventions change */
  const refreshSelectedCase = useCallback(async () => {
    if (!selectedCase?.id) return;
    try {
      const res = await caseApi.getById(selectedCase.id);
      const fresh = res?.data ?? res;
      if (fresh) setSelectedCase(fresh);
      fetchCases();
    } catch { /* ignore */ }
  }, [selectedCase?.id, fetchCases]);

  const tasks = caseEntries.filter((e) => e.type === CASE_ENTRY_TYPES.TASK);
  const notes = caseEntries.filter((e) => e.type === CASE_ENTRY_TYPES.NOTE);
  const milestones = caseEntries.filter((e) => e.type === CASE_ENTRY_TYPES.MILESTONE);
  const completedTasks = tasks.filter((t) => t.status === CASE_ENTRY_STATUSES.COMPLETED).length;

  /* ---- Save note ---- */
  const handleSaveNote = async () => {
    if (!newNote.trim() || !selectedCase) return;
    setSavingNote(true);
    try {
      await caseEntryApi.create(selectedCase.id, { type: CASE_ENTRY_TYPES.NOTE, title: 'Progress Note', content: newNote });
      toast.success('Note saved');
      setEditingNote(false);
      setNewNote('');
      const res = await caseEntryApi.getAll(selectedCase.id, { page: 0, size: 100 });
      setCaseEntries(extract(res));
      await refreshSelectedCase();
    } catch { toast.error('Failed to save note'); }
    finally { setSavingNote(false); }
  };

  /* ---- Toggle task ---- */
  const toggleTask = async (task) => {
    try {
      const newStatus = task.status === CASE_ENTRY_STATUSES.COMPLETED ? CASE_ENTRY_STATUSES.PENDING : CASE_ENTRY_STATUSES.COMPLETED;
      await caseEntryApi.update(selectedCase.id, task.id, { status: newStatus });
      const res = await caseEntryApi.getAll(selectedCase.id, { page: 0, size: 100 });
      setCaseEntries(extract(res));
      await refreshSelectedCase();
    } catch { toast.error('Failed to update task'); }
  };

  const handleCreateTask = async () => {
    if (!selectedCase || !newTaskTitle.trim()) return;
    setSavingTask(true);
    try {
      await caseEntryApi.create(selectedCase.id, {
        type: CASE_ENTRY_TYPES.TASK,
        title: newTaskTitle.trim(),
        content: '',
        dueDate: newTaskDue || undefined,
      });
      toast.success('Task added');
      setNewTaskTitle('');
      setNewTaskDue('');
      setAddTaskOpen(false);
      const res = await caseEntryApi.getAll(selectedCase.id, { page: 0, size: 100 });
      setCaseEntries(extract(res));
      await refreshSelectedCase();
    } catch { toast.error('Failed to add task'); }
    finally { setSavingTask(false); }
  };

  const handleCloseCaseConfirm = async () => {
    if (!selectedCase) return;
    setClosingCase(true);
    try {
      await caseApi.update(selectedCase.id, {
        title: selectedCase.title,
        beneficiaryName: selectedCase.beneficiaryName,
        beneficiaryIdentifier: selectedCase.beneficiaryIdentifier,
        status: CASE_STATUSES.CLOSED,
        priority: selectedCase.priority,
        assignedSocialWorkerId: selectedCase.assignedSocialWorker?.id,
        nextFollowUpDate: selectedCase.nextFollowUpDate,
      });
      toast.success('Case closed');
      setCloseCaseModal(false);
      await refreshSelectedCase();
      const res = await caseEntryApi.getAll(selectedCase.id, { page: 0, size: 100 });
      setCaseEntries(extract(res));
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to close case');
    } finally { setClosingCase(false); }
  };

  /* ============ RENDER ============ */
  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        badge="Case Files"
        badgeIcon={HiOutlineFolder}
        title="My Cases"
        subtitle="Manage your assigned case files and track progress"
        action={
          <div className="flex items-center gap-2">
            <button onClick={() => setShowReminders(!showReminders)} className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/30 text-sm font-medium transition-all ${showReminders ? 'bg-white/30 text-white' : 'bg-white/20 text-white hover:bg-white/30'}`}>
              <HiOutlineBell className="w-4 h-4" /> Reminders
              {reminders.length > 0 && <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">{reminders.length}</span>}
            </button>
            <Button variant="header" onClick={() => navigate('/social-worker/cases/new')} className="gap-2"><HiOutlinePlus className="w-4 h-4" /> New Case</Button>
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
          <p className="text-sm text-gray-400 mt-1">Try adjusting your filters or create a new case</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredCases.map((c) => {
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
                            {(c.interventionCount === 0 || c.interventionCount == null) && c.status !== 'CLOSED' && (
                              <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-red-100 text-red-600 border border-red-200 flex items-center gap-1">
                                <HiOutlineExclamation className="w-3 h-3" /> NO INTERVENTIONS
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 text-sm">
                        <div className="flex items-center gap-2 text-gray-600"><HiOutlineCalendar className="w-4 h-4 flex-shrink-0" /><span>Next: {c.nextFollowUpDate ? formatDate(c.nextFollowUpDate) : '—'}</span></div>
                        <div className="flex items-center gap-2 text-gray-600"><HiOutlineClock className="w-4 h-4 flex-shrink-0" /><span>{c.updatedAt ? formatRelativeTime(c.updatedAt) : '—'}</span></div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <HiOutlineCalendar className="w-4 h-4 flex-shrink-0" />
                          <span className={isOverdue ? 'text-red-600 font-semibold' : ''}>{c.nextFollowUpDate ? formatDate(c.nextFollowUpDate) : '—'}{isOverdue && ' (overdue)'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600"><HiOutlineCalendar className="w-4 h-4 flex-shrink-0" /><span>Opened: {formatDate(c.openedAt || c.createdAt)}</span></div>
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
                      <Button variant="outline" size="sm" onClick={() => navigate(`/social-worker/cases/${c.id}/edit`)} className="gap-1.5"><HiOutlinePencil className="w-4 h-4" /><span className="lg:hidden">Edit</span></Button>
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
                          { icon: HiOutlineCalendar, label: 'Opened', value: formatDate(selectedCase.openedAt || selectedCase.createdAt) },
                          { icon: HiOutlineCalendar, label: 'Due Date', value: selectedCase.nextFollowUpDate ? formatDate(selectedCase.nextFollowUpDate) : '—' },
                          { icon: HiOutlineCalendar, label: 'Next Follow-up', value: selectedCase.nextFollowUpDate ? formatDate(selectedCase.nextFollowUpDate) : '—' },
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
                      <p className="text-xs text-gray-500 mt-3 leading-relaxed">
                        Progress updates automatically when you complete <strong>interventions</strong>, check off <strong>tasks</strong>, or add <strong>progress notes</strong>. Schedule and Field Work use the same data.
                        When every intervention and every task for this case is done, the case can close automatically.
                      </p>
                      {selectedCase.status !== CASE_STATUSES.CLOSED && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          <Button size="sm" variant="outline" className="gap-1.5 text-red-700 border-red-200 hover:bg-red-50" onClick={() => setCloseCaseModal(true)} icon={HiOutlineLockClosed}>
                            Close case manually
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => navigate(`/social-worker/interventions/create`)} className="gap-1.5">
                            <HiOutlineClipboardList className="w-4 h-4" /> New intervention
                          </Button>
                        </div>
                      )}
                    </div>
                    {(selectedCase.interventionCount === 0 || selectedCase.interventionCount == null) && selectedCase.status !== 'CLOSED' && (
                      <div className="rounded-xl border-2 border-red-200 bg-red-50 p-5">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                            <HiOutlineExclamation className="w-5 h-5 text-red-600" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-red-800 mb-1">No Interventions Planned</h4>
                            <p className="text-sm text-red-700 mb-3">This case has no interventions. Every case should have at least one intervention to track progress effectively.</p>
                            <Button size="sm" onClick={() => { closeDetail(); navigate('/social-worker/interventions/create'); }} className="gap-1.5">
                              <HiOutlinePlus className="w-4 h-4" /> Create Intervention
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
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
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-gray-900">Progress Notes</h4>
                      <Button size="sm" onClick={() => setEditingNote(true)} className="gap-1.5"><HiOutlinePlus className="w-4 h-4" /> Add Note</Button>
                    </div>
                    {editingNote && (
                      <div className="rounded-xl border border-primary-200 bg-white p-4 space-y-3 mb-4">
                        <textarea value={newNote} onChange={(e) => setNewNote(e.target.value)} rows={4} placeholder="Document your progress..." className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none" />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={handleSaveNote} disabled={savingNote || !newNote.trim()} className="gap-1.5">{savingNote ? <Spinner size="xs" /> : <HiOutlineSave className="w-4 h-4" />} Save</Button>
                          <Button variant="ghost" size="sm" onClick={() => { setEditingNote(false); setNewNote(''); }}>Cancel</Button>
                        </div>
                      </div>
                    )}
                    {notes.length === 0 ? <p className="text-sm text-gray-400">No progress notes yet. Click "Add Note" to start documenting.</p> : (
                      <div className="space-y-3">
                        {notes.map((n) => (
                          <div key={n.id} className="bg-white rounded-xl border border-gray-100 p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <Avatar name={n.createdBy?.fullName || n.authorName || user?.fullName || 'User'} size="xs" />
                              <div><p className="text-sm font-medium">{n.createdBy?.fullName || n.authorName || user?.fullName || 'User'}</p><p className="text-[11px] text-gray-500">{formatDate(n.createdAt)}</p></div>
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
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                      <div>
                        <h4 className="font-semibold text-gray-900">Tasks & Follow-ups</h4>
                        <p className="text-xs text-gray-500 mt-1">Each new intervention adds a linked task (due on the planned date). Completing it here or finishing the intervention updates case progress.</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">{completedTasks}/{tasks.length} completed</span>
                        <Button size="sm" onClick={() => setAddTaskOpen((o) => !o)} className="gap-1.5"><HiOutlinePlus className="w-4 h-4" /> Add task</Button>
                      </div>
                    </div>
                    {addTaskOpen && (
                      <div className="rounded-xl border border-primary-200 bg-white p-4 space-y-3 mb-4">
                        <input value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} placeholder="Task title" className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary" />
                        <div className="flex flex-wrap items-end gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Due date (optional)</label>
                            <input type="date" value={newTaskDue} onChange={(e) => setNewTaskDue(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-xl text-sm" />
                          </div>
                          <Button size="sm" onClick={handleCreateTask} disabled={savingTask || !newTaskTitle.trim()} loading={savingTask}>Save task</Button>
                          <Button variant="ghost" size="sm" onClick={() => { setAddTaskOpen(false); setNewTaskTitle(''); setNewTaskDue(''); }}>Cancel</Button>
                        </div>
                      </div>
                    )}
                    {tasks.length === 0 ? <p className="text-sm text-gray-400">No tasks yet. Add one above, or create an intervention — a follow-up task is created automatically.</p> : (
                      <div className="space-y-2">
                        {tasks.map((t) => {
                          const done = t.status === CASE_ENTRY_STATUSES.COMPLETED;
                          const overdue = t.dueDate && new Date(t.dueDate) < new Date() && !done;
                          return (
                            <div key={t.id} className={`flex items-start gap-3 p-4 rounded-xl border ${overdue ? 'border-red-200 bg-red-50/50' : 'border-gray-100 bg-white'}`}>
                              <button type="button" onClick={() => toggleTask(t)} className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${done ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300 hover:border-primary'}`}>
                                {done && <HiOutlineCheck className="w-3 h-3 text-white" />}
                              </button>
                              <div className="flex-1 min-w-0">
                                <p className={`font-medium text-sm ${done ? 'line-through text-gray-400' : 'text-gray-900'}`}>{t.title || t.content || 'Task'}</p>
                                <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-gray-500">
                                  {t.dueDate && <span className={`flex items-center gap-1 ${overdue ? 'text-red-600 font-semibold' : ''}`}><HiOutlineCalendar className="w-3 h-3" /> Due: {formatDate(t.dueDate)}{overdue && ' (overdue)'}</span>}
                                  <StatusBadge status={t.status} />
                                  {t.relatedInterventionId && (
                                    <button type="button" onClick={() => navigate(`/social-worker/interventions/${t.relatedInterventionId}/edit`)} className="text-primary font-medium hover:underline">
                                      Open linked intervention
                                    </button>
                                  )}
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

      <Modal isOpen={closeCaseModal} onClose={() => !closingCase && setCloseCaseModal(false)} title="Close case" size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setCloseCaseModal(false)} disabled={closingCase}>Cancel</Button>
            <Button onClick={handleCloseCaseConfirm} loading={closingCase} className="bg-red-600 hover:bg-red-700">Close case</Button>
          </>
        }
      >
        <p className="text-sm text-gray-600">Mark <strong>{selectedCase?.beneficiaryName || selectedCase?.title}</strong> as closed. You can still reopen by editing the case if your workflow allows.</p>
      </Modal>
    </div>
  );
}
