import React from 'react';

export const LoadingSpinner = ({ message = 'Loading operational analytics...' }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', gap: 16 }}>
      <div style={{
        width: 40,
        height: 40,
        borderRadius: '50%',
        border: '3px solid #e2e8f0',
        borderTopColor: '#2563eb',
        animation: 'spin 0.8s linear infinite'
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <p style={{ color: '#64748b', fontSize: '0.9rem', fontWeight: 500 }}>{message}</p>
    </div>
  );
};
