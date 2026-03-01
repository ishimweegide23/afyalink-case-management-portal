import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { reportsApi } from '../../api/reportsApi';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import StatCard from '../../components/shared/StatCard';
import Spinner from '../../components/common/Spinner';
import ExportButtons from '../../components/shared/ExportButtons';
import ReportStatusBadge from '../../components/shared/ReportStatusBadge';
import PhotoGalleryModal from '../../components/shared/PhotoGalleryModal';
import {
  HiOutlinePencil, HiOutlineArrowLeft, HiOutlineLocationMarker, HiOutlinePhotograph,
  HiOutlineDocumentText, HiOutlineCalendar, HiOutlineUserGroup, HiOutlineCheckCircle,
  HiOutlineClipboardList, HiOutlineChartBar, HiOutlineDocument,
  HiOutlineClock, HiOutlineStar, HiOutlineTrendingUp, HiOutlineDownload
} from 'react-icons/hi';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { toast } from 'react-toastify';
import { documentApi } from '../../api/documentApi';
import AuthenticatedImage from '../../components/shared/AuthenticatedImage';

export default function ReportViewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [galleryOpen, setGalleryOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    reportsApi.getById(id)
      .then((res) => {
        const d = res?.data ?? res;
        setData(d);
      })
      .catch(() => {
        toast.error('Report not found');
        setData(null);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleFinalize = async () => {
    try {
      await reportsApi.finalize(id);
      toast.success('Report finalized successfully');
      setData((prev) => prev ? { ...prev, reportDto: { ...prev.reportDto, status: 'FINAL' } } : null);
    } catch (e) {
      toast.error(e?.message || 'Failed to finalize. Narrative must be at least 50 characters.');
    }
  };

  const handleSubmit = async () => {
    try {
      await reportsApi.submit(id);
      toast.success('Report submitted to supervisor');
      setData((prev) => prev ? { ...prev, reportDto: { ...prev.reportDto, status: 'SUBMITTED' } } : null);
    } catch (e) {
      toast.error(e?.message || 'Failed to submit');
    }
  };

  const [isEditingNarrative, setIsEditingNarrative] = React.useState(false);
  const [editedNarrative, setEditedNarrative] = React.useState('');
  const [savingNarrative, setSavingNarrative] = React.useState(false);

  React.useEffect(() => {
    if (data) {
      const r = data.reportDto || data;
      setEditedNarrative(r.narrative || '');
    }
  }, [data]);

  const handleSaveNarrative = async () => {
    setSavingNarrative(true);
    try {
      await reportsApi.update(id, { narrative: editedNarrative });
      toast.success('Report updated successfully');
      setIsEditingNarrative(false);
      setData(prev => prev ? {
        ...prev,
        reportDto: { ...(prev.reportDto || prev), narrative: editedNarrative }
      } : null);
    } catch (e) {
      toast.error('Failed to save narrative');
    } finally {
      setSavingNarrative(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  const report = data.reportDto || data;
  const summary = data.summary || {};
  const chartData = data.chartData || {};
  const beneficiaries = data.beneficiaries || [];
  const cases = data.cases || [];
  const interventions = data.interventions || [];
  const caseEntries = data.caseEntries || [];

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    const colors = { DRAFT: 'gray', FINAL: 'blue', SUBMITTED: 'green', ARCHIVED: 'gray' };
    return colors[status] || 'gray';
  };

  const getSuccessRateColor = (rate) => {
    if (rate >= 80) return 'text-green-600';
    if (rate >= 60) return 'text-amber-600';
    return 'text-red-600';
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-8">
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl shadow-xl border border-primary/10">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary-600 to-secondary opacity-[0.97]" />
        <div
          className="absolute inset-0 opacity-[0.12] pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        <div className="relative px-6 sm:px-8 py-6 sm:py-8">
          <button
            type="button"
            onClick={() => navigate('/social-worker/my-reports')}
            className="flex items-center gap-2 text-sm text-white/80 hover:text-white mb-4 transition-colors font-medium"
          >
            <HiOutlineArrowLeft className="w-4 h-4" /> Back to Reports
          </button>

          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-sm text-sm font-semibold mb-3 border border-white/20 text-white">
                <HiOutlineDocumentText className="w-4 h-4" />
                {report.reportType?.replace(/_/g, ' ')} Report
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight drop-shadow-sm">{report.title}</h1>
              <div className="flex flex-wrap items-center gap-4 mt-2 text-white/90 text-sm font-medium">
                <span className="flex items-center gap-1">
                  <HiOutlineCalendar className="w-4 h-4" />
                  {formatDate(report.periodStart)} – {formatDate(report.periodEnd)}
                </span>
                {report.location && (
                  <span className="flex items-center gap-1">
                    <HiOutlineLocationMarker className="w-4 h-4" />
                    {report.location}
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button size="sm" icon={HiOutlinePencil}
                onClick={() => navigate(`/social-worker/my-reports/create?edit=${id}`)}
                className="bg-white text-teal-700 hover:bg-teal-50 border-transparent shadow-sm font-bold">
                Edit Report
              </Button>
              {report.status === 'DRAFT' && (
                <Button size="sm" onClick={handleFinalize} className="bg-teal-800 text-white hover:bg-teal-900 border-transparent shadow-sm">
                  Finalize
                </Button>
              )}
              {(report.status === 'FINAL' || report.status === 'NEEDS_CHANGES') && (
                <Button size="sm" onClick={handleSubmit} className="bg-white text-teal-700 hover:bg-teal-50 font-bold shadow-sm">
                  {report.status === 'NEEDS_CHANGES' ? 'Resubmit to Supervisor' : 'Submit to Supervisor'}
                </Button>
              )}
              {report.attachments && report.attachments.length > 0 && (
                <Button size="sm" variant="outline" icon={HiOutlinePhotograph}
                  onClick={() => setGalleryOpen(true)}
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                  View Evidence ({report.attachments.length})
                </Button>
              )}
              <ExportButtons 
                reportId={id} 
                reportTitle={report.title}
                reportType={report.reportType}
                periodStart={report.periodStart}
                variant="light" 
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-6 text-sm font-medium">
          <div className="flex items-center gap-2">
            <span className="text-gray-500 uppercase text-xs font-bold tracking-wider">Status</span>
            <ReportStatusBadge status={report.status} />
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <HiOutlineClock className="w-4 h-4 text-gray-400" />
            <span>Generated {new Date(report.createdAt).toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <HiOutlineUserGroup className="w-4 h-4 text-gray-400" />
            <span>By {report.generatedByName}</span>
          </div>
        </div>
        {report.photoCount > 0 && (
          <div className="flex items-center gap-1 text-sm text-gray-600 font-medium px-3 py-1 bg-gray-50 rounded-lg border border-gray-200">
            <HiOutlinePhotograph className="w-4 h-4 text-primary" />
            <span>{report.photoCount} photo{report.photoCount !== 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <HiOutlineDocumentText className="w-5 h-5 text-primary" />
            <h2 className="font-bold text-gray-900 text-lg">Executive Summary</h2>
          </div>
          {!isEditingNarrative ? (
            <button
              type="button"
              onClick={() => setIsEditingNarrative(true)}
              className="flex items-center gap-1.5 text-sm text-primary font-semibold hover:underline"
            >
              <HiOutlinePencil className="w-4 h-4" /> Edit
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setIsEditingNarrative(false); setEditedNarrative(report.narrative || ''); }}
                className="text-sm text-gray-500 hover:text-gray-700 font-medium px-3 py-1 border border-gray-200 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveNarrative}
                disabled={savingNarrative}
                className="text-sm text-white bg-primary hover:bg-primary-600 font-semibold px-3 py-1 rounded-lg disabled:opacity-60"
              >
                {savingNarrative ? 'Saving…' : 'Save'}
              </button>
            </div>
          )}
        </div>
        
        {report.supervisorFeedback && (
          <div className="px-6 py-4 bg-amber-50 border-t border-b border-amber-100">
            <h3 className="text-sm font-bold text-amber-900 mb-1 flex items-center gap-2">
              <HiOutlineClipboardList className="w-4 h-4" /> Supervisor Feedback
            </h3>
            <p className="text-sm text-amber-800 whitespace-pre-wrap">{report.supervisorFeedback}</p>
          </div>
        )}

        <div className="p-6">
          {isEditingNarrative ? (
            <div className="mb-6">
              <textarea
                className="w-full min-h-[180px] p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none text-gray-700 leading-relaxed resize-y"
                value={editedNarrative}
                onChange={(e) => setEditedNarrative(e.target.value)}
                disabled={savingNarrative}
                placeholder="Write your narrative here (minimum 50 characters to finalize)…"
              />
              <p className={`text-xs mt-1 font-medium ${editedNarrative.length < 50 ? 'text-amber-600' : 'text-green-600'}`}>
                {editedNarrative.length} / 50 minimum characters
              </p>
            </div>
          ) : (
            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed mb-6">
              {report.narrative || 'No narrative provided. Click Edit to add your summary.'}
            </p>
          )}
          
          <div className="border border-gray-200 rounded-lg overflow-hidden mb-4">
             <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
               <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">Activity Summary Table</span>
             </div>
             <table className="w-full text-sm text-left">
               <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
                 <tr>
                   <th className="px-4 py-3 font-semibold">Metric</th>
                   <th className="px-4 py-3 font-semibold text-right">Value</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-100">
                 <tr>
                   <td className="px-4 py-3 font-medium text-gray-800 flex items-center gap-2"><HiOutlineClipboardList className="text-teal-600"/>Active Cases Handled</td>
                   <td className="px-4 py-3 text-right font-semibold text-gray-900">{summary.totalActiveCases || 0}</td>
                 </tr>
                 <tr>
                   <td className="px-4 py-3 font-medium text-gray-800 flex items-center gap-2"><HiOutlineUserGroup className="text-teal-600"/>New Beneficiaries Enrolled</td>
                   <td className="px-4 py-3 text-right font-semibold text-gray-900">{summary.newBeneficiariesInPeriod || 0}</td>
                 </tr>
                 <tr>
                   <td className="px-4 py-3 font-medium text-gray-800 flex items-center gap-2"><HiOutlineCheckCircle className="text-teal-600"/>Interventions Completed</td>
                   <td className="px-4 py-3 text-right font-semibold text-gray-900">{summary.interventionsCompleted || 0}</td>
                 </tr>
                 <tr>
                   <td className="px-4 py-3 font-medium text-gray-800 flex items-center gap-2"><HiOutlineChartBar className="text-teal-600"/>Tasks Completed</td>
                   <td className="px-4 py-3 text-right font-semibold text-gray-900">{summary.tasksCompleted || 0}</td>
                 </tr>
                 <tr>
                   <td className="px-4 py-3 font-medium text-gray-800 flex items-center gap-2"><HiOutlineDocument className="text-teal-600"/>Case Diary Entries</td>
                   <td className="px-4 py-3 text-right font-semibold text-gray-900">{summary.caseEntriesMade || 0}</td>
                 </tr>
               </tbody>
             </table>
          </div>

          {!isEditingNarrative && editedNarrative.length < 50 && report.status === 'DRAFT' && (
            <div className="mt-3 p-3 bg-amber-50 border border-amber-100 rounded-lg text-sm text-amber-800 flex items-center gap-2">
              <HiOutlineStar className="w-5 h-5 text-amber-500 shrink-0" />
              <span className="font-medium">Add <strong>{50 - editedNarrative.length}</strong> more characters to your narrative to be able to finalize this report</span>
            </div>
          )}
        </div>
      </div>
      
      {/* ATTACHMENTS AND PHOTOS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <HiOutlinePhotograph className="text-primary w-5 h-5" /> FIELD VISIT PHOTOS ({report.attachments ? report.attachments.filter(a => a.category === 'PHOTO').length : 0})
            </h4>
            <p className="text-xs text-gray-500 italic">Click any photo to expand</p>
          </div>
          {report.attachments && report.attachments.filter(a => a.category === 'PHOTO').length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {report.attachments.filter(a => a.category === 'PHOTO').slice(0, 6).map((att, idx) => (
                <div key={idx} className="border border-gray-200 rounded-xl overflow-hidden group cursor-pointer shadow-sm hover:shadow-md transition-all" onClick={() => setGalleryOpen(true)}>
                  <div className="h-32 bg-gray-100 relative">
                    <AuthenticatedImage documentId={att.documentId} attachment={att} alt={att.caption || 'Photo'} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all" />
                  </div>
                  <div className="p-3 bg-white">
                    <p className="text-xs font-semibold text-gray-900 truncate">{att.caption || 'Field Visit'}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 bg-gray-50 p-4 rounded-lg text-center border border-gray-100">No photos attached to this report.</p>
          )}
        </div>

        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex flex-col">
           <h4 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
              <HiOutlineDocument className="text-primary w-5 h-5" /> ATTACHED DOCUMENTS ({report.attachments ? report.attachments.filter(a => a.category !== 'PHOTO').length : 0})
           </h4>
           {report.attachments && report.attachments.filter(a => a.category !== 'PHOTO').length > 0 ? (
             <ul className="divide-y divide-gray-100 border border-gray-200 rounded-lg bg-gray-50 flex-1">
               {report.attachments.filter(a => a.category !== 'PHOTO').map((att, idx) => (
                 <li key={idx} className="flex items-center justify-between p-3 hover:bg-gray-100 transition-colors">
                   <div className="flex items-center gap-3">
                     <div className="w-8 h-8 rounded bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                       <HiOutlineDownload className="w-4 h-4" />
                     </div>
                     <span className="text-sm font-medium text-gray-900 truncate max-w-[200px]">{att.documentName}</span>
                   </div>
                   <button type="button" onClick={() => att.documentId && documentApi.downloadFile(att.documentId, att.documentName)} className="text-xs font-semibold text-primary hover:text-primary-700 bg-white px-3 py-1.5 rounded-md shadow-sm border border-gray-200">
                     DOWNLOAD
                   </button>
                 </li>
               ))}
             </ul>
           ) : (
              <p className="text-sm text-gray-500 bg-gray-50 p-4 rounded-lg text-center border border-gray-100 flex-1 flex items-center justify-center">No documents attached.</p>
           )}
        </div>
      </div>

      {(chartData.progressOverTime?.length > 0 || chartData.dailyActivity?.length > 0 || chartData.interventionTypeDistribution?.length > 0) && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
            <HiOutlineChartBar className="w-5 h-5 text-primary" />
            <h2 className="font-bold text-gray-900 text-lg">Performance Analytics</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {chartData.progressOverTime?.length > 0 && (
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 shadow-inner">
                  <p className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <HiOutlineTrendingUp className="w-4 h-4 text-primary" />
                    Progress Over Time
                  </p>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData.progressOverTime}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
                        <Tooltip />
                        <Line type="monotone" dataKey="value" stroke="#0D9488" strokeWidth={2} dot={{ fill: '#0D9488', r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {chartData.dailyActivity?.length > 0 && (
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 shadow-inner">
                  <p className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <HiOutlineChartBar className="w-4 h-4 text-primary" />
                    Daily Activity
                  </p>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData.dailyActivity}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Bar dataKey="value" fill="#0D9488" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {chartData.interventionTypeDistribution?.length > 0 && (
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 shadow-inner">
                  <p className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <HiOutlineCheckCircle className="w-4 h-4 text-primary" />
                    Intervention Types
                  </p>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartData.interventionTypeDistribution}
                          dataKey="value"
                          nameKey="label"
                          cx="50%"
                          cy="50%"
                          outerRadius={70}
                          label={({ label, percent }) => `${label}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {chartData.interventionTypeDistribution.map((_, i) => (
                            <Cell key={i} fill={['#0D9488', '#14B8A6', '#5EEAD4', '#2DD4BF', '#115E59'][i % 5]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {beneficiaries.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <HiOutlineUserGroup className="text-primary w-5 h-5"/>
              <h2 className="font-bold text-gray-900 text-lg">Beneficiaries Progress</h2>
            </div>
            <Badge color="blue" size="sm">{beneficiaries.length} beneficiaries</Badge>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-white border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left font-bold text-gray-700 tracking-wider">Beneficiary Name</th>
                  <th className="px-6 py-3 text-left font-bold text-gray-700 tracking-wider">Case Number</th>
                  <th className="px-6 py-3 text-left font-bold text-gray-700 tracking-wider">Progress</th>
                  <th className="px-6 py-3 text-left font-bold text-gray-700 tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {beneficiaries.map((b) => (
                  <tr key={b.beneficiaryId} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-6 py-4 text-gray-900 font-semibold">{b.fullName}</td>
                    <td className="px-6 py-4 font-mono text-gray-500">{b.caseNumber || '—'}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 max-w-32 bg-gray-200 rounded-full h-2.5">
                          <div
                            className="bg-primary rounded-full h-2.5 transition-all"
                            style={{ width: `${b.caseProgressPercent || 0}%` }}
                          />
                        </div>
                        <span className="font-bold text-gray-700">{b.caseProgressPercent || 0}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge color={b.status === 'CLOSED' ? 'green' : 'blue'} size="sm">
                        {b.status || 'Active'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {interventions.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
            <div className="flex items-center gap-2">
               <HiOutlineCheckCircle className="text-primary w-5 h-5"/>
               <h2 className="font-bold text-gray-900 text-lg">Interventions</h2>
            </div>
            <Badge color="green" size="sm">{interventions.length} interventions</Badge>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-white border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left font-bold text-gray-700 tracking-wider">Code</th>
                  <th className="px-6 py-3 text-left font-bold text-gray-700 tracking-wider">Title</th>
                  <th className="px-6 py-3 text-left font-bold text-gray-700 tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left font-bold text-gray-700 tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left font-bold text-gray-700 tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {interventions.slice(0, 10).map((i) => (
                  <tr key={i.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-6 py-3 font-mono text-gray-500">{i.interventionCode}</td>
                    <td className="px-6 py-3 font-semibold text-gray-800 max-w-xs truncate">{i.title}</td>
                    <td className="px-6 py-3 text-gray-600">{i.type}</td>
                    <td className="px-6 py-3 text-gray-600">{formatDate(i.scheduledDate)}</td>
                    <td className="px-6 py-3">
                      <Badge color={i.status === 'COMPLETED' ? 'green' : i.status === 'IN_PROGRESS' ? 'blue' : 'gray'} size="sm">
                        {i.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {interventions.length > 10 && (
              <div className="px-6 py-3 border-t border-gray-100 text-center text-sm font-semibold text-gray-500 bg-gray-50">
                + {interventions.length - 10} more interventions
              </div>
            )}
          </div>
        </div>
      )}

      {caseEntries.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
            <HiOutlineDocument className="text-primary w-5 h-5"/>
            <h2 className="font-bold text-gray-900 text-lg">Case Diary / Tasks</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {caseEntries.slice(0, 10).map((entry) => (
              <div key={entry.id} className="px-6 py-4 hover:bg-gray-50/80 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-800">{entry.title}</p>
                    <p className="text-xs font-medium text-gray-500 mt-1">
                      {entry.createdAt && new Date(entry.createdAt).toLocaleString()}
                    </p>
                  </div>
                  {entry.type === 'TASK' && (
                    <Badge color={entry.status === 'COMPLETED' ? 'green' : 'amber'} size="sm">
                      {entry.status || 'Pending'}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
          {caseEntries.length > 10 && (
            <div className="px-6 py-3 border-t border-gray-100 text-center text-sm font-semibold text-gray-500 bg-gray-50">
              + {caseEntries.length - 10} more entries
            </div>
          )}
        </div>
      )}

      <PhotoGalleryModal
        isOpen={galleryOpen}
        onClose={() => setGalleryOpen(false)}
        photos={report.attachments || []}
        title={report.title}
      />
    </div>
  );
}