import React, { useState } from 'react';
import { documentApi } from '../../api/documentApi';
import { HiUpload, HiX, HiPhotograph, HiDocumentText } from 'react-icons/hi';
import { toast } from 'react-toastify';

const ATTACHMENT_CATEGORIES = [
  { value: 'PHOTO', label: 'Field photo' },
  { value: 'HOME_VISIT', label: 'Home visit photo' },
  { value: 'MEDICAL_RESULT', label: 'Medical result' },
  { value: 'LAB_RESULT', label: 'Lab result' },
  { value: 'DOCUMENT', label: 'General document' },
  { value: 'CASE_DOCUMENT', label: 'Case document' },
  { value: 'LEGAL', label: 'Legal document' },
  { value: 'OTHER', label: 'Other' },
];

const API_BASE = process.env.REACT_APP_API_URL || '';

function previewUrl(documentId) {
  const base = API_BASE.replace(/\/$/, '');
  return `${base}/api/documents/download/${documentId}`;
}

export default function AttachmentUploader({ attachments, setAttachments }) {
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    setUploading(true);
    try {
      for (const file of files) {
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`File ${file.name} is too large. Max 10MB.`);
          continue;
        }

        const isImage = file.type.startsWith('image/');
        const response = await documentApi.upload(file);
        const doc = response.data?.data || response.data;

        if (doc && doc.id) {
          setAttachments((prev) => [
            ...prev,
            {
              documentId: doc.id,
              documentUrl: `/api/documents/download/${doc.id}`,
              documentName: doc.fileName,
              mimeType: doc.mimeType || file.type,
              caption: '',
              category: isImage ? 'PHOTO' : 'DOCUMENT',
              displayOrder: prev.length,
            },
          ]);
        }
      }
    } catch (err) {
      console.error('File upload error:', err);
      toast.error('Failed to upload some files');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const removeAttachment = (index) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const updateAttachment = (index, field, value) => {
    setAttachments((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const isImageAttachment = (att) => {
    if (att.mimeType?.startsWith('image/')) return true;
    const name = (att.documentName || '').toLowerCase();
    return /\.(jpg|jpeg|png|gif|webp)$/.test(name);
  };

  return (
    <div className="space-y-4">
      <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-teal-500 hover:bg-teal-50 transition-colors">
        <input
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          id="report-attachment-upload"
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
          disabled={uploading}
        />
        <label htmlFor="report-attachment-upload" className="cursor-pointer block">
          <HiUpload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
          <p className="text-sm font-medium text-gray-700">
            {uploading ? 'Uploading...' : 'Upload photos & documents'}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Photos, medical results, PDF, Word, Excel — max 10MB each
          </p>
        </label>
      </div>

      {attachments.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          {attachments.map((att, idx) => (
            <div
              key={`${att.documentId}-${idx}`}
              className="flex flex-col border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm"
            >
              {isImageAttachment(att) && (
                <div className="relative bg-gray-100 h-36 flex items-center justify-center overflow-hidden">
                  <img
                    src={previewUrl(att.documentId)}
                    alt={att.caption || att.documentName}
                    className="max-h-full max-w-full object-contain"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              )}
              <div className="flex items-center justify-between p-3 border-b border-gray-100 bg-gray-50">
                <div className="flex items-center gap-2 truncate min-w-0">
                  {isImageAttachment(att) ? (
                    <HiPhotograph className="text-teal-600 shrink-0" />
                  ) : (
                    <HiDocumentText className="text-blue-600 shrink-0" />
                  )}
                  <span className="text-sm font-medium text-gray-700 truncate">{att.documentName}</span>
                </div>
                <button
                  type="button"
                  onClick={() => removeAttachment(idx)}
                  className="text-gray-400 hover:text-red-500 shrink-0"
                  aria-label="Remove attachment"
                >
                  <HiX className="w-4 h-4" />
                </button>
              </div>
              <div className="p-3 space-y-2">
                <label className="block text-xs font-medium text-gray-500">Category</label>
                <select
                  value={att.category || 'DOCUMENT'}
                  onChange={(e) => updateAttachment(idx, 'category', e.target.value)}
                  className="w-full text-sm border border-gray-200 rounded px-2 py-1.5 focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                >
                  {ATTACHMENT_CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
                <label className="block text-xs font-medium text-gray-500">
                  Description / caption
                </label>
                <textarea
                  value={att.caption || ''}
                  onChange={(e) => updateAttachment(idx, 'caption', e.target.value)}
                  placeholder="Describe this photo or document (e.g. doctor result, home visit notes)..."
                  rows={2}
                  className="w-full text-sm border border-gray-200 rounded px-2 py-1.5 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 resize-none"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
