import { useState, useCallback } from 'react';

export function useSearch() {
  const [keyword, setKeyword] = useState('');
  const [debouncedKeyword, setDebouncedKeyword] = useState('');
  const [timer, setTimer] = useState(null);

  const handleSearch = useCallback((value) => {
    setKeyword(value);
    if (timer) clearTimeout(timer);
    const t = setTimeout(() => setDebouncedKeyword(value), 400);
    setTimer(t);
  }, [timer]);

  const clearSearch = useCallback(() => {
    setKeyword('');
    setDebouncedKeyword('');
  }, []);

  return { keyword, debouncedKeyword, handleSearch, clearSearch };
}
