import React, { useState } from 'react';
import { 
  HiOutlineDocumentDownload, 
  HiOutlineDocumentText, 
  HiOutlineTable
} from 'react-icons/hi';
import { useExport } from '../../hooks/useExport';
import ExportProgressModal from './ExportProgressModal';

const ExportButtons = ({ 
  reportId, 
  reportTitle, 
  reportType,
  periodStart,
  variant = 'default',
  size = 'sm',
  onSuccess,
  onError 
}) => {
  const [showProgress, setShowProgress] = useState(false);
  const [activeFormat, setActiveFormat] = useState(null);
  
  const { exportReport, loading, progress, error } = useExport();

  const handleExport = async (format) => {
    setActiveFormat(format);
    setShowProgress(true);
    
    const result = await exportReport(reportId, format, {
      reportType,
      periodStart,
    });
    
    if (result.success) {
      onSuccess?.(format);
    } else {
      onError?.(format, result.error);
    }
    
    setTimeout(() => {
      setShowProgress(false);
      setActiveFormat(null);
    }, 1500);
  };

  const getButtonStyles = () => {
    switch (variant) {
      case 'light':
        return 'text-white/80 hover:text-white hover:bg-white/20';
      case 'outline':
        return 'border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-primary bg-white';
      case 'default':
      default:
        return 'text-gray-500 hover:text-primary hover:bg-gray-100 border border-transparent';
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'lg':
        return 'px-4 py-2 gap-2 shadow-sm';
      case 'sm':
      default:
        return 'p-1.5 gap-1';
    }
  };

  const getFormatIcon = (format) => {
    switch (format) {
      case 'pdf': return <HiOutlineDocumentText className={size === 'lg' ? "w-5 h-5 text-red-500" : "w-4 h-4 text-red-500"} />;
      case 'excel': return <HiOutlineTable className={size === 'lg' ? "w-5 h-5 text-green-600" : "w-4 h-4 text-green-600"} />;
      case 'word': return <HiOutlineDocumentDownload className={size === 'lg' ? "w-5 h-5 text-blue-600" : "w-4 h-4 text-blue-600"} />;
      default: return <HiOutlineDocumentDownload className="w-4 h-4" />;
    }
  };

  return (
    <>
      <div className="flex items-center gap-1">
        {/* PDF Export */}
        <button
          onClick={() => handleExport('pdf')}
          disabled={loading === 'pdf'}
          className={`
            rounded-lg transition-all duration-200
            flex items-center justify-center font-medium
            ${getButtonStyles()}
            ${getSizeStyles()}
            ${loading === 'pdf' ? 'opacity-50 cursor-wait' : 'cursor-pointer'}
          `}
          title="Export as PDF (Professional report with photos)"
        >
          {loading === 'pdf' ? (
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            getFormatIcon('pdf')
          )}
          {size === 'lg' && <span>PDF</span>}
        </button>

        {/* Excel Export */}
        <button
          onClick={() => handleExport('excel')}
          disabled={loading === 'excel'}
          className={`
            rounded-lg transition-all duration-200
            flex items-center justify-center font-medium
            ${getButtonStyles()}
            ${getSizeStyles()}
            ${loading === 'excel' ? 'opacity-50 cursor-wait' : 'cursor-pointer'}
          `}
          title="Export as Excel (Multi-sheet data)"
        >
          {loading === 'excel' ? (
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            getFormatIcon('excel')
          )}
          {size === 'lg' && <span>Excel</span>}
        </button>

        {/* Word Export */}
        <button
          onClick={() => handleExport('word')}
          disabled={loading === 'word'}
          className={`
            rounded-lg transition-all duration-200
            flex items-center justify-center font-medium
            ${getButtonStyles()}
            ${getSizeStyles()}
            ${loading === 'word' ? 'opacity-50 cursor-wait' : 'cursor-pointer'}
          `}
          title="Export as Word (Editable document with images)"
        >
          {loading === 'word' ? (
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            getFormatIcon('word')
          )}
          {size === 'lg' && <span>Word</span>}
        </button>
      </div>

      {/* Export Progress Modal */}
      {showProgress && (
          <ExportProgressModal
            isOpen={showProgress}
            format={activeFormat}
            progress={progress}
            error={error}
            reportTitle={reportTitle}
            onClose={() => setShowProgress(false)}
          />
      )}
    </>
  );
};

export default ExportButtons;
