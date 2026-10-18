import React, { useState, useEffect } from 'react';
import { analyticsAPI, processesAPI } from '../services/api';
import { LoadingSpinner } from '../components/LoadingSpinner';
import {
  AlertOctagon,
  TrendingUp,
  Clock,
  AlertTriangle,
  Layers,
  Inbox,
  Activity,
  ShieldAlert,
  Info
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export const AnalyticsBottlenecks = () => {
  const [data, setData] = useState(null);
  const [processes, setProcesses] = useState([]);
  const [selectedProcess, setSelectedProcess] = useState('');
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const params = selectedProcess ? { process_id: selectedProcess } : {};
      const [bRes, pRes] = await Promise.all([
        analyticsAPI.getBottlenecks(params),
        processesAPI.getAll()
      ]);
      if (bRes.success) setData(bRes.data);
      if (pRes.success) setProcesses(pRes.data);
    } catch (err) {
      console.error('Error fetching bottleneck analytics', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedProcess]);

  if (loading) return <LoadingSpinner message="Executing multi-factor bottleneck ranking algorithm..." />;

  const major = data?.major_bottleneck;
  const ranked = data?.ranked_bottlenecks || [];

  // Chart data for top bottlenecks
  const chartData = ranked.slice(0, 8).map(r => ({
    name: r.stage_name.length > 15 ? r.stage_name.slice(0, 15) + '...' : r.stage_name,
    'Bottleneck Score': r.bottleneck_score,
    'SLA Violation %': r.violation_rate_pct
  }));

  const getRiskClass = (risk) => {
    switch (risk) {
      case 'CRITICAL': return 'risk-pill-critical';
      case 'HIGH': return 'risk-pill-high';
      case 'MEDIUM': return 'risk-pill-medium';
      default: return 'risk-pill-low';
    }
  };

  return (
    <div>
      {/* Header and Filter */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
            Multi-Factor Bottleneck Intelligence
          </h2>
          <p style={{ fontSize: '0.84rem', color: '#64748b' }}>
            Algorithmic diagnosis weighted across Processing Latency (30%), SLA Violation Rate (25%), Pending Backlog (20%), Volume (15%), and SLA Utilization (10%)
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <select
            className="form-select"
            style={{ width: 220 }}
            value={selectedProcess}
            onChange={(e) => setSelectedProcess(e.target.value)}
          >
            <option value="">All Workflows ({processes.length})</option>
            {processes.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Major Detected Bottleneck Callout */}
      {major ? (
        <div className="card" style={{ borderLeft: '4px solid #ef4444', marginBottom: 24 }}>
          <div className="card-header" style={{ background: '#fef2f2' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AlertOctagon size={18} />
              </div>
              <div>
                <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#991b1b', textTransform: 'uppercase' }}>
                  Critical Operational Bottleneck Identified
                </span>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#7f1d1d' }}>
                  {major.stage_name} <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#991b1b' }}>({major.process_name} — {major.department_name})</span>
                </h3>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span className={`badge ${getRiskClass(major.risk_level)}`} style={{ padding: '6px 14px', fontSize: '0.84rem' }}>
                {major.risk_level} RISK
              </span>
              <div style={{ background: 'white', padding: '6px 14px', borderRadius: 8, border: '1px solid #fecaca', textAlign: 'right' }}>
                <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', color: '#991b1b', fontWeight: 700 }}>Composite Score</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#dc2626', lineHeight: 1 }}>
                  {major.bottleneck_score}<span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>/100</span>
                </div>
              </div>
            </div>
          </div>

          <div className="card-body">
            {/* Algorithm Reason Explanation */}
            <div style={{ padding: 14, background: '#fff1f2', borderRadius: 8, border: '1px solid #fecdd3', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, color: '#9f1239', fontSize: '0.82rem', marginBottom: 4 }}>
                <Info size={15} /> Algorithmic Diagnosis & Root Cause Explanation:
              </div>
              <p style={{ fontSize: '0.88rem', color: '#881337', lineHeight: 1.5 }}>
                {major.explanation}
              </p>
            </div>

            {/* Metrics breakdown */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16 }}>
              <div style={{ padding: 12, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Avg Processing Time</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>{major.average_processing_time}h</div>
                <div style={{ fontSize: '0.74rem', color: '#64748b' }}>Target SLA: {major.sla_duration_hours}h</div>
              </div>

              <div style={{ padding: 12, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>SLA Violation Rate</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#dc2626' }}>{major.violation_rate_pct}%</div>
                <div style={{ fontSize: '0.74rem', color: '#64748b' }}>Breached executions</div>
              </div>

              <div style={{ padding: 12, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Pending Queue</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#d97706' }}>{major.pending_queue}</div>
                <div style={{ fontSize: '0.74rem', color: '#64748b' }}>Awaiting operator action</div>
              </div>

              <div style={{ padding: 12, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Request Volume</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#2563eb' }}>{major.request_volume}</div>
                <div style={{ fontSize: '0.74rem', color: '#64748b' }}>Total stage passes</div>
              </div>

              <div style={{ padding: 12, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>SLA Utilization</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#7c3aed' }}>{major.sla_utilization_pct}%</div>
                <div style={{ fontSize: '0.74rem', color: '#64748b' }}>Time window consumed</div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ padding: 20, background: '#ecfdf5', borderRadius: 8, color: '#065f46', marginBottom: 20 }}>
          No critical bottlenecks detected across selected workflow parameters.
        </div>
      )}

      {/* Bottlenecks Chart */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <div>
            <h3 className="card-title">Bottleneck Severity & SLA Breach Comparison</h3>
            <p className="card-subtitle">Composite score ranking across workflow stages</p>
          </div>
        </div>
        <div className="card-body" style={{ height: 320 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
              <Tooltip />
              <Bar dataKey="Bottleneck Score" fill="#ef4444" radius={[4, 4, 0, 0]} />
              <Bar dataKey="SLA Violation %" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Ranked Bottlenecks Table */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">All Ranked Operational Stages</h3>
            <p className="card-subtitle">Order of impact and operational risk prioritization</p>
          </div>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Stage Name & Workflow</th>
                  <th>Department</th>
                  <th>Bottleneck Score</th>
                  <th>Risk Level</th>
                  <th>Avg Time</th>
                  <th>SLA Target</th>
                  <th>Violation %</th>
                  <th>Queue</th>
                  <th>Volume</th>
                </tr>
              </thead>
              <tbody>
                {ranked.map((st) => (
                  <tr key={st.stage_id}>
                    <td>
                      <span style={{ fontWeight: 800, color: st.rank === 1 ? '#dc2626' : '#64748b' }}>
                        #{st.rank}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{st.stage_name}</div>
                      <div style={{ fontSize: '0.76rem', color: '#64748b' }}>{st.process_name} (Seq {st.sequence})</div>
                    </td>
                    <td>{st.department_name}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <strong style={{ fontSize: '0.92rem', color: st.bottleneck_score > 60 ? '#dc2626' : '#1e293b' }}>
                          {st.bottleneck_score}
                        </strong>
                        <div style={{ width: 40, height: 6, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ width: `${st.bottleneck_score}%`, height: '100%', background: st.bottleneck_score > 60 ? '#dc2626' : '#3b82f6' }} />
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${getRiskClass(st.risk_level)}`}>
                        {st.risk_level}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                        {st.average_processing_time}h
                      </span>
                    </td>
                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)', color: '#64748b' }}>
                        {st.sla_duration_hours}h
                      </span>
                    </td>
                    <td>
                      <span style={{ color: st.violation_rate_pct > 20 ? '#dc2626' : '#475569', fontWeight: 600 }}>
                        {st.violation_rate_pct}%
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, color: st.pending_queue > 5 ? '#d97706' : '#475569' }}>
                        {st.pending_queue}
                      </span>
                    </td>
                    <td>{st.request_volume}</td>
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
