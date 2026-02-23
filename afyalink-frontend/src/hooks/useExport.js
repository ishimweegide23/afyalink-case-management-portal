import { useState } from 'react';
import { reportsApi } from '../api/reportsApi';
import { toast } from 'react-toastify';
import React from 'react';

export const useExport = () => {
  const [loading, setLoading] = useState(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);

  const exportReport = async (reportId, format, meta = {}) => {
    setLoading(format);
    setProgress(0);
    setError(null);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 200);

    try {
      let blob;
      let filename;
      let contentType;

      const typeSlug = (meta.reportType || 'report').toLowerCase().replace(/\s+/g, '_');
      const periodSlug = meta.periodStart ? String(meta.periodStart).slice(0, 10) : String(reportId);

      switch (format) {
        case 'pdf':
          blob = await reportsApi.exportPdf(reportId);
          filename = `AfyaLink_${typeSlug}_${periodSlug}_${reportId}.pdf`;
          contentType = 'application/pdf';
          break;
        case 'excel':
          blob = await reportsApi.exportExcel(reportId);
          filename = `AfyaLink_${typeSlug}_${periodSlug}_${reportId}.xlsx`;
          contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
          break;
        case 'word':
          blob = await reportsApi.exportWord(reportId);
          filename = `AfyaLink_${typeSlug}_${periodSlug}_${reportId}.docx`;
          contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
          break;
        default:
          throw new Error(`Unsupported format: ${format}`);
      }

      // Handle axios returning { data: Blob } vs just Blob
      const blobData = blob?.data ?? blob;
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([blobData]));
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      setProgress(100);
      
      // Show success toast
      toast.success(
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-gray-900">Export Complete!</p>
            <p className="text-xs text-gray-500">{format.toUpperCase()} file downloaded successfully</p>
          </div>
        </div>,
        { autoClose: 3000, icon: false }
      );

      clearInterval(progressInterval);
      return { success: true };
      
    } catch (err) {
      console.error('Export failed:', err);
      setError(err.message || 'Export failed. Please try again.');
      
      toast.error(
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-gray-900">Export Failed</p>
            <p className="text-xs text-gray-500">{err.message || 'Please try again'}</p>
          </div>
        </div>,
        { autoClose: 5000, icon: false }
      );
      
      clearInterval(progressInterval);
      return { success: false, error: err.message };
      
    } finally {
      setTimeout(() => {
        setLoading(null);
        setProgress(0);
      }, 500);
    }
  };

  return { exportReport, loading, progress, error };
};
