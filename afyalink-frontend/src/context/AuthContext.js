import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { storageService } from '../services/storageService';
import { authApi } from '../api/authApi';
import { userApi } from '../api/userApi';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => storageService.getUser());
  const [token, setToken] = useState(() => storageService.getToken());
  const [loading, setLoading] = useState(false);

  const refreshUser = useCallback(async () => {
    if (!token) return null;
    try {
      const res = await userApi.getMe();
      const u = res?.data ?? res;
      if (u) {
        const userData = {
          id: u.id,
          fullName: u.fullName,
          email: u.email,
          role: u.role,
          phoneNumber: u.phoneNumber,
          profile: u.profile,
        };
        storageService.setUser(userData);
        setUser(userData);
        return userData;
      }
    } catch {
      // ignore
    }
    return null;
  }, [token]);

  useEffect(() => {
    if (token && user?.id) {
      refreshUser();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    try {
      const res = await authApi.login(email, password);
      const data = res?.data?.data || res?.data || res;
      
      if (data.requiresTwoFactor) {
        return { requiresTwoFactor: true, userId: data.userId, email: data.email };
      }
      
      const userData = {
        id: data.userId,
        fullName: data.fullName ?? data.name,
        email: data.email,
        role: data.role,
      };
      storageService.setToken(data.token);
      storageService.setUser(userData);
      setToken(data.token);
      setUser(userData);
      return userData;
    } finally {
      setLoading(false);
    }
  }, []);

  const loginWithToken = useCallback((data) => {
    const userData = {
      id: data.userId,
      fullName: data.fullName ?? data.name,
      email: data.email,
      role: data.role,
    };
    storageService.setToken(data.token);
    storageService.setUser(userData);
    setToken(data.token);
    setUser(userData);
    return userData;
  }, []);

  const register = useCallback(async (data) => {
    setLoading(true);
    try {
      const res = await authApi.register(data);
      const resData = res?.data ?? res;
      const userData = {
        id: resData.userId,
        fullName: resData.fullName ?? resData.name,
        email: resData.email,
        role: resData.role,
      };
      storageService.setToken(resData.token);
      storageService.setUser(userData);
      setToken(resData.token);
      setUser(userData);
      return userData;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    storageService.clearAuth();
    setToken(null);
    setUser(null);
  }, []);

  const updateUser = useCallback((updates) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...updates };
      storageService.setUser(next);
      return next;
    });
  }, []);

  useEffect(() => {
    if (!token) setUser(null);
  }, [token]);

  const value = {
    user,
    token,
    loading,
    login,
    loginWithToken,
    register,
    logout,
    updateUser,
    refreshUser,
    isAuthenticated: !!token && !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
