from datetime import datetime
from app.extensions import db


class ProcessStage(db.Model):
    __tablename__ = 'process_stages'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    process_id = db.Column(db.Integer, db.ForeignKey('business_processes.id', ondelete='CASCADE'), nullable=False, index=True)
    name = db.Column(db.String(150), nullable=False)
    description = db.Column(db.Text, nullable=True)
    sequence = db.Column(db.Integer, nullable=False)
    department_id = db.Column(db.Integer, db.ForeignKey('departments.id', ondelete='RESTRICT'), nullable=False, index=True)
    responsible_role_id = db.Column(db.Integer, db.ForeignKey('roles.id', ondelete='RESTRICT'), nullable=False)
    sla_duration_hours = db.Column(db.Float, default=4.0, nullable=False)
    warning_threshold_pct = db.Column(db.Float, default=75.0, nullable=False)
    required = db.Column(db.Boolean, default=True, nullable=False)
    status = db.Column(db.String(20), default='ACTIVE', nullable=False)  # ACTIVE, INACTIVE
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    process = db.relationship('BusinessProcess', back_populates='stages')
    department = db.relationship('Department', back_populates='stages')
    responsible_role = db.relationship('Role')
    request_stages = db.relationship('RequestStage', back_populates='stage', lazy='dynamic')

    __table_args__ = (
        db.UniqueConstraint('process_id', 'sequence', name='uq_process_stage_sequence'),
    )

    def to_dict(self):
        return {
            'id': self.id,
            'process_id': self.process_id,
            'name': self.name,
            'description': self.description,
            'sequence': self.sequence,
            'department_id': self.department_id,
            'department_name': self.department.name if self.department else None,
            'responsible_role_id': self.responsible_role_id,
            'responsible_role_name': self.responsible_role.name if self.responsible_role else None,
            'sla_duration_hours': float(self.sla_duration_hours or 0.0),
            'warning_threshold_pct': float(self.warning_threshold_pct or 75.0),
            'required': self.required,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
