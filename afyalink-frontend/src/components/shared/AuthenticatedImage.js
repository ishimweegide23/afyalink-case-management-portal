import React, { useEffect, useState } from 'react';
import { documentApi } from '../../api/documentApi';
import { attachmentPreviewUrl } from '../../utils/mediaUrl';

/**
 * Loads report/document images with JWT (blob fetch). Falls back to tokenized URL.
 */
export default function AuthenticatedImage({ documentId, attachment, alt, className, style, onClick, onError }) {
  const [src, setSrc] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let objectUrl;
    setFailed(false);
    setSrc(null);

    const load = async () => {
      const id = documentId ?? attachment?.documentId;
      if (!id) {
        setFailed(true);
        return;
      }
      try {
        const blob = await documentApi.downloadBlob(id);
        objectUrl = URL.createObjectURL(blob);
        setSrc(objectUrl);
      } catch {
        setSrc(attachmentPreviewUrl(attachment || { documentId: id }));
      }
    };

    load();
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [documentId, attachment?.documentId]);

  if (failed && !src) {
    return (
      <div
        className={className}
        style={{ ...style, background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF', fontSize: 11 }}
        onClick={onClick}
      >
        No preview
      </div>
    );
  }

  if (!src) {
    return <div className={className} style={{ ...style, background: '#F3F4F6', minHeight: 40 }} onClick={onClick} />;
  }

  return (
    <img
      src={src}
      alt={alt || 'Attachment'}
      className={className}
      style={style}
      onClick={onClick}
      onError={(e) => {
        setFailed(true);
        onError?.(e);
      }}
    />
  );
}
