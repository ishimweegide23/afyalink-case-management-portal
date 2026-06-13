// UI alignment and styling tweaks applied here
import React, { useState, useEffect } from 'react';
import { HiX, HiDownload } from 'react-icons/hi';
import { documentApi } from '../../api/documentApi';
import AuthenticatedImage from './AuthenticatedImage';

const PhotoGalleryModal = ({ isOpen, onClose, photos = [], initialIndex = null, title }) => {
  const [selectedIndex, setSelectedIndex] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedIndex(
        initialIndex != null && initialIndex >= 0 && initialIndex < photos.length ? initialIndex : null
      );
    }
  }, [isOpen, initialIndex, photos.length]);

  if (!isOpen) return null;

  const selectedPhoto = selectedIndex != null && photos[selectedIndex] ? photos[selectedIndex] : null;

  const handleDownload = (photo) => {
    if (!photo?.documentId) return;
    documentApi.downloadFile(photo.documentId, photo.documentName || photo.caption || 'download');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-900 bg-opacity-75" onClick={onClose} />

        <div className="relative inline-block w-full max-w-4xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
          <div className="flex justify-between items-center mb-5">
            <h3 className="text-xl font-bold leading-6 text-gray-900">
              {selectedPhoto ? 'Photo Preview' : (title || 'Field Visit Photo Gallery')}
            </h3>
            <button
              onClick={() => (selectedPhoto ? setSelectedIndex(null) : onClose())}
              className="text-gray-400 hover:text-gray-500 focus:outline-none"
              type="button"
            >
              <HiX className="w-6 h-6" />
            </button>
          </div>

          {selectedPhoto ? (
            <div className="flex flex-col items-center">
              <AuthenticatedImage
                documentId={selectedPhoto.documentId}
                attachment={selectedPhoto}
                alt={selectedPhoto.caption || 'Preview'}
                className="max-h-[60vh] object-contain rounded-lg shadow-md border border-gray-200"
              />
              <p className="mt-4 text-gray-700 italic text-center text-lg">{selectedPhoto.caption || 'No caption provided'}</p>

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedIndex(null)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-medium rounded-md transition-colors"
                >
                  Back to Gallery
                </button>
                {selectedPhoto.documentId && (
                  <button
                    type="button"
                    onClick={() => handleDownload(selectedPhoto)}
                    className="inline-flex items-center px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded-md shadow-sm transition-colors"
                  >
                    <HiDownload className="w-4 h-4 mr-2" />
                    Download
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-[65vh] overflow-y-auto p-1">
              {photos.length === 0 ? (
                <div className="col-span-full py-12 text-center text-gray-500">
                  No photos attached to this report.
                </div>
              ) : (
                photos.map((photo, idx) => (
                  <div
                    key={photo.id || idx}
                    className="relative group cursor-pointer overflow-hidden rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 aspect-square bg-gray-100"
                    onClick={() => setSelectedIndex(idx)}
                  >
                    <AuthenticatedImage
                      documentId={photo.documentId}
                      attachment={photo}
                      alt={photo.caption || `Photo ${idx + 1}`}
                      className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-end p-3">
                      <p className="text-white text-xs truncate font-medium">
                        {photo.caption || 'View photo'}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PhotoGalleryModal;
