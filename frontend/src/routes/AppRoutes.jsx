import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LoadingSpinner } from '../components/LoadingSpinner';

// Layout
import { AppLayout } from '../layouts/AppLayout';

// Auth Pages
import { Login } from '../pages/Login';
import { Register } from '../pages/Register';
import { ForgotPassword } from '../pages/ForgotPassword';
import { ResetPassword } from '../pages/ResetPassword';
import { Profile } from '../pages/Profile';

// Operational Pages
import { Dashboard } from '../pages/Dashboard';
import { ProcessesList } from '../pages/ProcessesList';
import { ProcessCreate } from '../pages/ProcessCreate';
import { ProcessStages } from '../pages/ProcessStages';
import { RequestsList } from '../pages/RequestsList';
import { RequestCreate } from '../pages/RequestCreate';
import { RequestTrack } from '../pages/RequestTrack';

// Analytics Pages
import { AnalyticsOverview } from '../pages/AnalyticsOverview';
import { AnalyticsBottlenecks } from '../pages/AnalyticsBottlenecks';
import { AnalyticsStages } from '../pages/AnalyticsStages';
import { AnalyticsDepartments } from '../pages/AnalyticsDepartments';
import { AnalyticsSLA } from '../pages/AnalyticsSLA';
import { AnalyticsSimulation } from '../pages/AnalyticsSimulation';

// Reports Pages
import { ImprovementReport } from '../pages/ImprovementReport';
import { SlaReport } from '../pages/SlaReport';

// Admin Pages
import { AdminUsers } from '../pages/AdminUsers';
import { AdminDepartments } from '../pages/AdminDepartments';
import { AdminAuditLogs } from '../pages/AdminAuditLogs';

// Protected Route Wrapper
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, role, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner message="Checking authentication session..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export const AppRoutes = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner message="Initializing application..." />;
  }

  return (
    <Routes>
      {/* Public Auth Routes */}
      <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" replace />} />
      <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/dashboard" replace />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Protected App Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />

        {/* Processes */}
        <Route path="processes" element={<ProcessesList />} />
        <Route
          path="processes/create"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <ProcessCreate />
            </ProtectedRoute>
          }
        />
        <Route path="processes/:id/stages" element={<ProcessStages />} />

        {/* Requests & Tracking */}
        <Route path="requests" element={<RequestsList />} />
        <Route path="requests/create" element={<RequestCreate />} />
        <Route path="requests/:id/track" element={<RequestTrack />} />

        {/* Analytics */}
        <Route path="analytics" element={<AnalyticsOverview />} />
        <Route path="analytics/bottlenecks" element={<AnalyticsBottlenecks />} />
        <Route path="analytics/stages" element={<AnalyticsStages />} />
        <Route path="analytics/departments" element={<AnalyticsDepartments />} />
        <Route path="analytics/sla" element={<AnalyticsSLA />} />
        <Route path="analytics/simulation" element={<AnalyticsSimulation />} />

        {/* Reports */}
        <Route path="reports/improvement" element={<ImprovementReport />} />
        <Route path="reports/sla" element={<SlaReport />} />

        {/* Admin */}
        <Route
          path="admin/users"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminUsers />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/departments"
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER']}>
              <AdminDepartments />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/audit-logs"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminAuditLogs />
            </ProtectedRoute>
          }
        />

        {/* Account */}
        <Route path="profile" element={<Profile />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};
