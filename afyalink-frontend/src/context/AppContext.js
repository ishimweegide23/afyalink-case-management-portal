import React from 'react';
import { ThemeProvider } from './ThemeContext';
import { LanguageProvider } from './LanguageContext';
import { AuthProvider } from './AuthContext';
import { SidebarProvider } from './SidebarContext';
import { NotificationProvider } from './NotificationContext';
import { PreferencesSyncer } from './PreferencesSyncer';

export function AppProviders({ children }) {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <PreferencesSyncer />
          <SidebarProvider>
            <NotificationProvider>
              {children}
            </NotificationProvider>
          </SidebarProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
