import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { processesAPI } from '../services/api';
import { ArrowLeft, Save } from 'lucide-react';

export const ProcessCreate = () => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    department_id: '1',
    priority: 'MEDIUM',
    status: 'ACTIVE',
    overall_sla_hours: '24'
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Process name is required');
      return;
    }

    setError('');
    setSubmitting(true);
    try {
      const res = await processesAPI.create({
        ...formData,
        department_id: parseInt(formData.department_id),
        overall_sla_hours: parseFloat(formData.overall_sla_hours)
      });
      if (res.success && res.data) {
        navigate(`/processes/${res.data.id}/stages`);
      }
    } catch (err) {
      setError(err.message || 'Failed to create business process');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: 680, margin: '0 auto' }}>
      <Link to="/processes" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', color: '#64748b', marginBottom: 16, fontWeight: 600 }}>
        <ArrowLeft size={16} /> Back to Processes
      </Link>

      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">Define New Business Process</h3>
            <p className="card-subtitle">Establish process parameters, department ownership, and master SLA</p>
          </div>
        </div>

        <div className="card-body">
          {error && (
            <div style={{ padding: '10px 14px', background: '#fee2e2', borderRadius: 8, color: '#dc2626', fontSize: '0.84rem', marginBottom: 16 }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Process Name</label>
              <input
                type="text"
                required
                className="form-input"
                placeholder="e.g., Capital Equipment Procurement & Deployment"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Primary Department</label>
                <select
                  className="form-select"
                  value={formData.department_id}
                  onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                >
                  <option value="1">Human Resources</option>
                  <option value="2">Finance & Accounting</option>
                  <option value="3">Information Technology</option>
                  <option value="4">Operations & Facilities</option>
                  <option value="5">Customer Support</option>
                  <option value="6">Legal & Compliance</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Default Priority</label>
                <select
                  className="form-select"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                >
                  <option value="LOW">LOW</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HIGH">HIGH</option>
                  <option value="CRITICAL">CRITICAL</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Overall SLA Target (Hours)</label>
                <input
                  type="number"
                  step="0.5"
                  min="1"
                  required
                  className="form-input"
                  value={formData.overall_sla_hours}
                  onChange={(e) => setFormData({ ...formData, overall_sla_hours: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Lifecycle Status</label>
                <select
                  className="form-select"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Process Description</label>
              <textarea
                className="form-textarea"
                rows={3}
                placeholder="Scope, operational purpose, and boundaries..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 20 }}>
              <Link to="/processes" className="btn btn-outline">Cancel</Link>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                <Save size={15} /> {submitting ? 'Creating...' : 'Create Process & Configure Stages'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
