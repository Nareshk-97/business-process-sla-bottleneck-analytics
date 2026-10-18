from datetime import datetime
from app.extensions import db


class AuditLog(db.Model):
    __tablename__ = 'audit_logs'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'), nullable=True, index=True)
    action = db.Column(db.String(100), nullable=False, index=True)
    entity = db.Column(db.String(100), nullable=False, index=True)
    entity_id = db.Column(db.String(100), nullable=True)
    description = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, nullable=False, index=True)

    user = db.relationship('User')

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'user_name': self.user.full_name if self.user else 'System',
            'user_email': self.user.email if self.user else None,
            'action': self.action,
            'entity': self.entity,
            'entity_id': self.entity_id,
            'description': self.description,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None
        }
