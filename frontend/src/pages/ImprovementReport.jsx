import React, { useState, useEffect } from 'react';
import { reportsAPI, processesAPI } from '../services/api';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Printer, Sparkles, CheckCircle, AlertTriangle, ShieldCheck, ArrowRight, FileSpreadsheet } from 'lucide-react';

export const ImprovementReport = () => {
  const [report, setReport] = useState(null);
  const [processes, setProcesses] = useState([]);
  const [selectedProcess, setSelectedProcess] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const params = selectedProcess ? { process_id: selectedProcess } : {};
      const [rRes, pRes] = await Promise.all([
        reportsAPI.getImprovementReport(params),
        processesAPI.getAll()
      ]);
      if (rRes.success) setReport(rRes.data);
      if (pRes.success) setProcesses(pRes.data);
    } catch (err) {
      console.error('Error generating report', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [selectedProcess]);

  if (loading) return <LoadingSpinner message="Generating data-driven executive improvement report..." />;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      {/* Action Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a' }}>
            Process Improvement & Bottleneck Audit Report
          </h2>
          <p style={{ fontSize: '0.84rem', color: '#64748b' }}>
            Comprehensive analytics summary and data-derived operational recommendations
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <select
            className="form-select"
            style={{ width: 220 }}
            value={selectedProcess}
            onChange={(e) => setSelectedProcess(e.target.value)}
          >
            <option value="">All Business Processes</option>
            {processes.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <button className="btn btn-primary" onClick={handlePrint}>
            <Printer size={15} /> Print / Export PDF
          </button>
        </div>
      </div>

      {/* Report Document Shell */}
      <div className="card" style={{ padding: '36px 40px', background: 'white' }}>
        {/* Document Header */}
        <div style={{ borderBottom: '2px solid #0f172a', paddingBottom: 20, marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Operational Analytics Intelligence
            </div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0f172a', marginTop: 4 }}>
              Business Process SLA & Capacity Report
            </h1>
            <p style={{ fontSize: '0.86rem', color: '#64748b', marginTop: 4 }}>
              Target: {selectedProcess ? processes.find(p => p.id === parseInt(selectedProcess))?.name : 'Enterprise Global Workflows'} • Generated {new Date().toLocaleDateString()}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span className="badge badge-normal" style={{ fontSize: '0.8rem', padding: '6px 14px' }}>
              Official Audit
            </span>
          </div>
        </div>

        {/* Section 1: Executive Summary */}
        <div style={{ marginBottom: 32 }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sparkles size={18} color="#2563eb" /> 1. Executive Summary
          </h3>
          <div style={{ padding: 18, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.92rem', color: '#334155', lineHeight: 1.6 }}>
            {report.executive_summary}
          </div>
        </div>

        {/* Section 2: Key Operational Findings */}
        <div style={{ marginBottom: 32 }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', marginBottom: 12 }}>
            2. Key Analytical Findings
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {(report.key_findings || []).map((finding, idx) => (
              <div key={idx} style={{ padding: 16, background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#b45309', fontSize: '0.74rem', fontWeight: 800, textTransform: 'uppercase' }}>
                  <AlertTriangle size={14} /> {finding.category}
                </div>
                <h4 style={{ fontSize: '0.98rem', fontWeight: 800, color: '#78350f', marginTop: 4 }}>
                  {finding.title}
                </h4>
                <p style={{ fontSize: '0.86rem', color: '#92400e', marginTop: 4, lineHeight: 1.5 }}>
                  {finding.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Section 3: Data-Driven Recommendations */}
        <div style={{ marginBottom: 32 }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', marginBottom: 12 }}>
            3. Recommended Interventions & Workload Balancing
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {(report.recommendations || []).map((rec, idx) => (
              <div key={idx} style={{ padding: 16, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#16a34a', textTransform: 'uppercase' }}>
                    Target: {rec.target_stage} ({rec.department})
                  </span>
                  <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: 4, background: rec.priority === 'CRITICAL' ? '#fee2e2' : '#e0f2fe', color: rec.priority === 'CRITICAL' ? '#dc2626' : '#0369a1', fontWeight: 700 }}>
                    {rec.priority} PRIORITY
                  </span>
                </div>
                <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#14532d', marginTop: 6 }}>
                  {rec.action}
                </h4>
                <p style={{ fontSize: '0.86rem', color: '#166534', marginTop: 4, lineHeight: 1.5 }}>
                  {rec.detail}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Section 4: Operational Metrics Appendix */}
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', marginBottom: 12 }}>
            4. Core Execution KPI Appendix
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            <div style={{ padding: 12, background: '#f8fafc', borderRadius: 6, border: '1px solid #e2e8f0', textAlign: 'center' }}>
              <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Total Requests</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>{report.overview_kpis?.total_requests}</div>
            </div>
            <div style={{ padding: 12, background: '#f8fafc', borderRadius: 6, border: '1px solid #e2e8f0', textAlign: 'center' }}>
              <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Completion Rate</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#10b981' }}>{report.overview_kpis?.completion_rate_pct}%</div>
            </div>
            <div style={{ padding: 12, background: '#f8fafc', borderRadius: 6, border: '1px solid #e2e8f0', textAlign: 'center' }}>
              <div style={{ fontSize: '0.72rem', color: '#64748b' }}>SLA Compliance</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#2563eb' }}>{report.overview_kpis?.sla_compliance_rate_pct}%</div>
            </div>
            <div style={{ padding: 12, background: '#f8fafc', borderRadius: 6, border: '1px solid #e2e8f0', textAlign: 'center' }}>
              <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Avg Cycle Time</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>{report.overview_kpis?.avg_completion_time_hours}h</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
