import React, { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { RoleRoute } from './RoleRoute';
import { ROUTES } from './routeConstants';
import MainLayout from '../components/layout/MainLayout';
import PublicLayout from '../components/layout/PublicLayout';
import Spinner from '../components/common/Spinner';
import PerformancePage from '../pages/admin/PerformancePage';

const LandingPage = lazy(() => import('../pages/public/LandingPage'));
const LoginPage = lazy(() => import('../pages/public/LoginPage'));
const RegisterPage = lazy(() => import('../pages/public/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('../pages/public/ForgotPasswordPage'));
const VerifyOTPPage = lazy(() => import('../pages/public/VerifyOTPPage'));
const TwoFactorVerifyPage = lazy(() => import('../pages/public/TwoFactorVerifyPage'));
const ResetPasswordPage = lazy(() => import('../pages/public/ResetPasswordPage'));
const PrivacyPolicyPage = lazy(() => import('../pages/public/PrivacyPolicyPage'));
const TermsOfServicePage = lazy(() => import('../pages/public/TermsOfServicePage'));
const CookiePolicyPage = lazy(() => import('../pages/public/CookiePolicyPage'));
const NotFoundPage = lazy(() => import('../pages/public/NotFoundPage'));

const AdminDashboard = lazy(() => import('../pages/admin/AdminDashboard'));
const UserManagementPage = lazy(() => import('../pages/admin/UserManagementPage'));
const CreateUserPage = lazy(() => import('../pages/admin/CreateUserPage'));
const EditUserPage = lazy(() => import('../pages/admin/EditUserPage'));
const UserDetailPage = lazy(() => import('../pages/admin/UserDetailPage'));
const AdminCasesPage = lazy(() => import('../pages/admin/AdminCasesPage'));
const AdminCaseDetailPage = lazy(() => import('../pages/admin/AdminCaseDetailPage'));
const InterventionsPage = lazy(() => import('../pages/shared/InterventionsPage'));
const AuditLogsPage = lazy(() => import('../pages/admin/AuditLogsPage'));
const SystemSettingsPage = lazy(() => import('../pages/admin/SystemSettingsPage'));

const SupervisorDashboard = lazy(() => import('../pages/supervisor/SupervisorDashboard'));
const TeamCasesPage = lazy(() => import('../pages/supervisor/TeamCasesPage'));
const CaseMonitorPage = lazy(() => import('../pages/supervisor/CaseMonitorPage'));

const SocialWorkerDashboard = lazy(() => import('../pages/social-worker/SocialWorkerDashboard'));
const MyCasesPage = lazy(() => import('../pages/social-worker/MyCasesPage'));
const CreateCasePage = lazy(() => import('../pages/social-worker/CreateCasePage'));
const EditCasePage = lazy(() => import('../pages/social-worker/EditCasePage'));
const CaseDetailPage = lazy(() => import('../pages/social-worker/CaseDetailPage'));
const CaseEntriesPage = lazy(() => import('../pages/social-worker/CaseEntriesPage'));
const CreateCaseEntryPage = lazy(() => import('../pages/social-worker/CreateCaseEntryPage'));
const CreateInterventionPage = lazy(() => import('../pages/social-worker/CreateInterventionPage'));
const EditInterventionPage = lazy(() => import('../pages/social-worker/EditInterventionPage'));
const InterventionDetailPage = lazy(() => import('../pages/social-worker/InterventionDetailPage'));
const MyInterventionsPage = lazy(() => import('../pages/social-worker/MyInterventionsPage'));
const SchedulePage = lazy(() => import('../pages/social-worker/SchedulePage'));
const FieldWorkPage = lazy(() => import('../pages/social-worker/FieldWorkPage'));
const DocumentsPage = lazy(() => import('../pages/social-worker/DocumentsPage'));

const BeneficiariesPage = lazy(() => import('../pages/shared/BeneficiariesPage'));
const ReportsPage = lazy(() => import('../pages/shared/ReportsPage'));
const MyReportsPage = lazy(() => import('../pages/social-worker/MyReportsPage'));
const ReportBuilderPage = lazy(() => import('../pages/social-worker/ReportBuilderPage'));
const ReportViewPage = lazy(() => import('../pages/social-worker/ReportViewPage'));
const TeamAnalyticsPage = lazy(() => import('../pages/supervisor/TeamAnalyticsPage'));
const TeamReportsPage = lazy(() => import('../pages/supervisor/TeamReportsPage'));
const SupervisorReportViewPage = lazy(() => import('../pages/supervisor/SupervisorReportViewPage'));
const AdminReportViewPage = lazy(() => import('../pages/admin/AdminReportViewPage'));
const OrgAnalyticsPage = lazy(() => import('../pages/admin/OrgAnalyticsPage'));
const OrgReportsPage = lazy(() => import('../pages/admin/OrgReportsPage'));
const ProfilePage = lazy(() => import('../pages/shared/ProfilePage'));
const SettingsPage = lazy(() => import('../pages/shared/SettingsPage'));
const ChangePasswordPage = lazy(() => import('../pages/shared/ChangePasswordPage'));
const NotificationsPage = lazy(() => import('../pages/shared/NotificationsPage'));
const MessagesPage = lazy(() => import('../pages/shared/MessagesPage'));
const UnauthorizedPage = lazy(() => import('../pages/shared/UnauthorizedPage'));

const Loading = () => (
  <div className="flex items-center justify-center min-h-screen"><Spinner size="lg" /></div>
);

export default function AppRoutes() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        {/* Public routes */}
        <Route element={<PublicLayout />}>
          <Route path={ROUTES.HOME} element={<LandingPage />} />
          {/* <Route path={ROUTES.REGISTER} element={<RegisterPage />} /> - Public registration disabled */}
          <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPasswordPage />} />
          <Route path={ROUTES.VERIFY_OTP} element={<VerifyOTPPage />} />
          <Route path={ROUTES.VERIFY_2FA} element={<TwoFactorVerifyPage />} />
          <Route path={ROUTES.RESET_PASSWORD} element={<ResetPasswordPage />} />
          <Route path={ROUTES.PRIVACY_POLICY} element={<PrivacyPolicyPage />} />
          <Route path={ROUTES.TERMS_OF_SERVICE} element={<TermsOfServicePage />} />
          <Route path={ROUTES.COOKIE_POLICY} element={<CookiePolicyPage />} />
        </Route>
        <Route path={ROUTES.LOGIN} element={<LoginPage />} />

        {/* Admin routes */}
        <Route path="/admin" element={<ProtectedRoute><RoleRoute allowedRoles={['ADMIN']}><MainLayout /></RoleRoute></ProtectedRoute>}>
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<UserManagementPage />} />
          <Route path="users/create" element={<CreateUserPage />} />
          <Route path="users/:id/edit" element={<EditUserPage />} />
          <Route path="users/:id" element={<UserDetailPage />} />
          <Route path="beneficiaries" element={<BeneficiariesPage />} />
          <Route path="cases" element={<AdminCasesPage />} />
          <Route path="cases/new" element={<CreateCasePage />} />
          <Route path="cases/create" element={<CreateCasePage />} />
          <Route path="cases/:id" element={<AdminCaseDetailPage />} />
          <Route path="interventions" element={<InterventionsPage />} />
          <Route path="reports" element={<OrgReportsPage />} />
          <Route path="reports/:id" element={<AdminReportViewPage />} />
          <Route path="analytics" element={<OrgAnalyticsPage />} />
          <Route path="performance" element={<PerformancePage />} />
          <Route path="audit-logs" element={<AuditLogsPage />} />
          <Route path="system-settings" element={<SystemSettingsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        {/* Supervisor routes */}
        <Route path="/supervisor" element={<ProtectedRoute><RoleRoute allowedRoles={['SUPERVISOR']}><MainLayout /></RoleRoute></ProtectedRoute>}>
          <Route path="dashboard" element={<SupervisorDashboard />} />
          <Route path="beneficiaries" element={<BeneficiariesPage />} />
          <Route path="cases" element={<TeamCasesPage />} />
          <Route path="cases/:id" element={<CaseDetailPage />} />
          <Route path="interventions" element={<InterventionsPage />} />
          <Route path="interventions/:id" element={<InterventionDetailPage />} />
          <Route path="case-monitor" element={<CaseMonitorPage />} />
          <Route path="analytics" element={<TeamAnalyticsPage />} />
          <Route path="team-reports" element={<TeamReportsPage />} />
          <Route path="team-reports/:id" element={<SupervisorReportViewPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        {/* Social Worker routes */}
        <Route path="/social-worker" element={<ProtectedRoute><RoleRoute allowedRoles={['SOCIAL_WORKER']}><MainLayout /></RoleRoute></ProtectedRoute>}>
          <Route path="dashboard" element={<SocialWorkerDashboard />} />
          <Route path="beneficiaries" element={<BeneficiariesPage />} />
          <Route path="cases" element={<MyCasesPage />} />
          <Route path="cases/new" element={<CreateCasePage />} />
          <Route path="cases/create" element={<CreateCasePage />} />
          <Route path="cases/:id" element={<CaseDetailPage />} />
          <Route path="cases/:id/edit" element={<EditCasePage />} />
          <Route path="cases/:id/entries" element={<CaseEntriesPage />} />
          <Route path="cases/:id/entries/create" element={<CreateCaseEntryPage />} />
          <Route path="interventions" element={<MyInterventionsPage />} />
          <Route path="interventions/create" element={<CreateInterventionPage />} />
          <Route path="interventions/:id" element={<InterventionDetailPage />} />
          <Route path="interventions/:id/edit" element={<EditInterventionPage />} />
          <Route path="schedule" element={<SchedulePage />} />
          <Route path="field-work" element={<FieldWorkPage />} />
          <Route path="documents" element={<DocumentsPage />} />
          <Route path="my-reports" element={<MyReportsPage />} />
          <Route path="my-reports/create" element={<ReportBuilderPage />} />
          <Route path="my-reports/:id" element={<ReportViewPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        {/* Shared authenticated routes */}
        <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
          <Route path={ROUTES.SHARED.PROFILE} element={<ProfilePage />} />
          <Route path={ROUTES.SHARED.CHANGE_PASSWORD} element={<ChangePasswordPage />} />
          <Route path={ROUTES.SHARED.NOTIFICATIONS} element={<NotificationsPage />} />
          <Route path={ROUTES.SHARED.MESSAGES} element={<MessagesPage />} />
          <Route path={ROUTES.SHARED.SETTINGS} element={<SettingsPage />} />
        </Route>

        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route path={ROUTES.NOT_FOUND} element={<NotFoundPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
