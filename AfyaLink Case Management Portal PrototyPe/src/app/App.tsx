// UI alignment and styling tweaks applied here
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import VerifyOTP from './pages/VerifyOTP';
import ResetPassword from './pages/ResetPassword';
import { DashboardLayout } from './components/DashboardLayout';
import { AdminDashboard } from './pages/dashboards/AdminDashboard';
import { SocialWorkerDashboard } from './pages/dashboards/SocialWorkerDashboard';
import { SupervisorDashboard } from './pages/dashboards/SupervisorDashboard';
import { Beneficiaries } from './pages/Beneficiaries';
import { Cases } from './pages/Cases';
import { Interventions } from './pages/Interventions';
import { Documents } from './pages/Documents';
import { Reports } from './pages/Reports';
import { Notifications } from './pages/Notifications';
import { Settings } from './pages/Settings';
import { UserManagement } from './pages/UserManagement';
import Collaboration from './pages/Collaboration';
import { FieldWork } from './pages/FieldWork';
import { CaseMonitor } from './pages/CaseMonitor';
import { Schedule } from './pages/Schedule';
import { SystemConfiguration } from './pages/SystemConfiguration';

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: string[] }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role || '')) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function AdminRoutes() {
  return (
    <DashboardLayout role="admin">
      <Routes>
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="beneficiaries" element={<Beneficiaries />} />
        <Route path="cases" element={<Cases />} />
        <Route path="interventions" element={<Interventions />} />
        <Route path="documents" element={<Documents />} />
        <Route path="reports" element={<Reports />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="collaboration" element={<Collaboration />} />
        <Route path="system-configuration" element={<SystemConfiguration />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Routes>
    </DashboardLayout>
  );
}

function SocialWorkerRoutes() {
  return (
    <DashboardLayout role="social_worker">
      <Routes>
        <Route path="dashboard" element={<SocialWorkerDashboard />} />
        <Route path="beneficiaries" element={<Beneficiaries />} />
        <Route path="cases" element={<Cases />} />
        <Route path="interventions" element={<Interventions />} />
        <Route path="field-work" element={<FieldWork />} />
        <Route path="schedule" element={<Schedule />} />
        <Route path="documents" element={<Documents />} />
        <Route path="reports" element={<Reports />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="collaboration" element={<Collaboration />} />
        <Route path="settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Routes>
    </DashboardLayout>
  );
}

function SupervisorRoutes() {
  return (
    <DashboardLayout role="supervisor">
      <Routes>
        <Route path="dashboard" element={<SupervisorDashboard />} />
        <Route path="beneficiaries" element={<Beneficiaries />} />
        <Route path="cases" element={<Cases />} />
        <Route path="interventions" element={<Interventions />} />
        <Route path="case-monitor" element={<CaseMonitor />} />
        <Route path="documents" element={<Documents />} />
        <Route path="reports" element={<Reports />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="collaboration" element={<Collaboration />} />
        <Route path="settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Routes>
    </DashboardLayout>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/verify-otp" element={<VerifyOTP />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminRoutes />
          </ProtectedRoute>
        }
      />

      <Route
        path="/social-worker/*"
        element={
          <ProtectedRoute allowedRoles={['social_worker']}>
            <SocialWorkerRoutes />
          </ProtectedRoute>
        }
      />

      <Route
        path="/supervisor/*"
        element={
          <ProtectedRoute allowedRoles={['supervisor']}>
            <SupervisorRoutes />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}