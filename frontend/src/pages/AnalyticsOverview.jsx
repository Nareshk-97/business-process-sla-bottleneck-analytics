import React, { useState, useEffect } from 'react';
import { analyticsAPI, processesAPI } from '../services/api';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { KpiCard } from '../components/KpiCard';
import { FileText, CheckCircle2, Clock, AlertTriangle, Activity, BarChart2 } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar } from 'recharts';

export const AnalyticsOverview = () => {
  const [data, setData] = useState(null);
  const [procList, setProcList] = useState([]);
  const [processes, setProcesses] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filterProcess, setFilterProcess] = useState('');
  const [filterPriority, setFilterPriority] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const params = {
        process_id: filterProcess || undefined,
        priority: filterPriority || undefined
      };
      const [ovRes, prRes, allProc] = await Promise.all([
        analyticsAPI.getOverview(params),
        analyticsAPI.getProcesses(),
        processesAPI.getAll()
      ]);
      if (ovRes.success) setData(ovRes.data);
      if (prRes.success) setProcList(prRes.data);
      if (allProc.success) setProcesses(allProc.data);
    } catch (err) {
      console.error('Error fetching analytics overview', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filterProcess, filterPriority]);

  if (loading) return <LoadingSpinner message="Aggregating enterprise process metrics..." />;

  const priorityData = Object.entries(data?.priority_distribution || {}).map(([p, count]) => ({
    priority: p,
    requests: count
  }));

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>Operational Analytics Overview</h2>
          <p style={{ fontSize: '0.84rem', color: '#64748b' }}>
            High-level operational performance, throughput distributions, and process-level metrics
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar">
        <select
          className="form-select"
          style={{ width: 220 }}
          value={filterProcess}
          onChange={(e) => setFilterProcess(e.target.value)}
        >
          <option value="">All Processes</option>
          {processes.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>

        <select
          className="form-select"
          style={{ width: 160 }}
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
        >
          <option value="">All Priorities</option>
          <option value="LOW">LOW</option>
          <option value="MEDIUM">MEDIUM</option>
          <option value="HIGH">HIGH</option>
          <option value="CRITICAL">CRITICAL</option>
        </select>

        {(filterProcess || filterPriority) && (
          <button className="btn btn-outline btn-sm" onClick={() => { setFilterProcess(''); setFilterPriority(''); }}>
            Reset Filters
          </button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        <KpiCard title="Total Requests" value={data.total_requests} icon={FileText} color="#2563eb" />
        <KpiCard title="Completion Rate" value={`${data.completion_rate_pct}%`} icon={CheckCircle2} color="#10b981" />
        <KpiCard title="SLA Compliance" value={`${data.sla_compliance_rate_pct}%`} icon={AlertTriangle} color="#f59e0b" />
        <KpiCard title="Average Duration" value={`${data.avg_completion_time_hours}h`} icon={Activity} color="#8b5cf6" />
        <KpiCard title="Median Duration" value={`${data.median_completion_time_hours}h`} icon={Clock} color="#06b6d4" />
      </div>

      {/* Charts */}
      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Intake Trajectory</h3>
          </div>
          <div className="card-body" style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.timeline || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Area type="monotone" dataKey="requests" stroke="#2563eb" fill="#eff6ff" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Priority Breakdown</h3>
          </div>
          <div className="card-body" style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priorityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="priority" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="requests" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Process-Level Comparison Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Business Process Performance Comparison</h3>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Process Workflow</th>
                  <th>Department</th>
                  <th>Total Requests</th>
                  <th>Completed</th>
                  <th>In Progress</th>
                  <th>SLA Target</th>
                  <th>Avg Cycle Time</th>
                  <th>SLA Compliance</th>
                  <th>Violations</th>
                </tr>
              </thead>
              <tbody>
                {procList.map((p) => (
                  <tr key={p.id}>
                    <td><strong>{p.name}</strong></td>
                    <td>{p.department_name}</td>
                    <td>{p.total_requests}</td>
                    <td><span style={{ color: '#10b981', fontWeight: 600 }}>{p.completed_requests}</span></td>
                    <td><span style={{ color: '#f59e0b', fontWeight: 600 }}>{p.in_progress_requests}</span></td>
                    <td>{p.overall_sla_hours}h</td>
                    <td><span style={{ fontFamily: 'var(--font-mono)' }}>{p.avg_completion_time_hours}h</span></td>
                    <td>
                      <strong style={{ color: p.sla_compliance_pct > 80 ? '#10b981' : '#dc2626' }}>
                        {p.sla_compliance_pct}%
                      </strong>
                    </td>
                    <td>
                      <span style={{ color: p.sla_violations > 0 ? '#dc2626' : '#10b981', fontWeight: 600 }}>
                        {p.sla_violations}
                      </span>
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
