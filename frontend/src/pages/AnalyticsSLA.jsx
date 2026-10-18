import React, { useState, useEffect } from 'react';
import { analyticsAPI, processesAPI } from '../services/api';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { StatusBadge } from '../components/StatusBadge';
import { Activity, AlertTriangle, ShieldCheck, Clock, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar } from 'recharts';

export const AnalyticsSLA = () => {
  const [data, setData] = useState(null);
  const [processes, setProcesses] = useState([]);
  const [selectedProcess, setSelectedProcess] = useState('');
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const params = selectedProcess ? { process_id: selectedProcess } : {};
      const [sRes, pRes] = await Promise.all([
        analyticsAPI.getSla(params),
        processesAPI.getAll()
      ]);
      if (sRes.success) setData(sRes.data);
      if (pRes.success) setProcesses(pRes.data);
    } catch (err) {
      console.error('Error loading SLA analytics', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedProcess]);

  if (loading) return <LoadingSpinner message="Evaluating enterprise SLA compliance records..." />;

  const priorityData = Object.entries(data?.violations_by_priority || {}).map(([p, count]) => ({
    priority: p,
    violations: count
  }));

  const trendData = data?.violations_trend || [];
  const atRisk = data?.at_risk_requests || [];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>SLA Compliance & Violation Audit</h2>
          <p style={{ fontSize: '0.84rem', color: '#64748b' }}>
            Tracking Service Level Agreement adherence across business priorities and live pipeline risks
          </p>
        </div>

        <select
          className="form-select"
          style={{ width: 220 }}
          value={selectedProcess}
          onChange={(e) => setSelectedProcess(e.target.value)}
        >
          <option value="">All Processes ({processes.length})</option>
          {processes.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      {/* Top Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div className="kpi-card" style={{ borderLeft: '4px solid #10b981' }}>
          <div className="kpi-header">
            <span className="kpi-title">Overall SLA Compliance</span>
            <ShieldCheck size={18} color="#10b981" />
          </div>
          <div className="kpi-value" style={{ color: data.overall_compliance_pct > 80 ? '#10b981' : '#dc2626' }}>
            {data.overall_compliance_pct}%
          </div>
          <div className="kpi-subtext">Across historical workflow requests</div>
        </div>

        <div className="kpi-card" style={{ borderLeft: '4px solid #ef4444' }}>
          <div className="kpi-header">
            <span className="kpi-title">Recorded SLA Breaches</span>
            <AlertTriangle size={18} color="#ef4444" />
          </div>
          <div className="kpi-value" style={{ color: '#dc2626' }}>
            {data.total_violations}
          </div>
          <div className="kpi-subtext">Total requests completing after SLA window</div>
        </div>

        <div className="kpi-card" style={{ borderLeft: '4px solid #f59e0b' }}>
          <div className="kpi-header">
            <span className="kpi-title">Active At-Risk Tasks</span>
            <Clock size={18} color="#f59e0b" />
          </div>
          <div className="kpi-value" style={{ color: '#d97706' }}>
            {atRisk.length}
          </div>
          <div className="kpi-subtext">Currently approaching or exceeding threshold</div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">SLA Violations Trend</h3>
          </div>
          <div className="card-body" style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Area type="monotone" dataKey="violations" stroke="#ef4444" fill="#fee2e2" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Violations by Request Priority</h3>
          </div>
          <div className="card-body" style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priorityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="priority" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="violations" fill="#d97706" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Live At-Risk Requests Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Live At-Risk Active Queue</h3>
          <p className="card-subtitle">Active stages currently in WARNING or VIOLATED status requiring operational triage</p>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          {atRisk.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: '#10b981', fontWeight: 600 }}>
              ✓ All currently active stages are operating smoothly within normal SLA limits!
            </div>
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Request ID</th>
                    <th>Process</th>
                    <th>At-Risk Stage</th>
                    <th>Department</th>
                    <th>SLA Target</th>
                    <th>Elapsed Time</th>
                    <th>% Used</th>
                    <th>Live SLA Status</th>
                  </tr>
                </thead>
                <tbody>
                  {atRisk.map((r, i) => (
                    <tr key={i}>
                      <td>
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#2563eb' }}>
                          {r.request_id}
                        </span>
                      </td>
                      <td>{r.process_name}</td>
                      <td><strong>{r.stage_name}</strong> (Seq {r.sequence})</td>
                      <td>{r.department_name}</td>
                      <td>{r.sla_duration_hours}h</td>
                      <td>
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#dc2626' }}>
                          {r.processing_time_hours}h
                        </span>
                      </td>
                      <td><strong>{r.sla_percentage_used}%</strong></td>
                      <td>
                        <StatusBadge status={r.sla_status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
