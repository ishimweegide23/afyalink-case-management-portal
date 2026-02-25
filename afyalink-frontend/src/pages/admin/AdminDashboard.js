import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { userApi } from '../../api/userApi';
import { caseApi } from '../../api/caseApi';
import { beneficiaryApi } from '../../api/beneficiaryApi';
import { interventionApi } from '../../api/interventionApi';
import { auditLogApi } from '../../api/auditLogApi';
import StatusBadge from '../../components/shared/StatusBadge';
import PriorityBadge from '../../components/shared/PriorityBadge';
import { formatRelativeTime } from '../../utils/formatDate';
import { ROUTES } from '../../routes/routeConstants';
import {
  HiOutlineUsers,
  HiOutlineFolder,
  HiOutlineHeart,
  HiOutlineClipboardList,
  HiOutlineChartBar,
  HiOutlineCog,
  HiOutlineShieldCheck,
  HiOutlineUserAdd,
  HiArrowRight,
  HiOutlineFolderOpen,
  HiOutlineCheckCircle,
  HiOutlineLightningBolt,
  HiOutlineClock,
  HiOutlineTrendingUp,
  HiOutlineDatabase,
  HiOutlineServer,
  HiOutlineGlobe,
  HiOutlineUserGroup,
  HiOutlineChartPie,
} from 'react-icons/hi';

/* ═══ HELPERS ═══ */
function cn(...c) { 
  return c.filter(Boolean).join(' '); 
}

const PAL = {
  primary:   { bg: 'bg-primary-50',   icon: 'bg-primary',      text: 'text-primary',      ring: 'ring-primary/20'     },
  warning:   { bg: 'bg-amber-50',     icon: 'bg-amber-500',    text: 'text-amber-600',    ring: 'ring-amber-200'      },
  info:      { bg: 'bg-sky-50',       icon: 'bg-sky-500',      text: 'text-sky-600',      ring: 'ring-sky-200'        },
  danger:    { bg: 'bg-rose-50',      icon: 'bg-rose-500',     text: 'text-rose-600',     ring: 'ring-rose-200'       },
  purple:    { bg: 'bg-violet-50',    icon: 'bg-violet-500',   text: 'text-violet-600',   ring: 'ring-violet-200'     },
  secondary: { bg: 'bg-emerald-50',   icon: 'bg-emerald-500',  text: 'text-emerald-600',  ring: 'ring-emerald-200'    },
  indigo:    { bg: 'bg-indigo-50',    icon: 'bg-indigo-500',   text: 'text-indigo-600',   ring: 'ring-indigo-200'     },
  orange:    { bg: 'bg-orange-50',    icon: 'bg-orange-500',   text: 'text-orange-600',   ring: 'ring-orange-200'     },
};

/* ═══ STAT CARD ═══ */
function StatCard({ title, value, icon: Icon, color = 'primary', subtitle, trend }) {
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
        {trend && (
          <div className={cn('flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg',
            trend > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700')}>
            <HiOutlineTrendingUp className={cn('w-3 h-3', trend < 0 && 'rotate-180')} />
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div className="relative">
        <div className={cn('text-3xl font-extrabold tracking-tight mb-0.5', p.text)}>{value}</div>
        <p className="text-sm font-semibold text-gray-700">{title}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

/* ═══ QUICK ACTION ═══ */
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

/* ═══ PROGRESS BAR ═══ */
function ProgressBar({ value = 0, color = 'bg-primary' }) {
  return (
    <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
      <div className={cn('h-full rounded-full transition-all duration-700', color)}
           style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════ */
export default function AdminDashboard() {
  const { user } = useAuth();

  const [stats, setStats] = useState({
    users: 0,
    socialWorkers: 0,
    supervisors: 0,
    totalCases: 0,
    activeCases: 0,
    closedCases: 0,
    beneficiaries: 0,
    interventions: 0,
    completedInterventions: 0,
  });
  
  const [recentLogs, setRecentLogs] = useState([]);
  const [recentCases, setRecentCases] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiHealth, setApiHealth] = useState({ users: false, cases: false, overall: false });

  useEffect(() => {
    async function fetchAll() {
      try {
        const [
          usersRes,
          casesRes,
          activeCasesRes,
          closedCasesRes,
          benRes,
          intRes,
          completedRes,
          logsRes,
          recentCasesRes,
          recentUsersRes
        ] = await Promise.allSettled([
          userApi.getAll({ page: 0, size: 1 }),
          caseApi.getAll({ page: 0, size: 1 }),
          caseApi.getAll({ page: 0, size: 1, status: 'IN_PROGRESS' }),
          caseApi.getAll({ page: 0, size: 1, status: 'CLOSED' }),
          beneficiaryApi.getAll({ page: 0, size: 1 }),
          interventionApi.getAll({ page: 0, size: 1 }),
          interventionApi.getAll({ page: 0, size: 1, status: 'COMPLETED' }),
          auditLogApi.getAll({ page: 0, size: 8, sortBy: 'createdAt', direction: 'DESC' }),
          caseApi.getAll({ page: 0, size: 6, sortBy: 'createdAt', direction: 'DESC' }),
          userApi.getAll({ page: 0, size: 5, sortBy: 'createdAt', direction: 'DESC' }),
        ]);

        const getValue = (result) => {
          if (result.status === 'fulfilled' && result.value?.data) {
            return result.value.data.totalElements || 0;
          }
          return 0;
        };

        const getContent = (result) => {
          if (result.status === 'fulfilled' && result.value?.data) {
            return result.value.data.content || [];
          }
          return [];
        };

        const allResults = [usersRes, casesRes, activeCasesRes, closedCasesRes, benRes, intRes, completedRes, logsRes, recentCasesRes, recentUsersRes];
        const fulfilledCount = allResults.filter(r => r.status === 'fulfilled').length;
        setApiHealth({
          users: usersRes.status === 'fulfilled',
          cases: casesRes.status === 'fulfilled',
          overall: fulfilledCount === allResults.length,
          successRate: Math.round((fulfilledCount / allResults.length) * 100),
        });

        let swCount = 0;
        let supCount = 0;
        if (recentUsersRes.status === 'fulfilled' && recentUsersRes.value?.data?.content) {
          const allUsersList = recentUsersRes.value.data.content;
          swCount = allUsersList.filter(u => u.role === 'SOCIAL_WORKER').length;
          supCount = allUsersList.filter(u => u.role === 'SUPERVISOR').length;
        }

        setStats({
          users: getValue(usersRes),
          socialWorkers: swCount,
          supervisors: supCount,
          totalCases: getValue(casesRes),
          activeCases: getValue(activeCasesRes),
          closedCases: getValue(closedCasesRes),
          beneficiaries: getValue(benRes),
          interventions: getValue(intRes),
          completedInterventions: getValue(completedRes),
        });

        setRecentLogs(getContent(logsRes));
        setRecentCases(getContent(recentCasesRes));
        setRecentUsers(getContent(recentUsersRes));

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setApiHealth({ users: false, cases: false, overall: false, successRate: 0 });
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, []);

  const completionRate = stats.interventions > 0
    ? Math.round((stats.completedInterventions / stats.interventions) * 100) : 0;
  const caseProgressRate = stats.totalCases > 0
    ? Math.round((stats.activeCases / stats.totalCases) * 100) : 0;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-32 bg-gray-100 rounded-2xl" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => <div key={i} className="h-28 bg-gray-100 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-7 pb-8">

      {/* ═══ HERO HEADER ═══ */}
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
              {user?.fullName || 'Administrator'}
            </h1>
            <p className="text-white/80 text-sm">System Administrator Dashboard — Complete system overview & control</p>
          </div>

          <div className="flex flex-wrap gap-3">
            {[
              { icon: HiOutlineUsers,    val: stats.users,         label: 'Total Users'     },
              { icon: HiOutlineFolder,   val: stats.totalCases,    label: 'Total Cases'     },
              { icon: HiOutlineDatabase, val: stats.beneficiaries, label: 'Beneficiaries'   },
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

      {/* ═══ SYSTEM OVERVIEW STATS ═══ */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest">System Overview</h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            title="Total Users" 
            value={stats.users} 
            icon={HiOutlineUsers} 
            color="primary" 
            subtitle="All system users"
          />
          <StatCard 
            title="Social Workers" 
            value={stats.socialWorkers} 
            icon={HiOutlineUserGroup} 
            color="info" 
            subtitle="Field workers"
          />
          <StatCard 
            title="Supervisors" 
            value={stats.supervisors} 
            icon={HiOutlineShieldCheck} 
            color="purple" 
            subtitle="Team leaders"
          />
          <StatCard 
            title="Active Users" 
            value={stats.users} 
            icon={HiOutlineLightningBolt} 
            color="secondary" 
            subtitle="Currently active"
          />
        </div>
      </div>

      {/* ═══ CASE MANAGEMENT STATS ═══ */}
      <div>
        <h2 className="text-xs font-bold text-gray-500 mb-4 uppercase tracking-widest">Case Management</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            title="Total Cases" 
            value={stats.totalCases} 
            icon={HiOutlineFolder} 
            color="secondary" 
            subtitle="All cases"
          />
          <StatCard 
            title="Active Cases" 
            value={stats.activeCases} 
            icon={HiOutlineFolderOpen} 
            color="warning" 
            subtitle="In progress"
          />
          <StatCard 
            title="Beneficiaries" 
            value={stats.beneficiaries} 
            icon={HiOutlineHeart} 
            color="danger" 
            subtitle="Total registered"
          />
          <StatCard 
            title="Closed Cases" 
            value={stats.closedCases} 
            icon={HiOutlineCheckCircle} 
            color="purple" 
            subtitle="Completed"
          />
        </div>
      </div>

      {/* ═══ INTERVENTION STATS ═══ */}
      <div>
        <h2 className="text-xs font-bold text-gray-500 mb-4 uppercase tracking-widest">Interventions & Performance</h2>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard 
            title="Total Interventions" 
            value={stats.interventions} 
            icon={HiOutlineClipboardList} 
            color="indigo" 
            subtitle="All interventions"
          />
          <StatCard 
            title="Completed" 
            value={stats.completedInterventions} 
            icon={HiOutlineCheckCircle} 
            color="secondary" 
            subtitle={`${completionRate}% completion rate`}
          />
          <StatCard 
            title="Success Rate" 
            value={`${completionRate}%`}
            icon={HiOutlineTrendingUp} 
            color="purple" 
            subtitle="System-wide metric"
          />
        </div>
      </div>

      {/* ═══ PERFORMANCE METERS ═══ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-md shadow-gray-200/40 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                <HiOutlineChartBar className="w-4 h-4 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">Intervention Completion Rate</p>
                <p className="text-xs text-gray-400">System-wide performance</p>
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
              <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center">
                <HiOutlineChartPie className="w-4 h-4 text-amber-500" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">Active Case Ratio</p>
                <p className="text-xs text-gray-400">Cases currently in progress</p>
              </div>
            </div>
            <span className="text-lg font-extrabold text-amber-600">{caseProgressRate}%</span>
          </div>
          <ProgressBar value={caseProgressRate} color="bg-amber-500" />
          <div className="flex justify-between text-xs text-gray-400 mt-2">
            <span>{stats.activeCases} active</span>
            <span>{stats.totalCases} total</span>
          </div>
        </div>
      </div>

      {/* ═══ QUICK ACTIONS ═══ */}
      <div>
        <h2 className="text-xs font-bold text-gray-500 mb-3 uppercase tracking-widest">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <QuickAction 
            to={ROUTES.ADMIN.USERS} 
            icon={HiOutlineUserAdd} 
            label="Manage Users" 
            desc="Add, edit & remove users" 
            color="primary" 
          />
          <QuickAction 
            to={ROUTES.ADMIN.CASES} 
            icon={HiOutlineFolderOpen} 
            label="All Cases" 
            desc="View & manage all cases" 
            color="secondary" 
          />
          <QuickAction 
            to={ROUTES.ADMIN.BENEFICIARIES} 
            icon={HiOutlineHeart} 
            label="Beneficiaries" 
            desc="Manage beneficiaries" 
            color="danger" 
          />
          <QuickAction 
            to={ROUTES.ADMIN.REPORTS} 
            icon={HiOutlineChartBar} 
            label="Analytics & Reports" 
            desc="System-wide insights" 
            color="purple" 
          />
          <QuickAction 
            to={ROUTES.ADMIN.AUDIT_LOGS} 
            icon={HiOutlineShieldCheck} 
            label="Audit Logs" 
            desc="Track system activity" 
            color="indigo" 
          />
          <QuickAction 
            to={ROUTES.ADMIN.SYSTEM_SETTINGS} 
            icon={HiOutlineCog} 
            label="System Settings" 
            desc="Configure system" 
            color="orange" 
          />
        </div>
      </div>

      {/* ═══ MAIN CONTENT GRID ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Recent Cases */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-md shadow-gray-200/40 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Recent Cases</h3>
              <p className="text-xs text-gray-400 mt-0.5">Latest case activities</p>
            </div>
            <Link to={ROUTES.ADMIN.CASES}
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
                to={`${ROUTES.ADMIN.CASES}/${c.id}`}
                className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50/80 transition-colors group">
                <div className={cn('w-2 h-2 rounded-full flex-shrink-0',
                  c.priority === 'HIGH' ? 'bg-red-500' : c.priority === 'MEDIUM' ? 'bg-amber-500' : 'bg-emerald-500')} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-primary transition-colors">
                    {c.title}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-gray-400">{c.caseNumber}</span>
                    {c.beneficiaryName && (
                      <>
                        <span className="text-gray-200">·</span>
                        <span className="text-xs text-gray-400 truncate">{c.beneficiaryName}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <StatusBadge status={c.status} />
                  <PriorityBadge priority={c.priority} />
                </div>
                <div className="hidden sm:flex items-center gap-1 text-xs text-gray-400 flex-shrink-0">
                  <HiOutlineClock className="w-3 h-3" />
                  {formatRelativeTime(c.createdAt)}
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Users */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-md shadow-gray-200/40 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div>
              <h3 className="text-sm font-bold text-gray-900">New Users</h3>
              <p className="text-xs text-gray-400 mt-0.5">Recently registered</p>
            </div>
            <Link to={ROUTES.ADMIN.USERS}
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-700 transition-colors">
              View All <HiArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {recentUsers.length === 0 ? (
              <div className="flex flex-col items-center py-10 text-gray-400">
                <HiOutlineUsers className="w-8 h-8 mb-1.5 opacity-30" />
                <p className="text-xs">No users found</p>
              </div>
            ) : recentUsers.map((u) => (
              <Link key={u.id}
                to={`${ROUTES.ADMIN.USERS}/${u.id}`}
                className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50/80 transition-colors group">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-xs flex-shrink-0 shadow-sm">
                  {u.fullName?.charAt(0) || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-primary transition-colors">
                    {u.fullName}
                  </p>
                  <p className="text-xs text-gray-400 truncate">{u.email}</p>
                </div>
                <span className={cn('text-xs font-medium px-2 py-1 rounded-lg flex-shrink-0',
                  u.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' :
                  u.role === 'SUPERVISOR' ? 'bg-blue-100 text-blue-700' :
                  'bg-emerald-100 text-emerald-700')}>
                  {u.role}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ AUDIT LOGS ═══ */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-md shadow-gray-200/40 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h3 className="text-sm font-bold text-gray-900">Recent System Activity</h3>
            <p className="text-xs text-gray-400 mt-0.5">Latest audit logs</p>
          </div>
          <Link to={ROUTES.ADMIN.AUDIT_LOGS}
            className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-700 transition-colors">
              View All <HiArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          {recentLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <HiOutlineShieldCheck className="w-10 h-10 mb-2 opacity-30" />
              <p className="text-sm">No activity logs yet</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  <th className="text-left text-xs font-bold text-gray-500 uppercase tracking-wide px-5 py-3 pl-6">Action</th>
                  <th className="text-left text-xs font-bold text-gray-500 uppercase tracking-wide px-5 py-3">User</th>
                  <th className="text-left text-xs font-bold text-gray-500 uppercase tracking-wide px-5 py-3">Entity</th>
                  <th className="text-left text-xs font-bold text-gray-500 uppercase tracking-wide px-5 py-3 pr-6">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-5 py-3.5 pl-6">
                      <span className={cn('inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-lg',
                        log.action === 'CREATE' ? 'bg-emerald-100 text-emerald-700' :
                        log.action === 'UPDATE' ? 'bg-sky-100 text-sky-700' :
                        log.action === 'DELETE' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700')}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs font-medium text-gray-900">{log.performedByName || '—'}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs text-gray-600">{log.entityType}</span>
                    </td>
                    <td className="px-5 py-3.5 pr-6">
                      <div className="flex items-center gap-1.5 text-xs text-gray-400">
                        <HiOutlineClock className="w-3.5 h-3.5" />
                        {formatRelativeTime(log.createdAt)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ═══ SYSTEM HEALTH ═══ */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-md shadow-gray-200/40 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center',
              apiHealth.overall ? 'bg-emerald-50' : 'bg-red-50')}>
              <HiOutlineServer className={cn('w-5 h-5', apiHealth.overall ? 'text-emerald-500' : 'text-red-500')} />
            </div>
            <div>
              <p className="text-xs text-gray-400">API Health</p>
              <p className={cn('text-sm font-bold', apiHealth.overall ? 'text-emerald-600' : 'text-red-600')}>
                {apiHealth.overall ? 'All Services Up' : 'Partial Outage'}
              </p>
            </div>
          </div>
          <ProgressBar value={apiHealth.successRate || 0}
            color={apiHealth.overall ? 'bg-emerald-500' : 'bg-red-500'} />
          <p className="text-xs text-gray-400 mt-2">{apiHealth.successRate || 0}% endpoints responding</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-md shadow-gray-200/40 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center',
              apiHealth.users ? 'bg-sky-50' : 'bg-red-50')}>
              <HiOutlineDatabase className={cn('w-5 h-5', apiHealth.users ? 'text-sky-500' : 'text-red-500')} />
            </div>
            <div>
              <p className="text-xs text-gray-400">User Service</p>
              <p className={cn('text-sm font-bold', apiHealth.users ? 'text-sky-600' : 'text-red-600')}>
                {apiHealth.users ? 'Connected' : 'Unavailable'}
              </p>
            </div>
          </div>
          <ProgressBar value={apiHealth.users ? 100 : 0}
            color={apiHealth.users ? 'bg-sky-500' : 'bg-red-500'} />
          <p className="text-xs text-gray-400 mt-2">{stats.users} users tracked</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-md shadow-gray-200/40 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center',
              apiHealth.cases ? 'bg-purple-50' : 'bg-red-50')}>
              <HiOutlineGlobe className={cn('w-5 h-5', apiHealth.cases ? 'text-purple-500' : 'text-red-500')} />
            </div>
            <div>
              <p className="text-xs text-gray-400">Case Service</p>
              <p className={cn('text-sm font-bold', apiHealth.cases ? 'text-purple-600' : 'text-red-600')}>
                {apiHealth.cases ? 'Connected' : 'Unavailable'}
              </p>
            </div>
          </div>
          <ProgressBar value={apiHealth.cases ? 100 : 0}
            color={apiHealth.cases ? 'bg-purple-500' : 'bg-red-500'} />
          <p className="text-xs text-gray-400 mt-2">{stats.totalCases} cases tracked</p>
        </div>
      </div>

    </div>
  );
}