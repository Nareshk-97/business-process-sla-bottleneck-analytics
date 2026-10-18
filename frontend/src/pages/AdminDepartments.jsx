import React, { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Modal } from '../components/Modal';
import { Building2, Plus, Layers } from 'lucide-react';

export const AdminDepartments = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchDepts = async () => {
    try {
      const res = await adminAPI.getDepartments();
      if (res.success && res.data) {
        setDepartments(res.data);
      }
    } catch (err) {
      console.error('Error fetching departments', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepts();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) {
      setError('Name and Code are required');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await adminAPI.createDepartment({ name: name.trim(), code: code.trim().toUpperCase(), description });
      setModalOpen(false);
      setName('');
      setCode('');
      setDescription('');
      fetchDepts();
    } catch (err) {
      setError(err.message || 'Failed to create department');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading departments..." />;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>Enterprise Departments</h2>
          <p style={{ fontSize: '0.84rem', color: '#64748b' }}>
            Operational units responsible for workflow stage execution and SLA accountability
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
          <Plus size={16} /> New Department
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
        {departments.map((d) => (
          <div key={d.id} className="card" style={{ marginBottom: 0 }}>
            <div className="card-body">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>{d.name}</h3>
                <span style={{ fontSize: '0.74rem', background: '#eff6ff', color: '#2563eb', padding: '2px 8px', borderRadius: 4, fontWeight: 700 }}>
                  {d.code}
                </span>
              </div>
              <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: 12 }}>
                {d.description || 'Enterprise operational unit'}
              </p>
              <div style={{ fontSize: '0.76rem', color: '#94a3b8' }}>
                Created: {d.created_at ? new Date(d.created_at).toLocaleDateString() : '—'}
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Create Enterprise Department"
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setModalOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleCreate} disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Department'}
            </button>
          </>
        }
      >
        {error && (
          <div style={{ padding: '8px 12px', background: '#fee2e2', color: '#dc2626', borderRadius: 6, fontSize: '0.82rem', marginBottom: 14 }}>
            {error}
          </div>
        )}
        <form onSubmit={handleCreate}>
          <div className="form-group">
            <label className="form-label">Department Name</label>
            <input
              type="text"
              required
              className="form-input"
              placeholder="e.g., Information Security & Compliance"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Department Code (Short)</label>
            <input
              type="text"
              required
              className="form-input"
              placeholder="e.g., SEC"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Scope & Responsibilities</label>
            <textarea
              className="form-textarea"
              rows={3}
              placeholder="Operational responsibilities..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};
