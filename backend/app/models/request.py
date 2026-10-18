from datetime import datetime
from app.extensions import db


class Request(db.Model):
    __tablename__ = 'requests'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    request_id = db.Column(db.String(50), unique=True, nullable=False, index=True)
    process_id = db.Column(db.Integer, db.ForeignKey('business_processes.id', ondelete='RESTRICT'), nullable=False, index=True)
    requester_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='RESTRICT'), nullable=False, index=True)
    department_id = db.Column(db.Integer, db.ForeignKey('departments.id', ondelete='RESTRICT'), nullable=False, index=True)
    priority = db.Column(db.String(20), default='MEDIUM', nullable=False, index=True)  # LOW, MEDIUM, HIGH, CRITICAL
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    status = db.Column(db.String(30), default='PENDING', nullable=False, index=True)  # PENDING, IN_PROGRESS, COMPLETED, REJECTED
    current_stage_id = db.Column(db.Integer, db.ForeignKey('process_stages.id', ondelete='SET NULL'), nullable=True)
    current_stage_sequence = db.Column(db.Integer, default=1, nullable=False)
    total_processing_time_hours = db.Column(db.Float, default=0.0, nullable=False)
    sla_status = db.Column(db.String(30), default='NORMAL', nullable=False, index=True)  # NORMAL, WARNING, VIOLATED, COMPLETED_WITHIN_SLA, COMPLETED_AFTER_SLA
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False, index=True)
    started_at = db.Column(db.DateTime, nullable=True)
    completed_at = db.Column(db.DateTime, nullable=True)

    process = db.relationship('BusinessProcess', back_populates='requests')
    requester = db.relationship('User', back_populates='submitted_requests')
    department = db.relationship('Department', back_populates='requests')
    current_stage = db.relationship('ProcessStage')
    stages = db.relationship('RequestStage', back_populates='request', cascade='all, delete-orphan', order_by='RequestStage.sequence')

    def to_dict(self, include_stages=False):
        data = {
            'id': self.id,
            'request_id': self.request_id,
            'process_id': self.process_id,
            'process_name': self.process.name if self.process else None,
            'requester_id': self.requester_id,
            'requester_name': self.requester.full_name if self.requester else None,
            'department_id': self.department_id,
            'department_name': self.department.name if self.department else None,
            'priority': self.priority,
            'title': self.title,
            'description': self.description,
            'status': self.status,
            'current_stage_id': self.current_stage_id,
            'current_stage_name': self.current_stage.name if self.current_stage else ('Completed' if self.status == 'COMPLETED' else None),
            'current_stage_sequence': self.current_stage_sequence,
            'total_processing_time_hours': round(float(self.total_processing_time_hours or 0.0), 2),
            'sla_status': self.sla_status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'started_at': self.started_at.isoformat() if self.started_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None
        }
        if include_stages and self.stages:
            data['stages'] = [s.to_dict() for s in self.stages]
        return data
