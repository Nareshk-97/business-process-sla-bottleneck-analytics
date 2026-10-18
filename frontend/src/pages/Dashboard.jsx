import React, { useState, useEffect } from 'react';
import { analyticsAPI, processesAPI } from '../services/api';
import { KpiCard } from '../components/KpiCard';
import { StatusBadge } from '../components/StatusBadge';
import { LoadingSpinner } from '../components/LoadingSpinner';
import {
  FileText,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Activity,
  Layers,
  Building2,
  TrendingUp,
  AlertOctagon,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
  CartesianGrid
} from 'recharts';

const PIE_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];

export const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [stagesData, setStagesData] = useState(null);
  const [bottlenecks, setBottlenecks] = useState(null);
  const [deptData, setDeptData] = useState(null);
  const [processes, setProcesses] = useState([]);
  const [filterProcess, setFilterProcess] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const params = filterProcess ? { process_id: filterProcess } : {};
      const [ovRes, stRes, bnRes, dpRes, prRes] = await Promise.all([
        analyticsAPI.getOverview(params),
        analyticsAPI.getStages(params),
        analyticsAPI.getBottlenecks(params),
        analyticsAPI.getDepartments(),
        processesAPI.getAll()
      ]);

      if (ovRes.success) setOverview(ovRes.data);
      if (stRes.success) setStagesData(stRes.data);
      if (bnRes.success) setBottlenecks(bnRes.data);
      if (dpRes.success) setDeptData(dpRes.data);
      if (prRes.success) setProcesses(prRes.data);
    } catch (err) {
      console.error('Error fetching dashboard metrics', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filterProcess]);

  if (loading || !overview) {
    return <LoadingSpinner message="Calculating real-time SLA metrics from execution records..." />;
  }

  // Pie chart data for status distribution
  const statusPieData = [
    { name: 'Completed', value: overview.completed_requests || 0 },
    { name: 'In Progress', value: overview.in_progress_requests || 0 },
    { name: 'Pending', value: overview.pending_requests || 0 }
  ].filter(d => d.value > 0);

  // Grouped bar chart data: Top 6 stages avg time vs SLA target
  const stageTimeData = (stagesData?.stages || []).slice(0, 6).map(s => ({
    name: s.stage_name.length > 16 ? s.stage_name.slice(0, 16) + '...' : s.stage_name,
    'Avg Time (h)': s.average_processing_time,
    'SLA Target (h)': s.sla_duration_hours,
  }));

  // Department workload data
  const deptWorkloadData = (deptData?.departments || []).map(d => ({
    name: d.code,
    'Requests': d.total_requests,
    'Violations': d.sla_violations,
    'Pending': d.pending_workload
  }));

  const majorBottleneck = bottlenecks?.major_bottleneck;
  const slowestStage = stagesData?.highlights?.slowest_stage;
  const mostViolatedStage = stagesData?.highlights?.most_violated_stage;
  const slowestDept = deptData?.highlights?.slowest_department;

  return (
    <div>
      {/* Filter Bar */}
      <div className="filter-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#475569' }}>Filter Process:</span>
          <select
            className="form-select"
            style={{ width: 240 }}
            value={filterProcess}
            onChange={(e) => setFilterProcess(e.target.value)}
          >
            <option value="">All Business Processes ({processes.length})</option>
            {processes.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        {filterProcess && (
          <button className="btn btn-outline btn-sm" onClick={() => setFilterProcess('')}>
            Reset Filter
          </button>
        )}
      </div>

      {/* KPI Cards Row */}
      <div className="kpi-grid">
        <KpiCard
          title="Total Requests"
          value={overview.total_requests}
          subtext={`Across all active business lines`}
          icon={FileText}
          color="#2563eb"
        />
        <KpiCard
          title="Completed"
          value={overview.completed_requests}
          subtext={`${overview.completion_rate_pct}% overall completion rate`}
          icon={CheckCircle2}
          color="#10b981"
        />
        <KpiCard
          title="In Progress"
          value={overview.in_progress_requests}
          subtext={`${overview.pending_requests} pending in queue`}
          icon={Clock}
          color="#f59e0b"
        />
        <KpiCard
          title="SLA Violations"
          value={overview.sla_violations}
          subtext={`${overview.sla_compliance_rate_pct}% compliance rate`}
          icon={AlertTriangle}
          color="#ef4444"
        />
        <KpiCard
          title="Avg Cycle Time"
          value={`${overview.avg_completion_time_hours}h`}
          subtext={`Median: ${overview.median_completion_time_hours}h (Max: ${overview.max_completion_time_hours}h)`}
          icon={Activity}
          color="#8b5cf6"
        />
      </div>

      {/* Operational Highlights Banner */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 24 }}>
        {majorBottleneck && (
          <div style={{ background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: 12, padding: '16px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#e11d48', fontWeight: 700, fontSize: '0.82rem', textTransform: 'uppercase' }}>
              <AlertOctagon size={16} /> Major Operational Bottleneck
            </div>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#881337', marginTop: 4 }}>
              {majorBottleneck.stage_name}
            </h4>
            <p style={{ fontSize: '0.8rem', color: '#9f1239', marginTop: 4 }}>
              Score: <strong>{majorBottleneck.bottleneck_score}/100</strong> ({majorBottleneck.risk_level} Risk) • Avg Duration: {majorBottleneck.average_processing_time}h (SLA: {majorBottleneck.sla_duration_hours}h)
            </p>
            <Link to="/analytics/bottlenecks" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.78rem', color: '#be123c', fontWeight: 700, marginTop: 8 }}>
              Diagnose Bottleneck <ArrowRight size={13} />
            </Link>
          </div>
        )}

        {mostViolatedStage && (
          <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12, padding: '16px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#d97706', fontWeight: 700, fontSize: '0.82rem', textTransform: 'uppercase' }}>
              <AlertTriangle size={16} /> Highest SLA Violation Rate
            </div>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#78350f', marginTop: 4 }}>
              {mostViolatedStage.stage_name}
            </h4>
            <p style={{ fontSize: '0.8rem', color: '#92400e', marginTop: 4 }}>
              Breach Rate: <strong>{mostViolatedStage.sla_violation_percentage}%</strong> ({mostViolatedStage.sla_violations} violations recorded)
            </p>
            <Link to="/analytics/stages" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.78rem', color: '#b45309', fontWeight: 700, marginTop: 8 }}>
              View Stage Metrics <ArrowRight size={13} />
            </Link>
          </div>
        )}

        {slowestDept && (
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: '16px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#16a34a', fontWeight: 700, fontSize: '0.82rem', textTransform: 'uppercase' }}>
              <Building2 size={16} /> Slowest Department Lead Time
            </div>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#14532d', marginTop: 4 }}>
              {slowestDept.name}
            </h4>
            <p style={{ fontSize: '0.8rem', color: '#166534', marginTop: 4 }}>
              Avg Duration: <strong>{slowestDept.avg_request_processing_time}h</strong> • Pending Queue: {slowestDept.pending_workload} items
            </p>
            <Link to="/analytics/departments" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.78rem', color: '#15803d', fontWeight: 700, marginTop: 8 }}>
              Explore Departments <ArrowRight size={13} />
            </Link>
          </div>
        )}
      </div>

      {/* Primary Analytics Charts Row */}
      <div className="grid-2">
        {/* Timeline Area Chart */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Request Intake Velocity Over Time</h3>
              <p className="card-subtitle">Daily intake trends across recorded operational timeline</p>
            </div>
          </div>
          <div className="card-body" style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={overview.timeline || []}>
                <defs>
                  <linearGradient id="colorReq" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Area type="monotone" dataKey="requests" stroke="#2563eb" strokeWidth={2} fillOpacity={1} fill="url(#colorReq)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Distribution Pie Chart */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Request Pipeline Distribution</h3>
              <p className="card-subtitle">Active execution state breakdown</p>
            </div>
          </div>
          <div className="card-body" style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {statusPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Secondary Analytics Charts Row */}
      <div className="grid-2">
        {/* Stage Average Time vs SLA Target Bar Chart */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Stage Processing Duration vs SLA Target</h3>
              <p className="card-subtitle">Comparing actual processing time against configured SLA thresholds</p>
            </div>
          </div>
          <div className="card-body" style={{ height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stageTimeData} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} label={{ value: 'Hours', angle: -90, position: 'insideLeft', fontSize: 11 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '0.8rem' }} />
                <Bar dataKey="Avg Time (h)" fill="#ef4444" radius={[4, 4, 0, 0]} />
                <Bar dataKey="SLA Target (h)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Department Workload & Violations */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Department Workload & Violations</h3>
              <p className="card-subtitle">Volume and SLA breaches categorized by business department</p>
            </div>
          </div>
          <div className="card-body" style={{ height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptWorkloadData} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '0.8rem' }} />
                <Bar dataKey="Requests" fill="#2563eb" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Pending" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Violations" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
