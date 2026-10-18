import React, { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Users, Shield, CheckCircle, XCircle } from 'lucide-react';

export const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      const res = await adminAPI.getUsers();
      if (res.success && res.data) {
        setUsers(res.data);
      }
    } catch (err) {
      console.error('Error fetching users', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleStatus = async (user) => {
    const updatedStatus = !user.is_active;
    try {
      await adminAPI.toggleUserStatus(user.id, { is_active: updatedStatus });
      fetchUsers();
    } catch (err) {
      alert(err.message || 'Failed to update user status');
    }
  };

  if (loading) return <LoadingSpinner message="Loading user directory..." />;

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>User & Access Management</h2>
        <p style={{ fontSize: '0.84rem', color: '#64748b' }}>
          Role-Based Access Control directory and credential status
        </p>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Authorized Users ({users.length})</h3>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Department</th>
                  <th>Status</th>
                  <th>Registered</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{u.full_name}</div>
                      <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{u.email}</div>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.74rem', fontWeight: 700, padding: '3px 8px', borderRadius: 4, background: u.role === 'ADMIN' ? '#fee2e2' : (u.role === 'MANAGER' ? '#e0f2fe' : '#f1f5f9'), color: u.role === 'ADMIN' ? '#dc2626' : (u.role === 'MANAGER' ? '#0369a1' : '#475569') }}>
                        {u.role}
                      </span>
                    </td>
                    <td>{u.department_name || 'Global Enterprise'}</td>
                    <td>
                      {u.is_active ? (
                        <span className="badge badge-normal">Active</span>
                      ) : (
                        <span className="badge badge-violated">Disabled</span>
                      )}
                    </td>
                    <td>
                      <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                        {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => handleToggleStatus(u)}
                      >
                        {u.is_active ? 'Disable' : 'Enable'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
