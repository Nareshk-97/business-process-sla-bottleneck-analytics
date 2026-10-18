import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { requestsAPI, processesAPI } from '../services/api';
import { StatusBadge, PriorityBadge } from '../components/StatusBadge';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { EmptyState } from '../components/EmptyState';
import { Plus, Search, Eye, Filter, ArrowRight } from 'lucide-react';

export const RequestsList = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [processes, setProcesses] = useState([]);
  const [processFilter, setProcessFilter] = useState('');

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        per_page: 15,
        search: search || undefined,
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
        process_id: processFilter || undefined
      };
      const res = await requestsAPI.getAll(params);
      if (res.success && res.data) {
        setRequests(res.data.items || []);
        setTotal(res.data.total || 0);
      }
    } catch (err) {
      console.error('Error fetching requests', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    processesAPI.getAll().then((res) => {
      if (res.success) setProcesses(res.data || []);
    });
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [page, statusFilter, priorityFilter, processFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchRequests();
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>Operational Requests Queue</h2>
          <p style={{ fontSize: '0.84rem', color: '#64748b' }}>
            Tracking {total} total requests across all business workflows
          </p>
        </div>
        <Link to="/requests/create" className="btn btn-primary">
          <Plus size={16} /> New Request
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="filter-bar">
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: 8, flex: 1, minWidth: 260 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: 36 }}
              placeholder="Search by Request ID (REQ-...) or Title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Search size={16} style={{ position: 'absolute', left: 12, top: 11, color: '#94a3b8' }} />
          </div>
          <button type="submit" className="btn btn-outline btn-sm">Search</button>
        </form>

        <select
          className="form-select"
          style={{ width: 180 }}
          value={processFilter}
          onChange={(e) => { setProcessFilter(e.target.value); setPage(1); }}
        >
          <option value="">All Processes</option>
          {processes.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>

        <select
          className="form-select"
          style={{ width: 140 }}
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
        >
          <option value="">All Statuses</option>
          <option value="IN_PROGRESS">IN PROGRESS</option>
          <option value="COMPLETED">COMPLETED</option>
          <option value="PENDING">PENDING</option>
        </select>

        <select
          className="form-select"
          style={{ width: 130 }}
          value={priorityFilter}
          onChange={(e) => { setPriorityFilter(e.target.value); setPage(1); }}
        >
          <option value="">All Priorities</option>
          <option value="LOW">LOW</option>
          <option value="MEDIUM">MEDIUM</option>
          <option value="HIGH">HIGH</option>
          <option value="CRITICAL">CRITICAL</option>
        </select>
      </div>

      {/* Table Card */}
      <div className="card">
        {loading ? (
          <LoadingSpinner message="Loading request records..." />
        ) : requests.length === 0 ? (
          <EmptyState
            title="No Requests Match Filter"
            message="Try resetting your search query or status filters to view historical records."
            action={
              <Link to="/requests/create" className="btn btn-primary btn-sm">
                Submit Request
              </Link>
            }
          />
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Request ID</th>
                  <th>Title & Workflow</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Current Stage</th>
                  <th>Duration</th>
                  <th>SLA Status</th>
                  <th>Submitted</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => (
                  <tr key={req.id}>
                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.82rem', color: '#2563eb' }}>
                        {req.request_id}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#0f172a', maxWidth: 280, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {req.title}
                      </div>
                      <div style={{ fontSize: '0.76rem', color: '#64748b' }}>
                        {req.process_name} • {req.department_name}
                      </div>
                    </td>
                    <td>
                      <PriorityBadge priority={req.priority} />
                    </td>
                    <td>
                      <StatusBadge status={req.status} />
                    </td>
                    <td>
                      <span style={{ fontSize: '0.82rem', fontWeight: 500, color: '#334155' }}>
                        {req.current_stage_name || (req.status === 'COMPLETED' ? 'All Completed' : '—')}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>
                        {req.total_processing_time_hours}h
                      </span>
                    </td>
                    <td>
                      <StatusBadge status={req.sla_status} />
                    </td>
                    <td>
                      <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                        {req.created_at ? new Date(req.created_at).toLocaleDateString() : '—'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <Link
                        to={`/requests/${req.id}/track`}
                        className="btn btn-outline btn-sm"
                        style={{ padding: '4px 10px' }}
                      >
                        <Eye size={13} /> Track
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination controls */}
        {total > 15 && (
          <div style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
              Showing {requests.length} of {total} requests (Page {page})
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
                disabled={requests.length < 15}
                onClick={() => setPage(page + 1)}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
