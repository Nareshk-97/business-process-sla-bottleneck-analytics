import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { requestsAPI } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { Timeline } from '../components/Timeline';
import { StatusBadge, PriorityBadge } from '../components/StatusBadge';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ArrowLeft, RefreshCw, Clock, Building2, User, FileText } from 'lucide-react';

export const RequestTrack = () => {
  const { id } = useParams();
  const { role } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionMessage, setActionMessage] = useState('');

  const fetchTracking = async () => {
    try {
      const res = await requestsAPI.getTracking(id);
      if (res.success && res.data) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Error loading tracking data', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTracking();
  }, [id]);

  const handleCompleteStage = async (stageId, notes) => {
    setActionMessage('');
    const res = await requestsAPI.completeStage(id, {
      stage_id: stageId,
      notes
    });
    if (res.success) {
      setActionMessage('Stage completed successfully! Next stage triggered.');
      fetchTracking();
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading live workflow tracking timeline..." />;
  }

  if (!data || !data.request) {
    return (
      <div style={{ textAlign: 'center', padding: 40 }}>
        <h3>Request record not found</h3>
        <Link to="/requests" className="btn btn-outline" style={{ marginTop: 12 }}>Back to Queue</Link>
      </div>
    );
  }

  const { request, timeline } = data;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Link to="/requests" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>
          <ArrowLeft size={16} /> Back to Request Queue
        </Link>
        <button
          className="btn btn-outline btn-sm"
          onClick={() => { setRefreshing(true); fetchTracking(); }}
          disabled={refreshing}
        >
          <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} /> Refresh Live Tracking
        </button>
      </div>

      {actionMessage && (
        <div style={{ padding: '10px 16px', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: 8, color: '#065f46', fontSize: '0.84rem', marginBottom: 20, fontWeight: 600 }}>
          ✓ {actionMessage}
        </div>
      )}

      {/* Request Header Banner */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-body">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1.05rem', fontWeight: 800, color: '#2563eb' }}>
                  {request.request_id}
                </span>
                <StatusBadge status={request.status} />
                <StatusBadge status={request.sla_status} />
                <PriorityBadge priority={request.priority} />
              </div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                {request.title}
              </h2>
              <p style={{ fontSize: '0.84rem', color: '#64748b', marginTop: 4 }}>
                Process: <strong>{request.process_name}</strong> • Department: <strong>{request.department_name}</strong>
              </p>
            </div>

            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 16px', textAlign: 'right' }}>
              <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 700 }}>
                Total Cycle Time
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>
                {request.total_processing_time_hours}h
              </div>
            </div>
          </div>

          {request.description && (
            <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid #f1f5f9', fontSize: '0.84rem', color: '#475569' }}>
              {request.description}
            </div>
          )}
        </div>
      </div>

      {/* Interactive Workflow Timeline */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">Live Sequential Workflow Progression</h3>
            <p className="card-subtitle">
              Server-enforced execution timeline, elapsed dwell times, and SLA status tracking
            </p>
          </div>
        </div>
        <div className="card-body">
          <Timeline
            stages={timeline}
            request={request}
            onCompleteStage={handleCompleteStage}
            userRole={role}
          />
        </div>
      </div>
    </div>
  );
};
