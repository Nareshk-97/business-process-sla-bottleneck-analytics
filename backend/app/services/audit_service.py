from datetime import datetime
from app.extensions import db
from app.models.audit_log import AuditLog


class AuditService:
    @staticmethod
    def log_action(action: str, entity: str, entity_id=None, description="", user_id=None):
        try:
            log = AuditLog(
                user_id=user_id,
                action=action,
                entity=entity,
                entity_id=str(entity_id) if entity_id is not None else None,
                description=description,
                timestamp=datetime.utcnow()
            )
            db.session.add(log)
            db.session.commit()
            return log
        except Exception as e:
            db.session.rollback()
            print(f"[AuditService Error] Failed to write audit log: {e}")
            return None
