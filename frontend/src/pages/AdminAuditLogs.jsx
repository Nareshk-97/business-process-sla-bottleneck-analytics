import React, { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ShieldCheck, Search, Filter } from 'lucide-react';

export const AdminAuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [actionFilter, setActionFilter] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        per_page: 25,
        action: actionFilter || undefined
      };
      const res = await adminAPI.getAuditLogs(params);
      if (res.success && res.data) {
        setLogs(res.data.items || []);
        setTotal(res.data.total || 0);
      }
    } catch (err) {
      console.error('Error fetching audit logs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, actionFilter]);

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>Immutable System Audit Trail</h2>
        <p style={{ fontSize: '0.84rem', color: '#64748b' }}>
          Cryptographic operational trail recording administrative mutations, request submissions, and stage transitions
        </p>
      </div>

      <div className="filter-bar">
        <select
          className="form-select"
          style={{ width: 220 }}
          value={actionFilter}
          onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
        >
          <option value="">All Actions ({total})</option>
          <option value="CREATE_REQUEST">CREATE_REQUEST</option>
          <option value="COMPLETE_STAGE">COMPLETE_STAGE</option>
          <option value="CREATE_PROCESS">CREATE_PROCESS</option>
          <option value="CREATE_STAGE">CREATE_STAGE</option>
          <option value="USER_LOGIN">USER_LOGIN</option>
          <option value="USER_STATUS_CHANGE">USER_STATUS_CHANGE</option>
        </select>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Audit Records</h3>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          {loading ? (
            <LoadingSpinner message="Loading audit trail records..." />
          ) : logs.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: '#64748b' }}>No audit records found matching criteria.</div>
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>User</th>
                    <th>Action</th>
                    <th>Entity</th>
                    <th>Entity ID</th>
                    <th>Details Description</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id}>
                      <td style={{ fontSize: '0.78rem', color: '#64748b', whiteSpace: 'nowrap' }}>
                        {log.timestamp ? new Date(log.timestamp).toLocaleString() : '—'}
                      </td>
                      <td>
                        <strong style={{ color: '#0f172a' }}>{log.user_name}</strong>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.74rem', background: '#f1f5f9', padding: '2px 8px', borderRadius: 4, fontWeight: 700, color: '#334155' }}>
                          {log.action}
                        </span>
                      </td>
                      <td>{log.entity}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>{log.entity_id || '—'}</td>
                      <td style={{ fontSize: '0.82rem', color: '#475569', maxWidth: 360 }}>
                        {log.description}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {total > 25 && (
            <div style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
                Page {page} of {Math.ceil(total / 25)} ({total} total records)
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className="btn btn-outline btn-sm"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                >
                  Previous
                </button>
                <button
                  className="btn btn-outline btn-sm"
                  disabled={logs.length < 25}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
