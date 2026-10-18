import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { processesAPI, stagesAPI } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';
import { ArrowLeft, Plus, Edit2, Clock, Layers, Shield, CheckCircle } from 'lucide-react';

export const ProcessStages = () => {
  const { id } = useParams();
  const { role } = useAuth();
  const isAdmin = role === 'ADMIN';

  const [process, setProcess] = useState(null);
  const [stages, setStages] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal state for adding or editing a stage
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStage, setEditingStage] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sequence: '',
    department_id: '1',
    responsible_role_id: '3',
    sla_duration_hours: '4.0',
    warning_threshold_pct: '75',
    required: true,
    status: 'ACTIVE'
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const loadData = async () => {
    try {
      const [pRes, sRes] = await Promise.all([
        processesAPI.getById(id),
        stagesAPI.getByProcessId(id)
      ]);
      if (pRes.success) setProcess(pRes.data);
      if (sRes.success) setStages(sRes.data);
    } catch (err) {
      console.error('Error loading process stages', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleOpenAdd = () => {
    setEditingStage(null);
    setFormData({
      name: '',
      description: '',
      sequence: stages.length + 1,
      department_id: process?.department_id || '1',
      responsible_role_id: '3', // EMPLOYEE default
      sla_duration_hours: '4.0',
      warning_threshold_pct: '75',
      required: true,
      status: 'ACTIVE'
    });
    setError('');
    setModalOpen(true);
  };

  const handleOpenEdit = (stage) => {
    setEditingStage(stage);
    setFormData({
      name: stage.name,
      description: stage.description || '',
      sequence: stage.sequence,
      department_id: stage.department_id,
      responsible_role_id: stage.responsible_role_id,
      sla_duration_hours: stage.sla_duration_hours,
      warning_threshold_pct: stage.warning_threshold_pct,
      required: stage.required,
      status: stage.status
    });
    setError('');
    setModalOpen(true);
  };

  const handleSaveStage = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Stage name is required');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const payload = {
        ...formData,
        sequence: parseInt(formData.sequence),
        department_id: parseInt(formData.department_id),
        responsible_role_id: parseInt(formData.responsible_role_id),
        sla_duration_hours: parseFloat(formData.sla_duration_hours),
        warning_threshold_pct: parseFloat(formData.warning_threshold_pct),
        required: Boolean(formData.required)
      };

      if (editingStage) {
        await stagesAPI.update(editingStage.id, payload);
      } else {
        await stagesAPI.create(id, payload);
      }
      setModalOpen(false);
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to save stage configuration');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading workflow stage definitions..." />;

  const sumStageSLA = stages.reduce((acc, s) => acc + (parseFloat(s.sla_duration_hours) || 0), 0);

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      <Link to="/processes" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', color: '#64748b', marginBottom: 16, fontWeight: 600 }}>
        <ArrowLeft size={16} /> Back to Processes
      </Link>

      {/* Header Banner */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-body">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                  Workflow Process
                </span>
                <StatusBadge status={process?.status} />
              </div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a' }}>
                {process?.name}
              </h2>
              <p style={{ fontSize: '0.84rem', color: '#64748b', marginTop: 4 }}>
                Department: <strong>{process?.department_name}</strong> • Master SLA: <strong>{process?.overall_sla_hours} Hours</strong>
              </p>
            </div>

            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{ padding: '8px 16px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0', textAlign: 'right' }}>
                <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
                  Sum of Stage SLAs
                </div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#2563eb' }}>
                  {sumStageSLA}h
                </div>
              </div>
              {isAdmin && (
                <button className="btn btn-primary" onClick={handleOpenAdd}>
                  <Plus size={16} /> Add Stage
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stages List Table */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">Sequential Process Stages</h3>
            <p className="card-subtitle">
              Execution sequence, departmental owners, and configured SLA warning thresholds
            </p>
          </div>
        </div>

        <div className="card-body" style={{ padding: 0 }}>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Seq</th>
                  <th>Stage Name & Description</th>
                  <th>Department</th>
                  <th>Responsible Role</th>
                  <th>SLA Target</th>
                  <th>Warning Threshold</th>
                  <th>Required</th>
                  <th>Status</th>
                  {isAdmin && <th style={{ textAlign: 'right' }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {stages.map((st) => (
                  <tr key={st.id}>
                    <td>
                      <span style={{ width: 26, height: 26, borderRadius: '50%', background: '#eff6ff', color: '#2563eb', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem' }}>
                        {st.sequence}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{st.name}</div>
                      <div style={{ fontSize: '0.76rem', color: '#64748b' }}>{st.description}</div>
                    </td>
                    <td>{st.department_name}</td>
                    <td>
                      <span style={{ fontWeight: 600, fontSize: '0.8rem', color: '#334155' }}>
                        {st.responsible_role_name}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#2563eb' }}>
                        {st.sla_duration_hours}h
                      </span>
                    </td>
                    <td>
                      <span style={{ color: '#d97706', fontWeight: 600, fontSize: '0.8rem' }}>
                        {st.warning_threshold_pct}%
                      </span>
                    </td>
                    <td>
                      {st.required ? (
                        <span style={{ color: '#10b981', fontSize: '0.78rem', fontWeight: 600 }}>Yes</span>
                      ) : (
                        <span style={{ color: '#64748b', fontSize: '0.78rem' }}>Optional</span>
                      )}
                    </td>
                    <td>
                      <StatusBadge status={st.status} />
                    </td>
                    {isAdmin && (
                      <td style={{ textAlign: 'right' }}>
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => handleOpenEdit(st)}
                          title="Edit Stage SLA"
                        >
                          <Edit2 size={13} /> Edit
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal for Adding or Editing Stage */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingStage ? `Edit Stage ${editingStage.sequence}: ${editingStage.name}` : 'Configure New Workflow Stage'}
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setModalOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSaveStage} disabled={submitting}>
              {submitting ? 'Saving...' : 'Save Stage Configuration'}
            </button>
          </>
        }
      >
        {error && (
          <div style={{ padding: '8px 12px', background: '#fee2e2', borderRadius: 6, color: '#dc2626', fontSize: '0.82rem', marginBottom: 14 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSaveStage}>
          <div className="form-group">
            <label className="form-label">Stage Name</label>
            <input
              type="text"
              required
              className="form-input"
              placeholder="e.g., Security & Compliance Audit"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div className="form-group">
              <label className="form-label">Sequence Order</label>
              <input
                type="number"
                min="1"
                required
                className="form-input"
                value={formData.sequence}
                onChange={(e) => setFormData({ ...formData, sequence: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Department</label>
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
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div className="form-group">
              <label className="form-label">Responsible Role</label>
              <select
                className="form-select"
                value={formData.responsible_role_id}
                onChange={(e) => setFormData({ ...formData, responsible_role_id: e.target.value })}
              >
                <option value="3">EMPLOYEE</option>
                <option value="2">MANAGER</option>
                <option value="1">ADMIN</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">SLA Duration (Hours)</label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                required
                className="form-input"
                value={formData.sla_duration_hours}
                onChange={(e) => setFormData({ ...formData, sla_duration_hours: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div className="form-group">
              <label className="form-label">Warning Threshold (%)</label>
              <input
                type="number"
                step="1"
                min="10"
                max="95"
                required
                className="form-input"
                value={formData.warning_threshold_pct}
                onChange={(e) => setFormData({ ...formData, warning_threshold_pct: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Status</label>
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
            <label className="form-label">Stage Description</label>
            <textarea
              className="form-textarea"
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};
