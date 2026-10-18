from datetime import datetime
from app.extensions import db


class RequestStage(db.Model):
    __tablename__ = 'request_stages'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    request_id = db.Column(db.Integer, db.ForeignKey('requests.id', ondelete='CASCADE'), nullable=False, index=True)
    stage_id = db.Column(db.Integer, db.ForeignKey('process_stages.id', ondelete='RESTRICT'), nullable=False, index=True)
    sequence = db.Column(db.Integer, nullable=False)
    department_id = db.Column(db.Integer, db.ForeignKey('departments.id', ondelete='RESTRICT'), nullable=False)
    responsible_role_id = db.Column(db.Integer, db.ForeignKey('roles.id', ondelete='RESTRICT'), nullable=False)
    status = db.Column(db.String(30), default='PENDING', nullable=False, index=True)  # PENDING, IN_PROGRESS, COMPLETED, SKIPPED
    sla_duration_hours = db.Column(db.Float, default=4.0, nullable=False)
    stage_start_time = db.Column(db.DateTime, nullable=True)
    stage_end_time = db.Column(db.DateTime, nullable=True)
    processing_time_hours = db.Column(db.Float, default=0.0, nullable=False)
    sla_percentage_used = db.Column(db.Float, default=0.0, nullable=False)
    sla_status = db.Column(db.String(30), default='PENDING', nullable=False, index=True)  # PENDING, NORMAL, WARNING, VIOLATED, COMPLETED_WITHIN_SLA, COMPLETED_AFTER_SLA
    sla_violation = db.Column(db.Boolean, default=False, nullable=False, index=True)
    completed_by_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    notes = db.Column(db.Text, nullable=True)

    request = db.relationship('Request', back_populates='stages')
    stage = db.relationship('ProcessStage', back_populates='request_stages')
    department = db.relationship('Department')
    responsible_role = db.relationship('Role')
    completed_by = db.relationship('User')
    events = db.relationship('StageEvent', back_populates='request_stage', cascade='all, delete-orphan', order_by='StageEvent.timestamp')

    def to_dict(self, include_events=False):
        # Calculate dynamic remaining time in hours if IN_PROGRESS
        remaining_sla_hours = None
        if self.status == 'IN_PROGRESS' and self.stage_start_time:
            now = datetime.utcnow()
            elapsed_hours = max(0.0, (now - self.stage_start_time).total_seconds() / 3600.0)
            remaining_sla_hours = round(float(self.sla_duration_hours) - elapsed_hours, 2)
        elif self.status == 'PENDING':
            remaining_sla_hours = round(float(self.sla_duration_hours), 2)
        elif self.status == 'COMPLETED':
            remaining_sla_hours = 0.0

        data = {
            'id': self.id,
            'request_id': self.request_id,
            'stage_id': self.stage_id,
            'stage_name': self.stage.name if self.stage else None,
            'stage_description': self.stage.description if self.stage else None,
            'sequence': self.sequence,
            'department_id': self.department_id,
            'department_name': self.department.name if self.department else None,
            'responsible_role_id': self.responsible_role_id,
            'responsible_role_name': self.responsible_role.name if self.responsible_role else None,
            'status': self.status,
            'sla_duration_hours': float(self.sla_duration_hours or 0.0),
            'stage_start_time': self.stage_start_time.isoformat() if self.stage_start_time else None,
            'stage_end_time': self.stage_end_time.isoformat() if self.stage_end_time else None,
            'processing_time_hours': round(float(self.processing_time_hours or 0.0), 2),
            'sla_percentage_used': round(float(self.sla_percentage_used or 0.0), 1),
            'remaining_sla_hours': remaining_sla_hours,
            'sla_status': self.sla_status,
            'sla_violation': self.sla_violation,
            'completed_by_id': self.completed_by_id,
            'completed_by_name': self.completed_by.full_name if self.completed_by else None,
            'notes': self.notes
        }
        if include_events and self.events:
            data['events'] = [e.to_dict() for e in self.events]
        return data
