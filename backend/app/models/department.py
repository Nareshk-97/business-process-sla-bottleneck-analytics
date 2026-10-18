from datetime import datetime
from app.extensions import db


class Department(db.Model):
    __tablename__ = 'departments'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(100), unique=True, nullable=False, index=True)
    code = db.Column(db.String(20), unique=True, nullable=False, index=True)
    description = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    users = db.relationship('User', back_populates='department', lazy='dynamic')
    processes = db.relationship('BusinessProcess', back_populates='department', lazy='dynamic')
    stages = db.relationship('ProcessStage', back_populates='department', lazy='dynamic')
    requests = db.relationship('Request', back_populates='department', lazy='dynamic')

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'code': self.code,
            'description': self.description,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'user_count': self.users.count() if hasattr(self.users, 'count') else 0
        }
