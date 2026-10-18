import React, { useState, useEffect } from 'react';
import { analyticsAPI, processesAPI, stagesAPI } from '../services/api';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { SlidersHorizontal, ArrowRight, TrendingDown, Clock, ShieldCheck, AlertCircle, Sparkles } from 'lucide-react';

export const AnalyticsSimulation = () => {
  const [processes, setProcesses] = useState([]);
  const [selectedProcessId, setSelectedProcessId] = useState('');
  const [stages, setStages] = useState([]);
  const [selectedStageId, setSelectedStageId] = useState('');

  const [proposedSla, setProposedSla] = useState(6.0);
  const [capacityChange, setCapacityChange] = useState(20); // +20% capacity

  const [simulationResult, setSimulationResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initLoading, setInitLoading] = useState(true);

  // Load processes on mount
  useEffect(() => {
    processesAPI.getAll().then((res) => {
      if (res.success && res.data.length > 0) {
        setProcesses(res.data);
        setSelectedProcessId(res.data[0].id);
      }
    }).finally(() => setInitLoading(false));
  }, []);

  // Load stages when process changes
  useEffect(() => {
    if (!selectedProcessId) return;
    stagesAPI.getByProcessId(selectedProcessId).then((res) => {
      if (res.success && res.data) {
        setStages(res.data);
        if (res.data.length > 0) {
          setSelectedStageId(res.data[0].id);
          setProposedSla(res.data[0].sla_duration_hours || 4.0);
        }
      }
    });
  }, [selectedProcessId]);

  // Run simulation
  const runSimulation = async () => {
    if (!selectedStageId) return;
    setLoading(true);
    try {
      const res = await analyticsAPI.simulate({
        process_id: parseInt(selectedProcessId),
        stage_id: parseInt(selectedStageId),
        proposed_sla_hours: parseFloat(proposedSla),
        capacity_change_pct: parseFloat(capacityChange)
      });
      if (res.success) {
        setSimulationResult(res.data);
      }
    } catch (err) {
      console.error('Simulation failed', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedStageId && proposedSla) {
      runSimulation();
    }
  }, [selectedStageId, proposedSla, capacityChange]);

  const handleStageChange = (stId) => {
    setSelectedStageId(stId);
    const st = stages.find(s => s.id === parseInt(stId));
    if (st) {
      setProposedSla(st.sla_duration_hours || 4.0);
    }
  };

  if (initLoading) return <LoadingSpinner message="Loading simulation model..." />;

  const currentStageObj = stages.find(s => s.id === parseInt(selectedStageId));

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
          What-If SLA Calibration & Capacity Simulator
        </h2>
        <p style={{ fontSize: '0.84rem', color: '#64748b' }}>
          Simulate the operational downstream impacts of revised SLA targets and workforce capacity allocations
        </p>
      </div>

      {/* Configuration Form Card */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <SlidersHorizontal size={18} color="#2563eb" />
            <h3 className="card-title">Simulation Scenario Parameters</h3>
          </div>
        </div>

        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
            <div className="form-group">
              <label className="form-label">Select Business Process</label>
              <select
                className="form-select"
                value={selectedProcessId}
                onChange={(e) => setSelectedProcessId(e.target.value)}
              >
                {processes.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Target Stage to Calibrate</label>
              <select
                className="form-select"
                value={selectedStageId}
                onChange={(e) => handleStageChange(e.target.value)}
              >
                {stages.map(s => (
                  <option key={s.id} value={s.id}>
                    Seq {s.sequence}: {s.name} (Current SLA: {s.sla_duration_hours}h)
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, padding: 16, background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
            {/* Slider 1: Proposed SLA Target */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <label className="form-label" style={{ marginBottom: 0 }}>Proposed SLA Window</label>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: '#2563eb' }}>
                  {proposedSla} Hours
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="24"
                step="0.5"
                style={{ width: '100%' }}
                value={proposedSla}
                onChange={(e) => setProposedSla(e.target.value)}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', color: '#64748b', marginTop: 4 }}>
                <span>1h (Aggressive)</span>
                <span>Current: {currentStageObj?.sla_duration_hours || 4}h</span>
                <span>24h (Relaxed)</span>
              </div>
            </div>

            {/* Slider 2: Capacity / Staffing Change */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <label className="form-label" style={{ marginBottom: 0 }}>Staffing & Automation Adjust</label>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: capacityChange >= 0 ? '#10b981' : '#ef4444' }}>
                  {capacityChange > 0 ? `+${capacityChange}%` : `${capacityChange}%`}
                </span>
              </div>
              <input
                type="range"
                min="-30"
                max="100"
                step="5"
                style={{ width: '100%' }}
                value={capacityChange}
                onChange={(e) => setCapacityChange(e.target.value)}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', color: '#64748b', marginTop: 4 }}>
                <span>-30% Capacity</span>
                <span>Baseline (0%)</span>
                <span>+100% Capacity</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Simulation Projection Results */}
      {loading ? (
        <LoadingSpinner message="Calculating empirical projection models..." />
      ) : simulationResult ? (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, marginBottom: 24 }}>
            {/* Projected Average Cycle Time */}
            <div className="kpi-card" style={{ borderLeft: '4px solid #2563eb' }}>
              <div className="kpi-header">
                <span className="kpi-title">Average Stage Duration</span>
                <Clock size={18} color="#2563eb" />
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
                <div className="kpi-value">{simulationResult.projected_avg_time_hours}h</div>
                <div style={{ fontSize: '0.85rem', color: '#64748b', textDecoration: 'line-through' }}>
                  {simulationResult.current_avg_time_hours}h
                </div>
              </div>
              <div className="kpi-subtext" style={{ color: simulationResult.estimated_improvement_pct >= 0 ? '#10b981' : '#ef4444', fontWeight: 600 }}>
                {simulationResult.estimated_improvement_pct >= 0 ? '▼ ' : '▲ '}
                {Math.abs(simulationResult.estimated_improvement_pct)}% cycle time difference
              </div>
            </div>

            {/* Projected SLA Violation Rate */}
            <div className="kpi-card" style={{ borderLeft: '4px solid #ef4444' }}>
              <div className="kpi-header">
                <span className="kpi-title">Projected Breach Rate</span>
                <AlertCircle size={18} color="#ef4444" />
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
                <div className="kpi-value" style={{ color: simulationResult.projected_violation_rate_pct > 30 ? '#dc2626' : '#16a34a' }}>
                  {simulationResult.projected_violation_rate_pct}%
                </div>
                <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                  was {simulationResult.current_violation_rate_pct}%
                </div>
              </div>
              <div className="kpi-subtext">
                Evaluated against {simulationResult.proposed_sla_hours}h proposed SLA
              </div>
            </div>

            {/* Estimated Efficiency Gain */}
            <div className="kpi-card" style={{ borderLeft: '4px solid #10b981' }}>
              <div className="kpi-header">
                <span className="kpi-title">Sample Executions Analyzed</span>
                <Sparkles size={18} color="#10b981" />
              </div>
              <div className="kpi-value">{simulationResult.sample_size}</div>
              <div className="kpi-subtext">
                Empirical historical stage executions
              </div>
            </div>
          </div>

          {/* Methodology & Disclaimer Banner */}
          <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 10, padding: '16px 20px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <ShieldCheck size={20} color="#2563eb" style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <h4 style={{ fontSize: '0.86rem', fontWeight: 700, color: '#1e293b' }}>
                Statistical Estimation Model
              </h4>
              <p style={{ fontSize: '0.82rem', color: '#475569', marginTop: 2 }}>
                {simulationResult.disclaimer}
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
