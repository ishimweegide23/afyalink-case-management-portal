import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { toast } from 'react-toastify';
import { authApi } from '../../api/authApi';
import { userApi } from '../../api/userApi';
import { systemSettingApi } from '../../api/systemSettingApi';
import { USER_ROLES } from '../../utils/constants';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import UserAvatar from '../../components/shared/UserAvatar';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Badge from '../../components/common/Badge';
import Card, { CardHeader, CardBody } from '../../components/common/Card';
import RoleBadge from '../../components/shared/RoleBadge';
import PageHeader from '../../components/layout/PageHeader';
import {
  HiOutlineUser,
  HiOutlineLockClosed,
  HiOutlineBell,
  HiOutlineGlobe,
  HiOutlineShieldCheck,
  HiOutlineMail,
  HiOutlineDatabase,
  HiOutlineLink,
  HiOutlineCamera,
  HiOutlineCheck,
  HiOutlineEye,
  HiOutlineEyeOff,
  HiOutlineExclamation,
  HiOutlineInformationCircle,
  HiOutlineOfficeBuilding,
  HiOutlineSave,
  HiOutlineUsers,
  HiOutlineChevronRight,
  HiOutlineColorSwatch,
  HiOutlineDocumentText,
} from 'react-icons/hi';

const passwordSchema = yup.object({
  currentPassword: yup.string().required('Current password is required'),
  newPassword: yup
    .string()
    .min(8, 'Minimum 8 characters')
    .matches(/[A-Z]/, 'Must contain an uppercase letter')
    .matches(/[a-z]/, 'Must contain a lowercase letter')
    .matches(/[0-9]/, 'Must contain a number')
    .matches(/[^A-Za-z0-9]/, 'Must contain a special character')
    .required('New password is required'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('newPassword')], 'Passwords must match')
    .required('Confirm password is required'),
});

function ToggleSwitch({ enabled, onChange, label, description }) {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex-1 min-w-0 pr-4">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{label}</p>
        {description && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{description}</p>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!enabled)}
        className={`
          relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent 
          transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2
          ${enabled ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-600'}
        `}
      >
        <span
          className={`
            pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 
            transition duration-200 ease-in-out
            ${enabled ? 'translate-x-5' : 'translate-x-0'}
          `}
        />
      </button>
    </div>
  );
}

function SectionNav({ sections, activeSection, onSelect }) {
  return (
    <nav className="space-y-1">
      {sections.map((section) => {
        const isActive = activeSection === section.id;
        return (
          <button
            key={section.id}
            onClick={() => onSelect(section.id)}
            className={`
              w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 text-left
              ${isActive
                ? 'bg-gradient-to-r from-primary to-primary-600 text-white shadow-md shadow-primary/20'
                : 'text-gray-600 hover:bg-primary-50/60 hover:text-primary'
              }
            `}
          >
            <section.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-gray-400'}`} />
            <span className="truncate">{section.label}</span>
            {section.badge && (
              <span className={`ml-auto text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${isActive ? 'bg-white/20 text-white' : 'bg-primary-100 text-primary-700'}`}>
                {section.badge}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}

function ProfileSection({ user, onUserUpdate, refreshUser }) {
  const fileInputRef = useRef(null);
  const [profile, setProfile] = useState({
    fullName: '',
    email: '',
    phone: '',
    department: '',
    jobTitle: '',
    bio: '',
  });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [userDetail, setUserDetail] = useState(null);
  const { t } = useLanguage();

  useEffect(() => {
    if (user?.id) {
      userApi.getMe()
        .then((res) => {
          const u = res?.data ?? res;
          setUserDetail(u);
          setProfile({
            fullName: u?.fullName || '',
            email: u?.email || '',
            phone: u?.phoneNumber || '',
            department: u?.profile?.department || '',
            jobTitle: u?.profile?.jobTitle || '',
            bio: u?.profile?.bio || '',
          });
        })
        .catch(() => toast.error('Failed to load profile'));
    }
  }, [user?.id]);

  const handleSave = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const res = await userApi.update(user.id, {
        fullName: profile.fullName,
        phoneNumber: profile.phone || null,
        department: profile.department || null,
        jobTitle: profile.jobTitle || null,
        bio: profile.bio || null,
      });
      const updated = res?.data ?? res;
      setUserDetail(updated);
      onUserUpdate?.(updated);
      refreshUser?.();
      toast.success(t('profileUpdated'));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file (JPG, PNG, GIF, WebP)');
      return;
    }
    setUploading(true);
    userApi.uploadProfilePicture(user.id, file)
      .then((res) => {
        const updated = res?.data ?? res;
        setUserDetail(updated);
        onUserUpdate?.(updated);
        refreshUser?.();
        toast.success(t('profileUpdated'));
      })
      .catch((err) => toast.error(err.response?.data?.message || 'Failed to upload photo'))
      .finally(() => {
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      });
  };

  const displayUser = userDetail || user;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">{t('profile')} Information</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage your personal details and contact information</p>
      </div>

      <Card>
        <CardBody>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 pb-6 border-b border-gray-100 dark:border-gray-700">
            <div className="relative group">
              <UserAvatar user={displayUser} size="xl" />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                <HiOutlineCamera className="w-5 h-5 text-white" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                className="hidden"
                onChange={handlePhotoChange}
                disabled={uploading}
              />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{displayUser?.fullName}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{displayUser?.email}</p>
              <div className="mt-2">
                <RoleBadge role={displayUser?.role} />
              </div>
            </div>
            <div>
              <Button
                variant="outline"
                size="sm"
                icon={HiOutlineCamera}
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
              >
                {uploading ? 'Uploading...' : t('changePhoto')}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6">
            <Input
              label={t('fullName')}
              value={profile.fullName}
              onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
              placeholder="Your full name"
            />
            <Input
              label={t('emailAddress')}
              type="email"
              value={profile.email}
              onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              placeholder="your.email@example.com"
              disabled
              title="Email cannot be changed"
            />
            <Input
              label={t('phoneNumber')}
              type="tel"
              value={profile.phone}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              placeholder="+250 XXX XXX XXX"
            />
            <Input
              label={t('department')}
              value={profile.department}
              onChange={(e) => setProfile({ ...profile, department: e.target.value })}
              placeholder="e.g. Child Protection"
            />
            <Input
              label={t('jobTitle')}
              value={profile.jobTitle}
              onChange={(e) => setProfile({ ...profile, jobTitle: e.target.value })}
              placeholder="e.g. Senior Social Worker"
            />
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('role')}</label>
              <div className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed">
                {displayUser?.role?.replace('_', ' ')}
              </div>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('bio')}</label>
            <textarea
              rows={3}
              value={profile.bio}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              placeholder="Write a short bio about yourself..."
              className="w-full px-3 py-2 border rounded-lg text-sm transition-colors bg-white dark:bg-gray-800 resize-vertical focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary border-gray-300 dark:border-gray-600 dark:text-gray-100"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost">{t('cancel')}</Button>
            <Button icon={HiOutlineSave} onClick={handleSave} loading={loading}>{t('saveChanges')}</Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

function SecuritySection() {
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const [twoFactor, setTwoFactor] = useState(false);
  const [loginAlerts, setLoginAlerts] = useState(true);
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [setupCode, setSetupCode] = useState('');
  const [verifying2FA, setVerifying2FA] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    // Fetch initial 2FA status
    authApi.getTwoFactorStatus()
      .then(res => {
        const data = res?.data?.data || res?.data || res;
        setTwoFactor(data?.enabled || false);
      })
      .catch(err => console.error('Failed to get 2FA status', err));
  }, []);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({ resolver: yupResolver(passwordSchema) });

  const newPassword = watch('newPassword', '');

  const requirements = [
    { label: 'At least 8 characters', met: newPassword.length >= 8 },
    { label: 'Contains uppercase letter', met: /[A-Z]/.test(newPassword) },
    { label: 'Contains lowercase letter', met: /[a-z]/.test(newPassword) },
    { label: 'Contains a number', met: /[0-9]/.test(newPassword) },
    { label: 'Contains special character', met: /[^A-Za-z0-9]/.test(newPassword) },
  ];

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await authApi.changePassword(data.currentPassword, data.newPassword);
      toast.success(t('passwordChanged'));
      reset();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle2FA = async (enabled) => {
    if (enabled) {
      // User wants to enable it
      try {
        await authApi.sendTwoFactorSetupOtp();
        setShow2FAModal(true);
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to send setup code');
      }
    } else {
      // User wants to disable it
      try {
        await authApi.disableTwoFactor();
        setTwoFactor(false);
        toast.success('Two-Factor Authentication disabled');
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to disable 2FA');
      }
    }
  };

  const handleVerify2FA = async (e) => {
    e.preventDefault();
    if (setupCode.length !== 6) {
      toast.error('Please enter the 6-digit code');
      return;
    }
    
    setVerifying2FA(true);
    try {
      await authApi.enableTwoFactor(setupCode);
      setTwoFactor(true);
      setShow2FAModal(false);
      setSetupCode('');
      toast.success('Two-Factor Authentication enabled successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid or expired code');
    } finally {
      setVerifying2FA(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-gray-900">Security Settings</h2>
        <p className="text-sm text-gray-500 mt-1">Manage your password and account security preferences</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <HiOutlineLockClosed className="w-5 h-5 text-primary" />
            <h3 className="text-sm font-semibold text-gray-900">Change Password</h3>
          </div>
        </CardHeader>
        <CardBody>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="relative">
              <Input
                label="Current Password"
                type={showCurrent ? 'text' : 'password'}
                register={register('currentPassword')}
                error={errors.currentPassword?.message}
                placeholder="Enter your current password"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-[34px] text-gray-400 hover:text-gray-600"
              >
                {showCurrent ? <HiOutlineEyeOff className="w-4 h-4" /> : <HiOutlineEye className="w-4 h-4" />}
              </button>
            </div>

            <div className="relative">
              <Input
                label="New Password"
                type={showNew ? 'text' : 'password'}
                register={register('newPassword')}
                error={errors.newPassword?.message}
                placeholder="Enter a strong new password"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-[34px] text-gray-400 hover:text-gray-600"
              >
                {showNew ? <HiOutlineEyeOff className="w-4 h-4" /> : <HiOutlineEye className="w-4 h-4" />}
              </button>
            </div>

            {newPassword && (
              <div className="bg-gray-50 rounded-lg p-3 space-y-1.5">
                <p className="text-xs font-medium text-gray-700 mb-2">Password Requirements</p>
                {requirements.map((req) => (
                  <div key={req.label} className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center ${req.met ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-400'}`}>
                      <HiOutlineCheck className="w-2.5 h-2.5" />
                    </div>
                    <span className={`text-xs ${req.met ? 'text-green-700' : 'text-gray-500'}`}>{req.label}</span>
                  </div>
                ))}
              </div>
            )}

            <Input
              label="Confirm New Password"
              type="password"
              register={register('confirmPassword')}
              error={errors.confirmPassword?.message}
              placeholder="Confirm your new password"
            />

            <div className="flex justify-end pt-2">
              <Button type="submit" loading={loading} icon={HiOutlineLockClosed}>Update Password</Button>
            </div>
          </form>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <HiOutlineShieldCheck className="w-5 h-5 text-primary" />
            <h3 className="text-sm font-semibold text-gray-900">Account Security</h3>
          </div>
        </CardHeader>
        <CardBody>
          <div className="divide-y divide-gray-100">
            <ToggleSwitch
              enabled={twoFactor}
              onChange={handleToggle2FA}
              label="Two-Factor Authentication"
              description="Add an extra layer of security with 2FA verification"
            />
            <ToggleSwitch
              enabled={loginAlerts}
              onChange={setLoginAlerts}
              label="Login Alerts"
              description="Get notified when someone logs into your account from a new device"
            />
          </div>

          <div className="mt-5 p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <div className="flex gap-3">
              <HiOutlineInformationCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900">Active Sessions</p>
                <p className="text-xs text-blue-700 mt-0.5">You are currently logged in on this device. Last login was from Kigali, Rwanda.</p>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* 2FA Setup Modal */}
      {show2FAModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-gray-900">Enable Two-Factor Auth</h3>
                <button 
                  onClick={() => {
                    setShow2FAModal(false);
                    setSetupCode('');
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <HiOutlineExclamation className="w-5 h-5" />
                </button>
              </div>
              
              <div className="bg-blue-50 text-blue-800 p-4 rounded-xl text-sm mb-6">
                We've sent a 6-digit verification code to your email address. Enter it below to enable 2FA on your account.
              </div>
              
              <form onSubmit={handleVerify2FA}>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Verification Code</label>
                  <input
                    type="text"
                    maxLength={6}
                    value={setupCode}
                    onChange={(e) => setSetupCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter 6-digit code"
                    className="w-full px-4 py-3 text-center tracking-[0.5em] text-xl font-mono border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  />
                </div>
                
                <div className="flex justify-end gap-3">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    onClick={() => {
                      setShow2FAModal(false);
                      setSetupCode('');
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" loading={verifying2FA}>
                    Verify & Enable
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function NotificationsSection({ role }) {
  const { t } = useLanguage();
  const [settings, setSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    caseUpdates: true,
    caseAssignments: true,
    interventionReminders: true,
    taskDeadlines: true,
    weeklySummary: true,
    teamUpdates: role === USER_ROLES.SUPERVISOR,
    systemAlerts: role === USER_ROLES.ADMIN,
    approvalRequests: role !== USER_ROLES.SOCIAL_WORKER,
    newRegistrations: role === USER_ROLES.ADMIN,
    escalations: role !== USER_ROLES.SOCIAL_WORKER,
  });
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    userApi.getPreferences()
      .then((res) => {
        const prefs = res?.data ?? res;
        if (prefs) {
          setSettings((prev) => ({
            ...prev,
            caseUpdates: prefs.caseUpdates ?? prev.caseUpdates,
            caseAssignments: prefs.caseAssignments ?? prev.caseAssignments,
            interventionReminders: prefs.interventionReminders ?? prev.interventionReminders,
            taskDeadlines: prefs.taskDeadlines ?? prev.taskDeadlines,
            weeklySummary: prefs.weeklySummary ?? prev.weeklySummary,
            emailNotifications: prefs.emailNotifications ?? prev.emailNotifications,
            smsNotifications: prefs.smsNotifications ?? prev.smsNotifications,
            pushNotifications: prefs.pushNotifications ?? prev.pushNotifications,
          }));
        }
        setInitialized(true);
      })
      .catch(() => setInitialized(true));
  }, []);

  const toggle = (key) => setSettings((prev) => ({ ...prev, [key]: !prev[key] }));

  const handleSave = async () => {
    setLoading(true);
    try {
      const current = await userApi.getPreferences().catch(() => ({}));
      const existing = current?.data ?? current ?? {};
      const payload = {
        caseUpdates: settings.caseUpdates,
        caseAssignments: settings.caseAssignments,
        interventionReminders: settings.interventionReminders,
        taskDeadlines: settings.taskDeadlines,
        weeklySummary: settings.weeklySummary,
        emailNotifications: settings.emailNotifications,
        smsNotifications: settings.smsNotifications,
        pushNotifications: settings.pushNotifications,
        language: existing.language ?? 'en',
        theme: existing.theme ?? 'light',
        timezone: existing.timezone ?? 'Africa/Kigali',
        dateFormat: existing.dateFormat ?? 'DD/MM/YYYY',
        compactMode: existing.compactMode ?? false,
        animationsEnabled: existing.animationsEnabled ?? true,
      };
      await userApi.updatePreferences(payload);
      toast.success(t('notificationPrefsSaved'));
    } catch (err) {
      const msg = err?.message || err?.error || (typeof err === 'string' ? err : 'Failed to save notification preferences');
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-gray-900">Notification Preferences</h2>
        <p className="text-sm text-gray-500 mt-1">Choose how and when you receive notifications</p>
      </div>

      <Card>
        <CardHeader>
          <h3 className="text-sm font-semibold text-gray-900">Delivery Channels</h3>
        </CardHeader>
        <CardBody>
          <div className="divide-y divide-gray-100">
            <ToggleSwitch enabled={settings.emailNotifications} onChange={() => toggle('emailNotifications')} label="Email Notifications" description="Receive notifications via email" />
            <ToggleSwitch enabled={settings.smsNotifications} onChange={() => toggle('smsNotifications')} label="SMS Notifications" description="Receive notifications via SMS to your phone" />
            <ToggleSwitch enabled={settings.pushNotifications} onChange={() => toggle('pushNotifications')} label="Push Notifications" description="Receive browser push notifications" />
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h3 className="text-sm font-semibold text-gray-900">Case & Work Notifications</h3>
        </CardHeader>
        <CardBody>
          <div className="divide-y divide-gray-100">
            <ToggleSwitch enabled={settings.caseUpdates} onChange={() => toggle('caseUpdates')} label={t('caseUpdates')} description="Get notified about changes to your assigned cases" />
            <ToggleSwitch enabled={settings.caseAssignments} onChange={() => toggle('caseAssignments')} label={t('caseAssignments')} description="Notifications when cases are assigned to you" />
            <ToggleSwitch enabled={settings.interventionReminders} onChange={() => toggle('interventionReminders')} label={t('interventionReminders')} description="Reminders for upcoming scheduled interventions" />
            <ToggleSwitch enabled={settings.taskDeadlines} onChange={() => toggle('taskDeadlines')} label={t('taskDeadlines')} description="Alerts when task deadlines are approaching" />
            <ToggleSwitch enabled={settings.weeklySummary} onChange={() => toggle('weeklySummary')} label={t('weeklySummary')} description="Receive a weekly digest of your activity" />
          </div>
        </CardBody>
      </Card>

      {(role === USER_ROLES.SUPERVISOR || role === USER_ROLES.ADMIN) && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-gray-900">Management Notifications</h3>
              <Badge color="bg-primary-100 text-primary-700 border-primary-200">
                {role === USER_ROLES.ADMIN ? 'Admin' : 'Supervisor'}
              </Badge>
            </div>
          </CardHeader>
          <CardBody>
            <div className="divide-y divide-gray-100">
              {role !== USER_ROLES.SOCIAL_WORKER && (
                <ToggleSwitch enabled={settings.approvalRequests} onChange={() => toggle('approvalRequests')} label="Approval Requests" description="When cases or interventions need your review" />
              )}
              {role !== USER_ROLES.SOCIAL_WORKER && (
                <ToggleSwitch enabled={settings.escalations} onChange={() => toggle('escalations')} label="Case Escalations" description="When cases are escalated and need attention" />
              )}
              {role === USER_ROLES.SUPERVISOR && (
                <ToggleSwitch enabled={settings.teamUpdates} onChange={() => toggle('teamUpdates')} label="Team Activity Updates" description="Summary of your team's daily activities" />
              )}
              {role === USER_ROLES.ADMIN && (
                <>
                  <ToggleSwitch enabled={settings.systemAlerts} onChange={() => toggle('systemAlerts')} label="System Alerts" description="Critical system notifications and maintenance" />
                  <ToggleSwitch enabled={settings.newRegistrations} onChange={() => toggle('newRegistrations')} label="New User Registrations" description="When new users register on the platform" />
                </>
              )}
            </div>
          </CardBody>
        </Card>
      )}

      <div className="flex justify-end">
        <Button icon={HiOutlineSave} onClick={handleSave} loading={loading}>{t('savePreferences')}</Button>
      </div>
    </div>
  );
}

function PreferencesSection() {
  const { theme, setTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const [prefs, setPrefs] = useState({
    language: 'en',
    timezone: 'Africa/Kigali',
    dateFormat: 'DD/MM/YYYY',
    theme: 'light',
    compactMode: false,
    animationsEnabled: true,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    userApi.getPreferences()
      .then((res) => {
        const data = res?.data ?? res;
        if (data) {
          const lang = data.language === 'fr' ? 'fr' : 'en';
          const th = data.theme || 'light';
          setPrefs({
            language: lang,
            timezone: data.timezone || 'Africa/Kigali',
            dateFormat: data.dateFormat || 'DD/MM/YYYY',
            theme: th,
            compactMode: data.compactMode ?? false,
            animationsEnabled: data.animationsEnabled ?? true,
          });
          setLanguage(lang);
          setTheme(th);
        }
      })
      .catch(() => {});
  }, [setLanguage, setTheme]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const current = await userApi.getPreferences().catch(() => ({}));
      const existing = current?.data ?? current ?? {};
      const payload = {
        caseUpdates: existing.caseUpdates ?? true,
        caseAssignments: existing.caseAssignments ?? true,
        interventionReminders: existing.interventionReminders ?? true,
        taskDeadlines: existing.taskDeadlines ?? true,
        weeklySummary: existing.weeklySummary ?? true,
        emailNotifications: existing.emailNotifications ?? true,
        smsNotifications: existing.smsNotifications ?? false,
        pushNotifications: existing.pushNotifications ?? true,
        language: prefs.language || 'en',
        theme: prefs.theme || 'light',
        timezone: prefs.timezone || 'Africa/Kigali',
        dateFormat: prefs.dateFormat || 'DD/MM/YYYY',
        compactMode: prefs.compactMode ?? false,
        animationsEnabled: prefs.animationsEnabled ?? true,
      };
      await userApi.updatePreferences(payload);
      setTheme(prefs.theme);
      setLanguage(prefs.language);
      toast.success(t('preferencesSaved'));
    } catch (err) {
      const msg = err?.message || err?.error || (typeof err === 'string' ? err : 'Failed to save preferences');
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleThemeChange = (newTheme) => {
    setPrefs((p) => ({ ...p, theme: newTheme }));
    setTheme(newTheme);
  };

  const handleLanguageChange = (newLang) => {
    setPrefs((p) => ({ ...p, language: newLang }));
    setLanguage(newLang);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">{t('systemPreferences')}</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Customize your display, language, and regional settings</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <HiOutlineGlobe className="w-5 h-5 text-primary" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{t('languageRegion')}</h3>
          </div>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label={t('language')}
              value={prefs.language}
              onChange={(e) => handleLanguageChange(e.target.value)}
              options={[
                { value: 'en', label: t('english') },
                { value: 'fr', label: t('french') },
              ]}
            />
            <Select
              label="Timezone"
              value={prefs.timezone}
              onChange={(e) => setPrefs({ ...prefs, timezone: e.target.value })}
              options={[
                { value: 'Africa/Kigali', label: 'Africa/Kigali (CAT, UTC+2)' },
                { value: 'Africa/Nairobi', label: 'Africa/Nairobi (EAT, UTC+3)' },
                { value: 'UTC', label: 'UTC' },
              ]}
            />
            <Select
              label="Date Format"
              value={prefs.dateFormat}
              onChange={(e) => setPrefs({ ...prefs, dateFormat: e.target.value })}
              options={[
                { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
                { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
                { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
              ]}
            />
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <HiOutlineColorSwatch className="w-5 h-5 text-primary" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{t('appearance')}</h3>
          </div>
        </CardHeader>
        <CardBody>
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">{t('theme')}</label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'light', label: t('light'), bg: 'bg-white dark:bg-gray-100 border-2', ring: 'ring-primary' },
                { id: 'dark', label: t('dark'), bg: 'bg-gray-900 border-2', ring: 'ring-primary' },
                { id: 'system', label: t('system'), bg: 'bg-gradient-to-r from-white to-gray-900 border-2', ring: 'ring-primary' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleThemeChange(opt.id)}
                  className={`
                    flex flex-col items-center gap-2 p-3 rounded-xl transition-all
                    ${prefs.theme === opt.id ? `${opt.ring} ring-2` : 'hover:bg-gray-50 dark:hover:bg-gray-700'}
                  `}
                >
                  <div className={`w-full h-12 rounded-lg ${opt.bg} border-gray-200 dark:border-gray-600`} />
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            <ToggleSwitch
              enabled={prefs.compactMode}
              onChange={(val) => setPrefs({ ...prefs, compactMode: val })}
              label={t('compactMode')}
              description="Reduce spacing for a denser display layout"
            />
            <ToggleSwitch
              enabled={prefs.animationsEnabled}
              onChange={(val) => setPrefs({ ...prefs, animationsEnabled: val })}
              label={t('animations')}
              description="Enable smooth transitions and animations throughout the app"
            />
          </div>
        </CardBody>
      </Card>

      <div className="flex justify-end">
        <Button icon={HiOutlineSave} onClick={handleSave} loading={loading}>{t('savePreferences')}</Button>
      </div>
    </div>
  );
}

function OrganizationSection() {
  const [org, setOrg] = useState({
    name: 'Association Mwana Ukundwa (AMU)',
    shortName: 'AMU',
    email: 'info@amu.rw',
    phone: '+250 788 000 000',
    address: 'Kigali, Rwanda',
    website: 'https://www.amu.rw',
    description: 'Supporting vulnerable children, youth, and families in Rwanda',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    systemSettingApi.getCategory('organization')
      .then((res) => {
        const data = res?.data ?? res;
        if (data && typeof data === 'object' && Object.keys(data).length > 0) {
          setOrg((prev) => ({ ...prev, ...data }));
        }
      })
      .catch(() => {});
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      await systemSettingApi.updateCategory('organization', org);
      toast.success('Organization settings saved');
    } catch (err) {
      toast.error(err?.message || err?.error || 'Failed to save organization settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Organization Settings</h2>
          <p className="text-sm text-gray-500 mt-1">Configure your organization's information and branding</p>
        </div>
        <Badge color="bg-primary-100 text-primary-700 border-primary-200">Admin Only</Badge>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <HiOutlineOfficeBuilding className="w-5 h-5 text-primary" />
            <h3 className="text-sm font-semibold text-gray-900">Organization Information</h3>
          </div>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Organization Name" value={org.name} onChange={(e) => setOrg({ ...org, name: e.target.value })} />
            <Input label="Short Name / Acronym" value={org.shortName} onChange={(e) => setOrg({ ...org, shortName: e.target.value })} />
            <Input label="Official Email" type="email" value={org.email} onChange={(e) => setOrg({ ...org, email: e.target.value })} />
            <Input label="Phone Number" value={org.phone} onChange={(e) => setOrg({ ...org, phone: e.target.value })} />
            <div className="md:col-span-2">
              <Input label="Physical Address" value={org.address} onChange={(e) => setOrg({ ...org, address: e.target.value })} />
            </div>
            <Input label="Website URL" value={org.website} onChange={(e) => setOrg({ ...org, website: e.target.value })} />
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Organization Logo</label>
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center text-white text-lg font-bold shadow">
                  {org.shortName}
                </div>
                <Button variant="outline" size="sm" icon={HiOutlineCamera}>Upload Logo</Button>
              </div>
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              rows={3}
              value={org.description}
              onChange={(e) => setOrg({ ...org, description: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm transition-colors bg-white resize-vertical focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary border-gray-300"
            />
          </div>
          <div className="flex justify-end">
            <Button icon={HiOutlineSave} onClick={handleSave} loading={loading}>Save Organization</Button>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h3 className="text-sm font-semibold text-gray-900">Regional Settings</h3>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select label="Country" value="rwanda" options={[{ value: 'rwanda', label: 'Rwanda' }]} disabled />
            <Select label="Default Timezone" value="cat" options={[{ value: 'cat', label: 'CAT (UTC+2)' }]} />
            <Select
              label="Default Language"
              value="en"
              options={[
                { value: 'en', label: 'English' },
                { value: 'rw', label: 'Kinyarwanda' },
                { value: 'fr', label: 'French' },
              ]}
            />
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

function SecurityPoliciesSection() {
  const [policies, setPolicies] = useState({
    twoFactorAuth: true,
    passwordExpiration: true,
    passwordExpiryDays: 90,
    sessionTimeout: true,
    sessionTimeoutMinutes: 30,
    loginAttemptLimit: true,
    maxLoginAttempts: 5,
    requireStrongPassword: true,
    minPasswordLength: 8,
    ipWhitelist: false,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    systemSettingApi.getCategory('security')
      .then((res) => {
        const data = res?.data ?? res;
        if (data && typeof data === 'object' && Object.keys(data).length > 0) {
          setPolicies((prev) => ({ ...prev, ...data }));
        }
      })
      .catch(() => {});
  }, []);

  const toggle = (key) => setPolicies((prev) => ({ ...prev, [key]: !prev[key] }));
  const handleSave = async () => {
    setLoading(true);
    try {
      await systemSettingApi.updateCategory('security', policies);
      toast.success('Security policies saved');
    } catch (err) {
      toast.error(err?.message || err?.error || 'Failed to save security policies');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Security Policies</h2>
          <p className="text-sm text-gray-500 mt-1">Configure system-wide authentication and security rules</p>
        </div>
        <Badge color="bg-primary-100 text-primary-700 border-primary-200">Admin Only</Badge>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <HiOutlineShieldCheck className="w-5 h-5 text-primary" />
            <h3 className="text-sm font-semibold text-gray-900">Authentication Policies</h3>
          </div>
        </CardHeader>
        <CardBody>
          <div className="space-y-4">
            <div>
              <ToggleSwitch enabled={policies.twoFactorAuth} onChange={() => toggle('twoFactorAuth')} label="Require Two-Factor Authentication" description="Require all users to enable 2FA" />
            </div>

            <div className="border-t border-gray-100 pt-3">
              <ToggleSwitch enabled={policies.passwordExpiration} onChange={() => toggle('passwordExpiration')} label="Password Expiration" description="Force users to change passwords periodically" />
              {policies.passwordExpiration && (
                <div className="ml-8 mt-2 max-w-xs">
                  <Input
                    label="Expiry Period (days)"
                    type="number"
                    value={policies.passwordExpiryDays}
                    onChange={(e) => setPolicies({ ...policies, passwordExpiryDays: e.target.value })}
                  />
                </div>
              )}
            </div>

            <div className="border-t border-gray-100 pt-3">
              <ToggleSwitch enabled={policies.sessionTimeout} onChange={() => toggle('sessionTimeout')} label="Session Timeout" description="Auto-logout after period of inactivity" />
              {policies.sessionTimeout && (
                <div className="ml-8 mt-2 max-w-xs">
                  <Input
                    label="Timeout (minutes)"
                    type="number"
                    value={policies.sessionTimeoutMinutes}
                    onChange={(e) => setPolicies({ ...policies, sessionTimeoutMinutes: e.target.value })}
                  />
                </div>
              )}
            </div>

            <div className="border-t border-gray-100 pt-3">
              <ToggleSwitch enabled={policies.loginAttemptLimit} onChange={() => toggle('loginAttemptLimit')} label="Login Attempt Limit" description="Lock accounts after too many failed attempts" />
              {policies.loginAttemptLimit && (
                <div className="ml-8 mt-2 max-w-xs">
                  <Input
                    label="Max Attempts"
                    type="number"
                    value={policies.maxLoginAttempts}
                    onChange={(e) => setPolicies({ ...policies, maxLoginAttempts: e.target.value })}
                  />
                </div>
              )}
            </div>

            <div className="border-t border-gray-100 pt-3">
              <ToggleSwitch enabled={policies.requireStrongPassword} onChange={() => toggle('requireStrongPassword')} label="Strong Password Requirement" description="Enforce complex password rules system-wide" />
              {policies.requireStrongPassword && (
                <div className="ml-8 mt-2 max-w-xs">
                  <Input
                    label="Minimum Length"
                    type="number"
                    value={policies.minPasswordLength}
                    onChange={(e) => setPolicies({ ...policies, minPasswordLength: e.target.value })}
                  />
                  <p className="text-xs text-gray-500 -mt-2">Must contain uppercase, lowercase, numbers, and special characters</p>
                </div>
              )}
            </div>

            <div className="border-t border-gray-100 pt-3">
              <ToggleSwitch enabled={policies.ipWhitelist} onChange={() => toggle('ipWhitelist')} label="IP Address Whitelist" description="Restrict access to specific IP addresses" />
            </div>
          </div>

          <div className="flex justify-end mt-4">
            <Button icon={HiOutlineSave} onClick={handleSave} loading={loading}>Save Policies</Button>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h3 className="text-sm font-semibold text-gray-900">Recent Security Events</h3>
        </CardHeader>
        <CardBody>
          <div className="space-y-3">
            {[
              { icon: HiOutlineCheck, color: 'text-green-500 bg-green-50', title: 'Successful Login', detail: 'admin@amu.rw from Kigali', time: '2 min ago' },
              { icon: HiOutlineShieldCheck, color: 'text-blue-500 bg-blue-50', title: 'Password Changed', detail: 'jean.uwase@amu.rw', time: '1 hour ago' },
              { icon: HiOutlineExclamation, color: 'text-red-500 bg-red-50', title: 'Failed Login Attempt', detail: 'unknown@example.com', time: '3 hours ago' },
            ].map((event, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${event.color}`}>
                    <event.icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{event.title}</p>
                    <p className="text-xs text-gray-500">{event.detail}</p>
                  </div>
                </div>
                <span className="text-xs text-gray-400">{event.time}</span>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

function EmailConfigSection() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState({
    smtpHost: 'smtp.gmail.com',
    smtpPort: '587',
    smtpUsername: 'system@afyalink.org',
    smtpPassword: '',
    encryption: 'TLS',
    fromName: 'AfyaLink System',
    fromEmail: 'system@afyalink.org',
  });

  useEffect(() => {
    systemSettingApi.getCategory('email')
      .then((res) => {
        const data = res?.data ?? res;
        if (data && typeof data === 'object' && Object.keys(data).length > 0) {
          setConfig((prev) => ({ ...prev, ...data }));
        }
      })
      .catch(() => {});
  }, []);

  const handleTestEmail = () => toast.success('Test email sent successfully');
  const handleSave = async () => {
    setLoading(true);
    try {
      await systemSettingApi.updateCategory('email', config);
      toast.success('Email configuration saved');
    } catch (err) {
      toast.error(err?.message || err?.error || 'Failed to save email configuration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Email Configuration</h2>
          <p className="text-sm text-gray-500 mt-1">Configure SMTP settings for email notifications</p>
        </div>
        <Badge color="bg-primary-100 text-primary-700 border-primary-200">Admin Only</Badge>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <HiOutlineMail className="w-5 h-5 text-primary" />
            <h3 className="text-sm font-semibold text-gray-900">SMTP Server</h3>
          </div>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="SMTP Host" value={config.smtpHost} onChange={(e) => setConfig({ ...config, smtpHost: e.target.value })} placeholder="smtp.gmail.com" />
            <Input label="SMTP Port" value={config.smtpPort} onChange={(e) => setConfig({ ...config, smtpPort: e.target.value })} placeholder="587" />
            <Input label="Username" value={config.smtpUsername} onChange={(e) => setConfig({ ...config, smtpUsername: e.target.value })} />
            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={config.smtpPassword}
                onChange={(e) => setConfig({ ...config, smtpPassword: e.target.value })}
                placeholder="Enter SMTP password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-[34px] text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <HiOutlineEyeOff className="w-4 h-4" /> : <HiOutlineEye className="w-4 h-4" />}
              </button>
            </div>
            <Select
              label="Encryption"
              value={config.encryption}
              onChange={(e) => setConfig({ ...config, encryption: e.target.value })}
              options={[
                { value: 'TLS', label: 'TLS' },
                { value: 'SSL', label: 'SSL' },
                { value: 'None', label: 'None' },
              ]}
            />
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h3 className="text-sm font-semibold text-gray-900">Sender Settings</h3>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="From Name" value={config.fromName} onChange={(e) => setConfig({ ...config, fromName: e.target.value })} />
            <Input label="From Email" type="email" value={config.fromEmail} onChange={(e) => setConfig({ ...config, fromEmail: e.target.value })} />
          </div>

          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
            <HiOutlineExclamation className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800">For Gmail, use an App Password instead of your regular password. Enable 2-Step Verification in your Google account first.</p>
          </div>

          <div className="flex justify-end gap-3 mt-5">
            <Button variant="outline" icon={HiOutlineMail} onClick={handleTestEmail}>Send Test Email</Button>
            <Button icon={HiOutlineSave} onClick={handleSave} loading={loading}>Save Configuration</Button>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h3 className="text-sm font-semibold text-gray-900">Email Templates</h3>
        </CardHeader>
        <CardBody>
          <div className="space-y-2">
            {['Welcome Email', 'Case Assignment', 'Password Reset', 'Task Reminder', 'Weekly Report'].map((t) => (
              <button key={t} className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors text-left">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary-50 rounded-lg flex items-center justify-center">
                    <HiOutlineDocumentText className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">{t}</span>
                </div>
                <HiOutlineChevronRight className="w-4 h-4 text-gray-400" />
              </button>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

function DataBackupSection() {
  const [data, setData] = useState({
    automaticBackups: true,
    backupFrequency: 'Daily',
    backupTime: '02:00',
    cloudBackup: true,
    dataRetentionDays: 365,
    archiveClosedCases: true,
    archiveAfterDays: 180,
  });
  const [loading, setLoading] = useState(false);

  const systemInfo = {
    lastBackup: 'January 27, 2025 at 2:00 AM',
    nextBackup: 'January 28, 2025 at 2:00 AM',
    databaseSize: '2.4 GB',
    storageUsed: 45,
    totalStorage: 100,
  };

  useEffect(() => {
    systemSettingApi.getCategory('data')
      .then((res) => {
        const cat = res?.data ?? res;
        if (cat && typeof cat === 'object' && Object.keys(cat).length > 0) {
          setData((prev) => ({ ...prev, ...cat }));
        }
      })
      .catch(() => {});
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      await systemSettingApi.updateCategory('data', data);
      toast.success('Backup settings saved');
    } catch (err) {
      toast.error(err?.message || err?.error || 'Failed to save backup settings');
    } finally {
      setLoading(false);
    }
  };
  const handleBackup = () => toast.info('Creating manual backup...');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Data & Backup</h2>
          <p className="text-sm text-gray-500 mt-1">Manage data backups, retention policies, and storage</p>
        </div>
        <Badge color="bg-primary-100 text-primary-700 border-primary-200">Admin Only</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardBody>
            <div className="text-center">
              <HiOutlineDatabase className="w-8 h-8 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{systemInfo.databaseSize}</p>
              <p className="text-xs text-gray-500">Database Size</p>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="text-center">
              <div className="relative w-14 h-14 mx-auto mb-2">
                <svg className="w-14 h-14 -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15.9" fill="none" className="stroke-gray-200" strokeWidth="3" />
                  <circle cx="18" cy="18" r="15.9" fill="none" className="stroke-primary" strokeWidth="3" strokeDasharray={`${systemInfo.storageUsed} ${100 - systemInfo.storageUsed}`} strokeLinecap="round" />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-900">{systemInfo.storageUsed}%</span>
              </div>
              <p className="text-xs text-gray-500">{systemInfo.storageUsed}GB / {systemInfo.totalStorage}GB Used</p>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="text-center">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                <HiOutlineCheck className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-sm font-semibold text-gray-900">Last Backup</p>
              <p className="text-xs text-gray-500 mt-0.5">Jan 27, 2025 at 2:00 AM</p>
            </div>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <h3 className="text-sm font-semibold text-gray-900">Backup Configuration</h3>
        </CardHeader>
        <CardBody>
          <ToggleSwitch
            enabled={data.automaticBackups}
            onChange={(val) => setData({ ...data, automaticBackups: val })}
            label="Automatic Backups"
            description="Enable scheduled database backups"
          />
          {data.automaticBackups && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pl-4 border-l-2 border-primary/20">
              <Select
                label="Frequency"
                value={data.backupFrequency}
                onChange={(e) => setData({ ...data, backupFrequency: e.target.value })}
                options={['Hourly', 'Daily', 'Weekly', 'Monthly']}
              />
              <Input
                label="Backup Time"
                type="time"
                value={data.backupTime}
                onChange={(e) => setData({ ...data, backupTime: e.target.value })}
              />
            </div>
          )}

          <div className="border-t border-gray-100 mt-4 pt-4">
            <ToggleSwitch
              enabled={data.cloudBackup}
              onChange={(val) => setData({ ...data, cloudBackup: val })}
              label="Cloud Backup"
              description="Store backup copies in cloud storage for additional safety"
            />
          </div>

          <div className="flex gap-3 mt-5">
            <Button icon={HiOutlineDatabase} onClick={handleBackup}>Create Manual Backup</Button>
            <Button variant="outline">Download Latest Backup</Button>
            <Button variant="outline">Restore from Backup</Button>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h3 className="text-sm font-semibold text-gray-900">Data Retention & Archiving</h3>
        </CardHeader>
        <CardBody>
          <div className="max-w-xs">
            <Input
              label="Data Retention Period (days)"
              type="number"
              value={data.dataRetentionDays}
              onChange={(e) => setData({ ...data, dataRetentionDays: e.target.value })}
            />
            <p className="text-xs text-gray-500 -mt-2 mb-4">Data older than this period will be archived</p>
          </div>

          <ToggleSwitch
            enabled={data.archiveClosedCases}
            onChange={(val) => setData({ ...data, archiveClosedCases: val })}
            label="Auto-Archive Closed Cases"
            description="Automatically archive closed cases after a period of inactivity"
          />
          {data.archiveClosedCases && (
            <div className="max-w-xs mt-2 pl-4 border-l-2 border-primary/20">
              <Input
                label="Archive After (days)"
                type="number"
                value={data.archiveAfterDays}
                onChange={(e) => setData({ ...data, archiveAfterDays: e.target.value })}
              />
            </div>
          )}

          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
            <HiOutlineExclamation className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800">Archived data can be restored, but permanently deleted data cannot be recovered. Ensure backup policies are configured before adjusting retention.</p>
          </div>

          <div className="flex justify-end mt-4">
            <Button icon={HiOutlineSave} onClick={handleSave} loading={loading}>Save Settings</Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

function IntegrationsSection() {
  const [apiEnabled, setApiEnabled] = useState(false);
  const [smsEnabled, setSmsEnabled] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState({ apiEnabled: false, smsEnabled: false });

  const apiKey = 'sk_live_xxxxxxxxxxxxxxxxxxxx';

  useEffect(() => {
    systemSettingApi.getCategory('integration')
      .then((res) => {
        const data = res?.data ?? res;
        if (data && typeof data === 'object' && Object.keys(data).length > 0) {
          setConfig(data);
          setApiEnabled(!!data.apiEnabled);
          setSmsEnabled(!!data.smsEnabled);
        }
      })
      .catch(() => {});
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      await systemSettingApi.updateCategory('integration', { apiEnabled, smsEnabled });
      setConfig({ apiEnabled, smsEnabled });
      toast.success('Integration settings saved');
    } catch (err) {
      toast.error(err?.message || err?.error || 'Failed to save integration settings');
    } finally {
      setLoading(false);
    }
  };

  const integrations = [
    { name: 'Google Drive', desc: 'Backup documents to Google Drive', icon: '☁️', connected: false },
    { name: 'Microsoft Office 365', desc: 'Email and calendar integration', icon: '📧', connected: true },
    { name: 'Slack', desc: 'Team notifications via Slack', icon: '💬', connected: false },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Integrations</h2>
          <p className="text-sm text-gray-500 mt-1">Manage API access and third-party integrations</p>
        </div>
        <Badge color="bg-primary-100 text-primary-700 border-primary-200">Admin Only</Badge>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <HiOutlineLink className="w-5 h-5 text-primary" />
            <h3 className="text-sm font-semibold text-gray-900">API Access</h3>
          </div>
        </CardHeader>
        <CardBody>
          <ToggleSwitch enabled={apiEnabled} onChange={setApiEnabled} label="Enable API Access" description="Allow external systems to access AfyaLink API" />

          {apiEnabled && (
            <div className="mt-4 space-y-4 pl-4 border-l-2 border-primary/20">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      readOnly
                      value={apiKey}
                      className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-50 border-gray-300 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                    >
                      {showApiKey ? <HiOutlineEyeOff className="w-4 h-4" /> : <HiOutlineEye className="w-4 h-4" />}
                    </button>
                  </div>
                  <Button variant="outline" size="sm">Regenerate</Button>
                </div>
              </div>
              <Input label="Rate Limit (requests/hour)" type="number" value="1000" />
              <Input label="Webhook URL" placeholder="https://your-domain.com/webhook" />

              <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                <HiOutlineLockClosed className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-800">Keep your API key secure. Do not share it or commit it to version control.</p>
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h3 className="text-sm font-semibold text-gray-900">SMS Integration</h3>
        </CardHeader>
        <CardBody>
          <ToggleSwitch enabled={smsEnabled} onChange={setSmsEnabled} label="Enable SMS Notifications" description="Send SMS alerts to beneficiaries and staff" />
          {smsEnabled && (
            <div className="mt-4 space-y-4 pl-4 border-l-2 border-primary/20">
              <Select
                label="SMS Provider"
                placeholder="Select provider..."
                options={[
                  { value: 'twilio', label: 'Twilio' },
                  { value: 'africastalking', label: "Africa's Talking" },
                  { value: 'nexmo', label: 'Vonage (Nexmo)' },
                ]}
              />
              <Input label="SMS API Key" type="password" placeholder="Enter provider API key" />
              <Button variant="outline" size="sm" icon={HiOutlineMail}>Send Test SMS</Button>
            </div>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h3 className="text-sm font-semibold text-gray-900">Third-Party Services</h3>
        </CardHeader>
        <CardBody>
          <div className="space-y-3">
            {integrations.map((int) => (
              <div key={int.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{int.icon}</span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{int.name}</p>
                    <p className="text-xs text-gray-500">{int.desc}</p>
                  </div>
                </div>
                {int.connected ? (
                  <Badge color="bg-green-100 text-green-700 border-green-200">Connected</Badge>
                ) : (
                  <Button variant="outline" size="sm">Connect</Button>
                )}
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      <div className="flex justify-end">
        <Button icon={HiOutlineSave} onClick={handleSave} loading={loading}>Save Integration Settings</Button>
      </div>
    </div>
  );
}

function TeamSettingsSection() {
  const [settings, setSettings] = useState({
    autoAssignment: true,
    reassignOnLeave: true,
    caseloadLimit: 25,
    requireApproval: true,
    weeklyReportDeadline: 'Friday',
  });

  const handleSave = () => toast.success('Team settings saved');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Team Settings</h2>
          <p className="text-sm text-gray-500 mt-1">Configure team workflow and case management rules</p>
        </div>
        <Badge color="bg-blue-100 text-blue-700 border-blue-200">Supervisor</Badge>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <HiOutlineUsers className="w-5 h-5 text-primary" />
            <h3 className="text-sm font-semibold text-gray-900">Case Assignment Rules</h3>
          </div>
        </CardHeader>
        <CardBody>
          <div className="space-y-3 divide-y divide-gray-100">
            <ToggleSwitch
              enabled={settings.autoAssignment}
              onChange={(val) => setSettings({ ...settings, autoAssignment: val })}
              label="Auto-Assignment"
              description="Automatically assign new cases based on workload balance"
            />
            <ToggleSwitch
              enabled={settings.reassignOnLeave}
              onChange={(val) => setSettings({ ...settings, reassignOnLeave: val })}
              label="Reassign on Leave"
              description="Automatically reassign cases when a worker is on leave"
            />
            <ToggleSwitch
              enabled={settings.requireApproval}
              onChange={(val) => setSettings({ ...settings, requireApproval: val })}
              label="Require Approval for Case Closure"
              description="Cases must be approved by supervisor before closing"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5 pt-4 border-t border-gray-100">
            <Input
              label="Max Caseload per Worker"
              type="number"
              value={settings.caseloadLimit}
              onChange={(e) => setSettings({ ...settings, caseloadLimit: e.target.value })}
            />
            <Select
              label="Weekly Report Deadline"
              value={settings.weeklyReportDeadline}
              onChange={(e) => setSettings({ ...settings, weeklyReportDeadline: e.target.value })}
              options={['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']}
            />
          </div>

          <div className="flex justify-end mt-5">
            <Button icon={HiOutlineSave} onClick={handleSave}>Save Team Settings</Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

export default function SettingsPage() {
  const { user, updateUser, refreshUser } = useAuth();
  const { t } = useLanguage();
  const role = user?.role;
  const [activeSection, setActiveSection] = useState('profile');

  const sections = useMemo(() => {
    const base = [
      { id: 'profile', label: t('profile'), icon: HiOutlineUser },
      { id: 'security', label: t('security'), icon: HiOutlineLockClosed },
      { id: 'notifications', label: t('notifications'), icon: HiOutlineBell },
      { id: 'preferences', label: t('preferences'), icon: HiOutlineGlobe },
    ];

    if (role === USER_ROLES.SUPERVISOR) {
      base.push({ id: 'team', label: t('teamSettings'), icon: HiOutlineUsers, badge: 'SUP' });
    }

    if (role === USER_ROLES.ADMIN) {
      base.push(
        { id: 'organization', label: t('organization'), icon: HiOutlineOfficeBuilding, badge: 'ADM' },
        { id: 'security-policies', label: t('securityPolicies'), icon: HiOutlineShieldCheck, badge: 'ADM' },
        { id: 'email-config', label: t('emailConfig'), icon: HiOutlineMail, badge: 'ADM' },
        { id: 'data-backup', label: t('dataBackup'), icon: HiOutlineDatabase, badge: 'ADM' },
        { id: 'integrations', label: t('integrations'), icon: HiOutlineLink, badge: 'ADM' },
      );
    }

    return base;
  }, [role, t]);

  const handleUserUpdate = (updated) => {
    if (updated && user) {
      updateUser({ fullName: updated.fullName });
    }
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'profile':
        return <ProfileSection user={user} onUserUpdate={handleUserUpdate} refreshUser={refreshUser} />;
      case 'security':
        return <SecuritySection />;
      case 'notifications':
        return <NotificationsSection role={role} />;
      case 'preferences':
        return <PreferencesSection />;
      case 'team':
        return role === USER_ROLES.SUPERVISOR ? <TeamSettingsSection /> : null;
      case 'organization':
        return role === USER_ROLES.ADMIN ? <OrganizationSection /> : null;
      case 'security-policies':
        return role === USER_ROLES.ADMIN ? <SecurityPoliciesSection /> : null;
      case 'email-config':
        return role === USER_ROLES.ADMIN ? <EmailConfigSection /> : null;
      case 'data-backup':
        return role === USER_ROLES.ADMIN ? <DataBackupSection /> : null;
      case 'integrations':
        return role === USER_ROLES.ADMIN ? <IntegrationsSection /> : null;
      default:
        return <ProfileSection user={user} />;
    }
  };

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        badge="Account & System"
        badgeIcon={HiOutlineColorSwatch}
        title="Settings"
        subtitle="Manage your account, preferences, and system configuration"
      />

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Navigation */}
        <div className="lg:w-64 flex-shrink-0">
              <div className="lg:sticky lg:top-6">
            <Card className="p-3">
              {/* User Card */}
              <div className="flex items-center gap-3 px-3 py-3 mb-3 bg-gray-50 rounded-xl">
                <div className="relative flex-shrink-0">
                  <UserAvatar user={user} size="sm" />
                  <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 border-2 border-gray-50 rounded-full" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-gray-900 truncate">{user?.fullName}</p>
                  <p className="text-[10px] text-gray-400 truncate">{user?.role?.replace('_', ' ')}</p>
                </div>
              </div>

              {/* Section Labels */}
              <p className="px-3 mb-2 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Account</p>
              <SectionNav
                sections={sections.filter((s) => ['profile', 'security', 'notifications', 'preferences'].includes(s.id))}
                activeSection={activeSection}
                onSelect={setActiveSection}
              />

              {role === USER_ROLES.SUPERVISOR && (
                <>
                  <div className="my-3 border-t border-gray-100" />
                  <p className="px-3 mb-2 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Team</p>
                  <SectionNav
                    sections={sections.filter((s) => s.id === 'team')}
                    activeSection={activeSection}
                    onSelect={setActiveSection}
                  />
                </>
              )}

              {role === USER_ROLES.ADMIN && (
                <>
                  <div className="my-3 border-t border-gray-100" />
                  <p className="px-3 mb-2 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">System</p>
                  <SectionNav
                    sections={sections.filter((s) => ['organization', 'security-policies', 'email-config', 'data-backup', 'integrations'].includes(s.id))}
                    activeSection={activeSection}
                    onSelect={setActiveSection}
                  />
                </>
              )}
            </Card>
          </div>
        </div>

        {/* Mobile Tab Bar */}
        <div className="lg:hidden -mt-3 mb-2 overflow-x-auto">
          <div className="flex gap-1 min-w-max pb-2">
            {sections.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={`
                  flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors
                  ${activeSection === s.id
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }
                `}
              >
                <s.icon className="w-3.5 h-3.5" />
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 min-w-0">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
