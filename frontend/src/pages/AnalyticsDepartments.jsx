import React, { useState, useEffect } from 'react';
import { analyticsAPI } from '../services/api';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Building2, Clock, AlertTriangle, Inbox, CheckCircle2, TrendingUp } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';

export const AnalyticsDepartments = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyticsAPI.getDepartments().then((res) => {
      if (res.success) setData(res.data);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner message="Calculating cross-departmental workload distributions..." />;

  const departments = data?.departments || [];
  const highlights = data?.highlights || {};

  const chartData = departments.map(d => ({
    name: d.name.length > 14 ? d.name.slice(0, 14) + '...' : d.name,
    'Total Requests': d.total_requests,
    'Pending Queue': d.pending_workload,
    'SLA Violations': d.sla_violations
  }));

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>Department Operational Workload</h2>
        <p style={{ fontSize: '0.84rem', color: '#64748b' }}>
          Inter-departmental capacity friction, SLA breach distribution, and queue congestion
        </p>
      </div>

      {/* Highlights */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div className="card" style={{ padding: 18, background: '#fef2f2', borderColor: '#fecaca' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#dc2626', fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase' }}>
            <Clock size={14} /> Slowest Department
          </div>
          <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#7f1d1d', marginTop: 4 }}>
            {highlights.slowest_department?.name || 'N/A'}
          </h4>
          <p style={{ fontSize: '0.8rem', color: '#991b1b', marginTop: 2 }}>
            Avg Request Time: <strong>{highlights.slowest_department?.avg_request_processing_time}h</strong>
          </p>
        </div>

        <div className="card" style={{ padding: 18, background: '#fffbeb', borderColor: '#fde68a' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#d97706', fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase' }}>
            <Inbox size={14} /> Most Overloaded Department
          </div>
          <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#78350f', marginTop: 4 }}>
            {highlights.most_overloaded_department?.name || 'N/A'}
          </h4>
          <p style={{ fontSize: '0.8rem', color: '#92400e', marginTop: 2 }}>
            Pending Queue: <strong>{highlights.most_overloaded_department?.pending_workload} Active Tasks</strong>
          </p>
        </div>

        <div className="card" style={{ padding: 18, background: '#fff1f2', borderColor: '#fecdd3' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#e11d48', fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase' }}>
            <AlertTriangle size={14} /> Highest SLA Breaches
          </div>
          <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#881337', marginTop: 4 }}>
            {highlights.highest_violation_department?.name || 'N/A'}
          </h4>
          <p style={{ fontSize: '0.8rem', color: '#9f1239', marginTop: 2 }}>
            Violations: <strong>{highlights.highest_violation_department?.sla_violations} Breaches</strong> ({highlights.highest_violation_department?.sla_compliance_pct}% compliance)
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <h3 className="card-title">Department Workload Distribution</h3>
        </div>
        <div className="card-body" style={{ height: 320 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: '0.8rem' }} />
              <Bar dataKey="Total Requests" fill="#2563eb" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Pending Queue" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              <Bar dataKey="SLA Violations" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Department Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
        {departments.map((dept) => (
          <div key={dept.department_id} className="card" style={{ marginBottom: 0 }}>
            <div className="card-body">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>{dept.name}</h3>
                <span style={{ fontSize: '0.74rem', background: '#f1f5f9', padding: '2px 8px', borderRadius: 4, fontWeight: 700, color: '#475569' }}>
                  {dept.code}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, padding: 12, background: '#f8fafc', borderRadius: 8, fontSize: '0.8rem', marginTop: 12 }}>
                <div>
                  <span style={{ color: '#64748b' }}>Total Requests:</span>
                  <div style={{ fontWeight: 700, color: '#0f172a' }}>{dept.total_requests}</div>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>Completed:</span>
                  <div style={{ fontWeight: 700, color: '#10b981' }}>{dept.completed_requests}</div>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>Pending Workload:</span>
                  <div style={{ fontWeight: 700, color: '#f59e0b' }}>{dept.pending_workload} tasks</div>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>SLA Compliance:</span>
                  <div style={{ fontWeight: 700, color: dept.sla_compliance_pct > 80 ? '#10b981' : '#dc2626' }}>
                    {dept.sla_compliance_pct}%
                  </div>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>Avg Request Time:</span>
                  <div style={{ fontWeight: 700, color: '#0f172a' }}>{dept.avg_request_processing_time}h</div>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>Avg Stage Duration:</span>
                  <div style={{ fontWeight: 700, color: '#0f172a' }}>{dept.avg_stage_duration}h</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
