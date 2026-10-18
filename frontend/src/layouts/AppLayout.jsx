import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { Navbar } from '../components/Navbar';

export const AppLayout = () => {
  const location = useLocation();

  // Determine header title based on current route
  const getRouteTitle = () => {
    const path = location.pathname;
    if (path.includes('/dashboard')) return 'Management KPI Dashboard';
    if (path.includes('/requests/create')) return 'Submit New Workflow Request';
    if (path.includes('/requests') && path.includes('/track')) return 'Workflow Live Tracking';
    if (path.includes('/requests')) return 'Operational Request Queue';
    if (path.includes('/processes/create')) return 'Design New Business Process';
    if (path.includes('/processes')) return 'Business Process & SLA Definitions';
    if (path.includes('/analytics/bottlenecks')) return 'Algorithmic Bottleneck Detection';
    if (path.includes('/analytics/stages')) return 'Stage Latency & Volume Analytics';
    if (path.includes('/analytics/departments')) return 'Cross-Department Workload Analytics';
    if (path.includes('/analytics/sla')) return 'SLA Compliance & Violation Audit';
    if (path.includes('/analytics/simulation')) return 'What-If Operational SLA Simulation';
    if (path.includes('/analytics')) return 'Enterprise Operational Overview';
    if (path.includes('/reports/improvement')) return 'Data-Driven Improvement Recommendations';
    if (path.includes('/reports/sla')) return 'Comprehensive SLA Compliance Report';
    if (path.includes('/admin/users')) return 'User Access & RBAC Directory';
    if (path.includes('/admin/departments')) return 'Enterprise Department Management';
    if (path.includes('/admin/audit-logs')) return 'Immutable Security Audit Logs';
    if (path.includes('/profile')) return 'User Account Profile';
    return 'Workflow Intelligence Platform';
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-viewport">
        <Navbar title={getRouteTitle()} />
        <main className="content-body">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
