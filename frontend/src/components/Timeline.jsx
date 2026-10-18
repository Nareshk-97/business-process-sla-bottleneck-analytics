import React, { useState } from 'react';
import { CheckCircle2, Clock, AlertTriangle, Play, ChevronDown, ChevronUp, UserCheck, ShieldAlert } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { Modal } from './Modal';

export const Timeline = ({ stages = [], request, onCompleteStage, userRole }) => {
  const [selectedStage, setSelectedStage] = useState(null);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [expandedStageId, setExpandedStageId] = useState(null);

  const handleOpenCompleteModal = (stage) => {
    setSelectedStage(stage);
    setNotes('');
  };

  const handleConfirmComplete = async () => {
    if (!selectedStage) return;
    setSubmitting(true);
    try {
      await onCompleteStage(selectedStage.id, notes);
      setSelectedStage(null);
    } catch (err) {
      alert(err.message || 'Failed to complete stage');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleExpand = (stageId) => {
    setExpandedStageId(expandedStageId === stageId ? null : stageId);
  };

  return (
    <div>
      <div className="timeline-list">
        {/* Initial Request Submission Node */}
        <div className="timeline-node completed">
          <div className="timeline-marker">✓</div>
          <div className="timeline-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0f172a' }}>Request Created</h4>
                <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  Submitted by {request?.requester_name || 'Requester'} • {request?.created_at ? new Date(request.created_at).toLocaleString() : '—'}
                </p>
              </div>
              <StatusBadge status="COMPLETED_WITHIN_SLA" />
            </div>
          </div>
        </div>

        {/* Dynamic Workflow Stages */}
        {stages.map((stage) => {
          const isCompleted = stage.status === 'COMPLETED';
          const isInProgress = stage.status === 'IN_PROGRESS';
          const isViolated = stage.sla_violation || stage.sla_status === 'VIOLATED' || stage.sla_status === 'COMPLETED_AFTER_SLA';
          const isWarning = stage.sla_status === 'WARNING';
          const isExpanded = expandedStageId === stage.id;

          let nodeClass = '';
          let markerSymbol = stage.sequence;
          if (isCompleted) {
            nodeClass = isViolated ? 'violated' : 'completed';
            markerSymbol = '✓';
          } else if (isInProgress) {
            nodeClass = isViolated ? 'violated' : 'in-progress';
            markerSymbol = isViolated ? '!' : '●';
          }

          return (
            <div key={stage.id} className={`timeline-node ${nodeClass}`}>
              <div className="timeline-marker">{markerSymbol}</div>
              <div className="timeline-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                        Stage {stage.sequence}
                      </span>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>
                        {stage.stage_name}
                      </h4>
                      <StatusBadge status={stage.sla_status} />
                    </div>

                    <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 4 }}>
                      Department: <strong>{stage.department_name || 'N/A'}</strong> • Role: <strong>{stage.responsible_role_name || 'N/A'}</strong>
                    </p>

                    <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: '0.82rem', color: '#334155' }}>
                      <span>
                        Target SLA: <strong>{stage.sla_duration_hours}h</strong>
                      </span>
                      <span>
                        Processing Time: <strong>{stage.processing_time_hours}h</strong> ({stage.sla_percentage_used}% used)
                      </span>
                      {stage.remaining_sla_hours !== null && stage.status === 'IN_PROGRESS' && (
                        <span style={{ color: stage.remaining_sla_hours < 0 ? '#dc2626' : '#2563eb', fontWeight: 600 }}>
                          Remaining: {stage.remaining_sla_hours}h
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {isInProgress && (
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => handleOpenCompleteModal(stage)}
                      >
                        <UserCheck size={14} /> Process Stage
                      </button>
                    )}
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => toggleExpand(stage.id)}
                      title="Toggle Details & Audit Events"
                    >
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  </div>
                </div>

                {/* Expanded Details and Stage Events Trail */}
                {isExpanded && (
                  <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #f1f5f9' }}>
                    {stage.notes && (
                      <div style={{ marginBottom: 12, padding: 10, background: '#f8fafc', borderRadius: 6, fontSize: '0.82rem' }}>
                        <strong>Operator Notes:</strong> {stage.notes}
                      </div>
                    )}
                    {stage.completed_by_name && (
                      <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: 12 }}>
                        Completed by: <strong>{stage.completed_by_name}</strong> at {stage.stage_end_time ? new Date(stage.stage_end_time).toLocaleString() : '—'}
                      </div>
                    )}

                    <h5 style={{ fontSize: '0.76rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748b', marginBottom: 8 }}>
                      Stage Event Audit Trail
                    </h5>
                    {stage.events && stage.events.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {stage.events.map((evt) => (
                          <div key={evt.id} style={{ fontSize: '0.78rem', color: '#475569', display: 'flex', justifyContent: 'space-between', background: '#f8fafc', padding: '6px 10px', borderRadius: 4 }}>
                            <span><strong>[{evt.event_type}]</strong> {evt.details}</span>
                            <span style={{ color: '#94a3b8' }}>{evt.timestamp ? new Date(evt.timestamp).toLocaleTimeString() : ''}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p style={{ fontSize: '0.78rem', color: '#94a3b8' }}>No sub-events recorded.</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Final Process Completion Node */}
        {request?.status === 'COMPLETED' && (
          <div className="timeline-node completed">
            <div className="timeline-marker">✓</div>
            <div className="timeline-card" style={{ background: '#ecfdf5', borderColor: '#a7f3d0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#065f46' }}>Request Completed</h4>
                  <p style={{ fontSize: '0.8rem', color: '#047857' }}>
                    Total Process Duration: {request?.total_processing_time_hours}h • Finished {request?.completed_at ? new Date(request.completed_at).toLocaleString() : '—'}
                  </p>
                </div>
                <StatusBadge status={request?.sla_status} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal for processing & completing active stage */}
      <Modal
        isOpen={!!selectedStage}
        onClose={() => setSelectedStage(null)}
        title={`Complete Stage ${selectedStage?.sequence}: ${selectedStage?.stage_name}`}
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setSelectedStage(null)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleConfirmComplete} disabled={submitting}>
              {submitting ? 'Confirming...' : 'Complete Stage'}
            </button>
          </>
        }
      >
        <div>
          <p style={{ fontSize: '0.86rem', color: '#475569', marginBottom: 16 }}>
            Confirm completion of this stage. The server will record the current timestamp, compute actual processing time against the target SLA ({selectedStage?.sla_duration_hours}h), and automatically trigger the next sequential workflow stage.
          </p>
          <div className="form-group">
            <label className="form-label">Resolution Notes / Comments (Optional)</label>
            <textarea
              className="form-textarea"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Verified credentials, approved budget, all checklists completed."
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};
