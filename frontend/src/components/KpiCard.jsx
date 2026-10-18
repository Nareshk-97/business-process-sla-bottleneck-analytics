import React from 'react';

export const KpiCard = ({ title, value, subtext, icon: Icon, color = '#2563eb', trend }) => {
  return (
    <div className="kpi-card">
      <div className="kpi-header">
        <span className="kpi-title">{title}</span>
        {Icon && (
          <div className="kpi-icon" style={{ backgroundColor: `${color}15`, color: color }}>
            <Icon size={18} />
          </div>
        )}
      </div>
      <div>
        <div className="kpi-value">{value ?? '—'}</div>
        {subtext && <div className="kpi-subtext">{subtext}</div>}
      </div>
    </div>
  );
};
