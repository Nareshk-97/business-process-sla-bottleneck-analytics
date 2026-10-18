import React from 'react';
import { Inbox } from 'lucide-react';

export const EmptyState = ({ title = 'No records found', message = 'There are no records matching your current filter criteria.', action }) => {
  return (
    <div style={{ textAlign: 'center', padding: '48px 24px', backgroundColor: 'white', borderRadius: 12, border: '1px solid #e2e8f0' }}>
      <div style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#f1f5f9', color: '#64748b', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
        <Inbox size={24} />
      </div>
      <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a', marginBottom: 6 }}>{title}</h3>
      <p style={{ fontSize: '0.86rem', color: '#64748b', maxWidth: 400, margin: '0 auto 16px' }}>{message}</p>
      {action}
    </div>
  );
};
