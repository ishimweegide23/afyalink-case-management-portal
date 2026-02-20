import { useEffect, useRef, useState } from 'react';
import { API_BASE_URL, TOKEN_KEY } from '../../utils/constants';
import { getInitials } from '../../utils/helpers';

const sizeMap = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-14 h-14 text-lg',
  '2xl': 'w-20 h-20 text-xl',
};

export default function BeneficiaryAvatar({ beneficiary, className = '', size = 'md' }) {
  const [imageUrl, setImageUrl] = useState(null);
  const blobUrlRef = useRef(null);
  const sizeClass = sizeMap[size] || sizeMap.md;

  useEffect(() => {
    if (!beneficiary?.profilePictureUrl || !beneficiary?.id) {
      setImageUrl(null);
      return;
    }
    const token = localStorage.getItem(TOKEN_KEY);
    const url = `${API_BASE_URL}${beneficiary.profilePictureUrl}`;
    const controller = new AbortController();
    fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      signal: controller.signal,
    })
      .then((res) => (res.ok ? res.blob() : null))
      .then((blob) => {
        if (blob) {
          if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
          blobUrlRef.current = URL.createObjectURL(blob);
          setImageUrl(blobUrlRef.current);
        }
      })
      .catch(() => setImageUrl(null));
    return () => {
      controller.abort();
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
      setImageUrl(null);
    };
  }, [beneficiary?.id, beneficiary?.profilePictureUrl]);

  return (
    <div
      className={`flex-shrink-0 rounded-full overflow-hidden bg-primary/10 text-primary font-semibold flex items-center justify-center ${sizeClass} ${className}`}
    >
      {imageUrl ? (
        <img src={imageUrl} alt={beneficiary?.fullName || 'Beneficiary'} className="w-full h-full object-cover" />
      ) : (
        <span>{getInitials(beneficiary?.fullName)}</span>
      )}
    </div>
  );
}
