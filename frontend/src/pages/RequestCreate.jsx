import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { requestsAPI, processesAPI } from '../services/api';
import { ArrowLeft, Send, GitBranch, AlertCircle } from 'lucide-react';

export const RequestCreate = () => {
  const [processes, setProcesses] = useState([]);
  const [processId, setProcessId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [selectedProcess, setSelectedProcess] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    processesAPI.getAll({ status: 'ACTIVE' }).then((res) => {
      if (res.success && res.data) {
        setProcesses(res.data);
        if (res.data.length > 0) {
          setProcessId(res.data[0].id);
          setSelectedProcess(res.data[0]);
        }
      }
    });
  }, []);

  const handleProcessChange = (id) => {
    setProcessId(id);
    const proc = processes.find(p => p.id === parseInt(id));
    setSelectedProcess(proc || null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!processId || !title.trim()) {
      setError('Please select a business process and provide a request title.');
      return;
    }

    setError('');
    setSubmitting(true);
    try {
      const res = await requestsAPI.create({
        process_id: parseInt(processId),
        title: title.trim(),
        description: description.trim(),
        priority
      });
      if (res.success && res.data) {
        navigate(`/requests/${res.data.id}/track`);
      }
    } catch (err) {
      setError(err.message || 'Failed to submit workflow request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: 760, margin: '0 auto' }}>
      <Link to="/requests" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', color: '#64748b', marginBottom: 16, fontWeight: 600 }}>
        <ArrowLeft size={16} /> Back to Request Queue
      </Link>

      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">Initiate Workflow Request</h3>
            <p className="card-subtitle">
              Submit an operational intake request to trigger sequential multi-stage SLA tracking
            </p>
          </div>
        </div>

        <div className="card-body">
          {error && (
            <div style={{ padding: '10px 14px', background: '#fee2e2', borderRadius: 8, color: '#dc2626', fontSize: '0.84rem', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Business Workflow Process</label>
              <select
                className="form-select"
                value={processId}
                onChange={(e) => handleProcessChange(e.target.value)}
                required
              >
                {processes.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.department_name} — SLA: {p.overall_sla_hours}h)
                  </option>
                ))}
              </select>
            </div>

            {/* Display Selected Process Stages Preview */}
            {selectedProcess?.stages && selectedProcess.stages.length > 0 && (
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 14, marginBottom: 20 }}>
                <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Sequential Workflow Stages ({selectedProcess.stages.length} Stages • Total SLA: {selectedProcess.overall_sla_hours}h)
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                  {selectedProcess.stages.map((st) => (
                    <span key={st.id} style={{ background: 'white', border: '1px solid #cbd5e1', borderRadius: 6, padding: '4px 8px', fontSize: '0.76rem', color: '#334155' }}>
                      <strong>{st.sequence}.</strong> {st.name} <span style={{ color: '#2563eb' }}>({st.sla_duration_hours}h)</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Request Title / Summary</label>
              <input
                type="text"
                required
                className="form-input"
                placeholder="e.g., Senior Systems Engineer Laptop Provisioning & Access"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Operational Priority</label>
                <select
                  className="form-select"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                >
                  <option value="LOW">LOW</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HIGH">HIGH</option>
                  <option value="CRITICAL">CRITICAL</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Managing Department</label>
                <input
                  type="text"
                  disabled
                  className="form-input"
                  style={{ background: '#f1f5f9', color: '#64748b' }}
                  value={selectedProcess?.department_name || 'Department'}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Detailed Business Context / Notes (Optional)</label>
              <textarea
                className="form-textarea"
                rows={4}
                placeholder="Enter justification, budget code, or specific instructions for processing agents..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
              <Link to="/requests" className="btn btn-outline">Cancel</Link>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                <Send size={15} /> {submitting ? 'Initializing Workflow...' : 'Submit & Start Stage 1'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
