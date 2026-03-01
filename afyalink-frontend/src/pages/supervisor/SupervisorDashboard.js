import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { caseApi } from '../../api/caseApi';
import { interventionApi } from '../../api/interventionApi';
import { beneficiaryApi } from '../../api/beneficiaryApi';
import StatusBadge from '../../components/shared/StatusBadge';
import PriorityBadge from '../../components/shared/PriorityBadge';
import Spinner from '../../components/common/Spinner';
import { formatDate, formatRelativeTime } from '../../utils/formatDate';
import { formatEnum } from '../../utils/helpers';
import { ROUTES } from '../../routes/routeConstants';
import {
  HiOutlineFolder,
  HiOutlineHeart,
  HiOutlineClipboardList,
  HiOutlineEye,
  HiOutlineExclamation,
  HiOutlineFolderOpen,
  HiOutlineCheckCircle,
  HiArrowRight,
  HiOutlineChartBar,
  HiOutlineLightningBolt,
  HiOutlineClock,
  HiOutlineBell,
  HiOutlineDocumentText,
  HiOutlineTrendingUp,
  HiOutlineCalendar,
  HiOutlineShieldCheck,
} from 'react-icons/hi';

/* ─── helper ── */
function cn(...c) { return c.filter(Boolean).join(' '); }

/* ─── colour palette ── */
const PAL = {
  primary:   { bg: 'bg-primary-50',   icon: 'bg-primary',    text: 'text-primary',    ring: 'ring-primary/20',    bar: 'bg-primary'    },
  warning:   { bg: 'bg-amber-50',     icon: 'bg-amber-500',  text: 'text-amber-600',  ring: 'ring-amber-200',     bar: 'bg-amber-500'  },
  info:      { bg: 'bg-sky-50',       icon: 'bg-sky-500',    text: 'text-sky-600',    ring: 'ring-sky-200',       bar: 'bg-sky-500'    },
  danger:    { bg: 'bg-rose-50',      icon: 'bg-rose-500',   text: 'text-rose-600',   ring: 'ring-rose-200',      bar: 'bg-rose-500'   },
  purple:    { bg: 'bg-violet-50',    icon: 'bg-violet-500', text: 'text-violet-600', ring: 'ring-violet-200',    bar: 'bg-violet-500' },
  secondary: { bg: 'bg-emerald-50',   icon: 'bg-emerald-500',text: 'text-emerald-600',ring: 'ring-emerald-200',   bar: 'bg-emerald-500'},
};

/* ─── StatCard ── */
function StatCard({ title, value, icon: Icon, color = 'primary', subtitle }) {
  const p = PAL[color];
  return (
    <div className={cn(
      'relative overflow-hidden rounded-2xl p-5 border border-white/60 shadow-lg shadow-gray-200/50',
      'hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 group', p.bg
    )}>
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
           style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 0%,rgba(255,255,255,0.45),transparent)' }} />
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

/* ─── QuickAction ── */
function QuickAction({ to, icon: Icon, label, desc, color = 'primary' }) {
  const p = PAL[color];
  return (
    <Link to={to} className={cn(
      'group flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-100/80',
      'shadow-md shadow-gray-200/40 hover:shadow-lg hover:shadow-primary/10',
      'hover:-translate-y-0.5 hover:border-primary/20 transition-all duration-200'
    )}>
      <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center shadow-sm ring-2 flex-shrink-0 group-hover:scale-110 transition-transform', p.icon, p.ring)}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-gray-900 group-hover:text-primary transition-colors">{label}</p>
        <p className="text-xs text-gray-400 truncate">{desc}</p>
      </div>
      <HiArrowRight className="w-4 h-4 text-gray-300 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
    </Link>
  );
}

/* ─── ProgressBar ── */
function ProgressBar({ value = 0, color = 'bg-primary' }) {
  return (
    <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
      <div className={cn('h-full rounded-full transition-all duration-700', color)}
           style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   MAIN
══════════════════════════════════════════════════════════ */
export default function SupervisorDashboard() {
  const { user } = useAuth();

  const [stats, setStats] = useState({
    totalCases: 0, openCases: 0, inProgressCases: 0, closedCases: 0,
    beneficiaries: 0, interventions: 0, completedInterventions: 0, inProgressInterventions: 0,
  });
  const [recentCases, setRecentCases]                 = useState([]);
  const [recentInterventions, setRecentInterventions] = useState([]);
  const [overdueCases, setOverdueCases]               = useState([]);
  const [loading, setLoading]                         = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [
          allC, openC, ipC, closedC, benR,
          allI, compI, ipI,
          cList, iList, overdueR,
        ] = await Promise.allSettled([
          caseApi.getAll({ page: 0, size: 1 }),
          caseApi.getByStatus('OPEN',        { page: 0, size: 1 }),
          caseApi.getByStatus('IN_PROGRESS', { page: 0, size: 1 }),
          caseApi.getByStatus('CLOSED',      { page: 0, size: 1 }),
          beneficiaryApi.getAll({ page: 0, size: 1 }),
          interventionApi.getAll({ page: 0, size: 1 }),
          interventionApi.getByStatus('COMPLETED',   { page: 0, size: 1 }),
          interventionApi.getByStatus('IN_PROGRESS', { page: 0, size: 1 }),
          caseApi.getAll({ page: 0, size: 6, sortBy: 'updatedAt', direction: 'DESC' }),
          interventionApi.getAll({ page: 0, size: 5, sortBy: 'createdAt', direction: 'DESC' }),
          caseApi.getOverdue ? caseApi.getOverdue({ page: 0, size: 4 }) : Promise.resolve(null),
        ]);

        const g = (r, key = 'totalElements') =>
          r.status === 'fulfilled' ? r.value?.data?.[key] ?? 0 : 0;

        setStats({
          totalCases:              g(allC),
          openCases:               g(openC),
          inProgressCases:         g(ipC),
          closedCases:             g(closedC),
          beneficiaries:           g(benR),
          interventions:           g(allI),
          completedInterventions:  g(compI),
          inProgressInterventions: g(ipI),
        });

        if (cList.status === 'fulfilled')
          setRecentCases(cList.value?.data?.content || []);
        if (iList.status === 'fulfilled')
          setRecentInterventions(iList.value?.data?.content || []);
        if (overdueR.status === 'fulfilled' && overdueR.value)
          setOverdueCases(overdueR.value?.data?.content || []);

      } catch { /* silent */ } finally { setLoading(false); }
    }
    load();
  }, []);

  const completionRate = stats.interventions > 0
    ? Math.round((stats.completedInterventions / stats.interventions) * 100) : 0;
  const progressRate = stats.totalCases > 0
    ? Math.round((stats.inProgressCases / stats.totalCases) * 100) : 0;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  if (loading) return (
    <div className="space-y-6 animate-pulse">
      <div className="h-28 bg-gray-100 rounded-2xl" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => <div key={i} className="h-28 bg-gray-100 rounded-2xl" />)}
      </div>
    </div>
  );

  return (
    <div className="space-y-7 pb-8">

      {/* ── HERO HEADER ── */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl shadow-xl shadow-primary/25">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary-600 to-secondary opacity-[0.97]" />
        <div className="absolute inset-0 opacity-[0.12] pointer-events-none"
          style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 70% 60% at 80% 50%,rgba(255,255,255,0.12),transparent)' }} />

        <div className="relative p-7 text-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
          <div>
            <p className="text-white/70 text-sm font-medium mb-1">{greeting},</p>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-1">
              {user?.fullName ?? 'Supervisor'}
            </h1>
            <p className="text-white/80 text-sm">Supervisor Dashboard &mdash; Monitor your team&apos;s performance</p>
          </div>

          {/* KPI pills */}
          <div className="flex flex-wrap gap-3">
            {[
              { icon: HiOutlineFolder,       val: stats.totalCases,    label: 'Total Cases'    },
              { icon: HiOutlineHeart,        val: stats.beneficiaries, label: 'Beneficiaries'  },
              { icon: HiOutlineCheckCircle,  val: `${completionRate}%`,label: 'Completion'     },
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
      </div>

      {/* ── STAT CARDS ROW 1 ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Cases"    value={stats.totalCases}      icon={HiOutlineFolder}       color="primary"   subtitle="All team cases"     />
        <StatCard title="Open Cases"     value={stats.openCases}       icon={HiOutlineFolderOpen}   color="warning"   subtitle="Awaiting action"    />
        <StatCard title="In Progress"    value={stats.inProgressCases} icon={HiOutlineLightningBolt}color="info"      subtitle={`${progressRate}% of total`} />
        <StatCard title="Beneficiaries"  value={stats.beneficiaries}   icon={HiOutlineHeart}        color="danger"    subtitle="Registered"         />
      </div>

      {/* ── STAT CARDS ROW 2 ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Interventions"  value={stats.interventions}           icon={HiOutlineClipboardList} color="purple"    subtitle="All interventions"  />
        <StatCard title="Completed"      value={stats.completedInterventions}  icon={HiOutlineCheckCircle}   color="secondary" subtitle={`${completionRate}% rate`} />
        <StatCard title="Active Now"     value={stats.inProgressInterventions} icon={HiOutlineExclamation}   color="info"      subtitle="In progress"        />
        <StatCard title="Closed Cases"   value={stats.closedCases}             icon={HiOutlineShieldCheck}   color="secondary" subtitle="Resolved"           />
      </div>

      {/* ── PERFORMANCE METERS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-md shadow-gray-200/40 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary-50 rounded-lg flex items-center justify-center">
                <HiOutlineChartBar className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">Intervention Completion</p>
                <p className="text-xs text-gray-400">Q2 Target: 70%</p>
              </div>
            </div>
            <span className={cn('text-lg font-extrabold',
              completionRate >= 70 ? 'text-emerald-600' :
              completionRate >= 50 ? 'text-amber-600'   : 'text-red-500')}>
              {completionRate}%
            </span>
          </div>
          <ProgressBar value={completionRate}
            color={completionRate >= 70 ? 'bg-emerald-500' : completionRate >= 50 ? 'bg-amber-500' : 'bg-red-500'} />
          <div className="flex justify-between text-xs text-gray-400 mt-2">
            <span>{stats.completedInterventions} completed</span>
            <span>{stats.interventions} total</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-md shadow-gray-200/40 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-sky-50 rounded-lg flex items-center justify-center">
                <HiOutlineTrendingUp className="w-4 h-4 text-sky-500" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">Case Progress Rate</p>
                <p className="text-xs text-gray-400">Active vs total cases</p>
              </div>
            </div>
            <span className="text-lg font-extrabold text-sky-600">{progressRate}%</span>
          </div>
          <ProgressBar value={progressRate} color="bg-sky-500" />
          <div className="flex justify-between text-xs text-gray-400 mt-2">
            <span>{stats.inProgressCases} in progress</span>
            <span>{stats.totalCases} total</span>
          </div>
        </div>
      </div>

      {/* ── QUICK ACTIONS ── */}
      <div>
        <h2 className="text-xs font-bold text-gray-500 mb-3 uppercase tracking-widest">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <QuickAction to={ROUTES.SUPERVISOR.CASES}         icon={HiOutlineFolder}        label="Team Cases"    desc="Monitor all cases"       color="primary"   />
          <QuickAction to={ROUTES.SUPERVISOR.CASE_MONITOR}  icon={HiOutlineEye}            label="Case Monitor"  desc="Real-time monitoring"    color="info"      />
          <QuickAction to={ROUTES.SUPERVISOR.INTERVENTIONS} icon={HiOutlineClipboardList}  label="Interventions" desc="Review & manage"         color="purple"    />
          <QuickAction to={ROUTES.SUPERVISOR.REPORTS}       icon={HiOutlineDocumentText}   label="Reports"       desc="Analytics & exports"     color="secondary" />
        </div>
      </div>

      {/* ── MAIN GRID ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Recent Cases — 2/3 */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-md shadow-gray-200/40 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h3 className="text-sm font-bold text-gray-900">Recent Team Cases</h3>
            <Link to={ROUTES.SUPERVISOR.CASES}
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-700 transition-colors">
              View All <HiArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {recentCases.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 text-gray-400">
                <HiOutlineFolder className="w-10 h-10 mb-2 opacity-30" />
                <p className="text-sm">No cases found</p>
              </div>
            ) : recentCases.map((c) => (
              <Link key={c.id}
                to={`${ROUTES.SUPERVISOR.CASES}/${c.id}`}
                className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50/80 transition-colors group">
                <div className={cn('w-2 h-2 rounded-full flex-shrink-0 mt-0.5',
                  c.priority === 'HIGH' ? 'bg-red-500' : c.priority === 'MEDIUM' ? 'bg-amber-500' : 'bg-emerald-500')} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-primary transition-colors">
                    {c.title}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-gray-400">{c.caseNumber}</span>
                    {c.beneficiaryName && (
                      <><span className="text-gray-200">·</span>
                      <span className="text-xs text-gray-400 truncate">{c.beneficiaryName}</span></>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <StatusBadge status={c.status} />
                  {c.progressPercent != null && (
                    <div className="hidden sm:flex items-center gap-1.5">
                      <div className="w-14 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${c.progressPercent}%` }} />
                      </div>
                      <span className="text-xs text-gray-400 w-7 text-right">{c.progressPercent}%</span>
                    </div>
                  )}
                </div>
                <div className="hidden sm:flex items-center gap-1 text-xs text-gray-400 flex-shrink-0 w-20 justify-end">
                  <HiOutlineClock className="w-3 h-3" />
                  {formatRelativeTime(c.updatedAt)}
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Sidebar — 1/3 */}
        <div className="flex flex-col gap-5">

          {/* Case breakdown donut-like */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-md shadow-gray-200/40 p-5">
            <h3 className="text-sm font-bold text-gray-900 mb-4">Cases by Status</h3>
            <div className="space-y-3.5">
              {[
                { label: 'Open',        value: stats.openCases,       color: 'bg-amber-500',   text: 'text-amber-600'   },
                { label: 'In Progress', value: stats.inProgressCases, color: 'bg-sky-500',     text: 'text-sky-600'     },
                { label: 'Closed',      value: stats.closedCases,     color: 'bg-emerald-500', text: 'text-emerald-600' },
              ].map((item) => {
                const pct = stats.totalCases > 0
                  ? Math.round((item.value / stats.totalCases) * 100) : 0;
                return (
                  <div key={item.label}>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="font-semibold text-gray-700">{item.label}</span>
                      <span className={cn('font-bold', item.text)}>
                        {item.value} <span className="text-gray-400 font-normal">({pct}%)</span>
                      </span>
                    </div>
                    <ProgressBar value={pct} color={item.color} />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Attention needed */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-md shadow-gray-200/40 overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3.5 border-b border-gray-100 bg-red-50/60">
              <HiOutlineBell className="w-4 h-4 text-red-500" />
              <h3 className="text-sm font-bold text-red-700">Needs Attention</h3>
            </div>
            <div className="divide-y divide-gray-50">
              {overdueCases.length === 0 ? (
                <div className="flex flex-col items-center py-8 text-gray-400">
                  <HiOutlineCheckCircle className="w-8 h-8 mb-1.5 text-emerald-400" />
                  <p className="text-xs font-medium text-emerald-600">All cases are on track</p>
                </div>
              ) : overdueCases.map((c) => (
                <Link key={c.id}
                  to={`${ROUTES.SUPERVISOR.CASES}/${c.id}`}
                  className="flex items-start gap-3 px-4 py-3 hover:bg-red-50/40 transition-colors group">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-800 truncate group-hover:text-red-600 transition-colors">
                      {c.title}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">{c.beneficiaryName}</p>
                  </div>
                  <PriorityBadge priority={c.priority} />
                </Link>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* ── INTERVENTIONS TABLE ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-md shadow-gray-200/40 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-sm font-bold text-gray-900">Recent Interventions</h3>
          <Link to={ROUTES.SUPERVISOR.INTERVENTIONS}
            className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-700 transition-colors">
            View All <HiArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          {recentInterventions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <HiOutlineClipboardList className="w-10 h-10 mb-2 opacity-30" />
              <p className="text-sm">No interventions found</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  {['Intervention', 'Type', 'Status', 'Priority', 'Planned Date', 'Effectiveness'].map((h) => (
                    <th key={h} className="text-left text-xs font-bold text-gray-500 uppercase tracking-wide px-5 py-3 first:pl-6 last:pr-6 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentInterventions.map((item) => (
                  <tr key={item.id}
                    className="hover:bg-gray-50/80 transition-colors group cursor-pointer"
                    onClick={() => window.location.assign(`${ROUTES.SUPERVISOR.INTERVENTIONS}/${item.id}`)}>
                    <td className="px-5 py-3.5 pl-6">
                      <p className="font-semibold text-gray-900 group-hover:text-primary transition-colors truncate max-w-[180px]">
                        {item.title}
                      </p>
                      <p className="text-xs text-gray-400 truncate max-w-[180px]">{item.interventionCode}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center text-xs font-medium text-gray-600 bg-gray-100 rounded-lg px-2.5 py-1">
                        {formatEnum(item.type)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5"><StatusBadge status={item.status} /></td>
                    <td className="px-5 py-3.5"><PriorityBadge priority={item.priority} /></td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5 text-xs text-gray-500 whitespace-nowrap">
                        <HiOutlineCalendar className="w-3.5 h-3.5 flex-shrink-0" />
                        {item.plannedStartDatetime ? formatDate(item.plannedStartDatetime) : '—'}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 pr-6">
                      {item.effectivenessPercent != null ? (
                        <div className="flex items-center gap-2">
                          <div className="w-14 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                            <div className={cn('h-full rounded-full',
                              item.effectivenessPercent >= 70 ? 'bg-emerald-500' :
                              item.effectivenessPercent >= 40 ? 'bg-amber-500'   : 'bg-red-500')}
                              style={{ width: `${item.effectivenessPercent}%` }} />
                          </div>
                          <span className="text-xs font-semibold text-gray-600">{item.effectivenessPercent}%</span>
                        </div>
                      ) : <span className="text-xs text-gray-400">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

    </div>
  );
}