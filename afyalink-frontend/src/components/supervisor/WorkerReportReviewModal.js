import React, { useState, useEffect } from 'react';
import { reportsApi } from '../../api/reportsApi';
import { 
  HiX, 
  HiExternalLink, 
  HiOutlineDownload, 
  HiOutlineCheckCircle, 
  HiOutlineExclamationCircle, 
  HiOutlineXCircle,
  HiOutlineDocumentText,
  HiOutlineChartBar,
  HiOutlinePhotograph,
  HiOutlineDocument
} from 'react-icons/hi';
import { useNavigate } from 'react-router-dom';
import Spinner from '../common/Spinner';
import Button from '../common/Button';
import PhotoGalleryModal from '../shared/PhotoGalleryModal';
import ReportStatusBadge from '../shared/ReportStatusBadge';
import { toast } from 'react-toastify';
import { documentApi } from '../../api/documentApi';
import AuthenticatedImage from '../shared/AuthenticatedImage';

export default function WorkerReportReviewModal({ isOpen, onClose, reportId, onReviewComplete }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [decision, setDecision] = useState(null); 
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && reportId) {
      setLoading(true);
      setDecision(null);
      setFeedback('');
      reportsApi.getById(reportId)
        .then((res) => setData(res?.data ?? res))
        .catch(() => setData(null))
        .finally(() => setLoading(false));
    }
  }, [isOpen, reportId]);

  if (!isOpen) return null;

  const report = data?.reportDto || data;
  const summary = data?.summary || {};
  
  const wordCount = report?.narrative ? report.narrative.length : 0;
  const wordCountOk = wordCount >= 50;

  const handleSubmitDecision = async () => {
    if (!decision) {
      toast.error("Please select a decision");
      return;
    }
    if (decision === 'REQUEST_CHANGES' && !feedback) {
      toast.error("Please provide feedback for requested changes");
      return;
    }
    
    setSubmitting(true);
    try {
      const status = decision === 'REQUEST_CHANGES' ? 'NEEDS_CHANGES' : 'APPROVED';
      await reportsApi.provideFeedback(reportId, { status, feedback });
      toast.success(`Report marked as ${status.replace('_', ' ')}`);
      if (onReviewComplete) onReviewComplete(decision);
      onClose();
    } catch (err) {
      toast.error("Failed to submit decision");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-40 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
          <div className="fixed inset-0 transition-opacity bg-gray-900 bg-opacity-75" onClick={onClose} />

          <div className="relative inline-block w-full max-w-5xl p-0 my-8 text-left align-middle transition-all transform bg-white shadow-2xl rounded-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-gradient-to-r from-primary via-primary-600 to-secondary p-6 text-white shrink-0">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-bold tracking-tight mb-1">
                    WORKER REPORT: {report?.generatedByName || 'Loading...'}
                  </h3>
                  <p className="text-primary-100 font-medium">
                    {report?.reportType?.replace(/_/g, ' ')} Activity Report - {report?.periodStart} to {report?.periodEnd}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      navigate(`/supervisor/team-reports/${reportId}`);
                      onClose();
                    }}
                    className="text-white bg-white/20 hover:bg-white/30 focus:outline-none flex items-center gap-1 text-sm font-medium px-3 py-1.5 rounded-lg border border-white/30 transition-colors"
                  >
                    <HiExternalLink className="w-4 h-4" />
                    Full View
                  </button>
                  <button
                    onClick={onClose}
                    className="text-white/70 hover:text-white bg-black/10 hover:bg-black/20 rounded-full p-2 transition-colors"
                  >
                    <HiX className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6 overflow-y-auto bg-gray-50 flex-1">
              {loading ? (
                <div className="flex justify-center py-20"><Spinner size="lg" /></div>
              ) : !report ? (
                <div className="text-center py-10 text-gray-500">Failed to load report details.</div>
              ) : (
                <div className="space-y-6">
                  
                  <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm flex flex-wrap gap-x-12 gap-y-4">
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Worker</p>
                      <p className="font-medium text-gray-900">{report.generatedByName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Status</p>
                      <ReportStatusBadge status={report.status} />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Submitted</p>
                      <p className="font-medium text-gray-900">{report.createdAt ? new Date(report.createdAt).toLocaleString() : '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Report #</p>
                      <p className="font-medium text-gray-900">{report.id ? `RPT-${new Date(report.createdAt || Date.now()).getFullYear()}-${report.id.toString().padStart(4, '0')}` : '—'}</p>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                    <h4 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <HiOutlineDocumentText className="text-primary w-5 h-5" /> EXECUTIVE SUMMARY
                    </h4>
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-100 text-gray-700 whitespace-pre-wrap text-sm leading-relaxed mb-3">
                      {report.narrative || 'No narrative provided.'}
                    </div>
                    <p className={`text-sm flex items-center gap-1 ${wordCountOk ? 'text-green-600' : 'text-amber-600'}`}>
                      <HiOutlineDocumentText className="w-4 h-4" /> Word count: {wordCount} characters 
                      {wordCountOk ? (
                        <span className="flex items-center gap-1"><HiOutlineCheckCircle className="w-4 h-4" /> meets minimum 50</span>
                      ) : (
                        <span className="flex items-center gap-1"><HiOutlineExclamationCircle className="w-4 h-4" /> under 50 minimum</span>
                      )}
                    </p>
                  </div>

                  <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                    <h4 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <HiOutlineChartBar className="text-primary w-5 h-5" /> PERFORMANCE STATISTICS
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-center">
                        <p className="text-xs text-blue-600 font-semibold uppercase mb-1">Active Cases</p>
                        <p className="text-2xl font-bold text-blue-900">{summary.totalActiveCases || 0}</p>
                      </div>
                      <div className="bg-teal-50 border border-teal-100 rounded-lg p-3 text-center">
                        <p className="text-xs text-teal-600 font-semibold uppercase mb-1">New Cases</p>
                        <p className="text-2xl font-bold text-teal-900">{summary.newCasesInPeriod || 0}</p>
                      </div>
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
                        <p className="text-xs text-gray-600 font-semibold uppercase mb-1">Closed Cases</p>
                        <p className="text-2xl font-bold text-gray-900">{summary.closedCases || 0}</p>
                      </div>
                      <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3 text-center">
                        <p className="text-xs text-indigo-600 font-semibold uppercase mb-1">Interventions</p>
                        <p className="text-2xl font-bold text-indigo-900">{summary.interventionsCompleted || 0}</p>
                      </div>
                      <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3 text-center">
                        <p className="text-xs text-emerald-600 font-semibold uppercase mb-1">Success Rate</p>
                        <p className="text-2xl font-bold text-emerald-900">{summary.interventionsCompleted > 0 ? '100%' : '0%'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-base font-bold text-gray-900 flex items-center gap-2">
                        <HiOutlinePhotograph className="text-primary w-5 h-5" /> FIELD VISIT PHOTOS ({report.photoCount || (report.attachments ? report.attachments.filter(a => a.category === 'PHOTO').length : 0)})
                      </h4>
                      <p className="text-xs text-gray-500 italic">Click any photo to expand</p>
                    </div>
                    {report.attachments && report.attachments.filter(a => a.category === 'PHOTO').length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {report.attachments.filter(a => a.category === 'PHOTO').slice(0, 4).map((att, idx) => (
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

                  <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                     <h4 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <HiOutlineDocument className="text-primary w-5 h-5" /> ATTACHED DOCUMENTS ({report.attachments ? report.attachments.filter(a => a.category !== 'PHOTO').length : 0})
                     </h4>
                     {report.attachments && report.attachments.filter(a => a.category !== 'PHOTO').length > 0 ? (
                       <ul className="divide-y divide-gray-100 border border-gray-200 rounded-lg bg-gray-50">
                         {report.attachments.filter(a => a.category !== 'PHOTO').map((att, idx) => (
                           <li key={idx} className="flex items-center justify-between p-3 hover:bg-gray-100 transition-colors">
                             <div className="flex items-center gap-3">
                               <div className="w-8 h-8 rounded bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                                 <HiOutlineDownload className="w-4 h-4" />
                               </div>
                               <span className="text-sm font-medium text-gray-900 truncate">{att.documentName}</span>
                             </div>
                             <button type="button" onClick={() => att.documentId && documentApi.downloadFile(att.documentId, att.documentName)} className="text-xs font-semibold text-primary hover:text-primary-700 bg-white px-3 py-1.5 rounded-md shadow-sm border border-gray-200">
                               DOWNLOAD
                             </button>
                           </li>
                         ))}
                       </ul>
                     ) : (
                        <p className="text-sm text-gray-500 bg-gray-50 p-4 rounded-lg text-center border border-gray-100">No documents attached.</p>
                     )}
                  </div>

                  <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                    <h4 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <HiOutlineExclamationCircle className="text-amber-500 w-5 h-5" /> ISSUES & CHALLENGES REPORTED
                    </h4>
                    <div className="bg-amber-50 rounded-lg p-4 border border-amber-100 text-amber-900 text-sm">
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Transport: Used personal funds for motorcycle taxi (2,000 RWF)</li>
                        <li>Weather: Heavy rain delayed afternoon visits by 1 hour</li>
                      </ul>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl p-6 border-2 border-primary/20 shadow-md">
                    <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <HiOutlineCheckCircle className="text-primary w-5 h-5" /> SUPERVISOR ACTION
                    </h4>
                    
                    <div className="space-y-5">
                      <div>
                        <p className="text-sm font-semibold text-gray-700 mb-3">Decision:</p>
                        <div className="flex flex-col sm:flex-row gap-3">
                          <label className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${decision === 'APPROVE' ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-green-300'}`}>
                            <input type="radio" name="decision" className="w-4 h-4 text-green-600 focus:ring-green-500" checked={decision === 'APPROVE'} onChange={() => setDecision('APPROVE')} />
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-gray-900 flex items-center gap-1"><HiOutlineCheckCircle className="text-green-600" /> APPROVE</span>
                              <span className="text-xs text-gray-500">Include in team report</span>
                            </div>
                          </label>
                          <label className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${decision === 'REQUEST_CHANGES' ? 'border-amber-500 bg-amber-50' : 'border-gray-200 hover:border-amber-300'}`}>
                            <input type="radio" name="decision" className="w-4 h-4 text-amber-600 focus:ring-amber-500" checked={decision === 'REQUEST_CHANGES'} onChange={() => setDecision('REQUEST_CHANGES')} />
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-gray-900 flex items-center gap-1"><HiOutlineExclamationCircle className="text-amber-600" /> REQUEST CHANGES</span>
                              <span className="text-xs text-gray-500">Send back to worker</span>
                            </div>
                          </label>
                          <label className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${decision === 'REJECT' ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-red-300'}`}>
                            <input type="radio" name="decision" className="w-4 h-4 text-red-600 focus:ring-red-500" checked={decision === 'REJECT'} onChange={() => setDecision('REJECT')} />
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-gray-900 flex items-center gap-1"><HiOutlineXCircle className="text-red-600" /> REJECT</span>
                              <span className="text-xs text-gray-500">Do not include</span>
                            </div>
                          </label>
                        </div>
                      </div>

                      <div>
                        <p className="text-sm font-semibold text-gray-700 mb-2">Feedback to worker:</p>
                        <textarea
                          rows={3}
                          value={feedback}
                          onChange={(e) => setFeedback(e.target.value)}
                          placeholder="Good work this week. Please add more details about..."
                          className="w-full border-gray-300 rounded-lg shadow-sm focus:border-primary focus:ring-primary sm:text-sm resize-none"
                        />
                      </div>

                      <div className="pt-2 flex justify-end">
                        <Button
                          onClick={handleSubmitDecision}
                          disabled={!decision || submitting}
                          loading={submitting}
                          className="w-full sm:w-auto px-8"
                        >
                          SUBMIT DECISION
                        </Button>
                      </div>
                    </div>
                  </div>

                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {report && (
        <PhotoGalleryModal
          isOpen={galleryOpen}
          onClose={() => setGalleryOpen(false)}
          photos={report.attachments || []}
        />
      )}
    </>
  );
}
