from datetime import datetime
from app.extensions import db


class StageEvent(db.Model):
    __tablename__ = 'stage_events'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    request_stage_id = db.Column(db.Integer, db.ForeignKey('request_stages.id', ondelete='CASCADE'), nullable=False, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    event_type = db.Column(db.String(50), nullable=False)  # STAGE_INITIALIZED, STAGE_STARTED, STAGE_COMPLETED, SLA_WARNING, SLA_BREACH
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, nullable=False, index=True)
    details = db.Column(db.Text, nullable=True)

    request_stage = db.relationship('RequestStage', back_populates='events')
    user = db.relationship('User')

    def to_dict(self):
        return {
            'id': self.id,
            'request_stage_id': self.request_stage_id,
            'user_id': self.user_id,
            'user_name': self.user.full_name if self.user else 'System',
            'event_type': self.event_type,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None,
            'details': self.details
        }
