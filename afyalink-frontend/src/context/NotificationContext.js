import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { notificationApi } from '../api/notificationApi';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [recentNotifications, setRecentNotifications] = useState([]);
  const [loadingRecent, setLoadingRecent] = useState(false);

  const fetchCount = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await notificationApi.getUnreadCount();
      const raw = res?.data !== undefined ? res.data : res;
      const count = raw?.count ?? raw?.data?.count ?? (typeof raw === 'number' ? raw : 0);
      setUnreadCount(Number(count) || 0);
    } catch {
      setUnreadCount(0);
    }
  }, [isAuthenticated]);

  const fetchRecent = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoadingRecent(true);
    try {
      const res = await notificationApi.getAll({ page: 0, size: 20, sortBy: 'createdAt', direction: 'DESC' });
      const raw = res?.data !== undefined ? res.data : res;
      const list = Array.isArray(raw?.content) ? raw.content : (Array.isArray(raw) ? raw : []);
      setRecentNotifications(list);
    } catch {
      setRecentNotifications([]);
    } finally {
      setLoadingRecent(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchCount();
    fetchRecent();
    if (!isAuthenticated) return;
    const interval = setInterval(() => {
      fetchCount();
      fetchRecent();
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchCount, fetchRecent, isAuthenticated]);

  const markRead = useCallback(async (id) => {
    try {
      await notificationApi.markAsRead(id);
      setUnreadCount((c) => Math.max(0, c - 1));
      setRecentNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch { /* silent */ }
  }, []);

  const markAllRead = useCallback(async () => {
    try {
      await notificationApi.markAllAsRead();
      setUnreadCount(0);
      setRecentNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch { /* silent */ }
  }, []);

  const refresh = useCallback(() => {
    fetchCount();
    fetchRecent();
  }, [fetchCount, fetchRecent]);

  return (
    <NotificationContext.Provider value={{
      unreadCount,
      recentNotifications,
      loadingRecent,
      fetchCount,
      fetchRecent,
      markRead,
      markAllRead,
      refresh,
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
}
