import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { processesAPI } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { StatusBadge, PriorityBadge } from '../components/StatusBadge';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { GitBranch, Plus, ArrowRight, Clock, Layers, Building2 } from 'lucide-react';

export const ProcessesList = () => {
  const [processes, setProcesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const { role } = useAuth();
  const isAdmin = role === 'ADMIN';

  useEffect(() => {
    processesAPI.getAll().then((res) => {
      if (res.success && res.data) {
        setProcesses(res.data);
      }
    }).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>Business Process Workflows</h2>
          <p style={{ fontSize: '0.84rem', color: '#64748b' }}>
            Enterprise multi-stage definitions, departmental assignments, and overarching SLA thresholds
          </p>
        </div>
        {isAdmin && (
          <Link to="/processes/create" className="btn btn-primary">
            <Plus size={16} /> Define New Process
          </Link>
        )}
      </div>

      {loading ? (
        <LoadingSpinner message="Loading workflow definitions..." />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
          {processes.map((proc) => (
            <div key={proc.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div className="card-body">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <GitBranch size={16} />
                    </div>
                    <StatusBadge status={proc.status} />
                  </div>
                  <PriorityBadge priority={proc.priority} />
                </div>

                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>
                  {proc.name}
                </h3>
                <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: 16, lineClamp: 2 }}>
                  {proc.description || 'Enterprise standardized workflow process.'}
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: 12, background: '#f8fafc', borderRadius: 8, fontSize: '0.8rem' }}>
                  <div>
                    <span style={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Building2 size={13} /> Dept
                    </span>
                    <strong style={{ color: '#1e293b' }}>{proc.department_name}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={13} /> Total SLA
                    </span>
                    <strong style={{ color: '#2563eb' }}>{proc.overall_sla_hours} Hours</strong>
                  </div>
                </div>

                {/* Stages count & preview */}
                <div style={{ marginTop: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.76rem', color: '#64748b', marginBottom: 6 }}>
                    <span>Configured Stages:</span>
                    <strong style={{ color: '#0f172a' }}>{proc.stage_count || (proc.stages ? proc.stages.length : 0)} Stages</strong>
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {(proc.stages || []).slice(0, 5).map((st, i) => (
                      <div
                        key={st.id || i}
                        title={`Stage ${st.sequence}: ${st.name} (${st.sla_duration_hours}h SLA)`}
                        style={{ flex: 1, height: 6, borderRadius: 3, background: '#3b82f6' }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ padding: '12px 24px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Link to={`/processes/${proc.id}/stages`} style={{ fontSize: '0.8rem', color: '#2563eb', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                  Manage Stages & SLA <ArrowRight size={13} />
                </Link>
                <Link to={`/requests/create`} className="btn btn-outline btn-sm" style={{ padding: '4px 10px' }}>
                  Start Request
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
