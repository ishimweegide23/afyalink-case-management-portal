import { API_BASE_URL, TOKEN_KEY } from './constants';

function withAccessToken(url) {
  if (!url) return url;
  try {
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;
    if (!token) return url;
    const sep = url.includes('?') ? '&' : '?';
    return `${url}${sep}access_token=${encodeURIComponent(token)}`;
  } catch {
    return url;
  }
}

/**
 * Resolve document/attachment URLs from API paths, bare filenames, or legacy local paths.
 */
export function resolveDocumentUrl(urlOrPath, documentId) {
  if (documentId != null) {
    const base = API_BASE_URL.replace(/\/$/, '');
    return withAccessToken(`${base}/api/documents/download/${documentId}`);
  }
  if (!urlOrPath || typeof urlOrPath !== 'string') return '';

  const trimmed = urlOrPath.trim();
  if (!trimmed) return '';

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  if (trimmed.startsWith('/api/')) {
    const base = API_BASE_URL.replace(/\/$/, '');
    return withAccessToken(`${base}${trimmed}`);
  }

  // Legacy stored paths: uploads/uuid.jpg or D:\...\uploads\file.jpg
  const filename = trimmed.replace(/^.*[\\/]/, '');
  if (filename && /\.(jpe?g|png|gif|webp|pdf|docx?|xlsx?)$/i.test(filename)) {
    const base = API_BASE_URL.replace(/\/$/, '');
    return `${base}/api/messages/files/${encodeURIComponent(filename)}`;
  }

  return trimmed;
}

export function attachmentPreviewUrl(attachment) {
  if (!attachment) return '';
  return resolveDocumentUrl(
    attachment.documentUrl || attachment.url,
    attachment.documentId
  );
}
