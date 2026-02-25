// pages/admin/reports/AdminReportViewPage.jsx
// FIXES:
//  1. Renders real data for ALL report types (org, supervisor, social worker)
//  2. Edit option REMOVED — admin cannot edit supervisor/worker reports
//  3. Executive Summary shows ONLY what the report author wrote (no auto-combined text)
//  4. Attachments (images + documents) displayed correctly with gallery + download
//  5. Feedback section only appears for SUPERVISOR_TEAM reports
//  6. Full redesign: tab nav, polished cards, charts, modern layout

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { reportsApi } from '../../api/reportsApi';
import Spinner from '../../components/common/Spinner';
import ExportButtons from '../../components/shared/ExportButtons';
import PhotoGalleryModal from '../../components/shared/PhotoGalleryModal';
import {
  HiArrowLeft,
  HiOutlineDocumentText,
  HiOutlineShare,
  HiOutlineCloudUpload,
  HiOutlineChartBar,
  HiOutlineMap,
  HiOutlineUserGroup,
  HiOutlinePhotograph,
  HiOutlineCheckCircle,
  HiOutlineExclamationCircle,
  HiOutlineTrendingUp,
  HiOutlineDocumentReport,
  HiOutlineOfficeBuilding,
  HiOutlineDownload,
  HiOutlineEye,
  HiOutlinePaperClip,
  HiOutlineClock,
  HiOutlineFlag,
  HiOutlineLocationMarker,
  HiOutlineCalendar,
  HiOutlineBriefcase,
  HiOutlineXCircle,
  HiOutlineThumbUp,
  HiOutlineAnnotation,
  HiOutlineInformationCircle,
  HiOutlineLightningBolt,
  HiOutlineClipboardList,
  HiOutlineUser,
} from 'react-icons/hi';
import { toast } from 'react-toastify';
import { attachmentPreviewUrl } from '../../utils/mediaUrl';
import { documentApi } from '../../api/documentApi';
import AuthenticatedImage from '../../components/shared/AuthenticatedImage';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';

const CHART_BOX = { width: '100%', height: 280, minHeight: 280, position: 'relative' };

/* ─── Design tokens ─── */
const P = {
  primary: '#0D9488',
  primary6: '#0F766E',
  secondary: '#10B981',
  indigo: '#6366F1',
  amber: '#F59E0B',
  red: '#EF4444',
  purple: '#8B5CF6',
  blue: '#3B82F6',
};
const CHART_COLORS = [P.primary, P.indigo, P.amber, P.red, P.secondary, P.purple, P.blue];

/* ─── Helpers ─── */
const fmt = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
const pct = (v) => v != null ? `${Number(v).toFixed(1)}%` : '0%';

/* ─── Tooltip ─── */
const CTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '10px 14px', boxShadow: '0 4px 20px rgba(0,0,0,.1)', fontSize: 12 }}>
      <p style={{ fontWeight: 700, color: '#111', marginBottom: 4 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color, margin: '2px 0' }}>
          <b>{p.name}:</b> {p.value}
        </p>
      ))}
    </div>
  );
};

/* ─── KPI Card ─── */
const KpiCard = ({ label, value, color = P.primary, icon: Icon, sub }) => (
  <div style={{
    background: '#fff', borderRadius: 16, border: '1px solid #F3F4F6',
    boxShadow: '0 2px 10px rgba(0,0,0,.04)', padding: '18px 16px',
    display: 'flex', flexDirection: 'column', gap: 8, position: 'relative', overflow: 'hidden',
    transition: 'box-shadow .2s, transform .2s',
  }}
    onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 6px 24px rgba(13,148,136,.12)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
    onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,.04)'; e.currentTarget.style.transform = 'none'; }}
  >
    <div style={{ position: 'absolute', top: 0, right: 0, width: 72, height: 72, borderRadius: '0 16px 0 72px', background: `${color}12` }} />
    <div style={{ background: `${color}15`, borderRadius: 10, padding: 8, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Icon style={{ color, width: 18, height: 18 }} />
    </div>
    <div>
      <p style={{ fontSize: 24, fontWeight: 800, color: '#111', letterSpacing: '-0.5px', lineHeight: 1.1 }}>{value}</p>
      <p style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.06em', marginTop: 4 }}>{label}</p>
      {sub && <p style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>{sub}</p>}
    </div>
  </div>
);

/* ─── Section Card ─── */
const SCard = ({ icon: Icon, title, subtitle, children, noPad }) => (
  <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #F3F4F6', boxShadow: '0 2px 12px rgba(0,0,0,.04)', overflow: 'hidden' }}>
    <div style={{ padding: '18px 24px', borderBottom: '1px solid #F3F4F6', background: '#FAFAFA', display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ background: `${P.primary}15`, borderRadius: 10, padding: 8, display: 'flex' }}>
        <Icon style={{ color: P.primary, width: 17, height: 17 }} />
      </div>
      <div>
        <h2 style={{ fontSize: 15, fontWeight: 800, color: '#111', margin: 0 }}>{title}</h2>
        {subtitle && <p style={{ fontSize: 11, color: '#9CA3AF', margin: '1px 0 0' }}>{subtitle}</p>}
      </div>
    </div>
    <div style={noPad ? {} : { padding: 24 }}>{children}</div>
  </div>
);

/* ─── Progress Bar ─── */
const PBar = ({ value, color = P.primary }) => (
  <div style={{ background: '#F3F4F6', borderRadius: 99, height: 7, overflow: 'hidden' }}>
    <div style={{ width: `${Math.min(100, value || 0)}%`, height: '100%', background: color, borderRadius: 99, transition: 'width .5s ease' }} />
  </div>
);

/* ─── Status Badge ─── */
const StatusBadge = ({ status }) => {
  const map = {
    SUBMITTED: { bg: '#D1FAE5', color: '#065F46', label: 'Submitted' },
    APPROVED: { bg: '#D1FAE5', color: '#065F46', label: 'Approved' },
    DRAFT: { bg: '#F3F4F6', color: '#374151', label: 'Draft' },
    NEEDS_CHANGES: { bg: '#FEF3C7', color: '#92400E', label: 'Needs Changes' },
    REJECTED: { bg: '#FEE2E2', color: '#991B1B', label: 'Rejected' },
  };
  const s = map[status] || { bg: '#F3F4F6', color: '#374151', label: status || 'Unknown' };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 12px', borderRadius: 99, background: s.bg, color: s.color, fontSize: 11, fontWeight: 700 }}>
      {status === 'APPROVED' || status === 'SUBMITTED' ? <HiOutlineCheckCircle style={{ width: 12 }} /> : status === 'NEEDS_CHANGES' ? <HiOutlineExclamationCircle style={{ width: 12 }} /> : null}
      {s.label}
    </span>
  );
};

/* ══════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════ */
export default function AdminReportViewPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackLoading, setFeedbackLoading] = useState(false);

  /* ── Fetch report ── */
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    reportsApi.getById(id)
      .then(res => {
        const d = res?.data ?? res;
        setData(d);
        setFeedbackText(d?.reportDto?.supervisorFeedback || d?.supervisorFeedback || '');
      })
      .catch(err => {
        console.error(err);
        toast.error(err?.message || 'Failed to load report');
        setData(null);
      })
      .finally(() => setLoading(false));
  }, [id]);

  /* ── Feedback ── */
  const handleFeedback = async (status) => {
    if (status === 'NEEDS_CHANGES' && !feedbackText.trim()) {
      toast.error('Please enter what changes are needed');
      return;
    }
    setFeedbackLoading(true);
    try {
      await reportsApi.provideFeedback(id, { status, feedback: feedbackText });
      toast.success(`Report ${status === 'APPROVED' ? 'approved' : 'sent back for changes'}`);
      setData(prev => ({
        ...prev,
        reportDto: { ...(prev.reportDto || prev), status, supervisorFeedback: feedbackText },
      }));
    } catch (e) {
      toast.error('Failed to submit feedback');
    } finally {
      setFeedbackLoading(false);
    }
  };

  /* ── Loading / error ── */
  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
      <Spinner size="lg" />
    </div>
  );
  if (!data) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, gap: 12 }}>
      <HiOutlineDocumentReport style={{ width: 48, height: 48, color: '#E5E7EB' }} />
      <p style={{ fontSize: 16, fontWeight: 700, color: '#6B7280' }}>Report not found</p>
      <button onClick={() => navigate('/admin/reports')} style={{ fontSize: 13, color: P.primary, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>
        Back to Reports
      </button>
    </div>
  );

  /* ── Normalise data ── */
  const report = data.reportDto || data;
  const summary = data.summary || {};
  // Organization data — embedded if already fetched, or from summary
  const orgData = data.organizationData || data.orgData || {};

  const reportType = report.reportType || report.orgPeriodType || '';
  const isOrgReport = reportType === 'ORGANIZATION';
  const isSupReport = reportType === 'SUPERVISOR_TEAM';
  const isWorkerReport = ['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY', 'BENEFICIARY_COMPLETION'].includes(reportType);

  const periodStr = `${fmt(report.periodStart)} – ${fmt(report.periodEnd)}`;

  /* KPIs — work for all report types */
  const chartData = data.chartData || summary.chartData || {};
  const reportInterventions = data.interventions || [];
  const reportCases = data.cases || [];

  const kpiBeneficiaries = orgData.totalBeneficiariesServed ?? summary.totalBeneficiaries ?? summary.beneficiariesServed ?? 0;
  const kpiCases = orgData.totalCasesManaged ?? summary.totalActiveCases ?? summary.newCasesInPeriod ?? summary.totalCases ?? 0;
  const kpiActiveCases = orgData.activeCases ?? summary.totalActiveCases ?? summary.activeCases ?? 0;
  const kpiClosedCases = orgData.closedCases ?? summary.closedCasesInPeriod ?? summary.closedCases ?? 0;
  const kpiSuccessRate = pct(orgData.overallSuccessRate ?? summary.interventionCompletionRate ?? summary.successRate ?? summary.avgSuccessRate);
  const kpiCompliance = pct(orgData.overallComplianceRate ?? summary.complianceRate);
  const kpiWorkers = orgData.totalSocialWorkers ?? summary.totalWorkers ?? summary.socialWorkersCount ?? 0;
  const kpiSupervisors = orgData.totalSupervisors ?? summary.totalSupervisors ?? 0;
  const kpiInterventions = orgData.interventionsCompleted ?? summary.interventionsCompleted ?? reportInterventions.length ?? 0;

  /* Charts */
  const districtPerformance = orgData.districtPerformance || summary.districtPerformance || [];
  const workerProgressDist = (chartData.caseProgressDistribution || []).map((e) => ({
    label: e.label,
    value: Number(e.value) || 0,
    color: CHART_COLORS[0],
  }));
  const workerInterventionDist = (chartData.interventionTypeDistribution || []).map((e, i) => ({
    label: e.label,
    value: Number(e.value) || 0,
    color: CHART_COLORS[i % CHART_COLORS.length],
  }));
  const casesByPriority = orgData.casesByPriority || summary.casesByPriority || (isWorkerReport || isSupReport ? workerProgressDist : []);
  const casesByStatus = orgData.casesByStatus || summary.casesByStatus || [];
  const casesByCategory = orgData.casesByCategory || summary.casesByCategory || [];
  const interventionStats = orgData.interventionStats || summary.interventionTypes || (workerInterventionDist.length > 0
    ? workerInterventionDist.map((e) => ({ type: e.label, count: e.value, successRate: 0 }))
    : []);
  const recoveryTrend = orgData.recoveryProgressTrend || chartData.progressOverTime || [];
  const recoveryBands = orgData.beneficiaryRecoveryBands || workerProgressDist;
  const topPerformers = orgData.topPerformers || summary.staffRanking || [];
  const alerts = orgData.alerts || [];
  const yoyMetrics = orgData.yoyMetrics || {};

  /* Attachments */
  const attachments = report.attachments || data.attachments || [];
  const photoAttachments = attachments.filter(a =>
    a.category === 'PHOTO' || /\.(jpg|jpeg|png|gif|webp)$/i.test(a.documentName || '')
  );
  const docAttachments = attachments.filter(a =>
    a.category !== 'PHOTO' && !/\.(jpg|jpeg|png|gif|webp)$/i.test(a.documentName || '')
  );

  /* Supervisor/worker specific fields */
  const workerName = report.generatedByName || summary.workerName || report.workerName || '—';
  const workerSector = report.generatedBySector || summary.sector || report.sector || report.workerSector || '—';
  const workerCell = report.generatedByCell || summary.cell || report.cell || report.workerCell || '—';
  const workerDistrict = report.generatedByDistrict || summary.district || report.district || report.workerDistrict || '—';

  /* Tab definitions */
  const TABS = [
    { id: 'overview', label: 'Overview', icon: HiOutlineDocumentText },
    { id: 'charts', label: 'Charts', icon: HiOutlineChartBar },
    ...(districtPerformance.length > 0 ? [{ id: 'districts', label: 'Districts', icon: HiOutlineMap }] : []),
    ...((isWorkerReport || isSupReport) && reportInterventions.length > 0 ? [{ id: 'interventions', label: `Interventions (${reportInterventions.length})`, icon: HiOutlineLightningBolt }] : []),
    { id: 'attachments', label: `Attachments (${attachments.length})`, icon: HiOutlinePaperClip },
    ...(isSupReport ? [{ id: 'feedback', label: 'Feedback', icon: HiOutlineAnnotation }] : []),
    ...(isOrgReport && Object.keys(yoyMetrics).length > 0 ? [{ id: 'yearly', label: 'Year-on-Year', icon: HiOutlineTrendingUp }] : []),
  ];

  /* ── RENDER ── */
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22, paddingBottom: 48 }}>

      {/* Back */}
      <button onClick={() => navigate('/admin/reports')} style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        fontSize: 13, color: '#6B7280', fontWeight: 600,
        background: 'none', border: 'none', cursor: 'pointer', padding: 0, width: 'fit-content',
      }}
        onMouseEnter={e => e.currentTarget.style.color = P.primary}
        onMouseLeave={e => e.currentTarget.style.color = '#6B7280'}
      >
        <HiArrowLeft style={{ width: 16, height: 16 }} />
        Back to Organization Reports
      </button>

      {/* ─── HERO HEADER (keep existing gradient) ─── */}
      <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 24, border: '1px solid rgba(13,148,136,.15)', boxShadow: '0 8px 40px rgba(13,148,136,.18)' }}>
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary-600 to-secondary opacity-[0.97]" />
        <div style={{ position: 'absolute', inset: 0, opacity: .1, backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }} />
        <div style={{ position: 'absolute', top: -60, right: -60, width: 220, height: 220, borderRadius: '50%', background: 'rgba(255,255,255,.07)', filter: 'blur(50px)' }} />

        <div style={{ position: 'relative', padding: '32px 36px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20 }}>

            {/* Left: title info */}
            <div style={{ color: '#fff', flex: 1, minWidth: 260 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '5px 14px', borderRadius: 99, background: 'rgba(255,255,255,.15)', border: '1px solid rgba(255,255,255,.25)', backdropFilter: 'blur(8px)', marginBottom: 14, fontSize: 12, fontWeight: 700, letterSpacing: '.04em' }}>
                <HiOutlineDocumentReport style={{ width: 14 }} />
                {reportType.replace(/_/g, ' ')} REPORT
              </div>
              <h1 style={{ fontSize: 26, fontWeight: 900, margin: '0 0 8px', letterSpacing: '-0.3px', textShadow: '0 2px 10px rgba(0,0,0,.15)', lineHeight: 1.2 }}>
                {report.title || 'Report'}
              </h1>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginTop: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, opacity: .88 }}>
                  <HiOutlineCalendar style={{ width: 14 }} />
                  {periodStr}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, opacity: .88 }}>
                  <HiOutlineUser style={{ width: 14 }} />
                  {workerName}
                </div>
                {(isWorkerReport || isSupReport) && workerDistrict !== '—' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, opacity: .88 }}>
                    <HiOutlineLocationMarker style={{ width: 14 }} />
                    {workerDistrict}
                  </div>
                )}
              </div>
              <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
                <StatusBadge status={report.status} />
                {report.createdAt && (
                  <span style={{ fontSize: 11, opacity: .7 }}>Generated {fmt(report.createdAt)}</span>
                )}
              </div>
            </div>

            {/* Right: actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-end' }}>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                <ExportButtons reportId={id} reportTitle={report.title} reportType={reportType} periodStart={report.periodStart} />
                <button style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 10,
                  background: 'rgba(255,255,255,.18)', border: '1px solid rgba(255,255,255,.35)',
                  color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                }}>
                  <HiOutlineShare style={{ width: 15 }} />
                  Share
                </button>
                {isOrgReport && (
                  <button style={{
                    display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 10,
                    background: 'rgba(255,255,255,.18)', border: '1px solid rgba(255,255,255,.35)',
                    color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  }}>
                    <HiOutlineCloudUpload style={{ width: 15 }} />
                    Submit to MINALOC
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Alerts strip ─── */}
      {alerts.length > 0 && (
        <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 16, padding: '14px 20px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <HiOutlineExclamationCircle style={{ color: P.amber, width: 20, height: 20, flexShrink: 0, marginTop: 1 }} />
          <div>
            <p style={{ fontWeight: 700, fontSize: 13, color: '#92400E', margin: '0 0 6px' }}>Actions Required</p>
            <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: '#92400E' }}>
              {alerts.map((a, i) => <li key={i}>{a}</li>)}
            </ul>
          </div>
        </div>
      )}

      {/* ─── TAB NAV ─── */}
      <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #F3F4F6', boxShadow: '0 2px 8px rgba(0,0,0,.04)', padding: '5px 6px', display: 'flex', gap: 4, overflowX: 'auto' }}>
        {TABS.map(tab => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 9,
              border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap',
              transition: 'all .2s',
              background: active ? P.primary : 'transparent',
              color: active ? '#fff' : '#6B7280',
              boxShadow: active ? '0 3px 12px rgba(13,148,136,.28)' : 'none',
            }}>
              <Icon style={{ width: 15, height: 15 }} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ══════════ TAB: OVERVIEW ══════════ */}
      {activeTab === 'overview' && (
        <>
          {/* Executive Summary — shows ONLY the report author's narrative, no auto-combine */}
          <SCard icon={HiOutlineDocumentText} title="Executive Summary" subtitle="Written narrative from the report author">
            {report.narrative ? (
              <p style={{ fontSize: 14, lineHeight: 1.75, color: '#374151', whiteSpace: 'pre-wrap', margin: 0 }}>
                {report.narrative}
              </p>
            ) : (
              <div style={{ textAlign: 'center', padding: '24px 0', color: '#9CA3AF' }}>
                <HiOutlineDocumentText style={{ width: 36, height: 36, margin: '0 auto 8px', display: 'block' }} />
                <p style={{ fontSize: 13 }}>No executive summary was provided for this report.</p>
              </div>
            )}
          </SCard>

          {/* For worker / supervisor reports — show their specific summary fields */}
          {(isWorkerReport || isSupReport) && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14 }}>
              <KpiCard label="Beneficiaries" value={kpiBeneficiaries} icon={HiOutlineUserGroup} color={P.primary} />
              <KpiCard label="Cases Managed" value={kpiCases} icon={HiOutlineBriefcase} color={P.indigo} />
              <KpiCard label="Active Cases" value={kpiActiveCases} icon={HiOutlineClock} color={P.amber} />
              <KpiCard label="Closed Cases" value={kpiClosedCases} icon={HiOutlineCheckCircle} color={P.secondary} />
              <KpiCard label="Interventions" value={kpiInterventions} icon={HiOutlineLightningBolt} color={P.purple} />
              <KpiCard label="Success Rate" value={kpiSuccessRate} icon={HiOutlineChartBar} color={P.blue} />
            </div>
          )}

          {/* Org report KPIs */}
          {isOrgReport && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14 }}>
              <KpiCard label="Beneficiaries" value={kpiBeneficiaries} icon={HiOutlineUserGroup} color={P.primary} />
              <KpiCard label="Total Cases" value={kpiCases} icon={HiOutlineBriefcase} color={P.indigo} />
              <KpiCard label="Active Cases" value={kpiActiveCases} icon={HiOutlineClock} color={P.amber} />
              <KpiCard label="Closed Cases" value={kpiClosedCases} icon={HiOutlineCheckCircle} color={P.secondary} />
              <KpiCard label="Success Rate" value={kpiSuccessRate} icon={HiOutlineChartBar} color={P.blue} />
              <KpiCard label="Compliance" value={kpiCompliance} icon={HiOutlineClipboardList} color={P.purple} />
              <KpiCard label="Social Workers" value={kpiWorkers} icon={HiOutlineUser} color={P.primary} />
              <KpiCard label="Supervisors" value={kpiSupervisors} icon={HiOutlineOfficeBuilding} color={P.primary6} />
            </div>
          )}

          {/* Worker / Supervisor specific info card */}
          {(isWorkerReport || isSupReport) && (
            <SCard icon={HiOutlineInformationCircle} title="Report Details" subtitle="Staff and location information">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
                {[
                  { label: 'Report Type', value: reportType.replace(/_/g, ' ') },
                  { label: 'Submitted By', value: workerName },
                  { label: 'District', value: workerDistrict },
                  { label: 'Sector', value: workerSector },
                  { label: 'Cell', value: workerCell },
                  { label: 'Period', value: periodStr },
                  { label: 'Status', value: <StatusBadge status={report.status} /> },
                  { label: 'Generated', value: fmt(report.createdAt) },
                ].map(item => (
                  <div key={item.label} style={{ padding: '12px 0', borderBottom: '1px solid #F3F4F6' }}>
                    <p style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 4 }}>{item.label}</p>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>{item.value}</div>
                  </div>
                ))}
              </div>
            </SCard>
          )}

          {/* Supervisor-submitted worker list */}
          {isSupReport && (summary.workerSubmissions || summary.teamWorkers || []).length > 0 && (
            <SCard icon={HiOutlineUserGroup} title="Worker Submission Status" subtitle="Social workers under this supervisor" noPad>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: '#F9FAFB' }}>
                      {['Worker', 'Sector/Cell', 'Cases', 'Interventions', 'Progress', 'Submitted'].map(h => (
                        <th key={h} style={{ padding: '11px 16px', textAlign: h === 'Worker' || h === 'Sector/Cell' ? 'left' : 'center', fontSize: 10, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '.06em' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(summary.workerSubmissions || summary.teamWorkers || []).map((w, i) => (
                      <tr key={i} style={{ borderTop: '1px solid #F3F4F6' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#F9FAFB'}
                        onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
                        <td style={{ padding: '12px 16px', fontWeight: 600, color: '#111' }}>{w.workerName || w.name || '—'}</td>
                        <td style={{ padding: '12px 16px', color: '#6B7280' }}>{[w.sector, w.cell].filter(Boolean).join(', ') || '—'}</td>
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>{w.totalCases ?? w.casesCount ?? 0}</td>
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>{w.interventionsCompleted ?? 0}</td>
                        <td style={{ padding: '12px 16px', minWidth: 120 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <PBar value={w.avgProgress ?? w.successRate ?? 0} color={
                              (w.avgProgress ?? w.successRate ?? 0) >= 80 ? P.secondary :
                                (w.avgProgress ?? w.successRate ?? 0) >= 60 ? P.amber : P.red
                            } />
                            <span style={{ fontSize: 11, fontWeight: 700, color: '#374151', flexShrink: 0 }}>{pct(w.avgProgress ?? w.successRate)}</span>
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          {w.submitted
                            ? <HiOutlineCheckCircle style={{ width: 16, color: P.secondary, margin: '0 auto' }} />
                            : <HiOutlineXCircle style={{ width: 16, color: P.red, margin: '0 auto' }} />}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SCard>
          )}

          {/* Top performers */}
          {topPerformers.length > 0 && (
            <SCard icon={HiOutlineFlag} title="Top Performing Staff" subtitle="Ranked by case success rate for this period" noPad>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: '#F9FAFB' }}>
                      {['#', 'Name', 'District', 'Cases', 'Success Rate'].map(h => (
                        <th key={h} style={{ padding: '11px 16px', textAlign: h === 'Name' || h === 'District' ? 'left' : 'center', fontSize: 10, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '.06em' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {topPerformers.map((p, i) => (
                      <tr key={i} style={{ borderTop: '1px solid #F3F4F6', background: i === 0 ? '#F0FDF4' : '#fff' }}
                        onMouseEnter={e => { if (i > 0) e.currentTarget.style.background = '#F9FAFB'; }}
                        onMouseLeave={e => { if (i > 0) e.currentTarget.style.background = '#fff'; }}>
                        <td style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 800, color: i === 0 ? '#065F46' : '#374151' }}>
                          {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                        </td>
                        <td style={{ padding: '12px 16px', fontWeight: 700, color: '#111' }}>{p.name || p.workerName || '—'}</td>
                        <td style={{ padding: '12px 16px', color: '#6B7280' }}>{p.district || '—'}</td>
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>{p.casesManaged ?? p.casesCount ?? p.cases ?? 0}</td>
                        <td style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 800, color: P.primary }}>{pct(p.successRate)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SCard>
          )}
        </>
      )}

      {/* ══════════ TAB: CHARTS ══════════ */}
      {activeTab === 'charts' && (
        <>
          {/* Recovery Bands */}
          {recoveryBands.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
              <SCard icon={HiOutlineTrendingUp} title="Beneficiary Recovery Distribution" subtitle="Case progress bands">
                <div style={CHART_BOX}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={recoveryBands} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                      <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                      <Tooltip content={<CTip />} />
                      <Bar dataKey="value" name="Cases" radius={[6, 6, 0, 0]}>
                        {recoveryBands.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </SCard>

              {recoveryTrend.length > 0 && (
                <SCard icon={HiOutlineTrendingUp} title="Recovery Progress Trend" subtitle="Average beneficiary progress over time">
                  <div style={CHART_BOX}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={recoveryTrend} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                        <defs>
                          <linearGradient id="gTrend" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={P.indigo} stopOpacity={.25} />
                            <stop offset="95%" stopColor={P.indigo} stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                        <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                        <Tooltip content={<CTip />} />
                        <Area type="monotone" dataKey="value" stroke={P.indigo} strokeWidth={2.5} fill="url(#gTrend)" name="Avg Progress %" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </SCard>
              )}
            </div>
          )}

          {/* Cases by Priority + Status */}
          {(casesByPriority.length > 0 || casesByStatus.length > 0) && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
              {casesByPriority.length > 0 && (
                <SCard icon={HiOutlineFlag} title="Cases by Priority" subtitle="Urgency distribution">
                  <div style={CHART_BOX}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={casesByPriority} dataKey="value" nameKey="label" cx="50%" cy="50%" innerRadius={50} outerRadius={90}
                          label={({ label, percent }) => `${(percent * 100).toFixed(0)}%`} labelLine={false}>
                          {casesByPriority.map((e, i) => <Cell key={i} fill={e.color || CHART_COLORS[i % CHART_COLORS.length]} />)}
                        </Pie>
                        <Tooltip content={<CTip />} />
                        <Legend wrapperStyle={{ fontSize: 11, fontWeight: 600 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </SCard>
              )}

              {casesByStatus.length > 0 && (
                <SCard icon={HiOutlineChartBar} title="Cases by Status" subtitle="Current case states">
                  <div style={CHART_BOX}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={casesByStatus} dataKey="value" nameKey="label" cx="50%" cy="50%" innerRadius={50} outerRadius={90}
                          label={({ label, percent }) => `${(percent * 100).toFixed(0)}%`} labelLine={false}>
                          {casesByStatus.map((e, i) => <Cell key={i} fill={e.color || CHART_COLORS[i % CHART_COLORS.length]} />)}
                        </Pie>
                        <Tooltip content={<CTip />} />
                        <Legend wrapperStyle={{ fontSize: 11, fontWeight: 600 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </SCard>
              )}
            </div>
          )}

          {/* Case categories */}
          {casesByCategory.length > 0 && (
            <SCard icon={HiOutlineClipboardList} title="Case Types" subtitle="Most common case categories">
              <div style={CHART_BOX}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={casesByCategory} layout="vertical" margin={{ left: 10, right: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F3F4F6" />
                    <XAxis type="number" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                    <YAxis dataKey="label" type="category" width={120} tick={{ fontSize: 11, fill: '#374151' }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CTip />} />
                    <Bar dataKey="value" name="Cases" radius={[0, 7, 7, 0]} label={{ position: 'right', fontSize: 11, fill: P.indigo, fontWeight: 700 }}>
                      {casesByCategory.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </SCard>
          )}

          {/* Intervention types */}
          {interventionStats.length > 0 && (
            <SCard icon={HiOutlineLightningBolt} title="Intervention Effectiveness" subtitle="Success rate per intervention type">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {interventionStats.map((t, i) => {
                  const rate = t.percent ?? t.successRate ?? 0;
                  return (
                    <div key={i}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{t.label || t.type || 'Other'}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontSize: 11, color: '#9CA3AF' }}>{t.count ?? 0} interventions</span>
                          <span style={{ fontSize: 13, fontWeight: 800, color: CHART_COLORS[i % CHART_COLORS.length] }}>{pct(rate)}</span>
                        </div>
                      </div>
                      <PBar value={rate} color={CHART_COLORS[i % CHART_COLORS.length]} />
                    </div>
                  );
                })}
              </div>
            </SCard>
          )}

          {casesByPriority.length === 0 && casesByStatus.length === 0 && casesByCategory.length === 0 && interventionStats.length === 0 && recoveryBands.length === 0 && (
            <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #F3F4F6', padding: '48px 24px', textAlign: 'center', color: '#9CA3AF' }}>
              <HiOutlineChartBar style={{ width: 48, height: 48, margin: '0 auto 12px', display: 'block', color: '#E5E7EB' }} />
              <p style={{ fontSize: 14, fontWeight: 600 }}>No chart data available for this report type.</p>
            </div>
          )}
        </>
      )}

      {/* ══════════ TAB: DISTRICTS ══════════ */}
      {activeTab === 'districts' && districtPerformance.length > 0 && (
        <>
          <SCard icon={HiOutlineMap} title="District Performance — Bar Chart" subtitle="Active vs closed cases per district">
            <div style={{ ...CHART_BOX, height: 320, minHeight: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={districtPerformance} layout="vertical" margin={{ left: 10, right: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F3F4F6" />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="district" type="category" width={100} tick={{ fontSize: 11, fill: '#374151', fontWeight: 600 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CTip />} />
                  <Legend wrapperStyle={{ fontSize: 11, fontWeight: 600 }} />
                  <Bar dataKey="activeCases" fill={P.primary} radius={[0, 6, 6, 0]} name="Active Cases" />
                  <Bar dataKey="closedCases" fill={P.indigo} radius={[0, 6, 6, 0]} name="Closed Cases" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </SCard>

          <SCard icon={HiOutlineMap} title="District Data Table" subtitle="Full breakdown per district" noPad>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#F9FAFB' }}>
                    {['District', 'Supervisor', 'Workers', 'Beneficiaries', 'Cases', 'Active', 'Closed', 'Success Rate'].map(h => (
                      <th key={h} style={{ padding: '12px 16px', textAlign: h === 'District' || h === 'Supervisor' ? 'left' : 'center', fontSize: 10, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '.06em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...districtPerformance].sort((a, b) => (b.successRate || 0) - (a.successRate || 0)).map((d, i) => {
                    const rate = Math.round(d.successRate || 0);
                    return (
                      <tr key={i} style={{ borderTop: '1px solid #F3F4F6' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#F9FAFB'}
                        onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
                        <td style={{ padding: '13px 16px', fontWeight: 700, color: '#111' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            {i === 0 && <span style={{ background: '#FEF3C7', color: '#92400E', fontSize: 10, fontWeight: 800, padding: '1px 6px', borderRadius: 5 }}>TOP</span>}
                            {d.district || d.name || '—'}
                          </div>
                        </td>
                        <td style={{ padding: '13px 16px', color: '#6B7280' }}>{d.supervisorName || '—'}</td>
                        <td style={{ padding: '13px 16px', textAlign: 'center' }}>{d.socialWorkersCount ?? d.workersCount ?? 0}</td>
                        <td style={{ padding: '13px 16px', textAlign: 'center' }}>{d.beneficiaries ?? 0}</td>
                        <td style={{ padding: '13px 16px', textAlign: 'center' }}>{d.cases ?? d.casesCount ?? 0}</td>
                        <td style={{ padding: '13px 16px', textAlign: 'center' }}>{d.activeCases ?? 0}</td>
                        <td style={{ padding: '13px 16px', textAlign: 'center' }}>{d.closedCases ?? 0}</td>
                        <td style={{ padding: '13px 16px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, minWidth: 80 }}>
                            <span style={{ fontWeight: 800, fontSize: 13, color: rate >= 80 ? P.secondary : rate >= 60 ? P.amber : P.red }}>{rate}%</span>
                            <PBar value={rate} color={rate >= 80 ? P.secondary : rate >= 60 ? P.amber : P.red} />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </SCard>
        </>
      )}

      {/* ══════════ TAB: INTERVENTIONS ══════════ */}
      {activeTab === 'interventions' && reportInterventions.length > 0 && (
        <SCard icon={HiOutlineLightningBolt} title="Interventions" subtitle="All interventions in this reporting period (planned, in progress, and completed)" noPad>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#F9FAFB' }}>
                  {['Title', 'Type', 'Status', 'Planned', 'Effectiveness'].map(h => (
                    <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '.06em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reportInterventions.map((iv, i) => (
                  <tr key={iv.id || i} style={{ borderTop: '1px solid #F3F4F6' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: '#111' }}>{iv.title || '—'}</td>
                    <td style={{ padding: '12px 16px', color: '#6B7280' }}>{iv.type || '—'}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700,
                        background: iv.status === 'COMPLETED' ? '#D1FAE5' : iv.status === 'IN_PROGRESS' ? '#DBEAFE' : '#F3F4F6',
                        color: iv.status === 'COMPLETED' ? '#065F46' : iv.status === 'IN_PROGRESS' ? '#1E40AF' : '#374151',
                      }}>
                        {(iv.status || 'PLANNED').replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: '#6B7280' }}>{iv.plannedStartDatetime ? fmt(iv.plannedStartDatetime) : '—'}</td>
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: P.primary }}>{iv.effectivenessPercent != null ? `${iv.effectivenessPercent}%` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SCard>
      )}

      {/* ══════════ TAB: ATTACHMENTS ══════════ */}
      {activeTab === 'attachments' && (
        <SCard icon={HiOutlinePaperClip} title="Report Attachments" subtitle="Photos, documents, and supporting evidence">
          {attachments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: '#9CA3AF' }}>
              <HiOutlinePaperClip style={{ width: 44, height: 44, margin: '0 auto 12px', display: 'block', color: '#E5E7EB' }} />
              <p style={{ fontSize: 14, fontWeight: 600 }}>No attachments were included in this report.</p>
            </div>
          ) : (
            <>
              {/* Photos section */}
              {photoAttachments.length > 0 && (
                <div style={{ marginBottom: 28 }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 14 }}>
                    Photos ({photoAttachments.length})
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14 }}>
                    {photoAttachments.map((att, i) => (
                      <div key={att.id || i} style={{ borderRadius: 14, overflow: 'hidden', border: '1px solid #E5E7EB', cursor: 'pointer', transition: 'transform .2s, box-shadow .2s' }}
                        onClick={() => { setGalleryIndex(i); setGalleryOpen(true); }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.02)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,.12)'; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}>
                        <AuthenticatedImage
                          documentId={att.documentId}
                          attachment={att}
                          alt={att.caption || att.documentName || 'Attachment'}
                          style={{ width: '100%', height: 140, objectFit: 'cover', display: 'block' }}
                        />
                        <div style={{ padding: '8px 10px', background: '#fff' }}>
                          <p style={{ fontSize: 11, fontWeight: 600, color: '#374151', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {att.caption || att.documentName || 'Photo'}
                          </p>
                          {att.description && (
                            <p style={{ fontSize: 10, color: '#9CA3AF', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {att.description}
                            </p>
                          )}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 6 }}>
                            <HiOutlineEye style={{ width: 12, color: P.primary }} />
                            <span style={{ fontSize: 10, color: P.primary, fontWeight: 600 }}>View full size</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Documents section */}
              {docAttachments.length > 0 && (
                <div>
                  <p style={{ fontSize: 12, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 14 }}>
                    Documents ({docAttachments.length})
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {docAttachments.map((att, i) => (
                      <div key={att.id || i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 12, border: '1px solid #E5E7EB', background: '#FAFAFA', transition: 'background .15s' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#F3F4F6'}
                        onMouseLeave={e => e.currentTarget.style.background = '#FAFAFA'}>
                        <div style={{ background: `${P.indigo}15`, borderRadius: 10, padding: 10, display: 'flex', flexShrink: 0 }}>
                          <HiOutlineDocumentText style={{ width: 20, height: 20, color: P.indigo }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 13, fontWeight: 700, color: '#111', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {att.caption || att.documentName || 'Document'}
                          </p>
                          {att.description && (
                            <p style={{ fontSize: 11, color: '#6B7280', margin: '2px 0 0' }}>{att.description}</p>
                          )}
                          <p style={{ fontSize: 10, color: '#9CA3AF', margin: '3px 0 0', textTransform: 'uppercase', letterSpacing: '.05em' }}>
                            {att.category || 'Document'} · {att.documentName?.split('.').pop()?.toUpperCase() || 'FILE'}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => att.documentId && documentApi.downloadFile(att.documentId, att.documentName || att.caption)}
                          style={{
                          display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 9,
                          background: `${P.primary}12`, color: P.primary, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, flexShrink: 0,
                        }}>
                          <HiOutlineDownload style={{ width: 14 }} />
                          Download
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </SCard>
      )}

      {/* ══════════ TAB: FEEDBACK (supervisor team only) ══════════ */}
      {activeTab === 'feedback' && isSupReport && (
        <>
          {report.supervisorFeedback && (
            <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 16, padding: '16px 20px' }}>
              <p style={{ fontWeight: 700, fontSize: 13, color: '#1E40AF', margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: 6 }}>
                <HiOutlineAnnotation style={{ width: 16 }} />
                Previous Admin Feedback
              </p>
              <p style={{ fontSize: 13, color: '#1D4ED8', margin: 0, lineHeight: 1.6 }}>{report.supervisorFeedback}</p>
            </div>
          )}

          <SCard icon={HiOutlineAnnotation} title="Provide Feedback" subtitle="Review this supervisor report and give your response">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 8 }}>
                  Feedback / Notes for Supervisor
                </label>
                <textarea
                  style={{ width: '100%', minHeight: 120, padding: '12px 14px', border: '1px solid #D1D5DB', borderRadius: 12, fontSize: 13, color: '#374151', resize: 'vertical', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', lineHeight: 1.6 }}
                  placeholder="Enter your feedback, required changes, or approval notes..."
                  value={feedbackText}
                  onChange={e => setFeedbackText(e.target.value)}
                  disabled={feedbackLoading}
                  onFocus={e => e.currentTarget.style.borderColor = P.primary}
                  onBlur={e => e.currentTarget.style.borderColor = '#D1D5DB'}
                />
              </div>

              {/* Current status info */}
              <div style={{ background: '#F9FAFB', borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <HiOutlineInformationCircle style={{ color: '#6B7280', width: 16, flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: '#6B7280' }}>
                  Current status: <strong>{report.status}</strong>
                  {report.status === 'APPROVED' && ' — This report has already been approved.'}
                </span>
              </div>

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button
                  onClick={() => handleFeedback('APPROVED')}
                  disabled={feedbackLoading || report.status === 'APPROVED'}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 7, padding: '11px 22px', borderRadius: 11,
                    background: report.status === 'APPROVED' ? '#D1FAE5' : '#059669', color: report.status === 'APPROVED' ? '#065F46' : '#fff',
                    border: 'none', fontSize: 13, fontWeight: 700, cursor: report.status === 'APPROVED' ? 'default' : 'pointer',
                    boxShadow: report.status === 'APPROVED' ? 'none' : '0 3px 12px rgba(5,150,105,.3)',
                  }}>
                  <HiOutlineThumbUp style={{ width: 16 }} />
                  {report.status === 'APPROVED' ? 'Already Approved' : feedbackLoading ? 'Approving…' : 'Approve Report'}
                </button>
                <button
                  onClick={() => handleFeedback('NEEDS_CHANGES')}
                  disabled={feedbackLoading}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 7, padding: '11px 22px', borderRadius: 11,
                    background: '#fff', color: P.amber, border: `2px solid ${P.amber}`,
                    fontSize: 13, fontWeight: 700, cursor: 'pointer',
                  }}>
                  <HiOutlineExclamationCircle style={{ width: 16 }} />
                  {feedbackLoading ? 'Sending…' : 'Request Changes'}
                </button>
              </div>
            </div>
          </SCard>
        </>
      )}

      {/* ══════════ TAB: YEAR-ON-YEAR ══════════ */}
      {activeTab === 'yearly' && Object.keys(yoyMetrics).length > 0 && (
        <SCard icon={HiOutlineTrendingUp} title="Year-on-Year Comparison" subtitle="Current year vs previous year" noPad>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#F9FAFB' }}>
                  {['Metric', 'Previous Year', 'Current Year', 'Change'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: h === 'Metric' ? 'left' : 'center', fontSize: 10, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '.06em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.entries(yoyMetrics).map(([key, m]) => {
                  const change = m.percentageChange ?? 0;
                  return (
                    <tr key={key} style={{ borderTop: '1px solid #F3F4F6' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#F9FAFB'}
                      onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
                      <td style={{ padding: '13px 16px', fontWeight: 600, color: '#374151', textTransform: 'capitalize' }}>{key.replace(/_/g, ' ')}</td>
                      <td style={{ padding: '13px 16px', textAlign: 'center', color: '#6B7280' }}>{Math.round(m.previousYearValue ?? 0)}</td>
                      <td style={{ padding: '13px 16px', textAlign: 'center', fontWeight: 700, color: '#111' }}>{Math.round(m.currentYearValue ?? 0)}</td>
                      <td style={{ padding: '13px 16px', textAlign: 'center' }}>
                        <span style={{ fontWeight: 800, fontSize: 13, color: change >= 0 ? P.secondary : P.red }}>
                          {change >= 0 ? '+' : ''}{Math.round(change)}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </SCard>
      )}

      {/* Footer */}
      <div style={{ textAlign: 'center', paddingTop: 16, borderTop: '1px solid #F3F4F6' }}>
        <p style={{ fontSize: 11, color: '#9CA3AF', margin: '0 0 3px' }}>
          Report generated {fmt(report.createdAt)} by {report.generatedByName || 'Administrator'}
          {(report.latitude != null && report.longitude != null) && ` · GPS: ${report.latitude}, ${report.longitude}`}
        </p>
        <p style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', margin: 0 }}>
          CONFIDENTIAL — Internal Use Only · admin@afyalink.rw
        </p>
      </div>

      {/* Photo gallery modal */}
      <PhotoGalleryModal
        isOpen={galleryOpen}
        onClose={() => setGalleryOpen(false)}
        photos={photoAttachments}
        initialIndex={galleryIndex}
        title={report.title}
      />
    </div>
  );
}