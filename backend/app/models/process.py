from datetime import datetime
from app.extensions import db


class BusinessProcess(db.Model):
    __tablename__ = 'business_processes'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(150), nullable=False, index=True)
    description = db.Column(db.Text, nullable=True)
    department_id = db.Column(db.Integer, db.ForeignKey('departments.id', ondelete='RESTRICT'), nullable=False, index=True)
    priority = db.Column(db.String(20), default='MEDIUM', nullable=False)
    status = db.Column(db.String(20), default='ACTIVE', nullable=False, index=True)  # ACTIVE, INACTIVE
    overall_sla_hours = db.Column(db.Float, default=24.0, nullable=False)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='RESTRICT'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    department = db.relationship('Department', back_populates='processes')
    creator = db.relationship('User', back_populates='created_processes')
    stages = db.relationship('ProcessStage', back_populates='process', cascade='all, delete-orphan', order_by='ProcessStage.sequence')
    requests = db.relationship('Request', back_populates='process', lazy='dynamic')

    def to_dict(self, include_stages=False):
        data = {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'department_id': self.department_id,
            'department_name': self.department.name if self.department else None,
            'priority': self.priority,
            'status': self.status,
            'overall_sla_hours': float(self.overall_sla_hours or 0.0),
            'created_by': self.created_by,
            'creator_name': self.creator.full_name if self.creator else None,
            'stage_count': len(self.stages) if self.stages else 0,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
        if include_stages and self.stages:
            data['stages'] = [s.to_dict() for s in self.stages]
        return data
