import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext(null);

const translations = {
  en: {
    settings: 'Settings',
    profile: 'Profile',
    security: 'Security',
    notifications: 'Notifications',
    preferences: 'Preferences',
    saveChanges: 'Save Changes',
    cancel: 'Cancel',
    changePhoto: 'Change Photo',
    fullName: 'Full Name',
    emailAddress: 'Email Address',
    phoneNumber: 'Phone Number',
    department: 'Department',
    jobTitle: 'Job Title',
    role: 'Role',
    bio: 'Bio',
    currentPassword: 'Current Password',
    newPassword: 'New Password',
    confirmPassword: 'Confirm New Password',
    updatePassword: 'Update Password',
    caseUpdates: 'Case Updates',
    caseAssignments: 'New Case Assignments',
    interventionReminders: 'Intervention Reminders',
    taskDeadlines: 'Task Deadlines',
    weeklySummary: 'Weekly Summary',
    language: 'Language',
    theme: 'Theme',
    light: 'Light',
    dark: 'Dark',
    system: 'System',
    english: 'English',
    french: 'French',
    savePreferences: 'Save Preferences',
    profileUpdated: 'Profile updated successfully',
    passwordChanged: 'Password changed successfully',
    preferencesSaved: 'Preferences saved successfully',
    notificationPrefsSaved: 'Notification preferences saved',
    organization: 'Organization',
    securityPolicies: 'Security Policies',
    emailConfig: 'Email Config',
    dataBackup: 'Data & Backup',
    integrations: 'Integrations',
    teamSettings: 'Team Settings',
    systemPreferences: 'System Preferences',
    languageRegion: 'Language & Region',
    appearance: 'Appearance',
    compactMode: 'Compact Mode',
    animations: 'Animations',
  },
  fr: {
    settings: 'Paramètres',
    profile: 'Profil',
    security: 'Sécurité',
    notifications: 'Notifications',
    preferences: 'Préférences',
    saveChanges: 'Enregistrer',
    cancel: 'Annuler',
    changePhoto: 'Changer la photo',
    fullName: 'Nom complet',
    emailAddress: 'Adresse e-mail',
    phoneNumber: 'Numéro de téléphone',
    department: 'Département',
    jobTitle: 'Titre du poste',
    role: 'Rôle',
    bio: 'Biographie',
    currentPassword: 'Mot de passe actuel',
    newPassword: 'Nouveau mot de passe',
    confirmPassword: 'Confirmer le mot de passe',
    updatePassword: 'Mettre à jour le mot de passe',
    caseUpdates: 'Mises à jour des dossiers',
    caseAssignments: 'Nouvelle attribution de dossiers',
    interventionReminders: 'Rappels d\'interventions',
    taskDeadlines: 'Échéances des tâches',
    weeklySummary: 'Résumé hebdomadaire',
    language: 'Langue',
    theme: 'Thème',
    light: 'Clair',
    dark: 'Sombre',
    system: 'Système',
    english: 'Anglais',
    french: 'Français',
    savePreferences: 'Enregistrer les préférences',
    profileUpdated: 'Profil mis à jour avec succès',
    passwordChanged: 'Mot de passe modifié avec succès',
    preferencesSaved: 'Préférences enregistrées avec succès',
    notificationPrefsSaved: 'Préférences de notification enregistrées',
    organization: 'Organisation',
    securityPolicies: 'Politiques de sécurité',
    emailConfig: 'Configuration e-mail',
    dataBackup: 'Données et sauvegarde',
    integrations: 'Intégrations',
    teamSettings: 'Paramètres d\'équipe',
    systemPreferences: 'Préférences système',
    languageRegion: 'Langue et région',
    appearance: 'Apparence',
    compactMode: 'Mode compact',
    animations: 'Animations',
  },
};

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => localStorage.getItem('afyalink_language') || 'en');

  useEffect(() => {
    localStorage.setItem('afyalink_language', language);
  }, [language]);

  const setLanguage = (lang) => setLanguageState(lang === 'fr' ? 'fr' : 'en');
  const t = (key) => translations[language]?.[key] ?? translations.en[key] ?? key;

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
