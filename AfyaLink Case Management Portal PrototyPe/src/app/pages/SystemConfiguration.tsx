import { useState } from 'react';
import {
  Shield,
  Database,
  Bell,
  Lock,
  Save,
  Cog,
  Mail,
  Server,
  Globe,
  Eye,
  EyeOff,
  RefreshCw,
  Download,
  Upload,
  HardDrive,
  Cloud,
  Wifi,
  AlertTriangle,
  CheckCircle,
  Settings,
  Building,
  Users,
  FileText,
  Calendar,
  Clock,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Switch } from '../components/ui/switch';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { useAuth } from '../context/AuthContext';
import { Alert, AlertDescription } from '../components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import { Progress } from '../components/ui/progress';

export function SystemConfiguration() {
  const { user } = useAuth();
  const [showApiKey, setShowApiKey] = useState(false);
  const [showEmailPassword, setShowEmailPassword] = useState(false);

  // Organization Settings
  const [orgSettings, setOrgSettings] = useState({
    name: 'Association Mwana Ukundwa (AMU)',
    shortName: 'AMU',
    email: 'info@amu.rw',
    phone: '+250 788 000 000',
    address: 'Kigali, Rwanda',
    website: 'https://www.amu.rw',
    logo: '',
    description: 'Supporting vulnerable children, youth, and families in Rwanda',
  });

  // Security Settings
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: true,
    passwordExpiration: true,
    passwordExpiryDays: 90,
    sessionTimeout: true,
    sessionTimeoutMinutes: 30,
    loginAttemptLimit: true,
    maxLoginAttempts: 5,
    ipWhitelist: false,
    requireStrongPassword: true,
    minPasswordLength: 8,
  });

  // Notification Settings
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    caseAssignmentAlerts: true,
    overdueTaskReminders: true,
    maintenanceAlerts: true,
    weeklyDigest: true,
    systemEmail: 'system@afyalink.org',
    replyToEmail: 'noreply@afyalink.org',
  });

  // Data & Backup Settings
  const [dataSettings, setDataSettings] = useState({
    automaticBackups: true,
    backupFrequency: 'Daily',
    backupTime: '02:00',
    dataRetentionDays: 365,
    archiveClosedCases: true,
    archiveAfterDays: 180,
    cloudBackup: true,
    backupStorage: 'local',
  });

  // Email Configuration
  const [emailConfig, setEmailConfig] = useState({
    smtpHost: 'smtp.gmail.com',
    smtpPort: '587',
    smtpUsername: 'system@afyalink.org',
    smtpPassword: '••••••••',
    encryption: 'TLS',
    fromName: 'AfyaLink System',
    fromEmail: 'system@afyalink.org',
  });

  // API Settings
  const [apiSettings, setApiSettings] = useState({
    apiEnabled: false,
    apiKey: 'sk_live_xxxxxxxxxxxxxxxxxxxx',
    smsIntegration: false,
    smsProvider: '',
    smsApiKey: '',
    webhookUrl: '',
    rateLimitPerHour: 1000,
  });

  // System Info
  const systemInfo = {
    version: '1.0.0',
    environment: 'Production',
    uptime: '45 days, 12 hours',
    lastBackup: 'January 27, 2025 at 2:00 AM',
    nextBackup: 'January 28, 2025 at 2:00 AM',
    storageUsed: 45,
    totalStorage: 100,
    activeUsers: 142,
    totalCases: 487,
    databaseSize: '2.4 GB',
  };

  const handleSaveSettings = () => {
    alert('Settings saved successfully!');
  };

  const handleTestEmail = () => {
    alert('Test email sent successfully!');
  };

  const handleCreateBackup = () => {
    alert('Creating manual backup... This may take a few minutes.');
  };

  const handleRegenerateApiKey = () => {
    const newKey = 'sk_live_' + Math.random().toString(36).substring(2, 15);
    setApiSettings({ ...apiSettings, apiKey: newKey });
    alert('API key regenerated successfully!');
  };

  // Redirect if not admin
  if (user?.role !== 'admin') {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            Access Denied: This page is restricted to System Administrators only.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">System Configuration</h1>
          <p className="text-gray-600 mt-1">Manage system-wide settings and configurations</p>
        </div>
        <div className="flex gap-2">
          <Badge className="bg-purple-100 text-purple-800 border-purple-200">Admin Only</Badge>
          <Badge variant="outline">v{systemInfo.version}</Badge>
        </div>
      </div>

      {/* System Health Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">System Status</p>
                <div className="flex items-center gap-2 mt-1">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <p className="font-semibold text-green-600">Operational</p>
                </div>
              </div>
              <Server className="h-10 w-10 text-green-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Uptime</p>
                <p className="text-xl font-bold text-gray-900 mt-1">{systemInfo.uptime}</p>
              </div>
              <Clock className="h-10 w-10 text-blue-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Users</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{systemInfo.activeUsers}</p>
              </div>
              <Users className="h-10 w-10 text-purple-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div>
              <p className="text-sm text-gray-600 mb-2">Storage Used</p>
              <Progress value={systemInfo.storageUsed} className="mb-2" />
              <p className="text-xs text-gray-600">
                {systemInfo.storageUsed}GB / {systemInfo.totalStorage}GB
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="organization" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="organization">Organization</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="data">Data & Backup</TabsTrigger>
          <TabsTrigger value="integration">Integration</TabsTrigger>
        </TabsList>

        {/* Organization Settings */}
        <TabsContent value="organization" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Building className="h-5 w-5 text-primary" />
                <CardTitle>Organization Information</CardTitle>
              </div>
              <CardDescription>Configure your organization's basic information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Organization Name *</Label>
                  <Input
                    value={orgSettings.name}
                    onChange={(e) => setOrgSettings({ ...orgSettings, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Short Name / Acronym *</Label>
                  <Input
                    value={orgSettings.shortName}
                    onChange={(e) => setOrgSettings({ ...orgSettings, shortName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Official Email *</Label>
                  <Input
                    type="email"
                    value={orgSettings.email}
                    onChange={(e) => setOrgSettings({ ...orgSettings, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone Number *</Label>
                  <Input
                    value={orgSettings.phone}
                    onChange={(e) => setOrgSettings({ ...orgSettings, phone: e.target.value })}
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label>Physical Address *</Label>
                  <Input
                    value={orgSettings.address}
                    onChange={(e) => setOrgSettings({ ...orgSettings, address: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Website URL</Label>
                  <Input
                    value={orgSettings.website}
                    onChange={(e) => setOrgSettings({ ...orgSettings, website: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Organization Logo</Label>
                  <div className="flex gap-2">
                    <Input type="file" accept="image/*" />
                    <Button variant="outline" size="icon">
                      <Upload className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="col-span-2 space-y-2">
                  <Label>Organization Description</Label>
                  <Textarea
                    rows={3}
                    value={orgSettings.description}
                    onChange={(e) => setOrgSettings({ ...orgSettings, description: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Regional Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Country</Label>
                  <Select defaultValue="rwanda">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rwanda">Rwanda</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Time Zone</Label>
                  <Select defaultValue="cat">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cat">CAT (UTC+2)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Language</Label>
                  <Select defaultValue="en">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="rw">Kinyarwanda</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <CardTitle>Authentication & Access Control</CardTitle>
              </div>
              <CardDescription>Configure authentication and security policies</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Two-Factor Authentication (2FA)</Label>
                  <p className="text-sm text-gray-600">Require 2FA for all users</p>
                </div>
                <Switch
                  checked={securitySettings.twoFactorAuth}
                  onCheckedChange={(checked) =>
                    setSecuritySettings({ ...securitySettings, twoFactorAuth: checked })
                  }
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Password Expiration</Label>
                    <p className="text-sm text-gray-600">Force password change periodically</p>
                  </div>
                  <Switch
                    checked={securitySettings.passwordExpiration}
                    onCheckedChange={(checked) =>
                      setSecuritySettings({ ...securitySettings, passwordExpiration: checked })
                    }
                  />
                </div>
                {securitySettings.passwordExpiration && (
                  <div className="ml-6 space-y-2">
                    <Label>Password Expiry Period (days)</Label>
                    <Input
                      type="number"
                      value={securitySettings.passwordExpiryDays}
                      onChange={(e) =>
                        setSecuritySettings({
                          ...securitySettings,
                          passwordExpiryDays: parseInt(e.target.value),
                        })
                      }
                      className="max-w-xs"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Session Timeout</Label>
                    <p className="text-sm text-gray-600">Auto-logout after inactivity</p>
                  </div>
                  <Switch
                    checked={securitySettings.sessionTimeout}
                    onCheckedChange={(checked) =>
                      setSecuritySettings({ ...securitySettings, sessionTimeout: checked })
                    }
                  />
                </div>
                {securitySettings.sessionTimeout && (
                  <div className="ml-6 space-y-2">
                    <Label>Session Timeout Duration (minutes)</Label>
                    <Input
                      type="number"
                      value={securitySettings.sessionTimeoutMinutes}
                      onChange={(e) =>
                        setSecuritySettings({
                          ...securitySettings,
                          sessionTimeoutMinutes: parseInt(e.target.value),
                        })
                      }
                      className="max-w-xs"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Login Attempt Limit</Label>
                    <p className="text-sm text-gray-600">Lock account after failed attempts</p>
                  </div>
                  <Switch
                    checked={securitySettings.loginAttemptLimit}
                    onCheckedChange={(checked) =>
                      setSecuritySettings({ ...securitySettings, loginAttemptLimit: checked })
                    }
                  />
                </div>
                {securitySettings.loginAttemptLimit && (
                  <div className="ml-6 space-y-2">
                    <Label>Maximum Login Attempts</Label>
                    <Input
                      type="number"
                      value={securitySettings.maxLoginAttempts}
                      onChange={(e) =>
                        setSecuritySettings({
                          ...securitySettings,
                          maxLoginAttempts: parseInt(e.target.value),
                        })
                      }
                      className="max-w-xs"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>IP Address Whitelist</Label>
                  <p className="text-sm text-gray-600">Restrict access to specific IP addresses</p>
                </div>
                <Switch
                  checked={securitySettings.ipWhitelist}
                  onCheckedChange={(checked) =>
                    setSecuritySettings({ ...securitySettings, ipWhitelist: checked })
                  }
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Strong Password Requirement</Label>
                    <p className="text-sm text-gray-600">Enforce complex password rules</p>
                  </div>
                  <Switch
                    checked={securitySettings.requireStrongPassword}
                    onCheckedChange={(checked) =>
                      setSecuritySettings({ ...securitySettings, requireStrongPassword: checked })
                    }
                  />
                </div>
                {securitySettings.requireStrongPassword && (
                  <div className="ml-6 space-y-2">
                    <Label>Minimum Password Length</Label>
                    <Input
                      type="number"
                      value={securitySettings.minPasswordLength}
                      onChange={(e) =>
                        setSecuritySettings({
                          ...securitySettings,
                          minPasswordLength: parseInt(e.target.value),
                        })
                      }
                      className="max-w-xs"
                    />
                    <p className="text-xs text-gray-500">
                      Password must contain uppercase, lowercase, numbers, and special characters
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Security Audit Log</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="font-medium text-sm">Successful Login</p>
                      <p className="text-xs text-gray-600">admin@amu.rw from 192.168.1.1</p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500">2 minutes ago</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="font-medium text-sm">Password Changed</p>
                      <p className="text-xs text-gray-600">jean.uwase@amu.rw</p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500">1 hour ago</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                    <div>
                      <p className="font-medium text-sm">Failed Login Attempt</p>
                      <p className="text-xs text-gray-600">unknown@example.com from 45.123.45.67</p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500">3 hours ago</span>
                </div>
              </div>
              <Button variant="outline" className="w-full mt-4">
                <Download className="h-4 w-4 mr-2" />
                Download Full Audit Log
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                <CardTitle>Notification Preferences</CardTitle>
              </div>
              <CardDescription>Configure system-wide notification settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-gray-600">Send email alerts for system events</p>
                </div>
                <Switch
                  checked={notificationSettings.emailNotifications}
                  onCheckedChange={(checked) =>
                    setNotificationSettings({ ...notificationSettings, emailNotifications: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Case Assignment Alerts</Label>
                  <p className="text-sm text-gray-600">Notify workers of new case assignments</p>
                </div>
                <Switch
                  checked={notificationSettings.caseAssignmentAlerts}
                  onCheckedChange={(checked) =>
                    setNotificationSettings({
                      ...notificationSettings,
                      caseAssignmentAlerts: checked,
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Overdue Task Reminders</Label>
                  <p className="text-sm text-gray-600">Send reminders for overdue tasks and follow-ups</p>
                </div>
                <Switch
                  checked={notificationSettings.overdueTaskReminders}
                  onCheckedChange={(checked) =>
                    setNotificationSettings({
                      ...notificationSettings,
                      overdueTaskReminders: checked,
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>System Maintenance Alerts</Label>
                  <p className="text-sm text-gray-600">Notify all users of scheduled maintenance</p>
                </div>
                <Switch
                  checked={notificationSettings.maintenanceAlerts}
                  onCheckedChange={(checked) =>
                    setNotificationSettings({ ...notificationSettings, maintenanceAlerts: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Weekly Digest Emails</Label>
                  <p className="text-sm text-gray-600">Send weekly summary emails to all users</p>
                </div>
                <Switch
                  checked={notificationSettings.weeklyDigest}
                  onCheckedChange={(checked) =>
                    setNotificationSettings({ ...notificationSettings, weeklyDigest: checked })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>System Email Address</Label>
                <Input
                  type="email"
                  value={notificationSettings.systemEmail}
                  onChange={(e) =>
                    setNotificationSettings({ ...notificationSettings, systemEmail: e.target.value })
                  }
                />
                <p className="text-xs text-gray-500">Email address used for system notifications</p>
              </div>

              <div className="space-y-2">
                <Label>Reply-To Email Address</Label>
                <Input
                  type="email"
                  value={notificationSettings.replyToEmail}
                  onChange={(e) =>
                    setNotificationSettings({ ...notificationSettings, replyToEmail: e.target.value })
                  }
                />
                <p className="text-xs text-gray-500">Email address for user replies</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notification Templates</CardTitle>
              <CardDescription>Customize email notification templates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-between">
                <span>Welcome Email Template</span>
                <Settings className="h-4 w-4" />
              </Button>
              <Button variant="outline" className="w-full justify-between">
                <span>Case Assignment Template</span>
                <Settings className="h-4 w-4" />
              </Button>
              <Button variant="outline" className="w-full justify-between">
                <span>Password Reset Template</span>
                <Settings className="h-4 w-4" />
              </Button>
              <Button variant="outline" className="w-full justify-between">
                <span>Task Reminder Template</span>
                <Settings className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Configuration */}
        <TabsContent value="email" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" />
                <CardTitle>SMTP Email Configuration</CardTitle>
              </div>
              <CardDescription>Configure email server settings for sending notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>SMTP Host *</Label>
                  <Input
                    value={emailConfig.smtpHost}
                    onChange={(e) => setEmailConfig({ ...emailConfig, smtpHost: e.target.value })}
                    placeholder="smtp.gmail.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>SMTP Port *</Label>
                  <Input
                    value={emailConfig.smtpPort}
                    onChange={(e) => setEmailConfig({ ...emailConfig, smtpPort: e.target.value })}
                    placeholder="587"
                  />
                </div>
                <div className="space-y-2">
                  <Label>SMTP Username *</Label>
                  <Input
                    type="email"
                    value={emailConfig.smtpUsername}
                    onChange={(e) => setEmailConfig({ ...emailConfig, smtpUsername: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>SMTP Password *</Label>
                  <div className="relative">
                    <Input
                      type={showEmailPassword ? 'text' : 'password'}
                      value={emailConfig.smtpPassword}
                      onChange={(e) =>
                        setEmailConfig({ ...emailConfig, smtpPassword: e.target.value })
                      }
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0"
                      onClick={() => setShowEmailPassword(!showEmailPassword)}
                    >
                      {showEmailPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Encryption</Label>
                  <Select
                    value={emailConfig.encryption}
                    onValueChange={(value) => setEmailConfig({ ...emailConfig, encryption: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TLS">TLS</SelectItem>
                      <SelectItem value="SSL">SSL</SelectItem>
                      <SelectItem value="None">None</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-4">From Email Settings</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>From Name</Label>
                    <Input
                      value={emailConfig.fromName}
                      onChange={(e) => setEmailConfig({ ...emailConfig, fromName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>From Email Address</Label>
                    <Input
                      type="email"
                      value={emailConfig.fromEmail}
                      onChange={(e) => setEmailConfig({ ...emailConfig, fromEmail: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <Alert>
                <Mail className="h-4 w-4" />
                <AlertDescription>
                  For Gmail, you need to enable "Less secure app access" or use an App Password
                </AlertDescription>
              </Alert>

              <div className="flex gap-2">
                <Button onClick={handleTestEmail}>
                  <Mail className="h-4 w-4 mr-2" />
                  Send Test Email
                </Button>
                <Button variant="outline">
                  <FileText className="h-4 w-4 mr-2" />
                  View Configuration Guide
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data & Backup Settings */}
        <TabsContent value="data" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5 text-secondary" />
                <CardTitle>Backup Configuration</CardTitle>
              </div>
              <CardDescription>Configure automated backup settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Automatic Backups</Label>
                  <p className="text-sm text-gray-600">Enable scheduled database backups</p>
                </div>
                <Switch
                  checked={dataSettings.automaticBackups}
                  onCheckedChange={(checked) =>
                    setDataSettings({ ...dataSettings, automaticBackups: checked })
                  }
                />
              </div>

              {dataSettings.automaticBackups && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Backup Frequency</Label>
                      <Select
                        value={dataSettings.backupFrequency}
                        onValueChange={(value) =>
                          setDataSettings({ ...dataSettings, backupFrequency: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Hourly">Hourly</SelectItem>
                          <SelectItem value="Daily">Daily</SelectItem>
                          <SelectItem value="Weekly">Weekly</SelectItem>
                          <SelectItem value="Monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Backup Time</Label>
                      <Input
                        type="time"
                        value={dataSettings.backupTime}
                        onChange={(e) =>
                          setDataSettings({ ...dataSettings, backupTime: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Backup Storage Location</Label>
                    <Select
                      value={dataSettings.backupStorage}
                      onValueChange={(value) =>
                        setDataSettings({ ...dataSettings, backupStorage: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="local">Local Server</SelectItem>
                        <SelectItem value="cloud">Cloud Storage</SelectItem>
                        <SelectItem value="both">Both</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Cloud Backup</Label>
                      <p className="text-sm text-gray-600">Store backups in cloud storage</p>
                    </div>
                    <Switch
                      checked={dataSettings.cloudBackup}
                      onCheckedChange={(checked) =>
                        setDataSettings({ ...dataSettings, cloudBackup: checked })
                      }
                    />
                  </div>
                </>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <HardDrive className="h-5 w-5 text-blue-600" />
                  <p className="font-medium text-blue-900">Backup Status</p>
                </div>
                <div className="space-y-1 text-sm">
                  <p className="text-blue-800">
                    <strong>Last Backup:</strong> {systemInfo.lastBackup}
                  </p>
                  <p className="text-blue-800">
                    <strong>Next Scheduled Backup:</strong> {systemInfo.nextBackup}
                  </p>
                  <p className="text-blue-800">
                    <strong>Database Size:</strong> {systemInfo.databaseSize}
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button onClick={handleCreateBackup}>
                  <Database className="h-4 w-4 mr-2" />
                  Create Manual Backup
                </Button>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Download Latest Backup
                </Button>
                <Button variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  Restore from Backup
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Data Retention & Archiving</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Data Retention Period (days)</Label>
                <Input
                  type="number"
                  value={dataSettings.dataRetentionDays}
                  onChange={(e) =>
                    setDataSettings({ ...dataSettings, dataRetentionDays: parseInt(e.target.value) })
                  }
                  className="max-w-xs"
                />
                <p className="text-xs text-gray-500">
                  Data older than this period will be permanently deleted
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Auto-Archive Closed Cases</Label>
                    <p className="text-sm text-gray-600">Automatically archive closed cases after a period</p>
                  </div>
                  <Switch
                    checked={dataSettings.archiveClosedCases}
                    onCheckedChange={(checked) =>
                      setDataSettings({ ...dataSettings, archiveClosedCases: checked })
                    }
                  />
                </div>
                {dataSettings.archiveClosedCases && (
                  <div className="ml-6 space-y-2">
                    <Label>Archive After (days)</Label>
                    <Input
                      type="number"
                      value={dataSettings.archiveAfterDays}
                      onChange={(e) =>
                        setDataSettings({
                          ...dataSettings,
                          archiveAfterDays: parseInt(e.target.value),
                        })
                      }
                      className="max-w-xs"
                    />
                  </div>
                )}
              </div>

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Archived data can be restored, but permanently deleted data cannot be recovered
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integration Settings */}
        <TabsContent value="integration" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Wifi className="h-5 w-5 text-primary" />
                <CardTitle>API Configuration</CardTitle>
              </div>
              <CardDescription>Manage external API integrations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable API Access</Label>
                  <p className="text-sm text-gray-600">Allow external systems to access AfyaLink API</p>
                </div>
                <Switch
                  checked={apiSettings.apiEnabled}
                  onCheckedChange={(checked) => setApiSettings({ ...apiSettings, apiEnabled: checked })}
                />
              </div>

              {apiSettings.apiEnabled && (
                <>
                  <div className="space-y-2">
                    <Label>API Key</Label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Input
                          type={showApiKey ? 'text' : 'password'}
                          value={apiSettings.apiKey}
                          readOnly
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0"
                          onClick={() => setShowApiKey(!showApiKey)}
                        >
                          {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                      <Button variant="outline" onClick={handleRegenerateApiKey}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Regenerate
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Rate Limit (requests per hour)</Label>
                    <Input
                      type="number"
                      value={apiSettings.rateLimitPerHour}
                      onChange={(e) =>
                        setApiSettings({ ...apiSettings, rateLimitPerHour: parseInt(e.target.value) })
                      }
                      className="max-w-xs"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Webhook URL</Label>
                    <Input
                      placeholder="https://your-domain.com/webhook"
                      value={apiSettings.webhookUrl}
                      onChange={(e) => setApiSettings({ ...apiSettings, webhookUrl: e.target.value })}
                    />
                    <p className="text-xs text-gray-500">
                      Receive real-time notifications about system events
                    </p>
                  </div>

                  <Alert>
                    <Lock className="h-4 w-4" />
                    <AlertDescription>
                      Keep your API key secure. Do not share it or commit it to version control.
                    </AlertDescription>
                  </Alert>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>SMS Integration</CardTitle>
              <CardDescription>Configure SMS notifications for beneficiaries</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable SMS Notifications</Label>
                  <p className="text-sm text-gray-600">Send SMS alerts to beneficiaries and staff</p>
                </div>
                <Switch
                  checked={apiSettings.smsIntegration}
                  onCheckedChange={(checked) =>
                    setApiSettings({ ...apiSettings, smsIntegration: checked })
                  }
                />
              </div>

              {apiSettings.smsIntegration && (
                <>
                  <div className="space-y-2">
                    <Label>SMS Provider</Label>
                    <Select
                      value={apiSettings.smsProvider}
                      onValueChange={(value) => setApiSettings({ ...apiSettings, smsProvider: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select SMS provider" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="twilio">Twilio</SelectItem>
                        <SelectItem value="africastalking">Africa's Talking</SelectItem>
                        <SelectItem value="nexmo">Vonage (Nexmo)</SelectItem>
                        <SelectItem value="clickatell">Clickatell</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>SMS API Key</Label>
                    <Input
                      type="password"
                      placeholder="Enter SMS provider API key"
                      value={apiSettings.smsApiKey}
                      onChange={(e) => setApiSettings({ ...apiSettings, smsApiKey: e.target.value })}
                    />
                  </div>

                  <Button variant="outline">
                    <Mail className="h-4 w-4 mr-2" />
                    Send Test SMS
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Third-Party Integrations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                <div className="flex items-center gap-3">
                  <Cloud className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="font-medium text-sm">Google Drive</p>
                    <p className="text-xs text-gray-600">Backup documents to Google Drive</p>
                  </div>
                </div>
                <Badge variant="outline">Not Connected</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="font-medium text-sm">Microsoft Office 365</p>
                    <p className="text-xs text-gray-600">Email and calendar integration</p>
                  </div>
                </div>
                <Badge className="bg-green-100 text-green-800">Connected</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                <div className="flex items-center gap-3">
                  <Globe className="h-5 w-5 text-purple-500" />
                  <div>
                    <p className="font-medium text-sm">Slack</p>
                    <p className="text-xs text-gray-600">Team notifications via Slack</p>
                  </div>
                </div>
                <Badge variant="outline">Not Connected</Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-3">
        <Button variant="outline">Cancel Changes</Button>
        <Button onClick={handleSaveSettings}>
          <Save className="h-4 w-4 mr-2" />
          Save All Settings
        </Button>
      </div>
    </div>
  );
}
