import React, { useState, useEffect } from 'react';
import { reportsAPI, processesAPI } from '../services/api';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Printer, ShieldCheck, AlertTriangle, Activity } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export const SlaReport = () => {
  const [data, setData] = useState(null);
  const [processes, setProcesses] = useState([]);
  const [selectedProcess, setSelectedProcess] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchSla = async () => {
    setLoading(true);
    try {
      const params = selectedProcess ? { process_id: selectedProcess } : {};
      const [sRes, pRes] = await Promise.all([
        reportsAPI.getSlaReport(params),
        processesAPI.getAll()
      ]);
      if (sRes.success) setData(sRes.data);
      if (pRes.success) setProcesses(pRes.data);
    } catch (err) {
      console.error('Error fetching SLA report', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSla();
  }, [selectedProcess]);

  if (loading) return <LoadingSpinner message="Generating formal SLA compliance report..." />;

  const deptData = Object.entries(data?.violations_by_department || {}).map(([dept, count]) => ({
    department: dept,
    violations: count
  }));

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>Formal SLA Compliance Audit Report</h2>
          <p style={{ fontSize: '0.84rem', color: '#64748b' }}>
            Service Level Agreement compliance metrics, breach concentrations, and departmental distributions
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <select
            className="form-select"
            style={{ width: 220 }}
            value={selectedProcess}
            onChange={(e) => setSelectedProcess(e.target.value)}
          >
            <option value="">All Processes</option>
            {processes.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <button className="btn btn-primary" onClick={() => window.print()}>
            <Printer size={15} /> Print Report
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: '36px 40px', background: 'white' }}>
        <div style={{ borderBottom: '2px solid #0f172a', paddingBottom: 16, marginBottom: 24, display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#2563eb', textTransform: 'uppercase' }}>
              Compliance Assurance
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0f172a', marginTop: 4 }}>
              Enterprise SLA Audit & Breaches
            </h1>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: data.overall_compliance_pct > 80 ? '#10b981' : '#dc2626' }}>
              {data.overall_compliance_pct}%
            </div>
            <div style={{ fontSize: '0.74rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
              Compliance Adherence
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 28 }}>
          <div style={{ padding: 18, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
            <h4 style={{ fontSize: '0.86rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 8 }}>
              Recorded SLA Violations
            </h4>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#dc2626' }}>
              {data.total_violations}
            </div>
            <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 4 }}>
              Requests requiring escalation due to missed target deadlines
            </p>
          </div>

          <div style={{ padding: 18, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
            <h4 style={{ fontSize: '0.86rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 8 }}>
              Pipeline In-Flight Risks
            </h4>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#d97706' }}>
              {data.at_risk_requests?.length || 0}
            </div>
            <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 4 }}>
              Stages currently exceeding warning threshold without resolution
            </p>
          </div>
        </div>

        {/* Violations by Department Chart */}
        <div style={{ marginBottom: 28 }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', marginBottom: 12 }}>
            Violations Concentration by Department
          </h3>
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="department" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="violations" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
