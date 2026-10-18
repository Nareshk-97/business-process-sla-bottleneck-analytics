import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  LayoutDashboard,
  GitBranch,
  FileText,
  BarChart3,
  AlertOctagon,
  SlidersHorizontal,
  FileSpreadsheet,
  Users,
  Building2,
  ShieldCheck,
  User,
  Layers,
  Activity
} from 'lucide-react';

export const Sidebar = () => {
  const { user, role } = useAuth();
  const isAdmin = role === 'ADMIN';
  const isManager = role === 'MANAGER' || isAdmin;

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="brand-icon">SLA</div>
        <div>
          <h1 className="brand-title">WorkflowSLA</h1>
          <div className="brand-subtitle">Analytics Platform</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-title">Core Operations</div>
        <NavLink to="/dashboard" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <LayoutDashboard size={18} />
          <span>Dashboard</span>
        </NavLink>
        <NavLink to="/requests" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <FileText size={18} />
          <span>Requests Queue</span>
        </NavLink>
        <NavLink to="/processes" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <GitBranch size={18} />
          <span>Business Processes</span>
        </NavLink>

        <div className="nav-section-title">Analytics Engine</div>
        <NavLink to="/analytics" end className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <BarChart3 size={18} />
          <span>Overview Metrics</span>
        </NavLink>
        <NavLink to="/analytics/bottlenecks" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <AlertOctagon size={18} />
          <span>Bottleneck Detector</span>
        </NavLink>
        <NavLink to="/analytics/stages" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Layers size={18} />
          <span>Stage Analytics</span>
        </NavLink>
        <NavLink to="/analytics/departments" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Building2 size={18} />
          <span>Department Stats</span>
        </NavLink>
        <NavLink to="/analytics/sla" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Activity size={18} />
          <span>SLA Compliance</span>
        </NavLink>
        <NavLink to="/analytics/simulation" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <SlidersHorizontal size={18} />
          <span>What-If Simulation</span>
        </NavLink>

        <div className="nav-section-title">Reports</div>
        <NavLink to="/reports/improvement" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <FileSpreadsheet size={18} />
          <span>Improvement Report</span>
        </NavLink>
        <NavLink to="/reports/sla" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <FileText size={18} />
          <span>SLA Audit Report</span>
        </NavLink>

        {isAdmin && (
          <>
            <div className="nav-section-title">Administration</div>
            <NavLink to="/admin/users" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <Users size={18} />
              <span>Users & Roles</span>
            </NavLink>
            <NavLink to="/admin/departments" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <Building2 size={18} />
              <span>Departments</span>
            </NavLink>
            <NavLink to="/admin/audit-logs" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <ShieldCheck size={18} />
              <span>System Audit Logs</span>
            </NavLink>
          </>
        )}

        <div className="nav-section-title">Account</div>
        <NavLink to="/profile" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <User size={18} />
          <span>My Profile</span>
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        <div className="user-snippet">
          <div className="user-avatar">
            {user?.full_name ? user.full_name[0].toUpperCase() : 'U'}
          </div>
          <div className="user-meta">
            <div className="user-name">{user?.full_name || 'Logged User'}</div>
            <div className="user-role-badge">{role || 'EMPLOYEE'}</div>
          </div>
        </div>
      </div>
    </aside>
  );
};
