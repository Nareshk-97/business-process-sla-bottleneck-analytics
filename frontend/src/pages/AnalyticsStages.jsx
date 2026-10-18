import React, { useState, useEffect } from 'react';
import { analyticsAPI, processesAPI } from '../services/api';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Layers, Zap, Clock, AlertTriangle, Inbox } from 'lucide-react';

export const AnalyticsStages = () => {
  const [data, setData] = useState(null);
  const [processes, setProcesses] = useState([]);
  const [selectedProcess, setSelectedProcess] = useState('');
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const params = selectedProcess ? { process_id: selectedProcess } : {};
      const [sRes, pRes] = await Promise.all([
        analyticsAPI.getStages(params),
        processesAPI.getAll()
      ]);
      if (sRes.success) setData(sRes.data);
      if (pRes.success) setProcesses(pRes.data);
    } catch (err) {
      console.error('Error fetching stage analytics', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedProcess]);

  if (loading) return <LoadingSpinner message="Calculating stage latency distributions..." />;

  const stages = data?.stages || [];
  const highlights = data?.highlights || {};

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>Stage-Level Latency & Volume Analytics</h2>
          <p style={{ fontSize: '0.84rem', color: '#64748b' }}>
            Empirical runtime performance, SLA utilization windows, and cycle times by workflow stage
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

      {/* Highlights row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div className="card" style={{ padding: 16, background: '#f0fdf4', borderColor: '#bbf7d0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#16a34a', fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase' }}>
            <Zap size={14} /> Fastest Stage
          </div>
          <h4 style={{ fontSize: '0.96rem', fontWeight: 700, color: '#14532d', marginTop: 4 }}>
            {highlights.fastest_stage?.stage_name || 'N/A'}
          </h4>
          <p style={{ fontSize: '0.78rem', color: '#166534', marginTop: 2 }}>
            Avg: <strong>{highlights.fastest_stage?.average_processing_time}h</strong> (SLA: {highlights.fastest_stage?.sla_duration_hours}h)
          </p>
        </div>

        <div className="card" style={{ padding: 16, background: '#fef2f2', borderColor: '#fecaca' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#dc2626', fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase' }}>
            <Clock size={14} /> Slowest Stage
          </div>
          <h4 style={{ fontSize: '0.96rem', fontWeight: 700, color: '#7f1d1d', marginTop: 4 }}>
            {highlights.slowest_stage?.stage_name || 'N/A'}
          </h4>
          <p style={{ fontSize: '0.78rem', color: '#991b1b', marginTop: 2 }}>
            Avg: <strong>{highlights.slowest_stage?.average_processing_time}h</strong> (SLA: {highlights.slowest_stage?.sla_duration_hours}h)
          </p>
        </div>

        <div className="card" style={{ padding: 16, background: '#fffbeb', borderColor: '#fde68a' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#d97706', fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase' }}>
            <AlertTriangle size={14} /> Most Violated Stage
          </div>
          <h4 style={{ fontSize: '0.96rem', fontWeight: 700, color: '#78350f', marginTop: 4 }}>
            {highlights.most_violated_stage?.stage_name || 'N/A'}
          </h4>
          <p style={{ fontSize: '0.78rem', color: '#92400e', marginTop: 2 }}>
            Breach Rate: <strong>{highlights.most_violated_stage?.sla_violation_percentage}%</strong>
          </p>
        </div>

        <div className="card" style={{ padding: 16, background: '#eff6ff', borderColor: '#bfdbfe' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#2563eb', fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase' }}>
            <Inbox size={14} /> Most Loaded Stage
          </div>
          <h4 style={{ fontSize: '0.96rem', fontWeight: 700, color: '#1e3a8a', marginTop: 4 }}>
            {highlights.most_loaded_stage?.stage_name || 'N/A'}
          </h4>
          <p style={{ fontSize: '0.78rem', color: '#1d4ed8', marginTop: 2 }}>
            Total Executions: <strong>{highlights.most_loaded_stage?.total_executions}</strong>
          </p>
        </div>
      </div>

      {/* Full Stages Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Comprehensive Stage Performance Breakdown</h3>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Stage Name & Workflow</th>
                  <th>Dept</th>
                  <th>Executions</th>
                  <th>Pending</th>
                  <th>Avg Time</th>
                  <th>Median</th>
                  <th>Min / Max</th>
                  <th>SLA Target</th>
                  <th>Violations</th>
                  <th>Violation %</th>
                  <th>Utilization</th>
                </tr>
              </thead>
              <tbody>
                {stages.map((st) => (
                  <tr key={st.stage_id}>
                    <td>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{st.stage_name}</div>
                      <div style={{ fontSize: '0.76rem', color: '#64748b' }}>{st.process_name} (Seq {st.sequence})</div>
                    </td>
                    <td>{st.department_name}</td>
                    <td><strong>{st.total_executions}</strong></td>
                    <td>{st.pending_executions}</td>
                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: st.average_processing_time > st.sla_duration_hours ? '#dc2626' : '#0f172a' }}>
                        {st.average_processing_time}h
                      </span>
                    </td>
                    <td>{st.median_processing_time}h</td>
                    <td style={{ fontSize: '0.78rem', color: '#64748b' }}>
                      {st.minimum_processing_time}h / {st.maximum_processing_time}h
                    </td>
                    <td>{st.sla_duration_hours}h</td>
                    <td>
                      <span style={{ fontWeight: 700, color: st.sla_violations > 0 ? '#dc2626' : '#16a34a' }}>
                        {st.sla_violations}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, color: st.sla_violation_percentage > 25 ? '#dc2626' : '#334155' }}>
                        {st.sla_violation_percentage}%
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span>{st.sla_utilization_percentage}%</span>
                        <div style={{ width: 40, height: 5, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ width: `${Math.min(100, st.sla_utilization_percentage)}%`, height: '100%', background: st.sla_utilization_percentage > 100 ? '#dc2626' : '#2563eb' }} />
                        </div>
                      </div>
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
