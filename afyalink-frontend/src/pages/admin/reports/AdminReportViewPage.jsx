// pages/admin/reports/AdminReportViewPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { reportsApi } from '../../api/reportsApi';
import Button from '../../components/common/Button';
import Spinner from '../../components/common/Spinner';
import ExportButtons from '../../components/shared/ExportButtons';
import PhotoGalleryModal from '../../components/shared/PhotoGalleryModal';
import AttachmentUploader from '../../components/shared/AttachmentUploader';
import { HiOutlinePencil, HiOutlinePlus } from 'react-icons/hi';
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
  HiOutlineStar,
  HiOutlineDocumentReport,
  HiOutlineCalendar,
  HiOutlineFilter,
  HiOutlineDownload
} from 'react-icons/hi';
import { toast } from 'react-toastify';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { format } from 'date-fns';

const COLORS = ['#0D9488', '#6366F1', '#F59E0B', '#EF4444', '#10B981', '#8B5CF6'];

export default function AdminReportViewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedNarrative, setEditedNarrative] = useState('');
  const [saving, setSaving] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [reportType, setReportType] = useState(null);
  const [feedbackText, setFeedbackText] = useState('');

  useEffect(() => {
    if (!id) return;
    fetchReportData();
  }, [id]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const res = await reportsApi.getById(id);
      const d = res?.data ?? res;
      setData(d);
      setEditedNarrative(d?.reportDto?.narrative || d?.narrative || '');
      setAttachments(d?.reportDto?.attachments || []);
      setReportType(d?.reportDto?.reportType || d?.reportType);
      setFeedbackText(d?.reportDto?.supervisorFeedback || d?.supervisorFeedback || '');
    } catch (error) {
      console.error('Error fetching report:', error);
      toast.error('Failed to load report');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNarrative = async () => {
    setSaving(true);
    try {
      await reportsApi.update(id, { narrative: editedNarrative });
      toast.success('Narrative updated successfully');
      setIsEditing(false);
      setData(prev => ({ ...prev, reportDto: { ...prev.reportDto, narrative: editedNarrative } }));
    } catch (e) {
      toast.error('Failed to update narrative');
    } finally {
      setSaving(false);
    }
  };

  const handleAddAttachment = async (files) => {
    for (const file of files) {
      const formData = new FormData();
      formData.append('file', file);
      try {
        const res = await reportsApi.uploadAttachment(formData);
        const doc = res?.data;
        if (doc?.id) {
          await reportsApi.addAttachmentToReport(id, {
            documentId: doc.id,
            caption: file.name,
            category: file.type.startsWith('image/') ? 'PHOTO' : 'DOCUMENT'
          });
          toast.success('Attachment added');
          fetchReportData();
        }
      } catch (error) {
        toast.error('Failed to upload attachment');
      }
    }
  };

  const handleRemoveAttachment = async (attachmentId) => {
    try {
      await reportsApi.removeAttachmentFromReport(id, attachmentId);
      toast.success('Attachment removed');
      fetchReportData();
    } catch (error) {
      toast.error('Failed to remove attachment');
    }
  };

  const handleFeedback = async (status) => {
      // feedback logic
      toast.success(`Feedback ${status}`);
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  if (!data) return <div className="flex justify-center py-20 text-gray-500">Report not found.</div>;

  const report = data.reportDto || data;
  const summary = data.summary || {};
  const orgData = data.organizationData || {};
  const periodStr = `${report?.periodStart ?? '—'} – ${report?.periodEnd ?? '—'}`;
  const isOrgReport = reportType === 'ORGANIZATION';
  const isSupervisorTeamReport = reportType === 'SUPERVISOR_TEAM';
  const isSocialWorkerReport = ['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'].includes(reportType);
  const canEdit = report.status === 'DRAFT' || report.status === 'NEEDS_CHANGES';

  // Extract data for different report types
  const totalBeneficiaries = orgData?.totalBeneficiariesServed || summary.totalBeneficiaries || 0;
  const totalCases = orgData?.totalCasesManaged || summary.totalCases || 0;
  const successRate = orgData?.overallSuccessRate ? `${orgData.overallSuccessRate.toFixed(1)}%` : summary.successRate || '0%';
  const complianceRate = orgData?.overallComplianceRate ? `${orgData.overallComplianceRate.toFixed(1)}%` : summary.complianceRate || '0%';
  const activeWorkers = orgData?.totalSocialWorkers || summary.totalWorkers || 0;
  const activeSupervisors = orgData?.totalSupervisors || 0;

  const districtPerformance = orgData?.districtPerformance || [];
  const casesByPriority = orgData?.casesByPriority || summary.casesByPriority || [];
  const casesByStatus = orgData?.casesByStatus || summary.casesByStatus || [];
  const interventionTypes = orgData?.interventionStats || summary.interventionTypes || [];

  return (
    <div className="space-y-6 pb-12">
      {/* Back Button */}
      <button 
        onClick={() => navigate(isOrgReport ? '/admin/reports' : isSupervisorTeamReport ? '/supervisor/team-reports' : '/social-worker/my-reports')} 
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-primary font-medium transition-colors"
      >
        <HiArrowLeft className="w-4 h-4" /> Back to Reports
      </button>

      {/* Header Section - Keep existing gradient */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-primary/10 shadow-xl shadow-primary/10">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary-600 to-secondary opacity-[0.97]" />
        <div className="absolute inset-0 opacity-[0.12] pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }} />
        <div className="relative px-6 sm:px-8 py-8 sm:py-10 text-white text-center">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-sm text-sm font-semibold mb-3 border border-white/20">
                <HiOutlineDocumentReport className="w-4 h-4" />
                {reportType?.replace(/_/g, ' ')} Report
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight drop-shadow-sm">{report.title}</h1>
              <p className="mt-2 text-white/80 text-sm">Period: {periodStr}</p>
              <p className="text-white/70 text-xs mt-1">Generated by: {report.generatedByName} | Status: {report.status}</p>
            </div>
            <div className="flex gap-2">
              {canEdit && (
                <Button size="sm" variant="light" icon={HiOutlinePencil} onClick={() => setIsEditing(true)} className="bg-white/20 border-white/40 text-white hover:bg-white/30">
                  Edit
                </Button>
              )}
              <ExportButtons reportId={id} reportTitle={report.title} reportType={reportType} variant="light" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-1 flex flex-wrap gap-1">
        {['overview', 'statistics', 'charts', 'attachments', 'feedback'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize ${
              activeTab === tab 
                ? 'bg-primary text-white shadow-sm' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {tab === 'overview' && '📋 Overview'}
            {tab === 'statistics' && '📊 Statistics'}
            {tab === 'charts' && '📈 Charts'}
            {tab === 'attachments' && '📎 Attachments'}
            {tab === 'feedback' && '💬 Feedback'}
          </button>
        ))}
      </div>

      {/* Tab: Overview */}
      {activeTab === 'overview' && (
        <>
          {/* Executive Summary Section */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-md p-6">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <HiOutlineDocumentText className="text-primary w-5 h-5" /> EXECUTIVE SUMMARY
              </h2>
              {isEditing && (
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={() => { setIsEditing(false); setEditedNarrative(report.narrative || ''); }}>Cancel</Button>
                  <Button size="sm" loading={saving} onClick={handleSaveNarrative}>Save</Button>
                </div>
              )}
            </div>
            {isEditing ? (
              <textarea
                className="w-full min-h-[200px] p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none"
                value={editedNarrative}
                onChange={(e) => setEditedNarrative(e.target.value)}
                disabled={saving}
                placeholder="Write your executive summary here..."
              />
            ) : report.narrative && report.narrative.trim() ? (
              <p style={{ fontSize: 14, lineHeight: 1.75, color: '#374151', whiteSpace: 'pre-wrap', margin: 0 }}>
                {report.narrative}
              </p>
            ) : (
              <div style={{ textAlign: 'center', padding: '24px 0', color: '#9CA3AF' }}>
                <HiOutlineDocumentText style={{ width: 36, height: 36, margin: '0 auto 8px', display: 'block' }} />
                <p style={{ fontSize: 13, margin: '0 0 4px' }}>No executive summary provided.</p>
                <p style={{ fontSize: 11, margin: 0 }}>Admin can edit this report and add a summary.</p>
              </div>
            )}
          </div>

          {/* KPI Cards */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-md p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <HiOutlineChartBar className="text-primary w-5 h-5" /> KEY PERFORMANCE INDICATORS
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="bg-gradient-to-br from-white to-gray-50 border border-gray-100 rounded-xl p-4 text-center hover:shadow-md transition-all">
                <p className="text-2xl font-extrabold text-primary">{totalBeneficiaries}</p>
                <p className="text-[10px] text-gray-500 uppercase font-bold mt-1">Beneficiaries</p>
              </div>
              <div className="bg-gradient-to-br from-white to-gray-50 border border-gray-100 rounded-xl p-4 text-center hover:shadow-md transition-all">
                <p className="text-2xl font-extrabold text-primary">{totalCases}</p>
                <p className="text-[10px] text-gray-500 uppercase font-bold mt-1">Total Cases</p>
              </div>
              <div className="bg-gradient-to-br from-white to-blue-50 border border-blue-100 rounded-xl p-4 text-center hover:shadow-md transition-all">
                <p className="text-2xl font-extrabold text-blue-600">{successRate}</p>
                <p className="text-[10px] text-blue-600 uppercase font-bold mt-1">Success Rate</p>
              </div>
              <div className="bg-gradient-to-br from-white to-green-50 border border-green-100 rounded-xl p-4 text-center hover:shadow-md transition-all">
                <p className="text-2xl font-extrabold text-green-600">{complianceRate}</p>
                <p className="text-[10px] text-green-600 uppercase font-bold mt-1">Compliance</p>
              </div>
              <div className="bg-gradient-to-br from-white to-gray-50 border border-gray-100 rounded-xl p-4 text-center hover:shadow-md transition-all">
                <p className="text-2xl font-extrabold text-primary">{activeWorkers}</p>
                <p className="text-[10px] text-gray-500 uppercase font-bold mt-1">Social Workers</p>
              </div>
              <div className="bg-gradient-to-br from-white to-gray-50 border border-gray-100 rounded-xl p-4 text-center hover:shadow-md transition-all">
                <p className="text-2xl font-extrabold text-primary">{activeSupervisors}</p>
                <p className="text-[10px] text-gray-500 uppercase font-bold mt-1">Supervisors</p>
              </div>
            </div>
          </div>

          {/* District Performance Table */}
          {districtPerformance.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-md overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <HiOutlineMap className="text-primary w-5 h-5" /> DISTRICT PERFORMANCE
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-gray-600">District</th>
                      <th className="px-4 py-3 text-center font-semibold text-gray-600">Cases</th>
                      <th className="px-4 py-3 text-center font-semibold text-gray-600">Active</th>
                      <th className="px-4 py-3 text-center font-semibold text-gray-600">Closed</th>
                      <th className="px-4 py-3 text-center font-semibold text-gray-600">Workers</th>
                      <th className="px-4 py-3 text-center font-semibold text-gray-600">Success %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {districtPerformance.map((d, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-semibold text-gray-900">{d.district || d.name || '—'}</td>
                        <td className="px-4 py-3 text-center">{d.cases || 0}</td>
                        <td className="px-4 py-3 text-center">{d.activeCases || 0}</td>
                        <td className="px-4 py-3 text-center">{d.closedCases || 0}</td>
                        <td className="px-4 py-3 text-center">{d.socialWorkersCount || 0}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`font-semibold ${(d.successRate || 0) >= 80 ? 'text-green-600' : (d.successRate || 0) >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                            {Math.round(d.successRate || 0)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Tab: Statistics */}
      {activeTab === 'statistics' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Cases by Priority */}
          {casesByPriority.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-md p-6">
              <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
                <HiOutlineChartBar className="text-primary w-5 h-5" /> Cases by Priority
              </h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={casesByPriority} dataKey="value" nameKey="label" cx="50%" cy="50%" outerRadius={100} label>
                      {casesByPriority.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Cases by Status */}
          {casesByStatus.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-md p-6">
              <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
                <HiOutlineTrendingUp className="text-primary w-5 h-5" /> Cases by Status
              </h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={casesByStatus} dataKey="value" nameKey="label" cx="50%" cy="50%" outerRadius={100} label>
                      {casesByStatus.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Intervention Success by Type */}
          {interventionTypes.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-md p-6 lg:col-span-2">
              <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
                <HiOutlineTrendingUp className="text-primary w-5 h-5" /> Intervention Success by Type
              </h3>
              <div className="space-y-4">
                {interventionTypes.map((type, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between text-sm font-medium text-gray-700 mb-1">
                      <span>{type.label || type.type || 'Other'}</span>
                      <span className="font-bold text-primary">{Math.round(type.percent || type.successRate || 0)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div className="h-2 rounded-full bg-primary" style={{ width: `${Math.min(100, type.percent || type.successRate || 0)}%` }} />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{type.count || 0} interventions</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab: Attachments */}
      {activeTab === 'attachments' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <HiOutlinePhotograph className="text-primary w-5 h-5" /> ATTACHMENTS
            </h2>
            {canEdit && (
              <AttachmentUploader onUpload={handleAddAttachment} buttonText="Add Attachment" />
            )}
          </div>
          
          {attachments.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <HiOutlinePhotograph className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No attachments found for this report.</p>
              {canEdit && <p className="text-sm mt-1">Click "Add Attachment" to upload files.</p>}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {attachments.map((att) => {
                const isImage = att.category === 'PHOTO' || att.documentName?.match(/\.(jpg|jpeg|png|gif|webp)$/i);
                return (
                  <div key={att.id} className="border border-gray-200 rounded-xl overflow-hidden group relative">
                    {isImage ? (
                      <button onClick={() => setGalleryOpen(true)} className="w-full">
                        <img src={att.documentUrl} alt={att.caption || att.documentName} className="w-full h-32 object-cover" />
                      </button>
                    ) : (
                      <div className="w-full h-32 bg-gray-100 flex items-center justify-center">
                        <HiOutlineDocumentText className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                    <div className="p-2">
                      <p className="text-xs text-gray-600 truncate">{att.caption || att.documentName}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{att.category || 'Document'}</p>
                    </div>
                    {canEdit && (
                      <button
                        onClick={() => handleRemoveAttachment(att.id)}
                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab: Feedback (for supervisor team reports) */}
      {activeTab === 'feedback' && isSupervisorTeamReport && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-md p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <HiOutlineDocumentText className="text-primary w-5 h-5" /> PROVIDE FEEDBACK
          </h2>
          {report.supervisorFeedback && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm font-semibold text-blue-800">Previous Feedback:</p>
              <p className="text-sm text-blue-700">{report.supervisorFeedback}</p>
            </div>
          )}
          <textarea
            className="w-full min-h-[100px] p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary mb-4"
            placeholder="Enter your feedback for the supervisor..."
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
          />
          <div className="flex gap-3">
            <Button onClick={() => handleFeedback('APPROVED')} className="bg-green-600 hover:bg-green-700 text-white">
              Approve Report
            </Button>
            <Button variant="outline" onClick={() => handleFeedback('NEEDS_CHANGES')} className="text-amber-600 border-amber-600 hover:bg-amber-50">
              Request Changes
            </Button>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="text-center text-xs text-gray-400 mt-8 space-y-1">
        <p>Report generated: {report.createdAt ? new Date(report.createdAt).toLocaleDateString() : new Date().toLocaleDateString()} by {report.generatedByName || 'Administrator'}</p>
        <p className="font-bold text-gray-500">CONFIDENTIAL - Internal Use Only | For questions: admin@afyalink.rw</p>
      </div>

      {/* Photo Gallery Modal */}
      <PhotoGalleryModal
        isOpen={galleryOpen}
        onClose={() => setGalleryOpen(false)}
        photos={attachments.filter(a => a.category === 'PHOTO' || a.documentName?.match(/\.(jpg|jpeg|png|gif|webp)$/i))}
        title={report.title}
      />
    </div>
  );
}
