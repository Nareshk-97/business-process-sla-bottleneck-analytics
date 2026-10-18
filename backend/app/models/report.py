from datetime import datetime
from app.extensions import db


class Report(db.Model):
    __tablename__ = 'reports'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    title = db.Column(db.String(200), nullable=False)
    report_type = db.Column(db.String(50), nullable=False, index=True)  # SLA_COMPLIANCE, IMPROVEMENT_RECOMMENDATION, PROCESS_AUDIT
    generated_by = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    parameters = db.Column(db.JSON, nullable=True)
    summary_content = db.Column(db.Text, nullable=True)
    data_payload = db.Column(db.JSON, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False, index=True)

    generator = db.relationship('User')

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'report_type': self.report_type,
            'generated_by': self.generated_by,
            'generator_name': self.generator.full_name if self.generator else 'System',
            'parameters': self.parameters,
            'summary_content': self.summary_content,
            'data_payload': self.data_payload,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
