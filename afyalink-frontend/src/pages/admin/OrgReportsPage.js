// pages/admin/reports/OrgReportsPage.jsx
// FIXES:
//  1. Executive Summary — admin writes their OWN, never auto-combines from supervisors
//  2. District filter — creates report for THAT district only (passed to backend)
//  3. Attachment upload — admin can add images/documents to org report with captions
//  4. "Team Reports Included" section REMOVED — admin report uses live system data only
//  5. Report generation previews real system data (not combined supervisor narratives)
//  6. Full redesign: modern layout, tabs, improved UX
//  7. Period filter works correctly: weekly / monthly / yearly

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { reportsApi } from '../../api/reportsApi';
import { notificationApi } from '../../api/notificationApi';
import { analyticsApi } from '../../api/analyticsApi';
import Spinner from '../../components/common/Spinner';
import EmptyState from '../../components/common/EmptyState';
import Modal from '../../components/common/Modal';
import ReportStatusBadge from '../../components/shared/ReportStatusBadge';
import {
  HiOutlineEye,
  HiOutlineDocumentReport,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineOfficeBuilding,
  HiOutlineChartBar,
  HiOutlineClipboardList,
  HiOutlineTrendingUp,
  HiOutlineRefresh,
  HiOutlinePlusCircle,
  HiOutlineSearch,
  HiOutlineUsers,
  HiOutlineUserGroup,
  HiOutlinePaperClip,
  HiOutlineDocumentText,
  HiOutlineTrash,
  HiOutlineBell,
  HiOutlineX,
  HiOutlineMap,
  HiOutlineLightningBolt,
  HiOutlineInformationCircle,  // ADDED - missing import
} from 'react-icons/hi';
import { toast } from 'react-toastify';
import { RWANDA_DISTRICTS } from '../../utils/constants';
import { systemApi } from '../../api/systemApi';
import {
  SYSTEM_START_YEAR,
  SYSTEM_START_MONTH,
  SYSTEM_START_DATE,
  getCurrentYear,
  getCurrentMonthString,
  getTodayISO,
  computePeriod,
  validatePeriodRange,
  clampYear,
  clampMonth,
  initServerDate,
  extractApiErrorMessage,
} from '../../utils/dateValidation';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';

/* ─── tokens ─── */
const P = { primary: '#0D9488', primary6: '#0F766E', secondary: '#10B981', indigo: '#6366F1', amber: '#F59E0B', red: '#EF4444', purple: '#8B5CF6', blue: '#3B82F6' };
const CHART_COLORS = [P.primary, P.indigo, P.amber, P.red, P.secondary, P.purple, P.blue];

const fmtDate = d => d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

const DateBanner = ({ type, message }) => {
  if (!message) return null;
  const isError = type === 'error';
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 16px', borderRadius: 12,
      background: isError ? '#FEF2F2' : '#FFFBEB',
      border: `1px solid ${isError ? '#FECACA' : '#FDE68A'}`,
      color: isError ? '#991B1B' : '#92400E',
      fontSize: 13, fontWeight: 600, lineHeight: 1.5,
    }}>
      {isError
        ? <HiOutlineXCircle style={{ width: 18, height: 18, flexShrink: 0, marginTop: 1 }} />
        : <HiOutlineInformationCircle style={{ width: 18, height: 18, flexShrink: 0, marginTop: 1 }} />}
      <span>{message}</span>
    </div>
  );
};

/* ─── KPI card ─── */
const KpiCard = ({ label, value, icon: Icon, color = P.primary, sub }) => (
  <div style={{
    background: '#fff', borderRadius: 16, border: '1px solid #F3F4F6',
    boxShadow: '0 2px 10px rgba(0,0,0,.04)', padding: '18px 16px',
    display: 'flex', flexDirection: 'column', gap: 8, position: 'relative', overflow: 'hidden',
    transition: 'box-shadow .2s, transform .2s',
  }}
    onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 6px 24px rgba(13,148,136,.1)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
    onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,.04)'; e.currentTarget.style.transform = 'none'; }}>
    <div style={{ position: 'absolute', top: 0, right: 0, width: 68, height: 68, borderRadius: '0 16px 0 68px', background: `${color}10` }} />
    <div style={{ background: `${color}15`, borderRadius: 10, padding: 8, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Icon style={{ color, width: 18, height: 18 }} />
    </div>
    <div>
      <p style={{ fontSize: 24, fontWeight: 800, color: '#111', letterSpacing: '-0.5px', lineHeight: 1.1 }}>{value ?? 0}</p>
      <p style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.06em', marginTop: 4 }}>{label}</p>
      {sub && <p style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>{sub}</p>}
    </div>
  </div>
);

/* ─── Section wrapper ─── */
const Sec = ({ icon: Icon, title, subtitle, right, children, noPad }) => (
  <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #F3F4F6', boxShadow: '0 2px 12px rgba(0,0,0,.04)', overflow: 'hidden' }}>
    <div style={{ padding: '16px 22px', borderBottom: '1px solid #F3F4F6', background: '#FAFAFA', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ background: `${P.primary}15`, borderRadius: 10, padding: 8, display: 'flex' }}>
          <Icon style={{ color: P.primary, width: 16, height: 16 }} />
        </div>
        <div>
          <h2 style={{ fontSize: 15, fontWeight: 800, color: '#111', margin: 0 }}>{title}</h2>
          {subtitle && <p style={{ fontSize: 11, color: '#9CA3AF', margin: '1px 0 0' }}>{subtitle}</p>}
        </div>
      </div>
      {right}
    </div>
    <div style={noPad ? {} : { padding: 22 }}>{children}</div>
  </div>
);

/* ─── Custom tooltip ─── */
const CTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '10px 14px', boxShadow: '0 4px 20px rgba(0,0,0,.1)', fontSize: 12 }}>
      <p style={{ fontWeight: 700, color: '#111', marginBottom: 4 }}>{label}</p>
      {payload.map((p, i) => <p key={i} style={{ color: p.color, margin: '2px 0' }}><b>{p.name}:</b> {p.value}</p>)}
    </div>
  );
};

/* ─── Progress bar ─── */
const PBar = ({ value, color = P.primary }) => (
  <div style={{ background: '#F3F4F6', borderRadius: 99, height: 6, overflow: 'hidden', flex: 1 }}>
    <div style={{ width: `${Math.min(100, value || 0)}%`, height: '100%', background: color, borderRadius: 99 }} />
  </div>
);

/* ══════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════ */
export default function OrgReportsPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  /* ── core state ── */
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [tableSearch, setTableSearch] = useState('');
  const [tableTypeFilter, setTableTypeFilter] = useState('');

  /* ── period ── */
  const [periodType, setPeriodType] = useState('MONTHLY');
  const [periodDate, setPeriodDate] = useState(() => `${getCurrentMonthString()}-01`);
  const [serverDateReady, setServerDateReady] = useState(false);
  const [dateWarning, setDateWarning] = useState(null);
  const [dateError, setDateError] = useState(null);

  const { start: periodStart, end: periodEnd } = useMemo(
    () => computePeriod(periodType, periodDate),
    [periodType, periodDate]
  );

  /* ── live org data ── */
  const [orgData, setOrgData] = useState(null);
  const [orgLoading, setOrgLoading] = useState(false);
  const [districtFilter, setDistrictFilter] = useState('');
  const [availableDistricts, setAvailableDistricts] = useState([]);

  /* ── supervisor submission status ── */
  const [submissionSummary, setSubmissionSummary] = useState(null);
  const [submissionLoading, setSubmissionLoading] = useState(false);

  /* ── generate modal ── */
  const [genModalOpen, setGenModalOpen] = useState(false);
  const [genLoading, setGenLoading] = useState(false);

  /* generate form fields */
  const [genPeriodType, setGenPeriodType] = useState('MONTHLY');
  const [genPeriodDate, setGenPeriodDate] = useState(() => getTodayISO());
  const [genDistrict, setGenDistrict] = useState('');          // '' = all districts
  const [genTitle, setGenTitle] = useState('');
  const [genTitleManual, setGenTitleManual] = useState(false);
  const [genNarrative, setGenNarrative] = useState('');          // admin's OWN summary
  const [genAttachments, setGenAttachments] = useState([]);          // { file, caption, description, preview }
  const [genPreviewData, setGenPreviewData] = useState(null);        // live data for preview
  const [genPreviewLoading, setGenPreviewLoading] = useState(false);

  const { start: genStart, end: genEnd } = useMemo(
    () => computePeriod(genPeriodType, genPeriodDate),
    [genPeriodType, genPeriodDate]
  );

  /* ── Auto-title ── */
  useEffect(() => {
    if (genTitleManual) return;
    const d = new Date(genPeriodDate);
    const distSuffix = genDistrict ? ` — ${genDistrict}` : '';
    let t = '';
    if (genPeriodType === 'MONTHLY') t = `Organization Report – ${d.toLocaleString('default', { month: 'long', year: 'numeric' })}${distSuffix}`;
    else if (genPeriodType === 'YEARLY') t = `Organization Annual Report – ${d.getFullYear()}${distSuffix}`;
    else {
      const { start, end } = computePeriod('WEEKLY', genPeriodDate);
      t = `Organization Weekly Report – ${fmtDate(start)} to ${fmtDate(end)}${distSuffix}`;
    }
    setGenTitle(t);
  }, [genPeriodType, genPeriodDate, genDistrict, genTitleManual]);

  useEffect(() => {
    initServerDate(systemApi).then(() => {
      setPeriodDate(`${getCurrentMonthString()}-01`);
      setGenPeriodDate(getTodayISO());
      setServerDateReady(true);
    });
  }, []);

  /* ── Load districts ── */
  useEffect(() => {
    analyticsApi.getAllDistricts?.()
      .then(res => {
        const api = res?.data || [];
        const consts = RWANDA_DISTRICTS.map(d => d.value || d);
        setAvailableDistricts([...new Set([...consts, ...api])].sort());
      })
      .catch(() => setAvailableDistricts(RWANDA_DISTRICTS.map(d => d.value || d)));
  }, []);

  /* ── Load reports list ── */
  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const res = await reportsApi.getAll({ page: 0, size: 100 });
      const d = res?.data ?? res;
      const items = d?.content ?? (Array.isArray(d) ? d : []);
      setReports(Array.isArray(items) ? items : []);
    } catch { toast.error('Failed to load reports'); setReports([]); }
    finally { setLoading(false); }
  }, []);

  /* ── Load live org data (for dashboard view) ── */
  const fetchOrgData = useCallback(async () => {
    setOrgLoading(true);
    setDateError(null);
    setDateWarning(null);

    const validation = validatePeriodRange(periodStart, periodEnd);
    if (!validation.valid) {
      setDateError(validation.message);
      setOrgData(null);
      toast.error(validation.message);
      setOrgLoading(false);
      return;
    }

    try {
      const res = await reportsApi.getOrganizationReportData({
        periodStart, periodEnd,
        district: districtFilter || undefined,
      });
      const data = res?.data ?? res;
      setOrgData(data);
      if (data?.warningMessage) {
        setDateWarning(data.warningMessage);
        if (data.noDataInRange) {
          toast.info(data.warningMessage);
        }
      }
    } catch (err) {
      const msg = extractApiErrorMessage(err) || 'Failed to load organization data';
      console.error('Org data fetch failed', err);
      setDateError(msg);
      setOrgData(null);
      toast.error(msg);
    } finally { setOrgLoading(false); }
  }, [periodStart, periodEnd, districtFilter]);

  /* ── Load submission status (for supervisor overview) ── */
  const fetchSubmissionStatus = useCallback(async () => {
    setSubmissionLoading(true);
    try {
      const res = await reportsApi.getSubmissionStatus({ periodType, periodStart, periodEnd });
      setSubmissionSummary(res?.data ?? res);
    } catch { setSubmissionSummary(null); }
    finally { setSubmissionLoading(false); }
  }, [periodType, periodStart, periodEnd]);

  /* ── Preview data when generate modal opens ── */
  const fetchPreviewData = useCallback(async () => {
    setGenPreviewLoading(true);
    const validation = validatePeriodRange(genStart, genEnd);
    if (!validation.valid) {
      toast.error(validation.message);
      setGenPreviewData(null);
      setGenPreviewLoading(false);
      return;
    }
    try {
      const res = await reportsApi.getOrganizationReportData({
        periodStart: genStart, periodEnd: genEnd,
        district: genDistrict || undefined,
      });
      const data = res?.data ?? res;
      setGenPreviewData(data);
      if (data?.warningMessage && data.noDataInRange) {
        toast.info(data.warningMessage);
      }
    } catch (err) {
      toast.error(extractApiErrorMessage(err) || 'Failed to load preview data');
      setGenPreviewData(null);
    }
    finally { setGenPreviewLoading(false); }
  }, [genStart, genEnd, genDistrict]);

  useEffect(() => { fetchReports(); }, [fetchReports]);
  useEffect(() => {
    if (serverDateReady) {
      fetchOrgData();
      fetchSubmissionStatus();
    }
  }, [fetchOrgData, fetchSubmissionStatus, serverDateReady]);
  useEffect(() => { if (genModalOpen) fetchPreviewData(); }, [genModalOpen, fetchPreviewData]);

  /* ── Attachment handling ── */
  const handleFileAdd = (e) => {
    const files = Array.from(e.target.files || []);
    const added = files.map(f => ({
      file: f,
      caption: f.name.replace(/\.[^.]+$/, ''),
      description: '',
      preview: f.type.startsWith('image/') ? URL.createObjectURL(f) : null,
      isImage: f.type.startsWith('image/'),
    }));
    setGenAttachments(prev => [...prev, ...added]);
    e.target.value = '';
  };

  const updateAttachment = (i, field, val) => {
    setGenAttachments(prev => prev.map((a, idx) => idx === i ? { ...a, [field]: val } : a));
  };

  const removeAttachment = (i) => {
    setGenAttachments(prev => {
      const a = prev[i];
      if (a.preview) URL.revokeObjectURL(a.preview);
      return prev.filter((_, idx) => idx !== i);
    });
  };

  /* ── Generate report ── */
  const handleGenerate = async () => {
    if (!genTitle.trim()) { toast.error('Please enter a report title'); return; }
    setGenLoading(true);
    try {
      // 1. Upload attachments first
      const uploadedAttachments = [];
      for (const att of genAttachments) {
        const fd = new FormData();
        fd.append('file', att.file);
        try {
          const uploadRes = await reportsApi.uploadAttachment(fd);
          const doc = uploadRes?.data ?? uploadRes;
          if (doc?.id || doc?.documentId) {
            uploadedAttachments.push({
              documentId: doc.id || doc.documentId,
              caption: att.caption,
              description: att.description,
              category: att.isImage ? 'PHOTO' : 'DOCUMENT',
            });
          }
        } catch (uploadErr) {
          console.error('Attachment upload failed', uploadErr);
          toast.warning(`Could not upload: ${att.file.name}`);
        }
      }

      // 2. Create the org report — admin's OWN narrative, district filter passed
      const res = await reportsApi.createOrgReport({
        title: genTitle.trim(),
        periodType: genPeriodType,
        periodStart: genStart,
        periodEnd: genEnd,
        district: genDistrict || null,          // null = all districts
        narrative: genNarrative.trim() || null,  // null = backend can auto-generate from system
        attachments: uploadedAttachments,
      });
      const created = res?.data ?? res;
      const newId = created?.id ?? created?.data?.id;

      toast.success('Organization report created successfully');
      setGenModalOpen(false);
      resetGenForm();
      fetchReports();
      if (newId) navigate(`/admin/reports/${newId}`);
    } catch (e) {
      toast.error(e?.message || 'Failed to create report');
    } finally {
      setGenLoading(false);
    }
  };

  const resetGenForm = () => {
    setGenPeriodType('MONTHLY'); setGenPeriodDate(new Date().toISOString().slice(0, 10));
    setGenDistrict(''); setGenNarrative(''); setGenTitleManual(false);
    setGenAttachments([]); setGenPreviewData(null);
  };

  /* ── Send reminder ── */
  const handleSendReminder = async (userId, name) => {
    try {
      await notificationApi.sendReminder({ targetUserId: userId, periodType, periodStart, periodEnd });
      toast.success(`Reminder sent to ${name}`);
    } catch { toast.error('Failed to send reminder'); }
  };

  /* ── Derived values ── */
  const supervisorRows = submissionSummary?.submissionStatuses?.filter(s => s.role === 'SUPERVISOR') ?? [];
  const filteredSupervisorRows = districtFilter
    ? supervisorRows.filter(r => (r.location || '').toLowerCase() === districtFilter.toLowerCase())
    : supervisorRows;

  const submitted = supervisorRows.filter(r => r.status === 'SUBMITTED').length;
  const notSubmitted = supervisorRows.length - submitted;
  const compliancePct = supervisorRows.length > 0 ? Math.round((submitted / supervisorRows.length) * 100) : 0;

  const filteredReports = reports.filter(r => {
    const matchType = !tableTypeFilter || r.reportType === tableTypeFilter;
    const matchSearch = !tableSearch || (r.title || '').toLowerCase().includes(tableSearch.toLowerCase())
      || (r.generatedByName || '').toLowerCase().includes(tableSearch.toLowerCase());
    return matchType && matchSearch;
  });

  const districtPerfData = (orgData?.districtPerformance || []).filter(
    d => !districtFilter || (d.district || '').toLowerCase() === districtFilter.toLowerCase()
  );

  /* ── Table columns ── */
  const columns = [
    {
      key: 'title', label: 'Title', render: (_, r) => (
        <div>
          <p style={{ fontWeight: 700, color: '#111', fontSize: 13, margin: 0 }}>{r.title || '—'}</p>
          <p style={{ fontSize: 11, color: '#9CA3AF', margin: '2px 0 0' }}>{fmtDate(r.periodStart)} – {fmtDate(r.periodEnd)}</p>
        </div>
      )
    },
    {
      key: 'reportType', label: 'Type', render: (_, r) => (
        <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 99, background: `${P.primary}15`, color: P.primary, fontSize: 11, fontWeight: 700 }}>
          {(r.reportType || '').replace(/_/g, ' ')}
        </span>
      )
    },
    { key: 'generatedByName', label: 'Submitted By', render: (_, r) => <span style={{ fontSize: 13, color: '#374151' }}>{r.generatedByName || '—'}</span> },
    { key: 'status', label: 'Status', render: (_, r) => <ReportStatusBadge status={r.status} /> },
    {
      key: 'actions', label: 'Actions', render: (_, r) => (
        <button onClick={() => navigate(`/admin/reports/${r.id}`)} style={{
          display: 'flex', alignItems: 'center', gap: 5, padding: '6px 14px', borderRadius: 8,
          background: `${P.primary}12`, color: P.primary, border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer',
        }}>
          <HiOutlineEye style={{ width: 14 }} /> View
        </button>
      )
    },
  ];

  /* ── TAB definitions ── */
  const TABS = [
    { id: 'dashboard', label: 'Dashboard', icon: HiOutlineChartBar },
    { id: 'districts', label: 'District Overview', icon: HiOutlineMap },
    { id: 'supervisors', label: 'Supervisors', icon: HiOutlineUsers },
    { id: 'reports', label: 'All Reports', icon: HiOutlineClipboardList },
    { id: 'generate', label: 'Generate Report', icon: HiOutlineDocumentReport },
  ];

  /* ══════════════ RENDER ══════════════ */
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22, paddingBottom: 48 }}>

      {/* ─── HERO HEADER (keep existing gradient) ─── */}
      <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 24, border: '1px solid rgba(13,148,136,.15)', boxShadow: '0 8px 40px rgba(13,148,136,.18)' }}>
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary-600 to-secondary opacity-[0.97]" />
        <div style={{ position: 'absolute', inset: 0, opacity: .1, backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }} />
        <div style={{ position: 'absolute', top: -50, right: -50, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,.07)', filter: 'blur(50px)' }} />

        <div style={{ position: 'relative', padding: '30px 34px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: 20 }}>
            <div style={{ color: '#fff' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '5px 14px', borderRadius: 99, background: 'rgba(255,255,255,.15)', border: '1px solid rgba(255,255,255,.25)', backdropFilter: 'blur(8px)', marginBottom: 12, fontSize: 12, fontWeight: 700, letterSpacing: '.04em' }}>
                <HiOutlineDocumentReport style={{ width: 14 }} />
                ADMIN ORGANIZATION DASHBOARD
              </div>
              <h1 style={{ fontSize: 28, fontWeight: 900, margin: '0 0 6px', letterSpacing: '-0.3px', textShadow: '0 2px 10px rgba(0,0,0,.15)' }}>
                AFYALINK — Organization Reports
              </h1>
              <p style={{ margin: 0, fontSize: 13, opacity: .85 }}>
                System-wide analytics, district overviews, and organization report management
              </p>

              {/* live KPI strip in header */}
              {orgData && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 16 }}>
                  {[
                    { l: 'Beneficiaries', v: orgData.totalBeneficiariesServed ?? 0 },
                    { l: 'Total Cases', v: orgData.totalCasesManaged ?? 0 },
                    { l: 'Success Rate', v: `${(orgData.overallSuccessRate ?? 0).toFixed(1)}%` },
                    { l: 'Compliance', v: `${(orgData.overallComplianceRate ?? 0).toFixed(1)}%` },
                  ].map(s => (
                    <div key={s.l} style={{ background: 'rgba(255,255,255,.13)', borderRadius: 10, padding: '7px 14px', border: '1px solid rgba(255,255,255,.2)', backdropFilter: 'blur(8px)' }}>
                      <p style={{ fontSize: 18, fontWeight: 800, color: '#fff', margin: 0 }}>{s.v}</p>
                      <p style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,.7)', margin: 0, textTransform: 'uppercase', letterSpacing: '.06em' }}>{s.l}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-end' }}>
              {/* Period selector */}
              <div style={{ display: 'flex', gap: 5, background: 'rgba(255,255,255,.12)', borderRadius: 11, padding: 4, border: '1px solid rgba(255,255,255,.2)' }}>
                {['WEEKLY', 'MONTHLY', 'YEARLY'].map(p => (
                  <button key={p} onClick={() => setPeriodType(p)} style={{
                    padding: '7px 15px', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700,
                    background: periodType === p ? '#fff' : 'transparent',
                    color: periodType === p ? P.primary : 'rgba(255,255,255,.85)',
                    transition: 'all .2s', boxShadow: periodType === p ? '0 2px 8px rgba(0,0,0,.12)' : 'none',
                  }}>{p.charAt(0) + p.slice(1).toLowerCase()}</button>
                ))}
              </div>
              {/* Date input */}
              <input
                type={periodType === 'MONTHLY' ? 'month' : periodType === 'YEARLY' ? 'number' : 'date'}
                min={periodType === 'MONTHLY' ? SYSTEM_START_MONTH : periodType === 'YEARLY' ? SYSTEM_START_YEAR : SYSTEM_START_DATE}
                max={periodType === 'MONTHLY' ? getCurrentMonthString() : periodType === 'YEARLY' ? getCurrentYear() : getTodayISO()}
                value={periodType === 'MONTHLY' ? periodDate.slice(0, 7) : periodType === 'YEARLY' ? new Date(periodDate).getFullYear() : periodDate}
                onChange={e => {
                  if (periodType === 'MONTHLY') {
                    setPeriodDate(`${clampMonth(e.target.value)}-01`);
                  } else if (periodType === 'YEARLY') {
                    setPeriodDate(`${clampYear(e.target.value)}-06-01`);
                  } else {
                    const v = e.target.value;
                    setPeriodDate(v < SYSTEM_START_DATE ? SYSTEM_START_DATE : v > getTodayISO() ? getTodayISO() : v);
                  }
                }}
                style={{ background: 'rgba(255,255,255,.2)', border: '1px solid rgba(255,255,255,.3)', borderRadius: 9, padding: '7px 12px', color: '#fff', fontSize: 13, fontWeight: 600, outline: 'none', width: periodType === 'YEARLY' ? 90 : 'auto' }}
              />
              {/* District filter */}
              <select
                value={districtFilter}
                onChange={e => setDistrictFilter(e.target.value)}
                style={{ background: 'rgba(255,255,255,.2)', border: '1px solid rgba(255,255,255,.3)', borderRadius: 9, padding: '7px 12px', color: '#fff', fontSize: 13, fontWeight: 600, outline: 'none', cursor: 'pointer' }}>
                <option value="" style={{ color: '#111', background: '#fff' }}>All Districts</option>
                {availableDistricts.map(d => <option key={d} value={d} style={{ color: '#111', background: '#fff' }}>{d}</option>)}
              </select>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => { fetchOrgData(); fetchSubmissionStatus(); }} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 9, background: 'rgba(255,255,255,.18)', border: '1px solid rgba(255,255,255,.3)', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                  <HiOutlineRefresh style={{ width: 14 }} /> Refresh
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── TAB NAV ─── */}
      <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #F3F4F6', boxShadow: '0 2px 8px rgba(0,0,0,.04)', padding: '5px 6px', display: 'flex', gap: 4, overflowX: 'auto' }}>
        {TABS.map(t => {
          const Icon = t.icon;
          const active = activeTab === t.id;
          return (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
              display: 'flex', alignItems: 'center', gap: 7, padding: '8px 16px', borderRadius: 9,
              border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap',
              transition: 'all .2s',
              background: active ? P.primary : 'transparent',
              color: active ? '#fff' : '#6B7280',
              boxShadow: active ? '0 3px 12px rgba(13,148,136,.28)' : 'none',
            }}>
              <Icon style={{ width: 15, height: 15 }} />
              {t.label}
            </button>
          );
        })}
      </div>

      {(dateError || dateWarning) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <DateBanner type="error" message={dateError} />
          <DateBanner type="warning" message={!dateError ? dateWarning : null} />
        </div>
      )}

      {/* ══════════ TAB: DASHBOARD ══════════ */}
      {activeTab === 'dashboard' && (
        <>
          {orgLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
              <Spinner size="lg" />
            </div>
          ) : orgData ? (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14 }}>
                <KpiCard label="Beneficiaries Served" value={orgData.totalBeneficiariesServed ?? 0} icon={HiOutlineUserGroup} color={P.primary} />
                <KpiCard label="Total Cases" value={orgData.totalCasesManaged ?? 0} icon={HiOutlineClipboardList} color={P.indigo} />
                <KpiCard label="Active Cases" value={orgData.activeCases ?? 0} icon={HiOutlineLightningBolt} color={P.amber} />
                <KpiCard label="Closed Cases" value={orgData.closedCases ?? 0} icon={HiOutlineCheckCircle} color={P.secondary} />
                <KpiCard label="Success Rate" value={`${(orgData.overallSuccessRate ?? 0).toFixed(1)}%`} icon={HiOutlineTrendingUp} color={P.blue} />
                <KpiCard label="Social Workers" value={orgData.totalSocialWorkers ?? 0} icon={HiOutlineUsers} color={P.primary} />
                <KpiCard label="Supervisors" value={orgData.totalSupervisors ?? 0} icon={HiOutlineOfficeBuilding} color={P.primary6} />
                <KpiCard label="Interventions" value={orgData.interventionsCompleted ?? 0} icon={HiOutlineChartBar} color={P.purple} />
              </div>

              {/* Charts row */}
              {(districtPerfData.length > 0 || (orgData.casesByPriority || []).length > 0) && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
                  {districtPerfData.length > 0 && (
                    <Sec icon={HiOutlineMap} title="District Performance" subtitle={districtFilter ? `Filtered: ${districtFilter}` : 'All districts'}>
                      <div style={{ height: 280 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={districtPerfData} layout="vertical" margin={{ left: 8, right: 30 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F3F4F6" />
                            <XAxis type="number" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                            <YAxis dataKey="district" type="category" width={90} tick={{ fontSize: 10, fill: '#374151' }} axisLine={false} tickLine={false} />
                            <Tooltip content={<CTip />} />
                            <Legend wrapperStyle={{ fontSize: 11 }} />
                            <Bar dataKey="activeCases" fill={P.primary} radius={[0, 5, 5, 0]} name="Active" />
                            <Bar dataKey="closedCases" fill={P.indigo} radius={[0, 5, 5, 0]} name="Closed" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </Sec>
                  )}

                  {(orgData.casesByPriority || []).length > 0 && (
                    <Sec icon={HiOutlineChartBar} title="Cases by Priority">
                      <div style={{ height: 280 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={orgData.casesByPriority} dataKey="value" nameKey="label" cx="50%" cy="50%" innerRadius={50} outerRadius={90}
                              label={({ label, percent }) => `${(percent * 100).toFixed(0)}%`} labelLine={false}>
                              {orgData.casesByPriority.map((e, i) => <Cell key={i} fill={e.color || CHART_COLORS[i % CHART_COLORS.length]} />)}
                            </Pie>
                            <Tooltip content={<CTip />} />
                            <Legend wrapperStyle={{ fontSize: 11, fontWeight: 600 }} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </Sec>
                  )}
                </div>
              )}

              {/* Intervention types */}
              {(orgData.interventionStats || []).length > 0 && (
                <Sec icon={HiOutlineLightningBolt} title="Intervention Effectiveness" subtitle="Success rate per category">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {orgData.interventionStats.map((t, i) => (
                      <div key={i}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{t.label || t.type}</span>
                          <div style={{ display: 'flex', gap: 10 }}>
                            <span style={{ fontSize: 11, color: '#9CA3AF' }}>{t.count} interventions</span>
                            <span style={{ fontSize: 13, fontWeight: 800, color: CHART_COLORS[i % CHART_COLORS.length] }}>{(t.percent ?? t.successRate ?? 0).toFixed(1)}%</span>
                          </div>
                        </div>
                        <PBar value={t.percent ?? t.successRate ?? 0} color={CHART_COLORS[i % CHART_COLORS.length]} />
                      </div>
                    ))}
                  </div>
                </Sec>
              )}
            </>
          ) : (
            <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #F3F4F6', padding: '48px 24px', textAlign: 'center', color: '#9CA3AF' }}>
              <HiOutlineChartBar style={{ width: 48, height: 48, display: 'block', margin: '0 auto 12px', color: '#E5E7EB' }} />
              <p style={{ fontSize: 14, fontWeight: 600 }}>
                {dateError || 'No system data available for this period.'}
              </p>
            </div>
          )}
        </>
      )}

      {/* ══════════ TAB: DISTRICTS ══════════ */}
      {activeTab === 'districts' && (
        <>
          {districtPerfData.length === 0 ? (
            <EmptyState message={districtFilter ? `No data for ${districtFilter} in this period` : 'No district data for this period'} />
          ) : (
            <>
              <Sec icon={HiOutlineMap} title="District Comparison" subtitle={`${periodType.toLowerCase()} view${districtFilter ? ` · ${districtFilter}` : ''}`}>
                <div style={{ height: 320 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[...districtPerfData].sort((a, b) => (b.successRate || 0) - (a.successRate || 0))} layout="vertical" margin={{ left: 8, right: 50 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F3F4F6" />
                      <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                      <YAxis dataKey="district" type="category" width={100} tick={{ fontSize: 11, fill: '#374151', fontWeight: 600 }} axisLine={false} tickLine={false} />
                      <Tooltip content={<CTip />} />
                      <Bar dataKey="successRate" name="Success Rate %" radius={[0, 7, 7, 0]} label={{ position: 'right', fontSize: 11, fontWeight: 700, fill: P.primary, formatter: v => `${v}%` }}>
                        {districtPerfData.map((d, i) => (
                          <Cell key={i} fill={(d.successRate || 0) >= 80 ? P.secondary : (d.successRate || 0) >= 60 ? P.primary : P.amber} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Sec>

              <Sec icon={HiOutlineClipboardList} title="District Details Table" subtitle="Full breakdown" noPad>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: '#F9FAFB' }}>
                        {['District', 'Supervisor', 'Workers', 'Beneficiaries', 'Cases', 'Active', 'Closed', 'Success %'].map(h => (
                          <th key={h} style={{ padding: '11px 14px', textAlign: ['District', 'Supervisor'].includes(h) ? 'left' : 'center', fontSize: 10, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '.06em' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                        <tbody>
                          {[...districtPerfData].sort((a, b) => (b.successRate || 0) - (a.successRate || 0)).map((d, i) => {
                            const r = Math.round(d.successRate || 0);
                            return (
                              <tr key={i} style={{ borderTop: '1px solid #F3F4F6' }}
                                onMouseEnter={e => e.currentTarget.style.background = '#F9FAFB'}
                                onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
                                <td style={{ padding: '12px 14px', fontWeight: 700, color: '#111' }}>{d.district || '—'}</td>
                                <td style={{ padding: '12px 14px', color: '#6B7280' }}>{d.supervisorName || '—'}</td>
                                <td style={{ padding: '12px 14px', textAlign: 'center' }}>{d.socialWorkersCount ?? d.workersCount ?? 0}</td>
                                <td style={{ padding: '12px 14px', textAlign: 'center' }}>{d.beneficiaries ?? 0}</td>
                                <td style={{ padding: '12px 14px', textAlign: 'center' }}>{d.cases ?? 0}</td>
                                <td style={{ padding: '12px 14px', textAlign: 'center' }}>{d.activeCases ?? 0}</td>
                                <td style={{ padding: '12px 14px', textAlign: 'center' }}>{d.closedCases ?? 0}</td>
                                <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, minWidth: 70 }}>
                                    <span style={{ fontWeight: 800, fontSize: 12, color: r >= 80 ? P.secondary : r >= 60 ? P.primary : P.amber }}>{r}%</span>
                                    <PBar value={r} color={r >= 80 ? P.secondary : r >= 60 ? P.primary : P.amber} />
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </Sec>
                </>
          )}
              </>
      )}

              {/* ══════════ TAB: SUPERVISORS ══════════ */}
              {activeTab === 'supervisors' && (
                <>
                  {/* Compliance summary strip */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14 }}>
                    <KpiCard label="Total Supervisors" value={supervisorRows.length} icon={HiOutlineUsers} color={P.primary} />
                    <KpiCard label="Reports Submitted" value={submitted} icon={HiOutlineCheckCircle} color={P.secondary} />
                    <KpiCard label="Not Yet Submitted" value={notSubmitted} icon={HiOutlineXCircle} color={P.red} />
                    <KpiCard label="Submission Rate" value={`${compliancePct}%`} icon={HiOutlineTrendingUp} color={P.blue} />
                  </div>

                  {submissionLoading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spinner size="lg" /></div>
                  ) : filteredSupervisorRows.length === 0 ? (
                    <EmptyState message="No supervisor data for this period" />
                  ) : (
                    <Sec icon={HiOutlineUsers} title="Supervisor Submission Status" subtitle={`${periodType.toLowerCase()} report compliance`} noPad>
                      <div style={{ padding: 6 }}>
                        {filteredSupervisorRows.map((sup, i) => {
                          const total = sup.workersCount || 0;
                          const subbed = sup.submittedCount || 0;
                          const rate = total > 0 ? Math.round((subbed / total) * 100) : 0;
                          const notSub = sup.status !== 'SUBMITTED';

                          return (
                            <div key={i} style={{ margin: '6px 0', borderRadius: 14, border: `1px solid ${notSub ? '#FEE2E2' : '#D1FAE5'}`, padding: '16px 18px', background: notSub ? '#FFF5F5' : '#F0FDF4', transition: 'box-shadow .2s' }}
                              onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,.06)'}
                              onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
                              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                                <div>
                                  <p style={{ fontWeight: 700, fontSize: 14, color: '#111', margin: 0 }}>{sup.fullName || '—'}</p>
                                  <p style={{ fontSize: 12, color: '#6B7280', margin: '2px 0 0' }}>{sup.location || '—'} District</p>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: notSub ? '#FEE2E2' : '#D1FAE5', color: notSub ? '#991B1B' : '#065F46' }}>
                                    {notSub ? <HiOutlineXCircle style={{ width: 12 }} /> : <HiOutlineCheckCircle style={{ width: 12 }} />}
                                    {sup.status || 'DRAFT'}
                                  </span>
                                  {notSub && (
                                    <button onClick={() => handleSendReminder(sup.userId, sup.fullName)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 8, background: P.amber, color: '#fff', border: 'none', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                                      <HiOutlineBell style={{ width: 12 }} /> Send Reminder
                                    </button>
                                  )}
                                </div>
                              </div>

                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 10, fontSize: 12 }}>
                                {[
                                  { l: 'Workers', v: total },
                                  { l: 'Submitted', v: subbed },
                                  { l: 'Pending', v: sup.pendingCount ?? 0 },
                                  { l: 'Missing', v: sup.missingCount ?? 0 },
                                ].map(s => (
                                  <div key={s.l}>
                                    <span style={{ color: '#9CA3AF' }}>{s.l}: </span>
                                    <span style={{ fontWeight: 700, color: '#374151' }}>{s.v}</span>
                                  </div>
                                ))}
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <PBar value={rate} color={rate >= 80 ? P.secondary : rate >= 60 ? P.primary : P.red} />
                                <span style={{ fontSize: 11, fontWeight: 700, color: '#374151', flexShrink: 0 }}>{rate}% submitted</span>
                              </div>

                              {(sup.overdueWorkers || []).length > 0 && (
                                <div style={{ marginTop: 10, padding: '8px 12px', background: '#FEF2F2', borderRadius: 8, fontSize: 11, color: P.red, fontWeight: 600 }}>
                                  Overdue workers: {sup.overdueWorkers.join(', ')}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </Sec>
                  )}
                </>
              )}

              {/* ══════════ TAB: ALL REPORTS ══════════ */}
              {activeTab === 'reports' && (
                <Sec icon={HiOutlineClipboardList} title="All Submitted Reports" subtitle="Browse and view all reports in the system"
                  right={
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <div style={{ position: 'relative' }}>
                        <HiOutlineSearch style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 14, color: '#9CA3AF' }} />
                        <input
                          value={tableSearch}
                          onChange={e => setTableSearch(e.target.value)}
                          placeholder="Search reports…"
                          style={{ padding: '7px 12px 7px 30px', borderRadius: 9, border: '1px solid #E5E7EB', fontSize: 13, outline: 'none', width: 200 }}
                        />
                      </div>
                      <select value={tableTypeFilter} onChange={e => setTableTypeFilter(e.target.value)} style={{ padding: '7px 12px', borderRadius: 9, border: '1px solid #E5E7EB', fontSize: 12, outline: 'none', color: '#374151' }}>
                        <option value="">All Types</option>
                        {['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY', 'SUPERVISOR_TEAM', 'ORGANIZATION', 'BENEFICIARY_COMPLETION', 'CUSTOM'].map(t => (
                          <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
                        ))}
                      </select>
                      {(tableSearch || tableTypeFilter) && (
                        <button onClick={() => { setTableSearch(''); setTableTypeFilter(''); }} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '7px 10px', borderRadius: 9, background: '#FEE2E2', color: P.red, border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                          <HiOutlineX style={{ width: 12 }} /> Clear
                        </button>
                      )}
                    </div>
                  }>
                  {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spinner size="lg" /></div>
                  ) : filteredReports.length === 0 ? (
                    <EmptyState message="No reports match your search" />
                  ) : (
                    <div style={{ borderRadius: 12, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                            {columns.map(col => (
                              <th key={col.key} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '.06em' }}>{col.label}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {filteredReports.map((row, idx) => (
                            <tr key={idx} style={{ borderBottom: '1px solid #F3F4F6' }}>
                              {columns.map(col => (
                                <td key={col.key} style={{ padding: '12px 16px' }}>
                                  {col.render ? col.render(col.key, row) : row[col.key]}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </Sec>
              )}

              {/* ══════════ TAB: GENERATE REPORT ══════════ */}
              {activeTab === 'generate' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 22 }}>

                  {/* Config card */}
                  <Sec icon={HiOutlineDocumentReport} title="Report Configuration" subtitle="Set filters and options for your organization report">
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>

                      {/* Period type */}
                      <div>
                        <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '.05em', display: 'block', marginBottom: 10 }}>Period Type</label>
                        <div style={{ display: 'flex', gap: 8 }}>
                          {['WEEKLY', 'MONTHLY', 'YEARLY'].map(p => (
                            <button key={p} onClick={() => { setGenPeriodType(p); setGenTitleManual(false); }} style={{
                              flex: 1, padding: '9px 0', borderRadius: 10, border: `2px solid ${genPeriodType === p ? P.primary : '#E5E7EB'}`,
                              background: genPeriodType === p ? P.primary : '#fff', color: genPeriodType === p ? '#fff' : '#6B7280',
                              fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all .2s',
                            }}>{p.charAt(0) + p.slice(1).toLowerCase()}</button>
                          ))}
                        </div>
                      </div>

                      {/* Date */}
                      <div>
                        <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '.05em', display: 'block', marginBottom: 10 }}>
                          {genPeriodType === 'WEEKLY' ? 'Select Week' : genPeriodType === 'MONTHLY' ? 'Select Month' : 'Select Year'}
                        </label>
                        <input
                          type={genPeriodType === 'MONTHLY' ? 'month' : genPeriodType === 'YEARLY' ? 'number' : 'date'}
                          min={genPeriodType === 'MONTHLY' ? SYSTEM_START_MONTH : genPeriodType === 'YEARLY' ? SYSTEM_START_YEAR : SYSTEM_START_DATE}
                          max={genPeriodType === 'MONTHLY' ? getCurrentMonthString() : genPeriodType === 'YEARLY' ? getCurrentYear() : getTodayISO()}
                          value={genPeriodType === 'MONTHLY' ? genPeriodDate.slice(0, 7) : genPeriodType === 'YEARLY' ? new Date(genPeriodDate).getFullYear() : genPeriodDate}
                          onChange={e => {
                            if (genPeriodType === 'MONTHLY') {
                              setGenPeriodDate(`${clampMonth(e.target.value)}-01`);
                            } else if (genPeriodType === 'YEARLY') {
                              setGenPeriodDate(`${clampYear(e.target.value)}-06-01`);
                            } else {
                              const v = e.target.value;
                              setGenPeriodDate(v < SYSTEM_START_DATE ? SYSTEM_START_DATE : v > getTodayISO() ? getTodayISO() : v);
                            }
                            setGenTitleManual(false);
                          }}
                          style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #D1D5DB', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                        />
                      </div>

                      {/* District filter — key fix: report generated for THIS district only */}
                      <div>
                        <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '.05em', display: 'block', marginBottom: 10 }}>
                          District (Optional)
                        </label>
                        <select value={genDistrict} onChange={e => { setGenDistrict(e.target.value); setGenTitleManual(false); }}
                          style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #D1D5DB', fontSize: 13, outline: 'none', background: '#fff', cursor: 'pointer' }}>
                          <option value="">All Districts — Entire Organization</option>
                          {availableDistricts.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                        <p style={{ fontSize: 11, color: '#9CA3AF', margin: '5px 0 0' }}>
                          {genDistrict ? `Report will include data for ${genDistrict} only.` : 'Report will include data from all districts.'}
                        </p>
                      </div>

                      {/* Period pill */}
                      <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                        <div style={{ padding: '10px 14px', background: `${P.primary}10`, borderRadius: 10, border: `1px solid ${P.primary}20`, width: '100%' }}>
                          <p style={{ fontSize: 10, fontWeight: 700, color: P.primary, margin: '0 0 3px', textTransform: 'uppercase', letterSpacing: '.05em' }}>Computed Period</p>
                          <p style={{ fontSize: 13, fontWeight: 700, color: P.primary6, margin: 0 }}>{fmtDate(genStart)} – {fmtDate(genEnd)}</p>
                        </div>
                      </div>
                    </div>
                  </Sec>

                  {/* Live preview data */}
                  {genPreviewData && (
                    <Sec icon={HiOutlineChartBar} title="Live System Data Preview" subtitle="This is the real data that will be included in the report">
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12 }}>
                        {[
                          { l: 'Beneficiaries', v: genPreviewData.totalBeneficiariesServed ?? 0, c: P.primary },
                          { l: 'Total Cases', v: genPreviewData.totalCasesManaged ?? 0, c: P.indigo },
                          { l: 'Active Cases', v: genPreviewData.activeCases ?? 0, c: P.amber },
                          { l: 'Closed Cases', v: genPreviewData.closedCases ?? 0, c: P.secondary },
                          { l: 'Success Rate', v: `${(genPreviewData.overallSuccessRate ?? 0).toFixed(1)}%`, c: P.blue },
                          { l: 'Workers', v: genPreviewData.totalSocialWorkers ?? 0, c: P.primary },
                          { l: 'Supervisors', v: genPreviewData.totalSupervisors ?? 0, c: P.primary6 },
                          { l: 'Interventions', v: genPreviewData.interventionsCompleted ?? 0, c: P.purple },
                        ].map(s => (
                          <div key={s.l} style={{ padding: '12px 14px', borderRadius: 12, border: '1px solid #F3F4F6', background: '#FAFAFA', textAlign: 'center' }}>
                            <p style={{ fontSize: 22, fontWeight: 800, color: s.c, margin: 0 }}>{s.v}</p>
                            <p style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', margin: '4px 0 0', textTransform: 'uppercase', letterSpacing: '.05em' }}>{s.l}</p>
                          </div>
                        ))}
                      </div>

                      {genPreviewLoading && (
                        <div style={{ textAlign: 'center', padding: '12px 0', color: '#9CA3AF', fontSize: 12 }}>Refreshing preview…</div>
                      )}
                    </Sec>
                  )}

                  {/* Report title */}
                  <Sec icon={HiOutlineDocumentText} title="Report Title">
                    <input
                      type="text"
                      value={genTitle}
                      onChange={e => { setGenTitle(e.target.value); setGenTitleManual(true); }}
                      placeholder="e.g. Organization Monthly Report — June 2026"
                      style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid #D1D5DB', fontSize: 13, outline: 'none', boxSizing: 'border-box', fontWeight: 600 }}
                    />
                    {genTitleManual && (
                      <button onClick={() => setGenTitleManual(false)} style={{ marginTop: 8, fontSize: 11, color: '#9CA3AF', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                        Reset to auto-generated title
                      </button>
                    )}
                  </Sec>

                  {/* Admin's OWN Executive Summary — key fix: NOT combined from supervisors */}
                  <Sec icon={HiOutlineDocumentText} title="Executive Summary" subtitle="Write your own summary — this will NOT be auto-combined from supervisor reports">
                    <textarea
                      value={genNarrative}
                      onChange={e => setGenNarrative(e.target.value)}
                      placeholder={`Write your executive summary for this ${genPeriodType.toLowerCase()} report.\n\nFor example: During this period, AfyaLink achieved key milestones across ${genDistrict || 'all districts'}…\n\nLeave empty and the system will auto-generate a summary from live data only.`}
                      style={{ width: '100%', minHeight: 160, padding: '12px 14px', borderRadius: 12, border: '1px solid #D1D5DB', fontSize: 13, lineHeight: 1.7, outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }}
                    />
                    <p style={{ fontSize: 11, color: '#9CA3AF', margin: '6px 0 0' }}>
                      If left empty, the system will auto-generate a summary based on real data. Your text will replace any auto-generated content.
                    </p>
                  </Sec>

                  {/* Attachments — key fix: admin can add images/documents */}
                  <Sec icon={HiOutlinePaperClip} title="Attachments" subtitle="Add supporting photos, evidence, or documents to this report">
                    <input ref={fileInputRef} type="file" multiple accept="image/*,.pdf,.doc,.docx,.xlsx,.xls" style={{ display: 'none' }} onChange={handleFileAdd} />

                    <button onClick={() => fileInputRef.current?.click()} style={{
                      display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 11,
                      background: `${P.primary}12`, color: P.primary, border: `1px dashed ${P.primary}`, fontSize: 13, fontWeight: 700, cursor: 'pointer', marginBottom: genAttachments.length > 0 ? 16 : 0,
                    }}>
                      <HiOutlinePlusCircle style={{ width: 16 }} />
                      Add Photos or Documents
                    </button>

                    {genAttachments.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {genAttachments.map((att, i) => (
                          <div key={i} style={{ display: 'flex', gap: 12, padding: '12px 14px', borderRadius: 12, border: '1px solid #E5E7EB', background: '#FAFAFA', alignItems: 'flex-start' }}>
                            {/* Thumbnail or icon */}
                            <div style={{ width: 56, height: 56, borderRadius: 8, overflow: 'hidden', flexShrink: 0, background: att.isImage ? 'transparent' : `${P.indigo}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              {att.isImage ? (
                                <img src={att.preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : (
                                <HiOutlineDocumentText style={{ width: 24, height: 24, color: P.indigo }} />
                              )}
                            </div>

                            {/* Fields */}
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                              <input
                                value={att.caption}
                                onChange={e => updateAttachment(i, 'caption', e.target.value)}
                                placeholder="Caption (title for this attachment)"
                                style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid #D1D5DB', fontSize: 12, outline: 'none' }}
                              />
                              <input
                                value={att.description}
                                onChange={e => updateAttachment(i, 'description', e.target.value)}
                                placeholder="Short description (optional)"
                                style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid #D1D5DB', fontSize: 12, outline: 'none' }}
                              />
                              <p style={{ fontSize: 10, color: '#9CA3AF', margin: 0 }}>{att.file.name} · {(att.file.size / 1024).toFixed(1)} KB</p>
                            </div>

                            <button onClick={() => removeAttachment(i)} style={{ padding: 6, borderRadius: 7, background: '#FEE2E2', color: P.red, border: 'none', cursor: 'pointer', flexShrink: 0 }}>
                              <HiOutlineTrash style={{ width: 15, height: 15 }} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </Sec>

                  {/* Generate button */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                    <button onClick={() => { setGenModalOpen(true); fetchPreviewData(); }} style={{
                      display: 'flex', alignItems: 'center', gap: 8, padding: '13px 28px', borderRadius: 13,
                      background: P.primary, color: '#fff', border: 'none', fontSize: 14, fontWeight: 800,
                      cursor: 'pointer', boxShadow: '0 4px 18px rgba(13,148,136,.35)', transition: 'box-shadow .2s',
                    }}
                      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 6px 24px rgba(13,148,136,.45)'}
                      onMouseLeave={e => e.currentTarget.style.boxShadow = '0 4px 18px rgba(13,148,136,.35)'}>
                      <HiOutlineDocumentReport style={{ width: 18 }} />
                      Preview & Generate Report
                    </button>
                  </div>
                </div>
              )}

              {/* ═══ CONFIRM GENERATE MODAL ═══ */}
              <Modal
                isOpen={genModalOpen}
                onClose={() => !genLoading && setGenModalOpen(false)}
                title="Confirm Report Generation"
                size="lg"
                footer={
                  <>
                    <button onClick={() => setGenModalOpen(false)} disabled={genLoading} style={{ padding: '9px 20px', borderRadius: 10, border: '1px solid #D1D5DB', background: '#fff', color: '#374151', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                    <button onClick={handleGenerate} disabled={genLoading} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 22px', borderRadius: 10, background: P.primary, color: '#fff', border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 3px 12px rgba(13,148,136,.3)' }}>
                      <HiOutlineDocumentReport style={{ width: 15 }} />
                      {genLoading ? 'Generating…' : 'Generate Report'}
                    </button>
                  </>
                }
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  {/* Summary */}
                  <div style={{ background: `${P.primary}08`, borderRadius: 14, padding: 16, border: `1px solid ${P.primary}20` }}>
                    <p style={{ fontWeight: 800, fontSize: 14, color: '#111', margin: '0 0 12px' }}>Report Summary</p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      {[
                        { l: 'Title', v: genTitle || '(auto)' },
                        { l: 'Period', v: `${genPeriodType} · ${fmtDate(genStart)} – ${fmtDate(genEnd)}` },
                        { l: 'District', v: genDistrict || 'All Districts' },
                        { l: 'Summary', v: genNarrative ? 'Custom (your text)' : 'Auto-generated from system data' },
                        { l: 'Files', v: genAttachments.length > 0 ? `${genAttachments.length} attachment(s)` : 'None' },
                      ].map(s => (
                        <div key={s.l} style={{ background: '#fff', padding: '10px 12px', borderRadius: 10, border: '1px solid #E5E7EB' }}>
                          <p style={{ fontSize: 10, color: '#9CA3AF', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', margin: '0 0 3px' }}>{s.l}</p>
                          <p style={{ fontSize: 12, fontWeight: 700, color: '#111', margin: 0, wordBreak: 'break-word' }}>{s.v}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Live data preview in modal */}
                  {genPreviewLoading ? (
                    <div style={{ textAlign: 'center', padding: 16 }}><Spinner size="sm" /></div>
                  ) : genPreviewData ? (
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 700, color: '#374151', margin: '0 0 10px' }}>System data that will be included:</p>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                        {[
                          { l: 'Beneficiaries', v: genPreviewData.totalBeneficiariesServed ?? 0 },
                          { l: 'Cases', v: genPreviewData.totalCasesManaged ?? 0 },
                          { l: 'Workers', v: genPreviewData.totalSocialWorkers ?? 0 },
                          { l: 'Success', v: `${(genPreviewData.overallSuccessRate ?? 0).toFixed(1)}%` },
                        ].map(s => (
                          <div key={s.l} style={{ padding: '10px', borderRadius: 10, border: '1px solid #F3F4F6', textAlign: 'center', background: '#FAFAFA' }}>
                            <p style={{ fontSize: 18, fontWeight: 800, color: P.primary, margin: 0 }}>{s.v}</p>
                            <p style={{ fontSize: 10, color: '#9CA3AF', margin: '3px 0 0', textTransform: 'uppercase', letterSpacing: '.05em' }}>{s.l}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 10, padding: '10px 14px', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <HiOutlineInformationCircle style={{ color: P.amber, width: 16, flexShrink: 0, marginTop: 1 }} />
                    <p style={{ fontSize: 12, color: '#92400E', margin: 0, lineHeight: 1.5 }}>
                      This report will be created from <strong>live system data</strong> only.
                      {genDistrict ? ` Only ${genDistrict} district data will be included.` : ' All district data will be included.'}
                      {' '}Supervisor narratives are <strong>not</strong> combined into this report.
                    </p>
                  </div>
                </div>
              </Modal>
            </div>
          );
}