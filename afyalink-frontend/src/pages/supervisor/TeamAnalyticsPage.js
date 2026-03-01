import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { analyticsApi } from '../../api/analyticsApi';
import WarningModal from '../../components/shared/WarningModal';
import Spinner from '../../components/common/Spinner';
import Button from '../../components/common/Button';
import {
  HiOutlineChartBar,
  HiOutlineExclamation,
  HiOutlineDocumentReport,
  HiOutlineUserGroup,
  HiOutlineUsers,
  HiOutlineTrendingUp,
  HiOutlineCalendar,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineDownload,
  HiOutlineRefresh,
  HiOutlineEye,
  HiOutlineBell,
  HiOutlineSearch,
  HiOutlineArrowUp,
  HiOutlineArrowDown,
} from 'react-icons/hi';

import {
  ResponsiveContainer,
  ComposedChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Bar,
  Line,
} from 'recharts';

import {
  SYSTEM_START_DATE,
  SYSTEM_START_MONTH,
  SYSTEM_START_YEAR,
  getCurrentMonthString,
  getCurrentYear,
  getCurrentWeekString,
  getTodayISO,
  getWeekNumber,
  parseISODate,
  computePeriod,
  clampYear,
  clampMonth,
} from '../../utils/dateValidation';

const P = {
  primary: '#0D9488',
  primary600: '#0F766E',
  secondary: '#10B981',
  indigo: '#6366F1',
  amber: '#F59E0B',
  red: '#EF4444',
  purple: '#8B5CF6',
  blue: '#3B82F6',
  cyan: '#06B6D4',
};
const CHART_COLORS = [P.primary, P.indigo, P.amber, P.red, P.secondary, P.purple, P.blue, P.cyan];

const fmtDate = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '10px 14px', boxShadow: '0 4px 20px rgba(0,0,0,0.10)' }}>
      <p style={{ fontWeight: 800, color: '#111', marginBottom: 4, fontSize: 12 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color, fontSize: 12, margin: '2px 0' }}>
          <span style={{ fontWeight: 700 }}>{p.name}:</span> {typeof p.value === 'number' ? p.value : p.value}
        </p>
      ))}
    </div>
  );
};

const ProgressBar = ({ value, max = 100, color = P.primary, height = 5 }) => (
  <div style={{ background: '#F3F4F6', borderRadius: 99, overflow: 'hidden', height }}>
    <div
      style={{
        width: `${Math.min((value / max) * 100, 100)}%`,
        background: color,
        height: '100%',
        borderRadius: 99,
        transition: 'width .4s ease',
      }}
    />
  </div>
);

const KpiCard = ({ icon: Icon, label, value, sub, color }) => (
  <div
    style={{
      background: '#fff',
      borderRadius: 20,
      border: '1px solid #F3F4F6',
      boxShadow: '0 2px 12px rgba(0,0,0,.04)',
      padding: '20px 18px',
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      position: 'relative',
      overflow: 'hidden',
    }}
  >
    <div style={{ position: 'absolute', top: 0, right: 0, width: 80, height: 80, borderRadius: '0 20px 0 80px', background: `${color}10` }} />
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ background: `${color}15`, borderRadius: 12, padding: 8, display: 'flex' }}>
        <Icon style={{ color, width: 20, height: 20 }} />
      </div>
    </div>
    <div>
      <p style={{ fontSize: 26, fontWeight: 900, color: '#111', letterSpacing: '-0.5px', lineHeight: 1 }}>{value ?? 0}</p>
      <p style={{ fontSize: 11, fontWeight: 800, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 4 }}>{label}</p>
      {sub && <p style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>{sub}</p>}
    </div>
  </div>
);

const StatusBadge = ({ days }) => {
  if (days == null || days === 999) {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 99, background: '#F3F4F6', color: '#374151', fontSize: 11, fontWeight: 800 }}>
        <HiOutlineXCircle style={{ width: 12 }} /> New
      </span>
    );
  }
  if (days <= 3) {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 99, background: '#D1FAE5', color: '#065F46', fontSize: 11, fontWeight: 800 }}>
        <HiOutlineCheckCircle style={{ width: 12 }} /> Active
      </span>
    );
  }
  if (days <= 7) {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 99, background: '#FEF3C7', color: '#92400E', fontSize: 11, fontWeight: 800 }}>
        <HiOutlineClock style={{ width: 12 }} /> Slow
      </span>
    );
  }
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 99, background: '#FEE2E2', color: '#991B1B', fontSize: 11, fontWeight: 800 }}>
      <HiOutlineExclamation style={{ width: 12 }} /> Inactive
    </span>
  );
};

export default function TeamAnalyticsPage() {
  const navigate = useNavigate();

  // ── Period / Date filter ──
  const [periodType, setPeriodType] = useState('MONTHLY'); // WEEKLY | MONTHLY | YEARLY
  const [weeklyAnchorISO, setWeeklyAnchorISO] = useState(() => getTodayISO());
  const [monthlyISO, setMonthlyISO] = useState(() => getCurrentMonthString());
  const [yearISO, setYearISO] = useState(() => String(getCurrentYear()));

  // ── UI state ──
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [underperformers, setUnderperformers] = useState([]);
  const [exporting, setExporting] = useState(false);

  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState('avgCaseProgress'); // workerName | totalActiveCases | caseEntriesMade | interventionsCompleted | avgCaseProgress | daysSinceLastActivity
  const [sortDir, setSortDir] = useState('desc'); // asc | desc
  const [expandedWorkerId, setExpandedWorkerId] = useState(null);

  const [warningModal, setWarningModal] = useState({ open: false, user: null });

  const weekKeyFromAnchor = useMemo(() => {
    const d = parseISODate(weeklyAnchorISO);
    if (!d || Number.isNaN(d.getTime())) return getCurrentWeekString();
    const year = d.getFullYear();
    const week = getWeekNumber(d);
    return `${year}-W${String(week).padStart(2, '0')}`;
  }, [weeklyAnchorISO]);

  const { periodStart, periodEnd } = useMemo(() => {
    if (periodType === 'WEEKLY') return computePeriod('WEEKLY', weekKeyFromAnchor);
    if (periodType === 'YEARLY') return computePeriod('YEARLY', String(yearISO));
    return computePeriod('MONTHLY', monthlyISO);
  }, [periodType, weekKeyFromAnchor, yearISO, monthlyISO]);

  // ── Fetch data ──
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [teamRes, underRes] = await Promise.all([
        analyticsApi.getTeamSummary({ period: periodType, startDate: periodStart, endDate: periodEnd }),
        analyticsApi.getUnderperformers(),
      ]);

      const teamDto = teamRes?.data ?? teamRes;
      const underList = underRes?.data ?? underRes;

      setSummary(teamDto && typeof teamDto === 'object' ? teamDto : null);
      setUnderperformers(Array.isArray(underList) ? underList : []);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to load team analytics';
      toast.error(msg);
      setSummary(null);
      setUnderperformers([]);
    } finally {
      setLoading(false);
    }
  }, [periodType, periodStart, periodEnd]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const underperformerMap = useMemo(() => {
    const m = new Map();
    (underperformers || []).forEach((u) => m.set(u.workerId, u));
    return m;
  }, [underperformers]);

  const members = summary?.members ?? [];

  // ── Derived KPIs ──
  const teamTotalCases = members.reduce((sum, w) => sum + (w.totalActiveCases || 0), 0);
  const teamAvgProgress = members.length
    ? members.reduce((sum, w) => sum + (w.avgCaseProgress || 0), 0) / members.length
    : 0;
  const teamInterventions = members.reduce((sum, w) => sum + (w.interventionsCompleted || 0), 0);

  const activeWorkers = members.filter((w) => (w.daysSinceLastActivity ?? 999) <= 7).length;
  const needsAttention = underperformers.length || members.filter((w) => (w.daysSinceLastActivity ?? 999) > 7).length;

  // ── Search + sort ──
  const toggleSort = (key) => {
    if (sortKey === key) setSortDir(sortDir === 'desc' ? 'asc' : 'desc');
    else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const filteredSortedMembers = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = members;
    if (q) {
      list = list.filter((w) => {
        const haystack = `${w.workerName || ''} ${w.sector || ''} ${w.cell || ''}`.toLowerCase();
        return haystack.includes(q);
      });
    }

    const dir = sortDir === 'desc' ? -1 : 1;
    const valueOf = (w) => {
      if (sortKey === 'workerName') return w.workerName || '';
      if (sortKey === 'daysSinceLastActivity') return w.daysSinceLastActivity ?? 999;
      if (sortKey === 'totalActiveCases') return w.totalActiveCases || 0;
      if (sortKey === 'caseEntriesMade') return w.caseEntriesMade || 0;
      if (sortKey === 'interventionsCompleted') return w.interventionsCompleted || 0;
      if (sortKey === 'avgCaseProgress') return w.avgCaseProgress ?? 0;
      return 0;
    };

    const sorted = [...list].sort((a, b) => {
      const av = valueOf(a);
      const bv = valueOf(b);
      if (typeof av === 'string' && typeof bv === 'string') return dir * av.localeCompare(bv);
      return dir * ((av ?? 0) - (bv ?? 0));
    });

    return sorted;
  }, [members, search, sortKey, sortDir]);

  // ── Chart data ──
  const chartData = members.map((w) => ({
    workerId: w.userId,
    name: w.workerName ? w.workerName.split(' ')[0] : 'Worker',
    cases: w.totalActiveCases || 0,
    interventions: w.interventionsCompleted || 0,
    progress: w.avgCaseProgress || 0,
  }));

  const formatLastActivityLabel = (days) => {
    if (days == null || days === 999) return 'No activity yet';
    if (days === 0) return 'Today';
    return `${days} day${days === 1 ? '' : 's'} ago`;
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const blob = await analyticsApi.exportTeamAnalytics({
        period: periodType,
        startDate: periodStart,
        endDate: periodEnd,
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `team_analytics_${periodType.toLowerCase()}_${new Date().toISOString().split('T')[0]}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Exported successfully');
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Export failed';
      toast.error(msg);
    } finally {
      setExporting(false);
    }
  };

  const periodHint = useMemo(() => {
    if (!periodStart || !periodEnd) return '';
    return `${fmtDate(periodStart)} – ${fmtDate(periodEnd)}`;
  }, [periodStart, periodEnd]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 40 }}>
      {/* HERO */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-primary/10" style={{ minHeight: 152 }}>
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary-600 to-secondary opacity-[0.97]" />
        <div
          className="absolute inset-0 opacity-[0.12] pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        <div style={{ position: 'relative', padding: '28px 28px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: 20 }}>
            <div style={{ color: '#fff', maxWidth: 520 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '6px 14px', borderRadius: 99, background: 'rgba(255,255,255,.15)', border: '1px solid rgba(255,255,255,.25)', backdropFilter: 'blur(8px)', marginBottom: 12 }}>
                <HiOutlineChartBar style={{ width: 15, height: 15 }} />
                <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.04em' }}>TEAM ANALYTICS</span>
              </div>
              <h1 style={{ fontSize: 30, fontWeight: 900, margin: 0, letterSpacing: '-0.5px', textShadow: '0 2px 10px rgba(0,0,0,.15)' }}>
                Team Analytics
              </h1>
              <p style={{ margin: '8px 0 0', fontSize: 14, opacity: 0.9, maxWidth: 520 }}>
                Monitor team performance and activity across social workers.
              </p>
              {periodHint && <p style={{ marginTop: 6, fontSize: 12, opacity: 0.85 }}>{periodHint}</p>}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-end' }}>
              <div style={{ display: 'flex', gap: 6, background: 'rgba(255,255,255,.12)', borderRadius: 12, padding: 4, border: '1px solid rgba(255,255,255,.2)' }}>
                {['WEEKLY', 'MONTHLY', 'YEARLY'].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPeriodType(p)}
                    style={{
                      padding: '7px 14px',
                      borderRadius: 8,
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: 12,
                      fontWeight: 900,
                      letterSpacing: '.04em',
                      background: periodType === p ? '#fff' : 'transparent',
                      color: periodType === p ? P.primary : 'rgba(255,255,255,.88)',
                      transition: 'all .2s',
                      boxShadow: periodType === p ? '0 2px 8px rgba(0,0,0,.12)' : 'none',
                    }}
                  >
                    {p.charAt(0) + p.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                {periodType === 'WEEKLY' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <HiOutlineCalendar style={{ color: 'rgba(255,255,255,.9)' }} />
                    <input
                      type="date"
                      value={weeklyAnchorISO}
                      max={getTodayISO()}
                      min={SYSTEM_START_DATE}
                      onChange={(e) => setWeeklyAnchorISO(e.target.value)}
                      style={{
                        padding: '8px 12px',
                        borderRadius: 10,
                        border: '1px solid rgba(255,255,255,.35)',
                        background: 'rgba(255,255,255,.10)',
                        color: '#fff',
                        fontSize: 13,
                        fontWeight: 700,
                        outline: 'none',
                        cursor: 'pointer',
                      }}
                    />
                  </div>
                )}

                {periodType === 'MONTHLY' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <HiOutlineCalendar style={{ color: 'rgba(255,255,255,.9)' }} />
                    <input
                      type="month"
                      value={monthlyISO}
                      min={SYSTEM_START_MONTH}
                      max={getCurrentMonthString()}
                      onChange={(e) => setMonthlyISO(clampMonth(e.target.value))}
                      style={{
                        padding: '8px 12px',
                        borderRadius: 10,
                        border: '1px solid rgba(255,255,255,.35)',
                        background: 'rgba(255,255,255,.10)',
                        color: '#fff',
                        fontSize: 13,
                        fontWeight: 700,
                        outline: 'none',
                        cursor: 'pointer',
                      }}
                    />
                  </div>
                )}

                {periodType === 'YEARLY' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <HiOutlineCalendar style={{ color: 'rgba(255,255,255,.9)' }} />
                    <input
                      type="number"
                      value={yearISO}
                      min={SYSTEM_START_YEAR}
                      max={getCurrentYear()}
                      onChange={(e) => setYearISO(String(clampYear(e.target.value)))}
                      style={{
                        padding: '8px 12px',
                        borderRadius: 10,
                        border: '1px solid rgba(255,255,255,.35)',
                        background: 'rgba(255,255,255,.10)',
                        color: '#fff',
                        fontSize: 13,
                        fontWeight: 700,
                        outline: 'none',
                        cursor: 'pointer',
                        width: 120,
                      }}
                    />
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={handleExport}
                  disabled={exporting}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '9px 16px',
                    borderRadius: 10,
                    background: 'rgba(255,255,255,.18)',
                    border: '1px solid rgba(255,255,255,.35)',
                    color: '#fff',
                    fontSize: 13,
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  <HiOutlineDownload style={{ width: 15 }} />
                  {exporting ? 'Exporting…' : 'Export'}
                </button>

                <button
                  type="button"
                  onClick={fetchData}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '9px 16px',
                    borderRadius: 10,
                    background: 'rgba(255,255,255,.18)',
                    border: '1px solid rgba(255,255,255,.35)',
                    color: '#fff',
                    fontSize: 13,
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  <HiOutlineRefresh style={{ width: 15 }} />
                  Refresh
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Loading / Empty */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 260 }}>
          <Spinner size="lg" />
        </div>
      ) : members.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #F3F4F6', boxShadow: '0 2px 12px rgba(0,0,0,.04)', padding: '60px 24px', textAlign: 'center' }}>
          <div style={{ width: 84, height: 84, background: '#F3F4F6', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <HiOutlineUsers style={{ width: 42, height: 42, color: '#9CA3AF' }} />
          </div>
          <h3 style={{ fontSize: 18, fontWeight: 900, color: '#111', marginBottom: 8 }}>No team members yet</h3>
          <p style={{ fontSize: 13, color: '#6B7280', maxWidth: 520, margin: '0 auto' }}>
            Team analytics will show cases, progress, and activity for social workers assigned to your team.
          </p>
          <div style={{ marginTop: 22 }}>
            <Button variant="primary" onClick={() => navigate('/supervisor/team-reports')} className="w-auto">
              View Team Reports
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* KPI CARDS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14 }}>
            <KpiCard icon={HiOutlineUserGroup} label="Team Members" value={members.length} color={P.primary} />
            <KpiCard icon={HiOutlineDocumentReport} label="Active Cases" value={teamTotalCases} color={P.indigo} sub={periodType.toLowerCase()} />
            <KpiCard icon={HiOutlineTrendingUp} label="Avg Progress" value={`${teamAvgProgress.toFixed(1)}%`} color={P.amber} />
            <KpiCard icon={HiOutlineUsers} label="Interventions" value={teamInterventions} color={P.secondary} />
            <KpiCard icon={HiOutlineCheckCircle} label="Active Workers" value={activeWorkers} color={P.blue} sub="last 7 days" />
            <KpiCard icon={HiOutlineExclamation} label="Needs Attention" value={needsAttention} color={P.red} sub="underperformers" />
          </div>

          {/* Underperformers */}
          {underperformers.length > 0 && (
            <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 20, padding: '18px 22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                <HiOutlineExclamation style={{ color: P.amber, width: 20, height: 20 }} />
                <h3 style={{ fontSize: 14, fontWeight: 900, color: '#92400E', margin: 0 }}>Workers Needing Attention</h3>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 12 }}>
                {underperformers.map((u) => (
                  <div key={u.workerId} style={{ background: '#fff', borderRadius: 14, padding: 14, border: '1px solid #FDE68A', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontWeight: 900, fontSize: 13, color: '#92400E', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.workerName}</p>
                      <p style={{ fontSize: 12, color: '#B45309', margin: '3px 0 0' }}>
                        {u.reason} • {u.daysSinceLastActivity === 999 ? 'No activity yet' : `${u.daysSinceLastActivity} day(s) ago`}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setWarningModal({ open: true, user: { id: u.workerId, fullName: u.workerName } })}
                      style={{ padding: '8px 14px', borderRadius: 10, background: P.red, color: '#fff', border: 'none', fontSize: 12, fontWeight: 900, cursor: 'pointer' }}
                    >
                      <HiOutlineBell style={{ width: 14, marginRight: 6, verticalAlign: 'middle' }} />
                      Send Warning
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CHART */}
          <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #F3F4F6', boxShadow: '0 2px 12px rgba(0,0,0,.04)', padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14, gap: 12 }}>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 900, color: '#111', margin: 0 }}>Worker Performance Comparison</h2>
                <p style={{ fontSize: 12, color: '#9CA3AF', margin: '4px 0 0' }}>{periodType.toLowerCase()} view — active cases, interventions & progress</p>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: 12, fontWeight: 900, color: '#374151' }}>Tip:</span>
                <span style={{ fontSize: 12, color: '#6B7280' }}>Click a row to expand details</span>
              </div>
            </div>
            <div style={{ height: 330 }}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 12, fontWeight: 900 }} />
                  <Bar yAxisId={0} dataKey="cases" fill={P.indigo} radius={[6, 6, 0, 0]} name="Active Cases" />
                  <Bar yAxisId={0} dataKey="interventions" fill={P.amber} radius={[6, 6, 0, 0]} name="Interventions" />
                  <Line
                    yAxisId={0}
                    type="monotone"
                    dataKey="progress"
                    stroke={P.secondary}
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: P.secondary }}
                    name="Avg Progress (%)"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* TABLE */}
          <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #F3F4F6', boxShadow: '0 2px 12px rgba(0,0,0,.04)', overflow: 'hidden' }}>
            <div style={{ padding: '18px 22px', borderBottom: '1px solid #F3F4F6', background: '#FAFAFA', display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 900, color: '#111', margin: 0 }}>Worker Performance Table</h2>
                <p style={{ fontSize: 12, color: '#9CA3AF', margin: '4px 0 0' }}>Sortable • Searchable • Expandable</p>
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '8px 10px', borderRadius: 12, border: '1px solid #E5E7EB', background: '#fff' }}>
                  <HiOutlineSearch style={{ width: 16, height: 16, color: '#9CA3AF' }} />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by worker, sector, cell..."
                    style={{ border: 'none', outline: 'none', minWidth: 260, fontSize: 13, fontWeight: 700 }}
                  />
                </div>
                <Button variant="header" onClick={() => fetchData()}>
                  Refresh
                </Button>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#F9FAFB' }}>
                    <th
                      style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 900, color: '#6B7280', textTransform: 'uppercase', cursor: 'pointer' }}
                      onClick={() => toggleSort('workerName')}
                    >
                      Worker
                      {sortKey === 'workerName' && (sortDir === 'desc' ? <HiOutlineArrowDown style={{ width: 14, verticalAlign: 'middle', marginLeft: 6 }} /> : <HiOutlineArrowUp style={{ width: 14, verticalAlign: 'middle', marginLeft: 6 }} />)}
                    </th>
                    <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 900, color: '#6B7280', textTransform: 'uppercase' }}>Location</th>
                    <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 900, color: '#6B7280', textTransform: 'uppercase', cursor: 'pointer' }} onClick={() => toggleSort('totalActiveCases')}>
                      Active Cases
                    </th>
                    <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 900, color: '#6B7280', textTransform: 'uppercase', cursor: 'pointer' }} onClick={() => toggleSort('caseEntriesMade')}>
                      Entries
                    </th>
                    <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 900, color: '#6B7280', textTransform: 'uppercase', cursor: 'pointer' }} onClick={() => toggleSort('interventionsCompleted')}>
                      Interventions
                    </th>
                    <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 900, color: '#6B7280', textTransform: 'uppercase', cursor: 'pointer' }} onClick={() => toggleSort('avgCaseProgress')}>
                      Avg Progress
                    </th>
                    <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 900, color: '#6B7280', textTransform: 'uppercase', cursor: 'pointer' }} onClick={() => toggleSort('daysSinceLastActivity')}>
                      Last Activity
                    </th>
                    <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 900, color: '#6B7280', textTransform: 'uppercase' }}>Status</th>
                    <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 900, color: '#6B7280', textTransform: 'uppercase' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSortedMembers.map((w) => {
                    const isExpanded = expandedWorkerId === w.userId;
                    const under = underperformerMap.get(w.userId);
                    const canWarn = !!under;
                    const location = [w.sector, w.cell].filter(Boolean).join(', ') || '—';
                    const lastLabel = formatLastActivityLabel(w.daysSinceLastActivity);
                    return (
                      <React.Fragment key={w.userId}>
                        <tr
                          style={{ borderTop: '1px solid #F3F4F6', cursor: 'pointer', background: isExpanded ? '#F0FDFA' : '#fff' }}
                          onClick={() => setExpandedWorkerId(isExpanded ? null : w.userId)}
                        >
                          <td style={{ padding: '14px 16px', fontWeight: 900, color: '#111', fontSize: 13 }}>{w.workerName}</td>
                          <td style={{ padding: '14px 16px', textAlign: 'center', fontSize: 12, color: '#6B7280' }}>{location}</td>
                          <td style={{ padding: '14px 16px', textAlign: 'center', fontSize: 13, color: '#374151' }}>{w.totalActiveCases || 0}</td>
                          <td style={{ padding: '14px 16px', textAlign: 'center', fontSize: 13, color: '#374151' }}>{w.caseEntriesMade || 0}</td>
                          <td style={{ padding: '14px 16px', textAlign: 'center', fontSize: 13, color: '#374151' }}>{w.interventionsCompleted || 0}</td>
                          <td style={{ padding: '14px 16px', textAlign: 'center', fontSize: 13 }}>
                            <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                              <span style={{ fontWeight: 900, color: (w.avgCaseProgress || 0) >= 80 ? P.secondary : (w.avgCaseProgress || 0) >= 60 ? P.amber : P.red }}>
                                {(w.avgCaseProgress != null ? w.avgCaseProgress : 0).toFixed(1)}%
                              </span>
                              <ProgressBar value={w.avgCaseProgress || 0} max={100} color={(w.avgCaseProgress || 0) >= 80 ? P.secondary : (w.avgCaseProgress || 0) >= 60 ? P.amber : P.red} height={4} />
                            </div>
                          </td>
                          <td style={{ padding: '14px 16px', textAlign: 'center', fontSize: 12, color: '#6B7280' }}>{lastLabel}</td>
                          <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                            <StatusBadge days={w.daysSinceLastActivity} />
                          </td>
                          <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/supervisor/team-reports?workerId=${w.userId}`);
                                }}
                                style={{ fontSize: 12, fontWeight: 900, color: P.primary, background: '#F0FDFA', border: '1px solid #CCFBF1', padding: '6px 10px', borderRadius: 8, cursor: 'pointer' }}
                              >
                                <HiOutlineEye style={{ width: 14, marginRight: 6, verticalAlign: 'middle' }} />
                                Reports
                              </button>
                              <button
                                type="button"
                                disabled={!canWarn}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setWarningModal({ open: true, user: { id: w.userId, fullName: w.workerName } });
                                }}
                                style={{
                                  fontSize: 12,
                                  fontWeight: 900,
                                  color: canWarn ? '#fff' : '#9CA3AF',
                                  background: canWarn ? '#EF4444' : '#F3F4F6',
                                  border: canWarn ? '1px solid #FEE2E2' : '1px solid #E5E7EB',
                                  padding: '6px 10px',
                                  borderRadius: 8,
                                  cursor: canWarn ? 'pointer' : 'not-allowed',
                                }}
                                title={canWarn ? `Reason: ${under?.reason || ''}` : 'Not underperforming'}
                              >
                                <HiOutlineBell style={{ width: 14, marginRight: 6, verticalAlign: 'middle' }} />
                                Warn
                              </button>
                            </div>
                          </td>
                        </tr>

                        {isExpanded && (
                          <tr style={{ background: '#F0FDFA' }}>
                            <td colSpan={9} style={{ padding: '16px 22px' }}>
                              <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #CCFBF1', padding: 16 }}>
                                <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', marginBottom: 16 }}>
                                  <div style={{ minWidth: 260, flex: 1 }}>
                                    <p style={{ fontSize: 10, fontWeight: 900, color: '#9CA3AF', textTransform: 'uppercase', margin: 0 }}>Progress Distribution</p>
                                    <div style={{ marginTop: 10 }}>
                                      {w.caseProgressDistribution && Object.keys(w.caseProgressDistribution).length > 0 ? (
                                        Object.entries(w.caseProgressDistribution).map(([band, count]) => {
                                          const max = w.totalActiveCases || 1;
                                          return (
                                            <div key={band} style={{ marginBottom: 10 }}>
                                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#374151', marginBottom: 6 }}>
                                                <span>{band}</span>
                                                <span style={{ fontWeight: 900 }}>{count}</span>
                                              </div>
                                              <ProgressBar value={count} max={max} color={P.indigo} height={4} />
                                            </div>
                                          );
                                        })
                                      ) : (
                                        <p style={{ fontSize: 13, color: '#6B7280', margin: 0 }}>No active progress distribution available.</p>
                                      )}
                                    </div>
                                  </div>

                                  <div style={{ minWidth: 260, flex: 1 }}>
                                    <p style={{ fontSize: 10, fontWeight: 900, color: '#9CA3AF', textTransform: 'uppercase', margin: 0 }}>Worker Details</p>
                                    <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
                                      <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 12, padding: 12 }}>
                                        <p style={{ fontSize: 11, fontWeight: 900, color: '#6B7280', margin: 0 }}>Interventions</p>
                                        <p style={{ fontSize: 16, fontWeight: 900, color: '#111', margin: '6px 0 0' }}>{w.interventionsCompleted || 0}</p>
                                        <p style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>Completion: {w.interventionCompletionRate != null ? `${w.interventionCompletionRate.toFixed(1)}%` : '—'}</p>
                                      </div>
                                      <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 12, padding: 12 }}>
                                        <p style={{ fontSize: 11, fontWeight: 900, color: '#6B7280', margin: 0 }}>Overdue Tasks</p>
                                        <p style={{ fontSize: 16, fontWeight: 900, color: '#111', margin: '6px 0 0' }}>{w.overdueTasksCount || 0}</p>
                                      </div>
                                      <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 12, padding: 12 }}>
                                        <p style={{ fontSize: 11, fontWeight: 900, color: '#6B7280', margin: 0 }}>Documents Uploaded</p>
                                        <p style={{ fontSize: 16, fontWeight: 900, color: '#111', margin: '6px 0 0' }}>{w.documentsUploaded || 0}</p>
                                      </div>
                                      <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 12, padding: 12 }}>
                                        <p style={{ fontSize: 11, fontWeight: 900, color: '#6B7280', margin: 0 }}>Last Activity Date</p>
                                        <p style={{ fontSize: 13, fontWeight: 900, color: '#111', margin: '6px 0 0' }}>{w.lastActivityDate ? fmtDate(w.lastActivityDate) : '—'}</p>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', borderTop: '1px solid #F3F4F6', paddingTop: 12, flexWrap: 'wrap' }}>
                                  <button
                                    type="button"
                                    onClick={() => navigate(`/supervisor/team-reports?workerId=${w.userId}`)}
                                    style={{ padding: '10px 14px', borderRadius: 10, background: P.primary, color: '#fff', border: 'none', fontSize: 12, fontWeight: 900, cursor: 'pointer' }}
                                  >
                                    <HiOutlineEye style={{ width: 14, marginRight: 8, verticalAlign: 'middle' }} />
                                    View All Reports
                                  </button>
                                  <button
                                    type="button"
                                    disabled={!canWarn}
                                    onClick={() => setWarningModal({ open: true, user: { id: w.userId, fullName: w.workerName } })}
                                    style={{
                                      padding: '10px 14px',
                                      borderRadius: 10,
                                      background: canWarn ? '#EF4444' : '#F3F4F6',
                                      color: canWarn ? '#fff' : '#9CA3AF',
                                      border: 'none',
                                      fontSize: 12,
                                      fontWeight: 900,
                                      cursor: canWarn ? 'pointer' : 'not-allowed',
                                    }}
                                  >
                                    <HiOutlineBell style={{ width: 14, marginRight: 8, verticalAlign: 'middle' }} />
                                    Send Warning
                                  </button>
                                </div>
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

      {/* Warning Modal */}
      <WarningModal
        isOpen={warningModal.open}
        onClose={() => setWarningModal({ open: false, user: null })}
        toUser={warningModal.user}
        onSuccess={() => {
          fetchData();
          toast.success('Warning sent successfully');
        }}
      />
    </div>
  );
}
