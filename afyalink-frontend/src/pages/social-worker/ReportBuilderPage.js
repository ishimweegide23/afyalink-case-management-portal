import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { reportsApi } from '../../api/reportsApi';
import { analyticsApi } from '../../api/analyticsApi';
import Button from '../../components/common/Button';
import StatCard from '../../components/shared/StatCard';
import Spinner from '../../components/common/Spinner';
import AttachmentUploader from '../../components/shared/AttachmentUploader';
import {
  HiOutlineClipboardList, HiOutlineUserGroup, HiOutlineCheckCircle, HiOutlineChartBar, HiOutlineDocument,
  HiOutlineDocumentText, HiOutlineArrowLeft, HiOutlineLocationMarker, HiOutlineCalendar,
  HiOutlinePhotograph, HiOutlineInformationCircle, HiOutlineTrendingUp, HiOutlineCog
} from 'react-icons/hi';
import { toast } from 'react-toastify';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';

// Removed emojis, using standard string identifiers for icons which we map below
const REPORT_TYPES = [
  { value: 'DAILY', label: 'Daily Report', description: 'Record what you did today', iconType: 'daily' },
  { value: 'WEEKLY', label: 'Weekly Report', description: 'Summarize your week', iconType: 'weekly' },
  { value: 'MONTHLY', label: 'Monthly Report', description: 'Monthly performance overview', iconType: 'monthly' },
  { value: 'YEARLY', label: 'Yearly Report', description: 'Annual summary', iconType: 'yearly' },
  { value: 'BENEFICIARY_COMPLETION', label: 'Beneficiary Completion', description: 'Case closure report', iconType: 'completion' },
  { value: 'CUSTOM', label: 'Custom Report', description: 'Custom date range', iconType: 'custom' },
];

const renderReportIcon = (iconType, className) => {
  switch (iconType) {
    case 'daily': return <HiOutlineCalendar className={className} />;
    case 'weekly': return <HiOutlineChartBar className={className} />;
    case 'monthly': return <HiOutlineTrendingUp className={className} />;
    case 'yearly': return <HiOutlineCalendar className={className} />;
    case 'completion': return <HiOutlineCheckCircle className={className} />;
    case 'custom': return <HiOutlineCog className={className} />;
    default: return <HiOutlineDocumentText className={className} />;
  }
};

function periodForType(type) {
  const today = new Date().toISOString().slice(0, 10);
  if (type === 'DAILY') return { start: today, end: today };
  if (type === 'WEEKLY') {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return { start: d.toISOString().slice(0, 10), end: today };
  }
  if (type === 'MONTHLY') {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return { start: d.toISOString().slice(0, 10), end: today };
  }
  if (type === 'YEARLY') {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 1);
    return { start: d.toISOString().slice(0, 10), end: today };
  }
  return { start: today, end: today };
}

function generateDefaultTitle(type, startDate) {
  const dateObj = startDate ? new Date(startDate) : new Date();
  const year = dateObj.getFullYear();
  
  switch(type) {
    case 'DAILY':
      return `Daily Activity Report - ${dateObj.toLocaleDateString()}`;
    case 'WEEKLY':
      // Basic week number calculation
      const firstDayOfYear = new Date(dateObj.getFullYear(), 0, 1);
      const pastDaysOfYear = (dateObj - firstDayOfYear) / 86400000;
      const weekNum = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
      return `Weekly Activity Report - Week ${weekNum}, ${year}`;
    case 'MONTHLY':
      const monthName = dateObj.toLocaleString('default', { month: 'long' });
      return `Monthly Performance Report - ${monthName} ${year}`;
    case 'YEARLY':
      return `Annual Summary Report - ${year}`;
    case 'BENEFICIARY_COMPLETION':
      return `Beneficiary Completion & Case Closure Report`;
    case 'CUSTOM':
      return `Custom Period Report - ${dateObj.toLocaleDateString()}`;
    default:
      return 'Activity Report';
  }
}

export default function ReportBuilderPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const [summary, setSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingEdit, setLoadingEdit] = useState(!!editId);
  const [period, setPeriod] = useState({ start: '', end: '' });
  const [attachments, setAttachments] = useState([]);
  const [narrativeLength, setNarrativeLength] = useState(0);

  const { register, handleSubmit, watch, setValue, reset } = useForm({
    defaultValues: {
      title: '',
      reportType: 'WEEKLY',
      periodStart: '',
      periodEnd: '',
      narrative: '',
      location: '',
      relatedCaseId: '',
    },
  });

  const reportType = watch('reportType');
  const periodStart = watch('periodStart');
  const periodEnd = watch('periodEnd');
  const narrative = watch('narrative');

  useEffect(() => {
    setNarrativeLength(narrative?.length || 0);
  }, [narrative]);

  useEffect(() => {
    if (editId) {
      setLoadingEdit(true);
      reportsApi
        .getById(editId)
        .then((res) => {
          const d = res?.data ?? res;
          const r = d?.reportDto ?? d;
          if (!r) {
            toast.error('Report not found');
            navigate('/social-worker/my-reports');
            return;
          }
          reset({
            title: r.title || '',
            reportType: r.reportType || 'WEEKLY',
            periodStart: r.periodStart || '',
            periodEnd: r.periodEnd || '',
            narrative: r.narrative || '',
            location: r.location || '',
            relatedCaseId: r.relatedCaseId ? String(r.relatedCaseId) : '',
          });
          setAttachments(r.attachments || []);
        })
        .catch(() => {
          toast.error('Failed to load report');
          navigate('/social-worker/my-reports');
        })
        .finally(() => setLoadingEdit(false));
      return;
    }
    const p = periodForType('WEEKLY');
    setValue('periodStart', p.start);
    setValue('periodEnd', p.end);
    setValue('title', generateDefaultTitle('WEEKLY', p.start));
  }, [editId, navigate, reset, setValue]);

  useEffect(() => {
    if (!periodStart || !periodEnd) return;
    setPeriod({ start: periodStart, end: periodEnd });
  }, [periodStart, periodEnd]);

  useEffect(() => {
    if (!period.start || !period.end) return;
    setLoadingSummary(true);
    analyticsApi
      .getMySummary({ startDate: period.start, endDate: period.end })
      .then((res) => {
        const d = res?.data ?? res;
        setSummary(d);
      })
      .catch(() => setSummary(null))
      .finally(() => setLoadingSummary(false));
  }, [period.start, period.end]);

  const handleReportTypeChange = (typeValue) => {
    setValue('reportType', typeValue);
    const p = periodForType(typeValue);
    setValue('periodStart', p.start);
    setValue('periodEnd', p.end);
    // Automatically change title based on selected type
    setValue('title', generateDefaultTitle(typeValue, p.start));
  };

  const onSubmit = async (data) => {
    if (!data.title?.trim()) {
      toast.error('Title is required');
      return;
    }
    if (!data.periodStart || !data.periodEnd) {
      toast.error('Period is required');
      return;
    }
    setSaving(true);
    try {
      if (editId) {
        await reportsApi.update(editId, {
          title: data.title.trim(),
          narrative: data.narrative || '',
          reportType: data.reportType,
          periodStart: data.periodStart,
          periodEnd: data.periodEnd,
          location: data.location || undefined,
          attachments: attachments.map(a => ({
            documentId: a.documentId,
            caption: a.caption,
            category: a.category,
            displayOrder: a.displayOrder
          }))
        });
        toast.success('Report updated successfully');
        navigate(`/social-worker/my-reports/${editId}`);
      } else {
        const payload = {
          title: data.title.trim(),
          reportType: data.reportType,
          periodStart: data.periodStart,
          periodEnd: data.periodEnd,
          narrative: data.narrative || undefined,
          location: data.location || undefined,
          relatedCaseId: data.relatedCaseId ? Number(data.relatedCaseId) : undefined,
          attachments: attachments.map(a => ({
            documentId: a.documentId,
            caption: a.caption,
            category: a.category,
            displayOrder: a.displayOrder
          }))
        };
        const result = await reportsApi.create(payload);
        const report = result?.data ?? result;
        toast.success('Report saved as draft');
        navigate(`/social-worker/my-reports/${report.id}`);
      }
    } catch (e) {
      toast.error(e?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const dailyActivity = summary?.chartData?.dailyActivity || [];
  const interventionDist = summary?.chartData?.interventionTypeDistribution || [];

  if (loadingEdit) {
    return (
      <div className="flex justify-center py-24">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => navigate('/social-worker/my-reports')}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-teal-600 font-medium transition-colors"
        >
          <HiOutlineArrowLeft className="w-4 h-4" /> Back to Reports
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-teal-50/50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center shadow-inner">
              <HiOutlineDocumentText className="w-5 h-5 text-teal-700" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {editId ? 'Edit Your Report' : 'Create New Report'}
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {editId ? 'Make changes to your draft report before finalizing' : 'Document your field activities and progress'}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-8">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Report Type
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {REPORT_TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => handleReportTypeChange(type.value)}
                  className={`p-3 rounded-xl text-left transition-all border-2 flex flex-col items-start shadow-sm hover:shadow ${reportType === type.value
                      ? 'border-teal-500 bg-teal-50 ring-1 ring-teal-500/20'
                      : 'border-gray-100 bg-gray-50 hover:border-gray-200 hover:bg-gray-100/50'
                    }`}
                >
                  <div className={`p-2 rounded-lg mb-2 ${reportType === type.value ? 'bg-teal-100 text-teal-700' : 'bg-white text-gray-500 shadow-sm border border-gray-100'}`}>
                     {renderReportIcon(type.iconType, 'w-5 h-5')}
                  </div>
                  <p className={`text-sm font-bold ${reportType === type.value ? 'text-teal-800' : 'text-gray-800'}`}>
                    {type.label}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2 leading-snug">{type.description}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Report Title <span className="text-red-500">*</span>
              </label>
              <input
                {...register('title')}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all font-medium text-gray-800 shadow-sm"
                placeholder="e.g., Weekly Activity Report - Week 8, 2026"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Period Start <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  {...register('periodStart')}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 shadow-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Period End <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  {...register('periodEnd')}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 shadow-sm"
                />
              </div>
            </div>
          </div>

          {reportType === 'DAILY' && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1">
                <HiOutlineLocationMarker className="w-4 h-4" /> Field Visit Location
              </label>
              <input
                {...register('location')}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 shadow-sm"
                placeholder="e.g., Gasabo District, Sector Remera, Cell Kibaza"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex justify-between">
              <span>Activity Summary / Narrative</span>
            </label>
            <textarea
              {...register('narrative')}
              rows={reportType === 'DAILY' ? 4 : 8}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all resize-none shadow-sm"
              placeholder="Describe your activities, visits, challenges, and outcomes for this period..."
            />
            <div className="flex justify-between items-center mt-2">
              <p className="text-xs text-gray-400 font-medium">
                <HiOutlineInformationCircle className="w-3.5 h-3.5 inline mr-1 text-teal-500" />
                This will be your executive summary. Do not leave it blank.
              </p>
              <div className={`text-xs font-bold px-2 py-1 rounded-md ${narrativeLength >= 50 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                {narrativeLength} / 50 characters minimum
                {narrativeLength >= 50 && <HiOutlineCheckCircle className="inline ml-1 w-3.5 h-3.5" />}
              </div>
            </div>
            {narrativeLength < 50 && (
              <div className="mt-3 p-3.5 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600 font-semibold flex items-center gap-2">
                <HiOutlineInformationCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>Minimum 50 characters required to finalize this report. Current characters count: {narrativeLength}.</span>
              </div>
            )}
          </div>

          <div className="bg-gray-50 rounded-xl p-5 border border-gray-200 shadow-inner">
            <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
              <HiOutlinePhotograph className="w-5 h-5 text-teal-600" />
              Evidence & Attachments
              <span className="text-xs font-normal text-gray-500 ml-1">
                (Photos, documents, audio notes)
              </span>
            </h3>
            <AttachmentUploader attachments={attachments} setAttachments={setAttachments} />
          </div>

          {period.start && period.end && (
            <div className="border-2 border-teal-50 rounded-xl overflow-hidden shadow-sm">
              <div className="bg-gradient-to-r from-teal-50 to-white px-5 py-3 border-b border-teal-100 flex justify-between items-center">
                <div>
                   <h3 className="font-bold text-teal-900 text-sm flex items-center gap-2">
                     <HiOutlineChartBar className="w-4 h-4 text-teal-600" />
                     Live Data Preview
                   </h3>
                   <p className="text-xs text-gray-500 mt-0.5 font-medium">
                     {new Date(period.start).toLocaleDateString()} to {new Date(period.end).toLocaleDateString()}
                   </p>
                </div>
              </div>
              <div className="p-5 bg-white">
                {loadingSummary ? (
                  <div className="flex justify-center py-12">
                    <Spinner size="lg" />
                  </div>
                ) : summary ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                      <StatCard title="Active Cases" value={summary.totalActiveCases || 0} icon={HiOutlineClipboardList} className="shadow-sm border-gray-100" />
                      <StatCard title="Total Beneficiaries" value={summary.totalBeneficiaries || 0} icon={HiOutlineUserGroup} className="shadow-sm border-gray-100" />
                      <StatCard title="New Beneficiaries" value={summary.newBeneficiariesInPeriod || 0} icon={HiOutlineUserGroup} className="shadow-sm border-gray-100" />
                      <StatCard title="Interventions" value={summary.interventionsCompleted || 0} icon={HiOutlineCheckCircle} className="shadow-sm border-gray-100" />
                      <StatCard title="Tasks Done" value={summary.tasksCompleted || 0} icon={HiOutlineCheckCircle} className="shadow-sm border-gray-100" />
                      <StatCard title="Avg Progress" value={summary.avgCaseProgress != null ? `${summary.avgCaseProgress.toFixed(1)}%` : '0%'} icon={HiOutlineTrendingUp} className="shadow-sm border-gray-100" />
                    </div>

                    {(dailyActivity.length > 0 || interventionDist.length > 0) && (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                        {dailyActivity.length > 0 && (
                          <div className="bg-gray-50 rounded-xl border border-gray-100 p-4 h-64 shadow-inner">
                            <p className="text-sm font-bold text-gray-800 mb-3">Daily Activity Trend</p>
                            <ResponsiveContainer width="100%" height="85%">
                              <BarChart data={dailyActivity}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                                <YAxis tick={{ fontSize: 11 }} />
                                <Tooltip />
                                <Bar dataKey="value" fill="#0D9488" radius={[4, 4, 0, 0]} />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        )}
                        {interventionDist.length > 0 && (
                          <div className="bg-gray-50 rounded-xl border border-gray-100 p-4 h-64 shadow-inner">
                            <p className="text-sm font-bold text-gray-800 mb-3">Intervention Types</p>
                            <ResponsiveContainer width="100%" height="85%">
                              <PieChart>
                                <Pie data={interventionDist} dataKey="value" nameKey="label" cx="50%" cy="50%" outerRadius={70} label>
                                  {interventionDist.map((_, i) => (
                                    <Cell key={i} fill={['#0D9488', '#14B8A6', '#5EEAD4', '#2DD4BF', '#115E59'][i % 5]} />
                                  ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    <HiOutlineChartBar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-600 font-semibold">No activity data recorded in this period</p>
                    <p className="text-xs text-gray-500 mt-1">Complete cases and interventions to automatically generate your data here.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex gap-4 pt-6 border-t border-gray-100">
            <Button
              type="submit"
              disabled={saving}
              className="bg-teal-600 hover:bg-teal-700 text-white px-8 py-3 rounded-xl font-bold shadow-md shadow-teal-500/20"
            >
              {saving ? 'Saving...' : editId ? 'Update Draft' : 'Save as Draft'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/social-worker/my-reports')}
              className="border-2 border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-300 px-8 py-3 rounded-xl font-bold transition-all"
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}