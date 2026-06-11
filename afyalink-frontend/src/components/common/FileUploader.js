// Fix linting warnings and format code
import React, { useRef, useState } from 'react';
import { HiUpload, HiX } from 'react-icons/hi';
import { formatFileSize } from '../../utils/formatFileSize';

export default function FileUploader({ onFileSelect, accept, maxSize = 10 * 1024 * 1024, label = 'Upload File' }) {
  const inputRef = useRef();
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    if (selected.size > maxSize) {
      setError(`File too large. Maximum size: ${formatFileSize(maxSize)}`);
      return;
    }
    setError('');
    setFile(selected);
    onFileSelect?.(selected);
  };

  const removeFile = () => {
    setFile(null);
    setError('');
    if (inputRef.current) inputRef.current.value = '';
    onFileSelect?.(null);
  };

  return (
    <div className="mb-4">
      {label && <p className="block text-sm font-medium text-gray-700 mb-1">{label}</p>}
      {!file ? (
        <div
          onClick={() => inputRef.current?.click()}
          className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer
            hover:border-primary hover:bg-primary-50/20 transition-colors"
        >
          <HiUpload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500">Click to upload or drag & drop</p>
          <p className="text-xs text-gray-400 mt-1">Max size: {formatFileSize(maxSize)}</p>
        </div>
      ) : (
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-700 truncate">{file.name}</p>
            <p className="text-xs text-gray-400">{formatFileSize(file.size)}</p>
          </div>
          <button onClick={removeFile} className="p-1 hover:bg-gray-200 rounded">
            <HiX className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      )}
      <input ref={inputRef} type="file" accept={accept} onChange={handleChange} className="hidden" />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
