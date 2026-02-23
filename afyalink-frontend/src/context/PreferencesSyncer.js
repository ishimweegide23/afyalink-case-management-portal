import { useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { useTheme } from './ThemeContext';
import { useLanguage } from './LanguageContext';
import { userApi } from '../api/userApi';

/**
 * Syncs user preferences (theme, language) from backend to contexts when user is authenticated.
 * Runs once on mount and when token changes so saved preferences apply across sessions/devices.
 */
export function PreferencesSyncer() {
  const { token, user } = useAuth();
  const { setTheme } = useTheme();
  const { setLanguage } = useLanguage();
  const syncedRef = useRef(false);

  useEffect(() => {
    if (!token || !user?.id) {
      syncedRef.current = false;
      return;
    }
    if (syncedRef.current) return;
    syncedRef.current = true;
    userApi
      .getPreferences()
      .then((res) => {
        const data = res?.data ?? res;
        if (!data) return;
        const th = data.theme || 'light';
        const lang = data.language === 'fr' ? 'fr' : 'en';
        setTheme(th);
        setLanguage(lang);
      })
      .catch(() => {})
      .finally(() => {
        syncedRef.current = false;
      });
    // Only run when user logs in; omit setTheme/setLanguage to avoid re-running on every
    // context update (which would overwrite user's in-session language/theme changes)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, user?.id]);

  return null;
}
