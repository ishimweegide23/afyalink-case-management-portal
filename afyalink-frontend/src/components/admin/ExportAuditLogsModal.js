import React, { useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { auditLogApi } from '../../api/auditLogApi';
import { HiOutlineDownload, HiOutlineDocumentText, HiOutlineTable, HiOutlineCode } from 'react-icons/hi';
import { toast } from 'react-toastify';

export default function ExportAuditLogsModal({ isOpen, onClose, keyword, filters }) {
  const [exporting, setExporting] = useState(false);
  const [format, setFormat] = useState('excel');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  const handleExport = async () => {
    setExporting(true);
    try {
      const params = {
        format,
        keyword: keyword || undefined,
        action: filters?.action || undefined,
        entityType: filters?.entityType || undefined,
        userId: filters?.userId || undefined,
        startDate: dateRange.start || filters?.startDate || undefined,
        endDate: dateRange.end || filters?.endDate || undefined,
      };
      
      // axiosInstance interceptor returns response.data directly, which IS the Blob for blob responseType
      const blob = await auditLogApi.export(params);
      const url = window.URL.createObjectURL(blob instanceof Blob ? blob : new Blob([blob]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit_logs_${new Date().toISOString().split('T')[0]}.${format === 'pdf' ? 'pdf' : format === 'csv' ? 'csv' : 'xlsx'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success('Export completed successfully');
      onClose();
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const formats = [
    { value: 'excel', label: 'Excel (.xlsx)', icon: HiOutlineTable, color: '#10B981' },
    { value: 'csv', label: 'CSV (.csv)', icon: HiOutlineCode, color: '#F59E0B' },
    { value: 'pdf', label: 'PDF (.pdf)', icon: HiOutlineDocumentText, color: '#EF4444' },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Export Audit Logs" size="md">
      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Export Format</label>
          <div className="grid grid-cols-3 gap-3">
            {formats.map((f) => {
              const Icon = f.icon;
              const isSelected = format === f.value;
              return (
                <button
                  key={f.value}
                  onClick={() => setFormat(f.value)}
                  className={`p-3 rounded-xl border-2 text-center transition-all ${
                    isSelected
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Icon className={`w-6 h-6 mx-auto mb-1 ${isSelected ? 'text-primary' : 'text-gray-400'}`} />
                  <p className={`text-xs font-medium ${isSelected ? 'text-primary' : 'text-gray-600'}`}>
                    {f.label}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date (Optional)</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date (Optional)</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
            />
          </div>
        </div>

        <div className="bg-gray-50 rounded-xl p-3 text-sm text-gray-500">
          <p className="font-medium mb-1">Export will include:</p>
          <ul className="text-xs space-y-1 list-disc list-inside">
            <li>All audit logs matching current filters</li>
            <li>Timestamps, user details, IP addresses</li>
            <li>Before/after values for changes</li>
            <li>Action types and entity information</li>
          </ul>
        </div>

        <div className="flex gap-3 pt-2">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleExport} loading={exporting} className="flex-1 bg-primary text-white">
            <HiOutlineDownload className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>
    </Modal>
  );
}
