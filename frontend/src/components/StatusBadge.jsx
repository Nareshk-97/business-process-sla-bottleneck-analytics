import React from 'react';

export const StatusBadge = ({ status, type = 'status' }) => {
  if (!status) return null;

  const normalized = String(status).toLowerCase();
  let badgeClass = 'badge-pending';
  let label = status.replace(/_/g, ' ');

  if (normalized.includes('completed_within') || normalized === 'normal' || normalized === 'active') {
    badgeClass = 'badge-normal';
  } else if (normalized.includes('warning')) {
    badgeClass = 'badge-warning';
  } else if (normalized.includes('violated') || normalized.includes('completed_after') || normalized === 'critical') {
    badgeClass = 'badge-violated';
  } else if (normalized.includes('in_progress')) {
    badgeClass = 'badge-in_progress';
  }

  return (
    <span className={`badge ${badgeClass}`}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'currentColor' }} />
      {label}
    </span>
  );
};

export const PriorityBadge = ({ priority }) => {
  if (!priority) return null;
  const p = priority.toUpperCase();
  const cls = `priority-${p.toLowerCase()}`;
  return <span className={cls}>{p}</span>;
};
