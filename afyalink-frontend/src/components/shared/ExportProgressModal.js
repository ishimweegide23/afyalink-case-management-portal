import React from 'react';
import { HiOutlineDocumentText, HiOutlineTable, HiOutlineDocumentDownload } from 'react-icons/hi';
import Modal from '../common/Modal';

const ExportProgressModal = ({ isOpen, format, progress, error, reportTitle, onClose }) => {
  const getFormatDetails = () => {
    switch (format) {
      case 'pdf':
        return {
          icon: <HiOutlineDocumentText className="w-12 h-12 text-primary" />,
          title: 'Generating PDF Report',
          description: 'Creating professional report with charts and images...'
        };
      case 'excel':
        return {
          icon: <HiOutlineTable className="w-12 h-12 text-green-600" />,
          title: 'Generating Excel Export',
          description: 'Creating multi-sheet spreadsheet with all data...'
        };
      case 'word':
        return {
          icon: <HiOutlineDocumentDownload className="w-12 h-12 text-blue-600" />,
          title: 'Generating Word Document',
          description: 'Creating editable document with embedded images...'
        };
      default:
        return {
          icon: <HiOutlineDocumentText className="w-12 h-12 text-primary" />,
          title: 'Generating Report',
          description: 'Please wait while we prepare your export...'
        };
    }
  };

  const details = getFormatDetails();

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm" closeOnOutsideClick={false}>
      <div className="text-center py-6">
        {/* Animated Icon */}
        <div className="mb-4 relative">
          <div className="animate-pulse flex justify-center">
            {details.icon}
          </div>
          {!error && progress < 100 && (
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-gray-900 mb-2 mt-4">
          {error ? 'Export Failed' : details.title}
        </h3>
        
        {/* Description */}
        <p className="text-sm text-gray-500 mb-4">
          {error || details.description}
        </p>

        {/* Progress Bar */}
        {!error && (
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4 overflow-hidden relative">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        {/* Progress Text */}
        {!error && progress < 100 && (
          <p className="text-xs text-gray-400">
            {progress}% complete...
          </p>
        )}

        {/* Success Check */}
        {!error && progress === 100 && (
          <div className="flex items-center justify-center gap-2 text-green-600 mb-4">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-sm font-medium">Download started!</span>
          </div>
        )}

        {/* Report Info */}
        {reportTitle && (
          <p className="text-xs text-gray-400 mt-2 truncate">
            Exporting: {reportTitle}
          </p>
        )}

        {/* Close Button on Error or Success */}
        {(error || progress === 100) && (
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
          >
            Close
          </button>
        )}
      </div>
    </Modal>
  );
};

export default ExportProgressModal;
