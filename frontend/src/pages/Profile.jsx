import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { User, Mail, Shield, Building2, Calendar } from 'lucide-react';

export const Profile = () => {
  const { user, role } = useAuth();

  return (
    <div>
      <div className="card" style={{ maxWidth: 640 }}>
        <div className="card-header">
          <div>
            <h3 className="card-title">User Account Profile</h3>
            <p className="card-subtitle">Your organizational identity and security permissions</p>
          </div>
        </div>
        <div className="card-body">
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 28 }}>
            <div style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #2563eb, #6366f1)',
              color: 'white',
              fontSize: '1.6rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {user?.full_name ? user.full_name[0].toUpperCase() : 'U'}
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a' }}>{user?.full_name}</h3>
              <p style={{ fontSize: '0.86rem', color: '#64748b' }}>{user?.email}</p>
              <div style={{ marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: 6, background: '#f1f5f9', padding: '3px 10px', borderRadius: 999, fontSize: '0.74rem', fontWeight: 700, color: '#334155' }}>
                <Shield size={12} color="#2563eb" /> {role || 'EMPLOYEE'}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ padding: 14, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#64748b', fontSize: '0.78rem', marginBottom: 4 }}>
                <Building2 size={14} /> Assigned Department
              </div>
              <div style={{ fontWeight: 600, fontSize: '0.92rem', color: '#0f172a' }}>
                {user?.department_name || 'All Enterprise Departments'}
              </div>
            </div>

            <div style={{ padding: 14, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#64748b', fontSize: '0.78rem', marginBottom: 4 }}>
                <Calendar size={14} /> Account Status
              </div>
              <div style={{ fontWeight: 600, fontSize: '0.92rem', color: user?.is_active ? '#10b981' : '#ef4444' }}>
                {user?.is_active ? 'Active & Authorized' : 'Deactivated'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
