import React, { useState, useEffect, useCallback } from 'react';
import { analyticsApi } from '../../api/analyticsApi';
import WarningModal from '../../components/shared/WarningModal';
import Spinner from '../../components/common/Spinner';
import { useAuth } from '../../hooks/useAuth'; // role-based guard
import {
  HiOutlineUserGroup, HiOutlineFolder, HiOutlineChartBar,
  HiOutlineTrendingUp, HiOutlineMap, HiOutlineUsers,
  HiOutlineCheckCircle, HiOutlineChevronDown, HiOutlineChevronUp,
  HiOutlineDownload, HiOutlineRefresh, HiOutlineExclamation,
  HiOutlineShieldCheck, HiOutlineCalendar, HiOutlineClock,
  HiOutlineLightningBolt, HiOutlineLocationMarker, HiOutlineScale,
  HiOutlineFlag, HiOutlineArrowUp, HiOutlineArrowDown,
  HiOutlineClipboardList, HiOutlineHeart
} from 'react-icons/hi';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area, ComposedChart
} from 'recharts';
import { toast } from 'react-toastify';
import { systemApi } from '../../api/systemApi';
import {
  SYSTEM_START_YEAR,
  SYSTEM_START_MONTH,
  getCurrentYear,
  getCurrentMonthString,
  getCurrentWeekString,
  getTodayISO,
  validateAnalyticsEndDate,
  resolvePeriodEnd,
  initServerDate,
  clampYear,
  clampMonth,
  clampWeek,
} from '../../utils/dateValidation';

/* ─────────── Design tokens (matching screenshot teal/green palette) ─────────── */
const PALETTE = {
  primary:   '#0D9488',
  primary600: '#0F766E',
  secondary: '#10B981',
  indigo:    '#6366F1',
  amber:     '#F59E0B',
  red:       '#EF4444',
  purple:    '#8B5CF6',
  blue:      '#3B82F6',
  rose:      '#F43F5E',
  cyan:      '#06B6D4',
};
const CHART_COLORS = [PALETTE.primary, PALETTE.indigo, PALETTE.amber, PALETTE.red, PALETTE.secondary, PALETTE.purple, PALETTE.blue, PALETTE.cyan];

/* ─────────── Custom Tooltip ─────────── */
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '10px 14px', boxShadow: '0 4px 20px rgba(0,0,0,0.10)' }}>
      <p style={{ fontWeight: 700, color: '#111', marginBottom: 4, fontSize: 12 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color, fontSize: 12, margin: '2px 0' }}>
          <span style={{ fontWeight: 600 }}>{p.name}:</span> {typeof p.value === 'number' && p.name?.includes('Rate') ? `${p.value}%` : p.value}
        </p>
      ))}
    </div>
  );
};

/* ─────────── KPI Card ─────────── */
const KpiCard = ({ icon: Icon, label, value, sub, color, trend, trendVal }) => (
  <div style={{
    background: '#fff', borderRadius: 20, border: '1px solid #F3F4F6',
    boxShadow: '0 2px 12px rgba(0,0,0,0.04)', padding: '20px 18px',
    display: 'flex', flexDirection: 'column', gap: 8, transition: 'all .2s',
    cursor: 'default', position: 'relative', overflow: 'hidden'
  }}
    onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 28px rgba(13,148,136,.12)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
    onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.04)'; e.currentTarget.style.transform = 'none'; }}
  >
    <div style={{ position: 'absolute', top: 0, right: 0, width: 80, height: 80, borderRadius: '0 20px 0 80px', background: `${color}10` }} />
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ background: `${color}15`, borderRadius: 12, padding: 8, display: 'flex' }}>
        <Icon style={{ color, width: 20, height: 20 }} />
      </div>
      {trend && (
        <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, fontWeight: 700, color: trend === 'up' ? '#10B981' : '#EF4444' }}>
          {trend === 'up' ? <HiOutlineArrowUp style={{ width: 12 }} /> : <HiOutlineArrowDown style={{ width: 12 }} />}
          {trendVal}
        </span>
      )}
    </div>
    <div>
      <p style={{ fontSize: 26, fontWeight: 800, color: '#111', letterSpacing: '-0.5px', lineHeight: 1 }}>{value}</p>
      <p style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 4 }}>{label}</p>
      {sub && <p style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>{sub}</p>}
    </div>
  </div>
);

/* ─────────── Section Header ─────────── */
const SectionHeader = ({ icon: Icon, title, subtitle, right }) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ background: `${PALETTE.primary}15`, borderRadius: 10, padding: 8, display: 'flex' }}>
        <Icon style={{ color: PALETTE.primary, width: 18, height: 18 }} />
      </div>
      <div>
        <h2 style={{ fontSize: 16, fontWeight: 800, color: '#111', margin: 0 }}>{title}</h2>
        {subtitle && <p style={{ fontSize: 12, color: '#9CA3AF', margin: '2px 0 0' }}>{subtitle}</p>}
      </div>
    </div>
    {right}
  </div>
);

/* ─────────── Performance Badge ─────────── */
const PerfBadge = ({ rate }) => {
  if (rate >= 85) return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 99, background: '#D1FAE5', color: '#065F46', fontSize: 11, fontWeight: 700 }}><HiOutlineCheckCircle style={{ width: 12 }} />High</span>;
  if (rate >= 70) return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 99, background: '#FEF3C7', color: '#92400E', fontSize: 11, fontWeight: 700 }}>Average</span>;
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 99, background: '#FEE2E2', color: '#991B1B', fontSize: 11, fontWeight: 700 }}><HiOutlineExclamation style={{ width: 12 }} />Needs Attention</span>;
};

/* ─────────── Progress Bar ─────────── */
const ProgressBar = ({ value, max = 100, color = PALETTE.primary, height = 6 }) => (
  <div style={{ background: '#F3F4F6', borderRadius: 99, overflow: 'hidden', height }}>
    <div style={{ width: `${Math.min((value / max) * 100, 100)}%`, background: color, height: '100%', borderRadius: 99, transition: 'width .5s ease' }} />
  </div>
);

/* ═══════════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════════ */
export default function OrgAnalyticsPage() {
  /* ── Role Guard ── */
  const { user } = useAuth?.() ?? { user: { role: 'ADMIN' } };
  /* ── State ── */
  const getWeekString = (d) => {
    const date = new Date(d.getTime());
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
    const week1 = new Date(date.getFullYear(), 0, 4);
    const weekNumber = 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
    return `${date.getFullYear()}-W${weekNumber.toString().padStart(2, '0')}`;
  };

  const [period, setPeriod] = useState('MONTHLY');
  const [selectedMonth, setSelectedMonth] = useState(() => getCurrentMonthString());
  const [selectedYear, setSelectedYear] = useState(() => String(getCurrentYear()));
  const [selectedWeek, setSelectedWeek] = useState(() => getCurrentWeekString());
  const [serverDateReady, setServerDateReady] = useState(false);
  const [dateWarning, setDateWarning] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // overview | districts | supervisors | workers | beneficiaries
  const [summary, setSummary] = useState(null);
  const [districtPerformance, setDistrictPerformance] = useState([]);
  const [caseTrends, setCaseTrends] = useState([]);
  const [monthlyBreakdown, setMonthlyBreakdown] = useState([]);
  const [interventionTypes, setInterventionTypes] = useState([]);
  const [casesByPriority, setCasesByPriority] = useState([]);
  const [casesByType, setCasesByType] = useState([]);
  const [expandedSupervisor, setExpandedSupervisor] = useState(null);
  const [workersUnderSupervisor, setWorkersUnderSupervisor] = useState({});
  const [loadingWorkers, setLoadingWorkers] = useState(false);
  const [warningModal, setWarningModal] = useState({ open: false, user: null });
  const [exporting, setExporting] = useState(false);
  const [supervisorSort, setSupervisorSort] = useState({ key: 'successRate', dir: 'desc' });

  const getDerivedBaseDate = useCallback(() => {
    if (period === 'MONTHLY') {
      return resolvePeriodEnd('MONTHLY', { month: selectedMonth || getCurrentMonthString() });
    }
    if (period === 'YEARLY') {
      return resolvePeriodEnd('YEARLY', { year: selectedYear || getCurrentYear() });
    }
    if (period === 'WEEKLY') {
      return resolvePeriodEnd('WEEKLY', { week: selectedWeek || getCurrentWeekString() });
    }
    return getTodayISO();
  }, [period, selectedMonth, selectedYear, selectedWeek]);

  useEffect(() => {
    initServerDate(systemApi).then(() => {
      setSelectedMonth(getCurrentMonthString());
      setSelectedYear(String(getCurrentYear()));
      setSelectedWeek(getCurrentWeekString());
      setServerDateReady(true);
    });
  }, []);

  /* ── Fetch ── */
  const fetchAllData = useCallback(async () => {
    setLoading(true);
    const baseDate = getDerivedBaseDate();
    const validation = validateAnalyticsEndDate(baseDate);

    if (!validation.valid) {
      toast.error(validation.message);
      setLoading(false);
      return;
    }

    if (validation.emptyBecauseBeforeSystem) {
      setDateWarning(validation.message);
      setSummary(null);
      setDistrictPerformance([]);
      setCaseTrends([]);
      setInterventionTypes([]);
      setCasesByPriority([]);
      setCasesByType([]);
      setMonthlyBreakdown([]);
      setLoading(false);
      return;
    }

    setDateWarning(null);

    try {
      const [
        summaryRes, districtRes, trendsRes, interventionRes, priorityRes, typeRes
      ] = await Promise.allSettled([
        analyticsApi.getOrgSummary({ period, endDate: baseDate }),
        analyticsApi.getAllDistrictsPerformance({ period, endDate: baseDate }),
        analyticsApi.getCaseTrends({ period, endDate: baseDate }),
        analyticsApi.getInterventionSuccessByType({ period, endDate: baseDate }),
        analyticsApi.getCasesByPriority({ endDate: baseDate }),
        analyticsApi.getCasesByType?.({ period, endDate: baseDate }),
      ]);

      if (summaryRes.status === 'fulfilled') {
        const s = summaryRes.value?.data ?? summaryRes.value;
        setSummary(s);
        if (s?.warningMessage) setDateWarning(s.warningMessage);
      }
      if (districtRes.status === 'fulfilled') setDistrictPerformance(districtRes.value?.data ?? []);
      if (trendsRes.status === 'fulfilled') setCaseTrends(trendsRes.value?.data ?? []);
      if (interventionRes.status === 'fulfilled') setInterventionTypes(interventionRes.value?.data ?? []);
      if (priorityRes.status === 'fulfilled') setCasesByPriority(priorityRes.value?.data ?? []);
      if (typeRes.status === 'fulfilled') setCasesByType(typeRes.value?.data ?? []);

      if (period === 'YEARLY') {
        const selectedYear = new Date(baseDate).getFullYear() || new Date().getFullYear();
        const monthlyRes = await analyticsApi.getMonthlyBreakdown({ year: selectedYear, endDate: baseDate });
        setMonthlyBreakdown(monthlyRes?.data ?? []);
      } else {
        setMonthlyBreakdown([]);
      }
    } catch (err) {
      console.error(err);
      const msg = err?.response?.data?.message || err?.message;
      if (err?.response?.status === 400 && msg) {
        setDateWarning(msg);
        setSummary(null);
        setDistrictPerformance([]);
        setCaseTrends([]);
        setInterventionTypes([]);
        setCasesByPriority([]);
        setCasesByType([]);
        setMonthlyBreakdown([]);
      }
      if (msg) toast.error(msg);
      else toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  }, [period, getDerivedBaseDate]);

  useEffect(() => {
    if (serverDateReady) fetchAllData();
  }, [fetchAllData, serverDateReady]);

  /* ── Supervisor drill-down ── */
  const handleToggleSupervisor = async (supId, supName) => {
    if (expandedSupervisor === supId) {
      setExpandedSupervisor(null);
      return;
    }
    setExpandedSupervisor(supId);
    if (workersUnderSupervisor[supId]) return; // cached
    setLoadingWorkers(true);
    try {
      const baseDate = getDerivedBaseDate();
      const res = await analyticsApi.getWorkersUnderSupervisor(supId, { period, endDate: baseDate });
      setWorkersUnderSupervisor(prev => ({ ...prev, [supId]: res?.data ?? [] }));
    } catch {
      toast.error('Failed to load workers');
    } finally {
      setLoadingWorkers(false);
    }
  };

  /* ── Export ── */
  const handleExport = async () => {
    setExporting(true);
    try {
      const baseDate = getDerivedBaseDate();
      const blob = await analyticsApi.exportAnalytics({ period, endDate: baseDate });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `afyalink_analytics_${period.toLowerCase()}_${new Date().toISOString().split('T')[0]}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Exported successfully');
    } catch { toast.error('Export failed'); }
    finally { setExporting(false); }
  };

  /* ── Sorted supervisors ── */
  const sortedSupervisors = [...(summary?.supervisorActivity ?? [])].sort((a, b) => {
    const rateA = districtPerformance.find(d => d.supervisorName === a.fullName)?.successRate ?? 0;
    const rateB = districtPerformance.find(d => d.supervisorName === b.fullName)?.successRate ?? 0;
    const valA = supervisorSort.key === 'successRate' ? rateA : (a[supervisorSort.key] ?? 0);
    const valB = supervisorSort.key === 'successRate' ? rateB : (b[supervisorSort.key] ?? 0);
    return supervisorSort.dir === 'desc' ? valB - valA : valA - valB;
  });

  const toggleSort = (key) => setSupervisorSort(prev => ({ key, dir: prev.key === key && prev.dir === 'desc' ? 'asc' : 'desc' }));

  /* ── Tab nav ── */
  const TABS = [
    { id: 'overview', label: 'Overview', icon: HiOutlineChartBar },
    { id: 'districts', label: 'Districts', icon: HiOutlineMap },
    { id: 'supervisors', label: 'Supervisors', icon: HiOutlineUsers },
    { id: 'beneficiaries', label: 'Beneficiaries', icon: HiOutlineHeart },
  ];

  /* ── Total active cases ── */
  const totalActive = summary ? (summary.totalOpenCases ?? 0) + (summary.totalInProgressCases ?? 0) : 0;

  /* ── Derived best district ── */
  const bestDistrict = districtPerformance.length
    ? [...districtPerformance].sort((a, b) => b.successRate - a.successRate)[0]
    : null;

  if (user?.role !== 'ADMIN') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, gap: 12 }}>
        <HiOutlineShieldCheck style={{ width: 48, height: 48, color: '#E5E7EB' }} />
        <p style={{ fontSize: 16, fontWeight: 700, color: '#6B7280' }}>Access Restricted</p>
        <p style={{ fontSize: 13, color: '#9CA3AF' }}>Only administrators can view organization analytics.</p>
      </div>
    );
  }

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
      <Spinner size="lg" />
    </div>
  );

  /* ════════════════════ RENDER ════════════════════ */
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 40 }}>

      {dateWarning && (
        <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 16, padding: '16px 20px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <HiOutlineExclamation style={{ color: PALETTE.amber, width: 22, height: 22, flexShrink: 0 }} />
          <div>
            <p style={{ fontWeight: 700, fontSize: 14, color: '#92400E', margin: '0 0 4px' }}>No data for this period</p>
            <p style={{ fontSize: 13, color: '#92400E', margin: 0 }}>{dateWarning}</p>
          </div>
        </div>
      )}

      {/* ─── HERO HEADER ─── */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-primary/10 shadow-xl shadow-primary/10">
        {/* gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary-600 to-secondary opacity-[0.97]" />
        {/* pattern */}
        <div
          className="absolute inset-0 opacity-[0.12] pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}
        />
        {/* glow orbs */}
        <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,.08)', filter: 'blur(40px)' }} />
        <div style={{ position: 'absolute', bottom: -20, left: 100, width: 150, height: 150, borderRadius: '50%', background: 'rgba(16,185,129,.3)', filter: 'blur(50px)' }} />

        <div style={{ position: 'relative', padding: '32px 36px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: 20 }}>
            <div style={{ color: '#fff' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 99, background: 'rgba(255,255,255,.15)', border: '1px solid rgba(255,255,255,.25)', backdropFilter: 'blur(8px)', marginBottom: 12 }}>
                <HiOutlineChartBar style={{ width: 15, height: 15 }} />
                <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.04em' }}>ORGANIZATION ANALYTICS</span>
              </div>
              <h1 style={{ fontSize: 32, fontWeight: 900, margin: 0, letterSpacing: '-0.5px', textShadow: '0 2px 10px rgba(0,0,0,.15)' }}>
                Organization Analytics
              </h1>
              <p style={{ margin: '8px 0 0', fontSize: 14, opacity: .85, maxWidth: 480 }}>
                Comprehensive insights into performance, district comparisons, supervisor analytics, and case resolutions across the organization.
              </p>
              {/* live stats strip */}
              {summary && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginTop: 18 }}>
                  {[
                    { label: 'Beneficiaries', val: summary.totalActiveBeneficiaries ?? 0 },
                    { label: 'Active Cases', val: totalActive },
                    { label: 'Closed', val: summary.totalClosedCases ?? 0 },
                    { label: 'Success Rate', val: `${summary.totalInterventionCompletionRate?.toFixed(1) ?? 0}%` },
                  ].map(s => (
                    <div key={s.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'rgba(255,255,255,.12)', borderRadius: 12, padding: '8px 16px', border: '1px solid rgba(255,255,255,.2)' }}>
                      <span style={{ fontSize: 20, fontWeight: 800 }}>{s.val}</span>
                      <span style={{ fontSize: 10, opacity: .8, fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase' }}>{s.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-end' }}>
              {/* Period buttons and Date Picker */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: 6, background: 'rgba(255,255,255,.12)', borderRadius: 12, padding: 4, border: '1px solid rgba(255,255,255,.2)' }}>
                  {['WEEKLY', 'MONTHLY', 'YEARLY'].map(p => (
                    <button key={p} onClick={() => setPeriod(p)} style={{
                      padding: '7px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
                      fontSize: 12, fontWeight: 700, letterSpacing: '.04em',
                      background: period === p ? '#fff' : 'transparent',
                      color: period === p ? PALETTE.primary : 'rgba(255,255,255,.85)',
                      transition: 'all .2s', boxShadow: period === p ? '0 2px 8px rgba(0,0,0,.12)' : 'none'
                    }}>
                      {p.charAt(0) + p.slice(1).toLowerCase()}
                    </button>
                  ))}
                </div>
                {period === 'WEEKLY' && (
                  <input
                    type="week"
                    value={selectedWeek}
                    onChange={(e) => setSelectedWeek(clampWeek(e.target.value))}
                    min={`${SYSTEM_START_YEAR}-W01`}
                    max={getCurrentWeekString()}
                    style={{
                      padding: '8px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,.3)',
                      background: 'rgba(255,255,255,.1)', color: '#fff', fontSize: 13, fontWeight: 600,
                      outline: 'none', cursor: 'pointer',
                    }}
                    title="Select week"
                  />
                )}
                {period === 'MONTHLY' && (
                  <input
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(clampMonth(e.target.value))}
                    min={`${SYSTEM_START_YEAR}-01`}
                    max={getCurrentMonthString()}
                    style={{
                      padding: '8px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,.3)',
                      background: 'rgba(255,255,255,.1)', color: '#fff', fontSize: 13, fontWeight: 600,
                      outline: 'none', cursor: 'pointer',
                    }}
                    title="Select month"
                  />
                )}
                {period === 'YEARLY' && (
                  <input
                    type="number"
                    min={SYSTEM_START_YEAR}
                    max={getCurrentYear()}
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(clampYear(e.target.value))}
                    style={{
                      padding: '8px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,.3)',
                      background: 'rgba(255,255,255,.1)', color: '#fff', fontSize: 13, fontWeight: 600,
                      outline: 'none', cursor: 'pointer', width: 100
                    }}
                    title="Select year"
                  />
                )}
              </div>
              {/* Action buttons */}
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={handleExport} disabled={exporting} style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 10,
                  background: 'rgba(255,255,255,.18)', border: '1px solid rgba(255,255,255,.35)',
                  color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer'
                }}>
                  <HiOutlineDownload style={{ width: 15 }} />
                  {exporting ? 'Exporting…' : 'Export'}
                </button>
                <button onClick={fetchAllData} style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 10,
                  background: 'rgba(255,255,255,.18)', border: '1px solid rgba(255,255,255,.35)',
                  color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer'
                }}>
                  <HiOutlineRefresh style={{ width: 15 }} />
                  Refresh
                </button>
              </div>
              <p style={{ color: 'rgba(255,255,255,.6)', fontSize: 11, margin: 0, textAlign: 'right' }}>
                Last updated: {new Date().toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ─── TAB NAVIGATION ─── */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #F3F4F6', boxShadow: '0 2px 8px rgba(0,0,0,.04)', padding: '6px 8px', display: 'flex', gap: 4, overflowX: 'auto' }}>
        {TABS.map(tab => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', borderRadius: 10, border: 'none',
              cursor: 'pointer', fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', transition: 'all .2s',
              background: active ? PALETTE.primary : 'transparent',
              color: active ? '#fff' : '#6B7280',
              boxShadow: active ? '0 4px 14px rgba(13,148,136,.3)' : 'none',
            }}>
              <Icon style={{ width: 15, height: 15 }} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ═══════════ TAB: OVERVIEW ═══════════ */}
      {activeTab === 'overview' && (
        <>
          {/* KPI Grid */}
          {summary && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14 }}>
              <KpiCard icon={HiOutlineHeart} label="Beneficiaries" value={summary.totalActiveBeneficiaries ?? 0} color={PALETTE.rose} trend="up" trendVal="+12%" sub="Registered in system" />
              <KpiCard icon={HiOutlineFolder} label="Open Cases" value={summary.totalOpenCases ?? 0} color={PALETTE.amber} sub="Awaiting action" />
              <KpiCard icon={HiOutlineClock} label="In Progress" value={summary.totalInProgressCases ?? 0} color={PALETTE.indigo} sub="Currently active" />
              <KpiCard icon={HiOutlineCheckCircle} label="Closed Cases" value={summary.totalClosedCases ?? 0} color={PALETTE.secondary} trend="up" trendVal="+8%" sub="Successfully resolved" />
              <KpiCard icon={HiOutlineChartBar} label="Success Rate" value={`${summary.totalInterventionCompletionRate?.toFixed(1) ?? 0}%`} color={PALETTE.primary} trend={summary.totalInterventionCompletionRate > 70 ? 'up' : 'down'} trendVal="vs last period" sub="Intervention completion" />
              <KpiCard icon={HiOutlineUsers} label="Social Workers" value={summary.totalUsersByRole?.SOCIAL_WORKER ?? 0} color={PALETTE.blue} sub="Active staff" />
              <KpiCard icon={HiOutlineUserGroup} label="Supervisors" value={summary.totalUsersByRole?.SUPERVISOR ?? 0} color={PALETTE.purple} sub="District leads" />
              {bestDistrict && <KpiCard icon={HiOutlineLocationMarker} label="Top District" value={bestDistrict.district || '—'} color={PALETTE.cyan} sub={`${bestDistrict.successRate}% success rate`} />}
            </div>
          )}

          {/* Case Trends — Area + Line */}
          {caseTrends.length > 0 && (
            <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #F3F4F6', boxShadow: '0 2px 12px rgba(0,0,0,.04)', padding: 24 }}>
              <SectionHeader icon={HiOutlineTrendingUp} title="Case Trends Over Time" subtitle={`${period.charAt(0)+period.slice(1).toLowerCase()} view — cases opened, closed & active`} />
              <div style={{ height: 320 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={caseTrends} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gOpen" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={PALETTE.primary} stopOpacity={.25} /><stop offset="95%" stopColor={PALETTE.primary} stopOpacity={0} /></linearGradient>
                      <linearGradient id="gClosed" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={PALETTE.secondary} stopOpacity={.25} /><stop offset="95%" stopColor={PALETTE.secondary} stopOpacity={0} /></linearGradient>
                      <linearGradient id="gActive" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={PALETTE.indigo} stopOpacity={.2} /><stop offset="95%" stopColor={PALETTE.indigo} stopOpacity={0} /></linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                    <XAxis dataKey="period" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 12, fontWeight: 600, paddingTop: 8 }} />
                    <Area type="monotone" dataKey="casesOpened" stroke={PALETTE.primary} strokeWidth={2.5} fill="url(#gOpen)" name="Cases Opened" dot={{ r: 3, fill: PALETTE.primary }} />
                    <Area type="monotone" dataKey="casesClosed" stroke={PALETTE.secondary} strokeWidth={2.5} fill="url(#gClosed)" name="Cases Closed" dot={{ r: 3, fill: PALETTE.secondary }} />
                    <Area type="monotone" dataKey="activeCases" stroke={PALETTE.indigo} strokeWidth={2.5} fill="url(#gActive)" name="Active Cases" dot={{ r: 3, fill: PALETTE.indigo }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Two column: Priority Pie + Intervention Types */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
            {/* Cases by Priority */}
            {casesByPriority.length > 0 && (
              <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #F3F4F6', boxShadow: '0 2px 12px rgba(0,0,0,.04)', padding: 24 }}>
                <SectionHeader icon={HiOutlineFlag} title="Cases by Priority" subtitle="Distribution across urgency levels" />
                <div style={{ height: 280 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={casesByPriority} dataKey="value" nameKey="label" cx="50%" cy="50%" innerRadius={55} outerRadius={90}
                        label={({ label, percent }) => `${(percent * 100).toFixed(0)}%`} labelLine={false}>
                        {casesByPriority.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontSize: 11, fontWeight: 600 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Intervention Success by Type */}
            {interventionTypes.length > 0 && (
              <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #F3F4F6', boxShadow: '0 2px 12px rgba(0,0,0,.04)', padding: 24 }}>
                <SectionHeader icon={HiOutlineLightningBolt} title="Intervention Success by Type" subtitle="Completion rate per intervention category" />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 4 }}>
                  {interventionTypes.map((t, i) => (
                    <div key={i}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{t.label}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 11, color: '#9CA3AF' }}>{t.count} total</span>
                          <span style={{ fontSize: 13, fontWeight: 800, color: CHART_COLORS[i % CHART_COLORS.length] }}>{t.percent}%</span>
                        </div>
                      </div>
                      <ProgressBar value={t.percent} color={CHART_COLORS[i % CHART_COLORS.length]} height={8} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Case Types Pie */}
          {casesByType.length > 0 && (
            <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #F3F4F6', boxShadow: '0 2px 12px rgba(0,0,0,.04)', padding: 24 }}>
              <SectionHeader icon={HiOutlineClipboardList} title="Most Common Case Types" subtitle="Distribution of case categories across the organization" />
              <div style={{ height: 320 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={casesByType} margin={{ top: 5, right: 10, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} angle={-20} textAnchor="end" />
                    <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" name="Cases" radius={[6, 6, 0, 0]}>
                      {casesByType.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </>
      )}

      {/* ═══════════ TAB: DISTRICTS ═══════════ */}
      {activeTab === 'districts' && (
        <>
          {/* District bar chart */}
          {districtPerformance.length > 0 && (
            <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #F3F4F6', boxShadow: '0 2px 12px rgba(0,0,0,.04)', padding: 24 }}>
              <SectionHeader icon={HiOutlineMap} title="District Performance Ranking" subtitle="Success rate comparison across all districts" />
              <div style={{ height: 360 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[...districtPerformance].sort((a, b) => b.successRate - a.successRate)} layout="vertical" margin={{ left: 10, right: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F3F4F6" />
                    <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                    <YAxis dataKey="district" type="category" width={110} tick={{ fontSize: 12, fill: '#374151', fontWeight: 600 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="successRate" name="Success Rate %" radius={[0, 8, 8, 0]} label={{ position: 'right', fontSize: 11, fontWeight: 700, fill: PALETTE.primary, formatter: v => `${v}%` }}>
                      {districtPerformance.map((d, i) => (
                        <Cell key={i} fill={d.successRate >= 85 ? PALETTE.secondary : d.successRate >= 70 ? PALETTE.primary : PALETTE.amber} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* District table */}
          {districtPerformance.length > 0 && (
            <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #F3F4F6', boxShadow: '0 2px 12px rgba(0,0,0,.04)', overflow: 'hidden' }}>
              <div style={{ padding: '18px 24px', borderBottom: '1px solid #F3F4F6', background: '#FAFAFA' }}>
                <SectionHeader icon={HiOutlineScale} title="District Comparison Table" subtitle="Full breakdown per district" />
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#F9FAFB' }}>
                      {['District', 'Supervisor', 'Workers', 'Cases', 'Closed', 'Success Rate', 'Status'].map(h => (
                        <th key={h} style={{ padding: '12px 16px', textAlign: h === 'District' || h === 'Supervisor' ? 'left' : 'center', fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '.06em' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[...districtPerformance].sort((a, b) => b.successRate - a.successRate).map((d, i) => (
                      <tr key={i} style={{ borderTop: '1px solid #F3F4F6', transition: 'background .15s' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#F9FAFB'}
                        onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
                        <td style={{ padding: '14px 16px', fontWeight: 700, color: '#111', fontSize: 13 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            {i === 0 && <span style={{ background: '#FEF3C7', color: '#92400E', fontSize: 10, fontWeight: 800, padding: '2px 6px', borderRadius: 6 }}>🏆 TOP</span>}
                            {d.district || '—'}
                          </div>
                        </td>
                        <td style={{ padding: '14px 16px', color: '#374151', fontSize: 13 }}>{d.supervisorName || '—'}</td>
                        <td style={{ padding: '14px 16px', textAlign: 'center', color: '#374151', fontSize: 13 }}>{d.totalWorkers ?? 0}</td>
                        <td style={{ padding: '14px 16px', textAlign: 'center', color: '#374151', fontSize: 13 }}>{d.totalCases ?? 0}</td>
                        <td style={{ padding: '14px 16px', textAlign: 'center', color: '#374151', fontSize: 13 }}>{d.closedCases ?? 0}</td>
                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                            <span style={{ fontSize: 14, fontWeight: 800, color: d.successRate >= 85 ? PALETTE.secondary : d.successRate >= 70 ? PALETTE.primary : PALETTE.amber }}>{d.successRate ?? 0}%</span>
                            <ProgressBar value={d.successRate ?? 0} color={d.successRate >= 85 ? PALETTE.secondary : d.successRate >= 70 ? PALETTE.primary : PALETTE.amber} height={4} />
                          </div>
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'center' }}><PerfBadge rate={d.successRate ?? 0} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* ═══════════ TAB: SUPERVISORS ═══════════ */}
      {activeTab === 'supervisors' && summary?.supervisorActivity?.length > 0 && (
        <>
          {/* Supervisor comparison bar */}
          <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #F3F4F6', boxShadow: '0 2px 12px rgba(0,0,0,.04)', padding: 24 }}>
            <SectionHeader icon={HiOutlineUsers} title="Supervisor Performance Comparison" subtitle="Success rate and report activity side-by-side" />
            <div style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={summary.supervisorActivity.map(s => ({
                  name: s.fullName?.split(' ')[0] ?? '?',
                  reports: s.reportSubmissionCount ?? 0,
                  successRate: districtPerformance.find(d => d.supervisorName === s.fullName)?.successRate ?? 0,
                  workers: districtPerformance.find(d => d.supervisorName === s.fullName)?.totalWorkers ?? 0,
                }))} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 12, fontWeight: 600 }} />
                  <Bar yAxisId="left" dataKey="reports" fill={PALETTE.indigo} radius={[5, 5, 0, 0]} name="Reports Submitted" opacity={.85} />
                  <Bar yAxisId="left" dataKey="workers" fill={PALETTE.cyan} radius={[5, 5, 0, 0]} name="Workers Managed" opacity={.85} />
                  <Line yAxisId="right" type="monotone" dataKey="successRate" stroke={PALETTE.amber} strokeWidth={2.5} dot={{ r: 4, fill: PALETTE.amber }} name="Success Rate %" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Supervisor drilldown table */}
          <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #F3F4F6', boxShadow: '0 2px 12px rgba(0,0,0,.04)', overflow: 'hidden' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #F3F4F6', background: '#FAFAFA', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 800, color: '#111', margin: 0 }}>Supervisor Activity Table</h2>
                <p style={{ fontSize: 12, color: '#9CA3AF', margin: '2px 0 0' }}>Click a row to expand workers • Send warnings to underperformers</p>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {['successRate', 'reportSubmissionCount'].map(k => (
                  <button key={k} onClick={() => toggleSort(k)} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #E5E7EB', background: supervisorSort.key === k ? PALETTE.primary : '#fff', color: supervisorSort.key === k ? '#fff' : '#374151', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                    Sort by {k === 'successRate' ? 'Success' : 'Reports'} {supervisorSort.key === k ? (supervisorSort.dir === 'desc' ? '↓' : '↑') : ''}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#F9FAFB' }}>
                    {['Supervisor', 'District', 'Workers', 'Reports', 'Last Login', 'Success Rate', 'Status', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '12px 16px', textAlign: ['Supervisor', 'District'].includes(h) ? 'left' : 'center', fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '.06em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedSupervisors.map(sup => {
                    const dp = districtPerformance.find(d => d.supervisorName === sup.fullName);
                    const rate = dp?.successRate ?? 0;
                    const isExp = expandedSupervisor === sup.userId;
                    const workers = workersUnderSupervisor[sup.userId] ?? [];

                    return (
                      <React.Fragment key={sup.userId}>
                        <tr style={{ borderTop: '1px solid #F3F4F6', cursor: 'pointer', transition: 'background .15s', background: isExp ? '#F0FDFA' : '#fff' }}
                          onMouseEnter={e => { if (!isExp) e.currentTarget.style.background = '#F9FAFB'; }}
                          onMouseLeave={e => { if (!isExp) e.currentTarget.style.background = '#fff'; }}>
                          <td style={{ padding: '14px 16px' }}>
                            <div style={{ fontWeight: 700, color: '#111', fontSize: 13 }}>{sup.fullName}</div>
                            <div style={{ fontSize: 11, color: '#9CA3AF' }}>{sup.email}</div>
                          </td>
                          <td style={{ padding: '14px 16px', fontSize: 13, color: '#374151' }}>{dp?.district || '—'}</td>
                          <td style={{ padding: '14px 16px', textAlign: 'center', fontSize: 13, color: '#374151' }}>{dp?.totalWorkers ?? 0}</td>
                          <td style={{ padding: '14px 16px', textAlign: 'center', fontSize: 13, color: '#374151' }}>{sup.reportSubmissionCount ?? 0}</td>
                          <td style={{ padding: '14px 16px', textAlign: 'center', fontSize: 12, color: '#6B7280' }}>
                            {sup.lastLoginAt ? new Date(sup.lastLoginAt).toLocaleDateString() : <span style={{ color: '#EF4444', fontWeight: 600 }}>Never</span>}
                          </td>
                          <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                              <span style={{ fontWeight: 800, fontSize: 14, color: rate >= 85 ? PALETTE.secondary : rate >= 70 ? PALETTE.primary : PALETTE.red }}>{rate}%</span>
                              <ProgressBar value={rate} color={rate >= 85 ? PALETTE.secondary : rate >= 70 ? PALETTE.primary : PALETTE.red} height={4} />
                            </div>
                          </td>
                          <td style={{ padding: '14px 16px', textAlign: 'center' }}><PerfBadge rate={rate} /></td>
                          <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                              <button onClick={() => setWarningModal({ open: true, user: { id: sup.userId, fullName: sup.fullName } })}
                                style={{ fontSize: 11, fontWeight: 700, color: PALETTE.red, background: '#FEF2F2', border: 'none', padding: '4px 10px', borderRadius: 7, cursor: 'pointer' }}>
                                ⚠ Warn
                              </button>
                              <button onClick={() => handleToggleSupervisor(sup.userId, sup.fullName)}
                                style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: PALETTE.primary, background: '#F0FDFA', border: 'none', padding: '4px 10px', borderRadius: 7, cursor: 'pointer' }}>
                                {isExp ? <HiOutlineChevronUp style={{ width: 12 }} /> : <HiOutlineChevronDown style={{ width: 12 }} />}
                                {isExp ? 'Hide' : 'Workers'}
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* ── Worker drilldown ── */}
                        {isExp && (
                          <tr>
                            <td colSpan={8} style={{ padding: '0 16px 16px 32px', background: '#F0FDFA' }}>
                              <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #CCFBF1', overflow: 'hidden', boxShadow: '0 2px 8px rgba(13,148,136,.08)' }}>
                                <div style={{ padding: '12px 16px', borderBottom: '1px solid #CCFBF1', background: '#F0FDFA', display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <HiOutlineUserGroup style={{ color: PALETTE.primary, width: 16 }} />
                                  <span style={{ fontWeight: 700, fontSize: 13, color: '#111' }}>Workers under {sup.fullName}</span>
                                  <span style={{ background: PALETTE.primary, color: '#fff', borderRadius: 99, padding: '1px 8px', fontSize: 10, fontWeight: 700, marginLeft: 4 }}>{workers.length}</span>
                                </div>
                                {loadingWorkers && !workers.length ? (
                                  <div style={{ padding: 20, textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>Loading workers…</div>
                                ) : workers.length === 0 ? (
                                  <div style={{ padding: 20, textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>No workers found</div>
                                ) : (
                                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                      <tr style={{ background: '#F9FAFB' }}>
                                        {['Worker', 'Sector / Cell', 'Active Cases', 'Interventions Done', 'Avg Progress', 'Action'].map(h => (
                                          <th key={h} style={{ padding: '10px 14px', textAlign: h === 'Worker' || h === 'Sector / Cell' ? 'left' : 'center', fontSize: 10, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '.06em' }}>{h}</th>
                                        ))}
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {workers.map(w => {
                                        const prog = w.avgCaseProgress ?? 0;
                                        return (
                                          <tr key={w.userId} style={{ borderTop: '1px solid #F3F4F6' }}
                                            onMouseEnter={e => e.currentTarget.style.background = '#F9FAFB'}
                                            onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
                                            <td style={{ padding: '10px 14px', fontWeight: 600, color: '#111', fontSize: 13 }}>{w.workerName}</td>
                                            <td style={{ padding: '10px 14px', color: '#6B7280', fontSize: 12 }}>{[w.sector, w.cell].filter(Boolean).join(', ') || '—'}</td>
                                            <td style={{ padding: '10px 14px', textAlign: 'center', fontSize: 13, color: '#374151' }}>{w.totalActiveCases ?? 0}</td>
                                            <td style={{ padding: '10px 14px', textAlign: 'center', fontSize: 13, color: '#374151' }}>{w.interventionsCompleted ?? 0}</td>
                                            <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                                                <span style={{ fontWeight: 800, fontSize: 13, color: prog >= 80 ? PALETTE.secondary : prog >= 60 ? PALETTE.amber : PALETTE.red }}>{prog.toFixed(1)}%</span>
                                                <ProgressBar value={prog} color={prog >= 80 ? PALETTE.secondary : prog >= 60 ? PALETTE.amber : PALETTE.red} height={4} />
                                              </div>
                                            </td>
                                            <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                                              <button onClick={() => setWarningModal({ open: true, user: { id: w.userId, fullName: w.workerName } })}
                                                style={{ fontSize: 11, fontWeight: 700, color: PALETTE.red, background: '#FEF2F2', border: 'none', padding: '4px 10px', borderRadius: 7, cursor: 'pointer' }}>
                                                ⚠ Warn
                                              </button>
                                            </td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}


      {/* ═══════════ TAB: BENEFICIARIES ═══════════ */}
      {activeTab === 'beneficiaries' && (
        <>
          {/* Beneficiary KPIs */}
          {summary && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
              <KpiCard icon={HiOutlineHeart} label="Total Beneficiaries" value={summary.totalActiveBeneficiaries ?? 0} color={PALETTE.rose} sub="Registered in system" />
              <KpiCard icon={HiOutlineFolder} label="Cases per Beneficiary" value={summary.totalActiveBeneficiaries ? ((totalActive + (summary.totalClosedCases ?? 0)) / summary.totalActiveBeneficiaries).toFixed(1) : '—'} color={PALETTE.indigo} sub="Average case load" />
              <KpiCard icon={HiOutlineCheckCircle} label="Resolved Cases" value={summary.totalClosedCases ?? 0} color={PALETTE.secondary} sub="Successfully closed" />
              <KpiCard icon={HiOutlineClock} label="Pending Resolution" value={totalActive} color={PALETTE.amber} sub="Open + in-progress" />
            </div>
          )}

          {/* Case trends for beneficiaries */}
          {caseTrends.length > 0 && (
            <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #F3F4F6', boxShadow: '0 2px 12px rgba(0,0,0,.04)', padding: 24 }}>
              <SectionHeader icon={HiOutlineTrendingUp} title="Beneficiary Case Flow Over Time" subtitle="How case activity for beneficiaries evolves each period" />
              <div style={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={caseTrends} margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                    <XAxis dataKey="period" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 12, fontWeight: 600 }} />
                    <Line type="monotone" dataKey="casesOpened" stroke={PALETTE.rose} strokeWidth={2.5} dot={{ r: 3 }} name="New Cases" />
                    <Line type="monotone" dataKey="casesClosed" stroke={PALETTE.secondary} strokeWidth={2.5} dot={{ r: 3 }} name="Resolved Cases" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Most common case types for beneficiaries */}
          {casesByType.length > 0 && (
            <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #F3F4F6', boxShadow: '0 2px 12px rgba(0,0,0,.04)', padding: 24 }}>
              <SectionHeader icon={HiOutlineClipboardList} title="Most Common Beneficiary Case Types" subtitle="What issues beneficiaries face most" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 4 }}>
                {casesByType.slice(0, 8).map((t, i) => {
                  const max = Math.max(...casesByType.map(x => x.count ?? 0));
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <span style={{ width: 20, height: 20, borderRadius: 6, background: CHART_COLORS[i % CHART_COLORS.length], display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 10, fontWeight: 800, flexShrink: 0 }}>{i + 1}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{t.label}</span>
                          <span style={{ fontSize: 13, fontWeight: 800, color: CHART_COLORS[i % CHART_COLORS.length] }}>{t.count} cases</span>
                        </div>
                        <ProgressBar value={t.count ?? 0} max={max} color={CHART_COLORS[i % CHART_COLORS.length]} height={7} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* ═══════════ MONTHLY BREAKDOWN (YEARLY mode only, all tabs) ═══════════ */}
      {period === 'YEARLY' && monthlyBreakdown.length > 0 && (
        <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #F3F4F6', boxShadow: '0 2px 12px rgba(0,0,0,.04)', overflow: 'hidden' }}>
          <div style={{ padding: '18px 24px', borderBottom: '1px solid #F3F4F6', background: '#FAFAFA' }}>
            <SectionHeader icon={HiOutlineCalendar} title={`Monthly Breakdown — ${new Date().getFullYear()}`} subtitle="See which months performed best and where case resolution dipped" />
            {/* Mini area chart */}
            <div style={{ height: 160, marginTop: 8 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyBreakdown} margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gMonth" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={PALETTE.primary} stopOpacity={.3} /><stop offset="95%" stopColor={PALETTE.primary} stopOpacity={0} /></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="casesOpened" stroke={PALETTE.primary} strokeWidth={2} fill="url(#gMonth)" name="Cases Opened" />
                  <Area type="monotone" dataKey="casesClosed" stroke={PALETTE.secondary} strokeWidth={2} fill="none" name="Cases Closed" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#F9FAFB' }}>
                  {['Month', 'Cases Opened', 'Cases Closed', 'Success Rate', 'Performance'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: h === 'Month' ? 'left' : 'center', fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '.06em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {monthlyBreakdown.map((m, i) => {
                  const best = Math.max(...monthlyBreakdown.map(x => x.successRate ?? 0));
                  const worst = Math.min(...monthlyBreakdown.map(x => x.successRate ?? 0));
                  const isBest = (m.successRate ?? 0) === best;
                  const isWorst = (m.successRate ?? 0) === worst;
                  return (
                    <tr key={i} style={{ borderTop: '1px solid #F3F4F6', background: isBest ? '#F0FDF4' : isWorst ? '#FFF7ED' : '#fff' }}>
                      <td style={{ padding: '13px 16px', fontWeight: 700, color: '#111', fontSize: 13 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          {m.month}
                          {isBest && <span style={{ background: '#D1FAE5', color: '#065F46', fontSize: 10, padding: '1px 6px', borderRadius: 6, fontWeight: 800 }}>Best</span>}
                          {isWorst && <span style={{ background: '#FEE2E2', color: '#991B1B', fontSize: 10, padding: '1px 6px', borderRadius: 6, fontWeight: 800 }}>Low</span>}
                        </div>
                      </td>
                      <td style={{ padding: '13px 16px', textAlign: 'center', fontSize: 13, color: '#374151' }}>{m.casesOpened}</td>
                      <td style={{ padding: '13px 16px', textAlign: 'center', fontSize: 13, color: '#374151' }}>{m.casesClosed}</td>
                      <td style={{ padding: '13px 16px', textAlign: 'center' }}>
                        <span style={{ fontWeight: 800, fontSize: 14, color: (m.successRate ?? 0) >= 80 ? PALETTE.secondary : (m.successRate ?? 0) >= 60 ? PALETTE.amber : PALETTE.red }}>{m.successRate ?? 0}%</span>
                      </td>
                      <td style={{ padding: '13px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 160 }}>
                          <ProgressBar value={m.successRate ?? 0} color={(m.successRate ?? 0) >= 80 ? PALETTE.secondary : (m.successRate ?? 0) >= 60 ? PALETTE.amber : PALETTE.red} height={6} />
                          <span style={{ fontSize: 11, color: '#9CA3AF', flexShrink: 0 }}>{m.successRate ?? 0}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── Warning Modal ─── */}
      <WarningModal
        isOpen={warningModal.open}
        onClose={() => setWarningModal({ open: false, user: null })}
        toUser={warningModal.user}
        onSuccess={() => {
          fetchAllData();
          toast.success('Warning sent successfully');
          setWarningModal({ open: false, user: null });
        }}
      />
    </div>
  );
}