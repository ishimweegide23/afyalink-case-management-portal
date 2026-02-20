import React, { useState, useEffect } from 'react';
import { getInitials } from '../../utils/helpers';
import { API_BASE_URL } from '../../utils/constants';
import { TOKEN_KEY } from '../../utils/constants';

const sizeMap = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-lg',
};

// Consistent color palette based on name hash
const COLORS = [
  ['#0D9488', '#0F766E'], // teal
  ['#3B82F6', '#2563EB'], // blue
  ['#8B5CF6', '#7C3AED'], // violet
  ['#EC4899', '#DB2777'], // pink
  ['#F97316', '#EA580C'], // orange
  ['#10B981', '#059669'], // emerald
  ['#6366F1', '#4F46E5'], // indigo
  ['#EF4444', '#DC2626'], // red
];

function getColorPair(name) {
  if (!name) return COLORS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return COLORS[Math.abs(hash) % COLORS.length];
}

function resolveFullSrc(src) {
  if (!src) return null;
  if (src.startsWith('http')) return src;
  // Backend relative URL — prepend API base
  return `${API_BASE_URL}${src.startsWith('/') ? '' : '/'}${src}`;
}

export default function Avatar({ src, name, className = '', size = 'md' }) {
  const [imgSrc, setImgSrc] = useState(null);
  const [imgError, setImgError] = useState(false);
  const sizeClass = sizeMap[size] || sizeMap.md;
  const [bg1, bg2] = getColorPair(name);

  useEffect(() => {
    setImgError(false);
    const fullSrc = resolveFullSrc(src);
    if (!fullSrc) { setImgSrc(null); return; }

    // If the URL is a backend profile-picture endpoint, fetch with auth token
    if (fullSrc.includes('/api/users/') && fullSrc.includes('/profile-picture')) {
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) { setImgSrc(null); return; }
      fetch(fullSrc, { headers: { Authorization: `Bearer ${token}` } })
        .then((res) => {
          if (!res.ok) throw new Error('not found');
          return res.blob();
        })
        .then((blob) => setImgSrc(URL.createObjectURL(blob)))
        .catch(() => setImgSrc(null));
    } else {
      setImgSrc(fullSrc);
    }
  }, [src]);

  const showInitials = !imgSrc || imgError;

  return (
    <div
      className={`flex-shrink-0 rounded-full overflow-hidden font-semibold flex items-center justify-center ${sizeClass} ${className}`}
      style={showInitials ? { background: `linear-gradient(135deg, ${bg1}, ${bg2})`, color: '#fff' } : {}}
    >
      {!showInitials ? (
        <img
          src={imgSrc}
          alt={name || 'Avatar'}
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <span className="select-none">{getInitials(name)}</span>
      )}
    </div>
  );
}
