import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { reportsApi } from '../../api/reportsApi';
import Button from '../../components/common/Button';
import StatCard from '../../components/shared/StatCard';
import Spinner from '../../components/common/Spinner';
import Badge from '../../components/common/Badge';
import { HiArrowLeft, HiOutlineDocumentText, HiOutlineDownload, HiOutlinePencil, HiOutlinePhotograph, HiOutlineLocationMarker, HiOutlineMap } from 'react-icons/hi';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts';
import { toast } from 'react-toastify';
import PhotoGalleryModal from '../../components/shared/PhotoGalleryModal';

export default function SupervisorReportViewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedNarrative, setEditedNarrative] = useState('');
  const [saving, setSaving] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    reportsApi.getById(id)
      .then((res) => {
        const d = res?.data ?? res;
        setData(d);
        setEditedNarrative(d?.reportDto?.narrative || d?.narrative || '');
      })
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [id]);

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

  const handleExport = (format) => {
    const fn = format === 'pdf' ? reportsApi.exportPdf : format === 'excel' ? reportsApi.exportExcel : reportsApi.exportWord;
    fn(id).then((blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report-${id}.${format === 'pdf' ? 'pdf' : format === 'excel' ? 'xlsx' : 'docx'}`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Download started');
    }).catch(() => toast.error('Export failed'));
  };

  const handleFeedback = async (status) => {
    if (status === 'NEEDS_CHANGES' && !feedbackText.trim()) {
      toast.error('Please provide feedback on what needs changing');
      return;
    }
    setFeedbackLoading(true);
    try {
      await reportsApi.provideFeedback(id, { status, feedback: feedbackText });
      toast.success(`Report marked as ${status.replace('_', ' ')}`);
      setData(prev => ({ ...prev, reportDto: { ...prev.reportDto, status, supervisorFeedback: feedbackText } }));
    } catch (e) {
      toast.error('Failed to submit feedback');
    } finally {
      setFeedbackLoading(false);
    }
  };

  if (loading || !data) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  const report = data.reportDto || data;
  const summary = data.summary;
  const chartData = data.chartData || {};
  const beneficiaries = data.beneficiaries || [];
  const interventions = data.interventions || [];
  const caseEntries = data.caseEntries || [];
  const teamSummary = data.teamSummary;
  const teamMembers = teamSummary?.members || [];
  const periodStr = `${report?.periodStart ?? '—'} – ${report?.periodEnd ?? '—'}`;
  const isTeamReport = report.reportType === 'SUPERVISOR_TEAM';

  return (
    <div className="space-y-6 pb-8">
      <button onClick={() => navigate('/supervisor/team-reports')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-primary font-medium transition-colors">
        <HiArrowLeft className="w-4 h-4" /> Back to Team Reports
      </button>

      {(report.generatedByDistrict || report.generatedBySector) && (
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 flex flex-wrap gap-4">
          {report.generatedByDistrict && (
            <div className="flex items-center gap-2 text-sm">
              <HiOutlineLocationMarker className="w-4 h-4 text-primary" />
              <span className="text-gray-600">District:</span>
              <span className="font-semibold text-gray-900">{report.generatedByDistrict}</span>
            </div>
          )}
          {report.generatedBySector && (
            <div className="flex items-center gap-2 text-sm">
              <HiOutlineMap className="w-4 h-4 text-primary" />
              <span className="text-gray-600">Sector:</span>
              <span className="font-semibold text-gray-900">{report.generatedBySector}</span>
            </div>
          )}
          {report.generatedByCell && (
            <div className="flex items-center gap-2 text-sm">
              <HiOutlineMap className="w-4 h-4 text-primary" />
              <span className="text-gray-600">Cell:</span>
              <span className="font-semibold text-gray-900">{report.generatedByCell}</span>
            </div>
          )}
        </div>
      )}
      <div className="relative overflow-hidden rounded-2xl border border-primary/10 shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary-600 to-secondary opacity-[0.97]" />
        <div className="relative px-6 sm:px-8 py-8 text-white">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 text-sm font-semibold mb-3 border border-white/20">
                <HiOutlineDocumentText className="w-4 h-4" /> {report.reportType?.replace(/_/g, ' ')}
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                {isTeamReport ? 'Supervisor Team Report' : report.title}
              </h1>
              {isTeamReport && report.generatedByDistrict && (
                <p className="text-white/90 text-sm font-medium">{report.generatedByDistrict} District Team</p>
              )}
              <p className="mt-1 text-white/90 text-sm">Period: {periodStr} • By {report.generatedByName}</p>
              <Badge color="bg-white/20 text-white border-white/30" className="mt-2">{report.status}</Badge>
            </div>
            <div className="flex flex-wrap gap-2">
              {report.attachments && report.attachments.length > 0 && (
                <Button size="sm" variant="secondary" icon={HiOutlinePhotograph} onClick={() => setGalleryOpen(true)} className="bg-white/20 border-white/40 text-white hover:bg-white/30">
                  View Attachments ({report.attachments.length})
                </Button>
              )}
              <Button size="sm" variant="secondary" icon={HiOutlineDownload} onClick={() => handleExport('pdf')} className="bg-white/20 border-white/40 text-white hover:bg-white/30">PDF</Button>
              <Button size="sm" variant="secondary" onClick={() => handleExport('excel')} className="bg-white/20 border-white/40 text-white hover:bg-white/30">Excel</Button>
              <Button size="sm" variant="secondary" onClick={() => handleExport('word')} className="bg-white/20 border-white/40 text-white hover:bg-white/30">Word</Button>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-md p-6">
          <div className="space-y-6">
            <div className="bg-white rounded-xl border p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Narrative</h2>
                {!isEditing ? (
                  <Button size="sm" variant="ghost" icon={HiOutlinePencil} onClick={() => setIsEditing(true)}>
                    Edit
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" onClick={() => { setIsEditing(false); setEditedNarrative(report.narrative || ''); }}>Cancel</Button>
                    <Button size="sm" loading={saving} onClick={handleSaveNarrative}>Save</Button>
                  </div>
                )}
              </div>
              {report.reportType === 'SUPERVISOR_TEAM' && (
                <div className="mb-3 p-2.5 bg-blue-50/80 border border-blue-100 rounded-lg text-xs text-blue-700 flex items-center gap-2">
                  <HiOutlineDocumentText className="w-4 h-4" />
                  <span><strong>Source:</strong> Auto-generated from worker reports. You can edit below.</span>
                </div>
              )}
              {isEditing ? (
                <textarea
                  className="w-full min-h-[200px] p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none"
                  value={editedNarrative}
                  onChange={(e) => setEditedNarrative(e.target.value)}
                  disabled={saving}
                />
              ) : (
                <p className="text-gray-700 whitespace-pre-wrap">{report.narrative || '—'}</p>
              )}
            </div>
            
            {report.supervisorFeedback && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-blue-900 mb-2">Previous Supervisor Feedback</h2>
                <p className="text-blue-800 whitespace-pre-wrap">{report.supervisorFeedback}</p>
              </div>
            )}

            {(report.status === 'SUBMITTED' || report.status === 'NEEDS_CHANGES') && report.reportType !== 'SUPERVISOR_TEAM' && (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                <h2 className="text-lg font-semibold mb-4">Provide Feedback</h2>
                <textarea
                  className="w-full min-h-[100px] p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none mb-4"
                  placeholder="Enter feedback or changes required..."
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  disabled={feedbackLoading}
                />
                <div className="flex gap-3">
                  <Button size="sm" onClick={() => handleFeedback('APPROVED')} disabled={feedbackLoading} className="bg-green-600 hover:bg-green-700 text-white">Approve Report</Button>
                  <Button size="sm" variant="outline" onClick={() => handleFeedback('NEEDS_CHANGES')} disabled={feedbackLoading} className="text-amber-600 border-amber-600 hover:bg-amber-50">Request Changes</Button>
                </div>
              </div>
            )}

            {isTeamReport && summary && (
              <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                <div><span className="text-gray-500 block">District</span><strong>{report.generatedByDistrict || '—'}</strong></div>
                <div><span className="text-gray-500 block">Workers</span><strong>{teamMembers.length}</strong></div>
                <div><span className="text-gray-500 block">Team cases</span><strong>{summary.totalActiveCases}</strong></div>
                <div><span className="text-gray-500 block">Beneficiaries</span><strong>{summary.totalBeneficiaries}</strong></div>
              </div>
            )}

            {isTeamReport && teamMembers.length > 0 && (
              <div className="bg-white rounded-xl border p-6 overflow-x-auto">
                <h2 className="text-lg font-semibold mb-4">Worker Performance by Sector</h2>
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold text-gray-600">Sector</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-600">Worker</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-600">Cases</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-600">Progress</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-600">Coverage</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {teamMembers.map((m) => (
                      <tr key={m.userId}>
                        <td className="px-3 py-2">{m.sector || '—'}</td>
                        <td className="px-3 py-2 font-medium">{m.workerName}</td>
                        <td className="px-3 py-2">{m.totalActiveCases}</td>
                        <td className="px-3 py-2">{m.avgCaseProgress != null ? `${Math.round(m.avgCaseProgress)}%` : '—'}</td>
                        <td className="px-3 py-2 text-gray-600">{[m.cell, m.village].filter(Boolean).join(', ') || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {summary && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                <StatCard title="Active cases" value={summary.totalActiveCases} />
                <StatCard title="New beneficiaries" value={summary.newBeneficiariesInPeriod} />
                <StatCard title="Total beneficiaries" value={summary.totalBeneficiaries} />
                <StatCard title="New cases" value={summary.newCasesInPeriod} />
                <StatCard title="Interventions done" value={summary.interventionsCompleted} />
                <StatCard title="Tasks completed" value={summary.tasksCompleted} />
                <StatCard title="Case entries" value={summary.caseEntriesMade} />
                <StatCard title="Avg progress" value={summary.avgCaseProgress != null ? `${summary.avgCaseProgress.toFixed(1)}%` : '—'} />
              </div>
            )}
            {(chartData.progressOverTime?.length > 0 || chartData.dailyActivity?.length > 0 || chartData.interventionTypeDistribution?.length > 0) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {chartData.progressOverTime?.length > 0 && (
                  <div className="bg-white rounded-xl border border-gray-100 p-5 h-64">
                    <p className="font-medium mb-2">Progress over time</p>
                    <ResponsiveContainer width="100%" height="85%">
                      <LineChart data={chartData.progressOverTime}>
                        <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" /><YAxis /><Tooltip />
                        <Line type="monotone" dataKey="value" stroke="#0369A1" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
                {chartData.dailyActivity?.length > 0 && (
                  <div className="bg-white rounded-xl border border-gray-100 p-5 h-64">
                    <p className="font-medium mb-2">Daily activity</p>
                    <ResponsiveContainer width="100%" height="85%">
                      <BarChart data={chartData.dailyActivity}>
                        <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" /><YAxis /><Tooltip />
                        <Bar dataKey="value" fill="#16A34A" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
                {chartData.interventionTypeDistribution?.length > 0 && (
                  <div className="bg-white rounded-xl border border-gray-100 p-5 h-64">
                    <p className="font-medium mb-2">Intervention types</p>
                    <ResponsiveContainer width="100%" height="85%">
                      <PieChart>
                        <Pie data={chartData.interventionTypeDistribution} dataKey="value" nameKey="label" cx="50%" cy="50%" outerRadius={60}>
                          {chartData.interventionTypeDistribution.map((_, i) => <Cell key={i} fill={['#0369A1', '#16A34A', '#f59e0b', '#8b5cf6'][i % 4]} />)}
                        </Pie>
                        <Tooltip /><Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            )}
            {beneficiaries.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-3">Beneficiaries with progress</h2>
                <div className="overflow-x-auto border border-gray-200 rounded-xl">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50"><tr><th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Name</th><th className="px-4 py-2 text-left text-xs font-semibold">Progress</th><th className="px-4 py-2 text-left text-xs font-semibold">Case</th></tr></thead>
                    <tbody className="divide-y divide-gray-100">
                      {beneficiaries.slice(0, 15).map((b) => (
                        <tr key={b.beneficiaryId} className="text-sm"><td className="px-4 py-2">{b.fullName}</td><td className="px-4 py-2">{b.caseProgressPercent != null ? `${b.caseProgressPercent}%` : '—'}</td><td className="px-4 py-2">{b.caseNumber}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {interventions.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-3">Interventions in period</h2>
                <div className="overflow-x-auto border border-gray-200 rounded-xl">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50"><tr><th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Code</th><th className="px-4 py-2 text-left text-xs font-semibold">Title</th><th className="px-4 py-2 text-left text-xs font-semibold">Type</th><th className="px-4 py-2 text-left text-xs font-semibold">Status</th></tr></thead>
                    <tbody className="divide-y divide-gray-100">
                      {interventions.slice(0, 15).map((i) => (
                        <tr key={i.id} className="text-sm"><td className="px-4 py-2 font-mono text-xs">{i.interventionCode}</td><td className="px-4 py-2">{i.title}</td><td className="px-4 py-2">{i.type}</td><td className="px-4 py-2"><Badge color={i.status === 'COMPLETED' ? 'green' : 'gray'}>{i.status}</Badge></td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {caseEntries.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-3">Case diary / tasks</h2>
                <ul className="space-y-2">
                  {caseEntries.slice(0, 15).map((e) => (
                    <li key={e.id} className="text-sm text-gray-700 border-l-2 border-primary pl-3">{e.createdAt ? new Date(e.createdAt).toLocaleString() : ''} – {e.title}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
      </div>
      <PhotoGalleryModal
        isOpen={galleryOpen}
        onClose={() => setGalleryOpen(false)}
        photos={report.attachments || []}
        title={report.title}
      />
    </div>
  );
}
