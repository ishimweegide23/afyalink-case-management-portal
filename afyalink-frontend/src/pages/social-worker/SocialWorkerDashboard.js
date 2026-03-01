import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import { dashboardApi } from '../../api/dashboardApi';
import { caseApi } from '../../api/caseApi';
import { interventionApi } from '../../api/interventionApi';
import { caseEntryApi } from '../../api/caseEntryApi';
import { beneficiaryApi } from '../../api/beneficiaryApi';
import StatusBadge from '../../components/shared/StatusBadge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import { formatRelativeTime, formatDate, formatDateTime } from '../../utils/formatDate';
import { formatEnum } from '../../utils/helpers';
import { ROUTES } from '../../routes/routeConstants';
import {
  HiOutlineFolder, HiOutlineClipboardList, HiOutlinePlus,
  HiOutlineFolderOpen, HiOutlineCheckCircle,
  HiOutlineClock, HiOutlineCalendar, HiOutlineDocumentText, HiOutlineChartBar,
  HiOutlineTrendingUp, HiArrowRight, HiOutlineBell, HiOutlineLocationMarker,
  HiOutlineExclamation, HiOutlinePlay, HiOutlineCheck, HiOutlineClipboardCheck,
  HiOutlinePencilAlt, HiOutlineEye, HiOutlineRefresh, HiOutlineSave,
} from 'react-icons/hi';

function cn(...c) { return c.filter(Boolean).join(' '); }

const PAL = {
  primary:   { bg: 'bg-primary-50',  icon: 'bg-primary',     text: 'text-primary',     ring: 'ring-primary/20'  },
  warning:   { bg: 'bg-amber-50',    icon: 'bg-amber-500',   text: 'text-amber-600',   ring: 'ring-amber-200'   },
  info:      { bg: 'bg-sky-50',      icon: 'bg-sky-500',     text: 'text-sky-600',     ring: 'ring-sky-200'     },
  danger:    { bg: 'bg-rose-50',     icon: 'bg-rose-500',    text: 'text-rose-600',    ring: 'ring-rose-200'    },
  purple:    { bg: 'bg-violet-50',   icon: 'bg-violet-500',  text: 'text-violet-600',  ring: 'ring-violet-200'  },
  secondary: { bg: 'bg-emerald-50',  icon: 'bg-emerald-500', text: 'text-emerald-600', ring: 'ring-emerald-200' },
};

function StatCard({ title, value, icon: Icon, color = 'primary', subtitle }) {
  const p = PAL[color];
  return (
    <div className={cn('relative overflow-hidden rounded-2xl p-5 border border-white/60 shadow-lg shadow-gray-200/50 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 group', p.bg)}>
      <div className="relative flex items-start justify-between mb-4">
        <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center shadow-md ring-4', p.icon, p.ring)}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
      <div className="relative">
        <div className={cn('text-3xl font-extrabold tracking-tight mb-0.5', p.text)}>{value}</div>
        <p className="text-sm font-semibold text-gray-700">{title}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

function ProgressBar({ value = 0, color = 'bg-primary' }) {
  return (
    <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
      <div className={cn('h-full rounded-full transition-all duration-700', color)} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}

export default function SocialWorkerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [today, setToday] = useState(null);
  const [stats, setStats] = useState({ totalCases: 0, openCases: 0, inProgressCases: 0, closedCases: 0, beneficiaries: 0, interventions: 0, completedInterventions: 0, inProgressInterventions: 0 });
  const [recentCases, setRecentCases] = useState([]);
  const [actionLoading, setActionLoading] = useState(null);

  const [showLogModal, setShowLogModal] = useState(false);
  const [logCase, setLogCase] = useState(null);
  const [logContent, setLogContent] = useState('');
  const [logSaving, setLogSaving] = useState(false);
  const [workerCases, setWorkerCases] = useState([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [todayRes, allC, openC, ipC, closedC, benR, allI, compI, ipI, cList] = await Promise.allSettled([
        dashboardApi.getTodaySummary(),
        caseApi.getAll({ page: 0, size: 1 }),
        caseApi.getByStatus('OPEN', { page: 0, size: 1 }),
        caseApi.getByStatus('IN_PROGRESS', { page: 0, size: 1 }),
        caseApi.getByStatus('CLOSED', { page: 0, size: 1 }),
        beneficiaryApi.getAll({ page: 0, size: 1 }),
        interventionApi.getAll({ page: 0, size: 1 }),
        interventionApi.getByStatus('COMPLETED', { page: 0, size: 1 }),
        interventionApi.getByStatus('IN_PROGRESS', { page: 0, size: 1 }),
        caseApi.getAll({ page: 0, size: 6, sortBy: 'updatedAt', direction: 'DESC' }),
      ]);

      if (todayRes.status === 'fulfilled') setToday(todayRes.value?.data ?? todayRes.value);

      const g = (r) => r.status === 'fulfilled' ? r.value?.data?.totalElements ?? 0 : 0;
      setStats({
        totalCases: g(allC), openCases: g(openC), inProgressCases: g(ipC), closedCases: g(closedC),
        beneficiaries: g(benR), interventions: g(allI), completedInterventions: g(compI), inProgressInterventions: g(ipI),
      });

      if (cList.status === 'fulfilled') {
        const cases = cList.value?.data?.content || [];
        setRecentCases(cases);
        setWorkerCases(cases);
      }
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleInterventionStatus = async (id, newStatus) => {
    setActionLoading(id);
    try {
      const payload = { status: newStatus };
      if (newStatus === 'COMPLETED') {
        payload.completedAt = new Date().toISOString();
      }
      await interventionApi.update(id, payload);
      toast.success(`Updated to ${formatEnum(newStatus)}`);
      loadData();
    } catch { toast.error('Failed to update'); }
    finally { setActionLoading(null); }
  };

  const handleSaveLog = async () => {
    if (!logCase || !logContent.trim()) return;
    setLogSaving(true);
    try {
      await caseEntryApi.create(logCase, { type: 'NOTE', title: 'Daily Activity Log', content: logContent, status: 'COMPLETED' });
      toast.success('Activity logged successfully');
      setShowLogModal(false);
      setLogContent('');
      setLogCase(null);
      loadData();
    } catch { toast.error('Failed to log activity'); }
    finally { setLogSaving(false); }
  };

  const completionRate = stats.interventions > 0 ? Math.round((stats.completedInterventions / stats.interventions) * 100) : 0;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const todayStats = today?.stats || {};
  const todayInterventions = today?.todayInterventions || [];
  const overdueInterventions = today?.overdueInterventions || [];
  const casesWithoutInterventions = today?.casesWithoutInterventions || [];
  const overdueTasks = today?.overdueTasks || [];
  const overdueFollowUps = today?.overdueFollowUps || [];
  const recentActivities = today?.recentActivities || [];

  const alertCount = (todayStats.overdueTaskCount || 0) + (todayStats.casesNeedingIntervention || 0) + (todayStats.overdueFollowUpCount || 0) + overdueInterventions.length;

  if (loading) return (
    <div className="space-y-6 animate-pulse">
      <div className="h-28 bg-gray-100 rounded-2xl" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-gray-100 rounded-2xl" />)}</div>
    </div>
  );

  return (
    <div className="space-y-7 pb-8">
      {/* HERO HEADER */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl shadow-xl shadow-primary/25">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary-600 to-secondary opacity-[0.97]" />
        <div className="absolute inset-0 opacity-[0.12] pointer-events-none" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none'%3E%3Cg fill='%23ffffff'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />
        <div className="relative p-7 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
          <div>
            <p className="text-white/70 text-sm font-medium mb-1">{greeting},</p>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-1">{user?.fullName ?? 'Social Worker'}</h1>
            <p className="text-white/80 text-sm">
              {todayInterventions.length > 0
                ? `You have ${todayInterventions.length} intervention${todayInterventions.length > 1 ? 's' : ''} scheduled today`
                : "Here's your daily overview"}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {[
              { icon: HiOutlineCalendar, val: todayStats.totalScheduledToday || 0, label: "Today's Tasks" },
              { icon: HiOutlineCheckCircle, val: todayStats.completedToday || 0, label: 'Done Today' },
              { icon: HiOutlineExclamation, val: alertCount, label: 'Needs Attention' },
            ].map(({ icon: Icon, val, label }) => (
              <div key={label} className="flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-xl px-4 py-2.5 border border-white/20">
                <Icon className="w-4 h-4 text-white/80 flex-shrink-0" />
                <div>
                  <p className="text-lg font-bold leading-none">{val}</p>
                  <p className="text-white/70 text-xs mt-0.5">{label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-5">
          <Link to={`${ROUTES.SOCIAL_WORKER.MY_CASES}/create`} className="inline-flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-semibold px-4 py-2 rounded-xl border border-white/20 transition-all">
            <HiOutlinePlus className="w-3.5 h-3.5" /> New Case
          </Link>
          <Link to={`${ROUTES.SOCIAL_WORKER.INTERVENTIONS}/create`} className="inline-flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-semibold px-4 py-2 rounded-xl border border-white/20 transition-all">
            <HiOutlinePlus className="w-3.5 h-3.5" /> New Intervention
          </Link>
          <button onClick={() => setShowLogModal(true)} className="inline-flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-semibold px-4 py-2 rounded-xl border border-white/20 transition-all">
            <HiOutlinePencilAlt className="w-3.5 h-3.5" /> Log Activity
          </button>
          <button onClick={loadData} className="inline-flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-semibold px-4 py-2 rounded-xl border border-white/20 transition-all">
            <HiOutlineRefresh className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>
        </div>
      </div>

      {/* TODAY'S CHECKLIST */}
      {(todayInterventions.length > 0 || overdueInterventions.length > 0) && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-md shadow-gray-200/40 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-emerald-50/40">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center"><HiOutlineClipboardCheck className="w-4 h-4 text-white" /></div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">Today's Checklist</h3>
                <p className="text-xs text-gray-500">{todayStats.completedToday || 0} of {todayStats.totalScheduledToday || 0} completed</p>
              </div>
            </div>
            <Link to={ROUTES.SOCIAL_WORKER.SCHEDULE} className="text-xs font-semibold text-primary hover:text-primary-700 flex items-center gap-1">Full Schedule <HiArrowRight className="w-3 h-3" /></Link>
          </div>
          <div className="divide-y divide-gray-50">
            {overdueInterventions.map((iv) => (
              <div key={`overdue-${iv.id}`} className="flex items-center gap-4 px-5 py-3.5 bg-red-50/50">
                <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0"><HiOutlineExclamation className="w-4 h-4 text-red-600" /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{iv.title}</p>
                  <p className="text-xs text-red-600 font-medium">Overdue &mdash; {iv.caseBeneficiaryName || iv.caseNumber} &bull; {formatEnum(iv.type)}{iv.location ? ` &bull; ${iv.location}` : ''}</p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  {iv.status !== 'COMPLETED' && iv.status !== 'IN_PROGRESS' && (
                    <button onClick={() => handleInterventionStatus(iv.id, 'IN_PROGRESS')} disabled={actionLoading === iv.id} className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-orange-100 text-orange-700 hover:bg-orange-200 transition-colors flex items-center gap-1">
                      <HiOutlinePlay className="w-3.5 h-3.5" /> Start
                    </button>
                  )}
                  {iv.status === 'IN_PROGRESS' && (
                    <button onClick={() => handleInterventionStatus(iv.id, 'COMPLETED')} disabled={actionLoading === iv.id} className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors flex items-center gap-1">
                      <HiOutlineCheck className="w-3.5 h-3.5" /> Complete
                    </button>
                  )}
                  <button onClick={() => navigate(`/social-worker/interventions/${iv.id}`)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><HiOutlineEye className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
            {todayInterventions.map((iv) => {
              const done = iv.status === 'COMPLETED';
              return (
                <div key={iv.id} className={cn('flex items-center gap-4 px-5 py-3.5', done && 'bg-emerald-50/30')}>
                  <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', done ? 'bg-emerald-100' : iv.status === 'IN_PROGRESS' ? 'bg-orange-100' : 'bg-gray-100')}>
                    {done ? <HiOutlineCheckCircle className="w-4 h-4 text-emerald-600" /> : iv.status === 'IN_PROGRESS' ? <HiOutlinePlay className="w-4 h-4 text-orange-600" /> : <HiOutlineClock className="w-4 h-4 text-gray-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn('text-sm font-semibold truncate', done ? 'text-gray-400 line-through' : 'text-gray-900')}>{iv.title}</p>
                    <p className="text-xs text-gray-500">
                      {iv.caseBeneficiaryName || iv.caseNumber} &bull; {formatEnum(iv.type)}
                      {iv.plannedStartDatetime ? ` &bull; ${formatDateTime(iv.plannedStartDatetime)}` : ''}
                      {iv.location ? ` &bull; ${iv.location}` : ''}
                    </p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    {!done && iv.status !== 'IN_PROGRESS' && (
                      <button onClick={() => handleInterventionStatus(iv.id, 'IN_PROGRESS')} disabled={actionLoading === iv.id} className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-orange-100 text-orange-700 hover:bg-orange-200 transition-colors flex items-center gap-1">
                        <HiOutlinePlay className="w-3.5 h-3.5" /> Start
                      </button>
                    )}
                    {iv.status === 'IN_PROGRESS' && (
                      <button onClick={() => handleInterventionStatus(iv.id, 'COMPLETED')} disabled={actionLoading === iv.id} className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors flex items-center gap-1">
                        <HiOutlineCheck className="w-3.5 h-3.5" /> Complete
                      </button>
                    )}
                    <button onClick={() => navigate(`/social-worker/interventions/${iv.id}`)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><HiOutlineEye className="w-4 h-4" /></button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ALERTS: Cases without interventions + Overdue follow-ups + Overdue tasks */}
      {alertCount > 0 && (
        <div className="bg-white rounded-2xl border border-amber-200 shadow-md overflow-hidden">
          <div className="flex items-center gap-2 px-6 py-4 border-b border-amber-100 bg-amber-50/60">
            <HiOutlineBell className="w-5 h-5 text-amber-600" />
            <h3 className="text-sm font-bold text-amber-800">Needs Your Attention ({alertCount})</h3>
          </div>
          <div className="p-4 space-y-2">
            {casesWithoutInterventions.map((c) => (
              <div key={`no-int-${c.id}`} className="flex items-center gap-3 p-3 bg-red-50 rounded-xl border border-red-100">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0"><HiOutlineExclamation className="w-4 h-4 text-red-600" /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{c.beneficiaryName} <span className="text-xs text-gray-400">({c.caseNumber})</span></p>
                  <p className="text-xs text-red-600 font-medium">No interventions planned &mdash; this case needs an intervention</p>
                </div>
                <button onClick={() => navigate(`/social-worker/interventions/create`)} className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary text-white hover:bg-primary-700 transition-colors flex items-center gap-1">
                  <HiOutlinePlus className="w-3.5 h-3.5" /> Add
                </button>
              </div>
            ))}
            {overdueFollowUps.map((c) => (
              <div key={`fup-${c.id}`} className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl border border-amber-100">
                <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0"><HiOutlineCalendar className="w-4 h-4 text-amber-600" /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{c.beneficiaryName} <span className="text-xs text-gray-400">({c.caseNumber})</span></p>
                  <p className="text-xs text-amber-700 font-medium">Follow-up overdue since {formatDate(c.nextFollowUpDate)}</p>
                </div>
                <button onClick={() => navigate(`/social-worker/cases/${c.id}`)} className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-100 text-amber-800 hover:bg-amber-200 transition-colors">View</button>
              </div>
            ))}
            {overdueTasks.map((t) => (
              <div key={`task-${t.taskId}`} className="flex items-center gap-3 p-3 bg-orange-50 rounded-xl border border-orange-100">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0"><HiOutlineClipboardList className="w-4 h-4 text-orange-600" /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{t.taskTitle}</p>
                  <p className="text-xs text-orange-700 font-medium">{t.beneficiaryName} ({t.caseNumber}) &bull; Due {t.dueDate}</p>
                </div>
                <button onClick={() => navigate(`/social-worker/cases/${t.caseId}`)} className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-orange-100 text-orange-800 hover:bg-orange-200 transition-colors">View</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* STAT CARDS */}
      <div>
        <h2 className="text-xs font-bold text-gray-500 mb-4 uppercase tracking-widest">My Overview</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="My Cases" value={stats.totalCases} icon={HiOutlineFolder} color="primary" subtitle="Total assigned" />
          <StatCard title="Open Cases" value={stats.openCases} icon={HiOutlineFolderOpen} color="warning" subtitle="Awaiting action" />
          <StatCard title="Interventions" value={stats.interventions} icon={HiOutlineClipboardList} color="purple" subtitle="All interventions" />
          <StatCard title="Completed" value={stats.completedInterventions} icon={HiOutlineCheckCircle} color="secondary" subtitle={`${completionRate}% rate`} />
        </div>
      </div>

      {/* PERFORMANCE + ACTIVITY LOG */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Performance */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-md shadow-gray-200/40 p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-primary-50 rounded-lg flex items-center justify-center"><HiOutlineChartBar className="w-4 h-4 text-primary" /></div>
                  <div><p className="text-sm font-bold text-gray-900">Completion Rate</p><p className="text-xs text-gray-400">Interventions</p></div>
                </div>
                <span className={cn('text-lg font-extrabold', completionRate >= 70 ? 'text-emerald-600' : completionRate >= 50 ? 'text-amber-600' : 'text-red-500')}>{completionRate}%</span>
              </div>
              <ProgressBar value={completionRate} color={completionRate >= 70 ? 'bg-emerald-500' : completionRate >= 50 ? 'bg-amber-500' : 'bg-red-500'} />
              <div className="flex justify-between text-xs text-gray-400 mt-2"><span>{stats.completedInterventions} completed</span><span>{stats.interventions} total</span></div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-md shadow-gray-200/40 p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-sky-50 rounded-lg flex items-center justify-center"><HiOutlineTrendingUp className="w-4 h-4 text-sky-500" /></div>
                  <div><p className="text-sm font-bold text-gray-900">Today's Progress</p><p className="text-xs text-gray-400">Scheduled vs Done</p></div>
                </div>
                <span className="text-lg font-extrabold text-sky-600">{todayStats.totalScheduledToday ? Math.round((todayStats.completedToday / todayStats.totalScheduledToday) * 100) : 0}%</span>
              </div>
              <ProgressBar value={todayStats.totalScheduledToday ? (todayStats.completedToday / todayStats.totalScheduledToday) * 100 : 0} color="bg-sky-500" />
              <div className="flex justify-between text-xs text-gray-400 mt-2"><span>{todayStats.completedToday || 0} done</span><span>{todayStats.totalScheduledToday || 0} scheduled</span></div>
            </div>
          </div>

          {/* Recent Cases */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-md shadow-gray-200/40 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div><h3 className="text-sm font-bold text-gray-900">My Recent Cases</h3><p className="text-xs text-gray-400 mt-0.5">Latest case activities</p></div>
              <Link to={ROUTES.SOCIAL_WORKER.MY_CASES} className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-700 transition-colors">View All <HiArrowRight className="w-3 h-3" /></Link>
            </div>
            <div className="divide-y divide-gray-50">
              {recentCases.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-14 text-gray-400"><HiOutlineFolder className="w-10 h-10 mb-2 opacity-30" /><p className="text-sm">No cases found</p></div>
              ) : recentCases.map((c) => (
                <Link key={c.id} to={`${ROUTES.SOCIAL_WORKER.MY_CASES}/${c.id}`} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50/80 transition-colors group">
                  <div className={cn('w-2 h-2 rounded-full flex-shrink-0', c.priority === 'HIGH' ? 'bg-red-500' : c.priority === 'MEDIUM' ? 'bg-amber-500' : 'bg-emerald-500')} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-primary transition-colors">{c.beneficiaryName || c.title}</p>
                      {(c.interventionCount === 0 || c.interventionCount == null) && c.status !== 'CLOSED' && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-600 flex-shrink-0">NO INTERVENTIONS</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-gray-400">{c.caseNumber}</span>
                      <span className="text-gray-200">&middot;</span>
                      <span className="text-xs text-gray-400">{formatRelativeTime(c.updatedAt)}</span>
                    </div>
                  </div>
                  <StatusBadge status={c.status} />
                  {c.progressPercent != null && (
                    <div className="hidden sm:flex items-center gap-1.5">
                      <div className="w-14 bg-gray-100 rounded-full h-1.5 overflow-hidden"><div className="h-full bg-primary rounded-full" style={{ width: `${c.progressPercent}%` }} /></div>
                      <span className="text-xs text-gray-400 w-7 text-right">{c.progressPercent}%</span>
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* SIDEBAR: Today's Activity Log + Quick Actions */}
        <div className="flex flex-col gap-5">
          {/* Today's Activity Log */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-md shadow-gray-200/40 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 bg-violet-50/40">
              <div className="flex items-center gap-2">
                <HiOutlineDocumentText className="w-4 h-4 text-violet-600" />
                <h3 className="text-sm font-bold text-gray-900">Today's Activity Log</h3>
              </div>
              <button onClick={() => setShowLogModal(true)} className="text-xs font-semibold text-primary hover:text-primary-700 flex items-center gap-1">
                <HiOutlinePlus className="w-3 h-3" /> Log
              </button>
            </div>
            <div className="p-4 space-y-2 max-h-80 overflow-y-auto">
              {recentActivities.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <HiOutlinePencilAlt className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No activities logged today</p>
                  <button onClick={() => setShowLogModal(true)} className="mt-2 text-xs font-semibold text-primary hover:underline">Log your first activity</button>
                </div>
              ) : recentActivities.map((a) => (
                <div key={a.id} className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-bold', a.type === 'NOTE' ? 'bg-blue-100 text-blue-700' : a.type === 'TASK' ? 'bg-orange-100 text-orange-700' : 'bg-purple-100 text-purple-700')}>{a.type}</span>
                    <span className="text-xs text-gray-400">{a.caseNumber}</span>
                  </div>
                  <p className="text-sm font-medium text-gray-800">{a.title}</p>
                  {a.content && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{a.content}</p>}
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-md shadow-gray-200/40 p-5">
            <h3 className="text-sm font-bold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-2">
              {[
                { to: ROUTES.SOCIAL_WORKER.MY_CASES, icon: HiOutlineFolder, label: 'My Cases', color: 'text-primary bg-primary-50' },
                { to: ROUTES.SOCIAL_WORKER.INTERVENTIONS, icon: HiOutlineClipboardList, label: 'Interventions', color: 'text-violet-600 bg-violet-50' },
                { to: ROUTES.SOCIAL_WORKER.SCHEDULE, icon: HiOutlineCalendar, label: 'My Schedule', color: 'text-sky-600 bg-sky-50' },
                { to: ROUTES.SOCIAL_WORKER.FIELD_WORK, icon: HiOutlineLocationMarker, label: 'Field Work', color: 'text-emerald-600 bg-emerald-50' },
                { to: ROUTES.SOCIAL_WORKER.MY_REPORTS, icon: HiOutlineDocumentText, label: 'My Reports', color: 'text-amber-600 bg-amber-50' },
              ].map(({ to, icon: Icon, label, color }) => (
                <Link key={to} to={to} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group">
                  <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0', color)}><Icon className="w-4 h-4" /></div>
                  <span className="text-sm font-semibold text-gray-700 group-hover:text-primary transition-colors flex-1">{label}</span>
                  <HiArrowRight className="w-4 h-4 text-gray-300 group-hover:text-primary transition-colors" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ACTIVITY LOG MODAL */}
      <Modal isOpen={showLogModal} onClose={() => { setShowLogModal(false); setLogContent(''); setLogCase(null); }} title="Log Daily Activity" size="md"
        footer={<><Button variant="ghost" onClick={() => setShowLogModal(false)}>Cancel</Button><Button loading={logSaving} onClick={handleSaveLog} disabled={!logCase || !logContent.trim()}><HiOutlineSave className="w-4 h-4 mr-1" /> Save Activity</Button></>}>
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Record what you did today for a specific case. This will be saved as a progress note.</p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Select Case *</label>
            <select value={logCase || ''} onChange={(e) => setLogCase(e.target.value ? Number(e.target.value) : null)} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary">
              <option value="">Choose a case...</option>
              {workerCases.map((c) => <option key={c.id} value={c.id}>{c.caseNumber} &mdash; {c.beneficiaryName || c.title}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">What did you do? *</label>
            <textarea value={logContent} onChange={(e) => setLogContent(e.target.value)} rows={5} placeholder="Describe your activity... e.g., Visited beneficiary at home, conducted health assessment, provided counseling session..." className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none" />
          </div>
        </div>
      </Modal>
    </div>
  );
}
