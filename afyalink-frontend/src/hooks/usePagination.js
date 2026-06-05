// Cleaned up unused imports and console logs
import { useState, useCallback } from 'react';
import { PAGE_SIZE } from '../utils/constants';

export function usePagination(initialSize = PAGE_SIZE) {
  const [page, setPage] = useState(0);
  const [size] = useState(initialSize);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const goToPage = useCallback((p) => setPage(p), []);
  const nextPage = useCallback(() => setPage((p) => Math.min(p + 1, totalPages - 1)), [totalPages]);
  const prevPage = useCallback(() => setPage((p) => Math.max(p - 1, 0)), []);
  const resetPage = useCallback(() => setPage(0), []);

  const updateFromResponse = useCallback((pageData) => {
    if (pageData) {
      setTotalPages(pageData.totalPages || 0);
      setTotalElements(pageData.totalElements || 0);
    }
  }, []);

  return {
    page,
    size,
    totalPages,
    totalElements,
    goToPage,
    nextPage,
    prevPage,
    resetPage,
    updateFromResponse,
  };
}
