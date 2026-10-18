from app.extensions import db
from app.models.process import BusinessProcess
from app.models.stage import ProcessStage
from app.services.audit_service import AuditService


class ProcessService:
    @staticmethod
    def get_all_processes(department_id=None, status=None):
        query = BusinessProcess.query
        if department_id:
            query = query.filter_by(department_id=department_id)
        if status:
            query = query.filter_by(status=status)
        return query.order_by(BusinessProcess.created_at.desc()).all()

    @staticmethod
    def create_process(data, creator_id):
        overall_sla = float(data.get('overall_sla_hours', 24.0))
        process = BusinessProcess(
            name=data['name'].strip(),
            description=data.get('description', ''),
            department_id=data['department_id'],
            priority=data.get('priority', 'MEDIUM').upper(),
            status=data.get('status', 'ACTIVE').upper(),
            overall_sla_hours=overall_sla,
            created_by=creator_id
        )
        db.session.add(process)
        db.session.commit()

        AuditService.log_action(
            action="CREATE_PROCESS",
            entity="BusinessProcess",
            entity_id=process.id,
            description=f"Created process '{process.name}'",
            user_id=creator_id
        )
        return process

    @staticmethod
    def update_process(process_id, data, user_id):
        process = BusinessProcess.query.get(process_id)
        if not process:
            return None, "Process not found", 404

        if 'name' in data:
            process.name = data['name'].strip()
        if 'description' in data:
            process.description = data['description']
        if 'department_id' in data:
            process.department_id = data['department_id']
        if 'priority' in data:
            process.priority = data['priority'].upper()
        if 'status' in data:
            process.status = data['status'].upper()
        if 'overall_sla_hours' in data:
            process.overall_sla_hours = float(data['overall_sla_hours'])

        db.session.commit()

        AuditService.log_action(
            action="UPDATE_PROCESS",
            entity="BusinessProcess",
            entity_id=process.id,
            description=f"Updated process '{process.name}'",
            user_id=user_id
        )
        return process, "Process updated successfully", 200

    @staticmethod
    def add_stage(process_id, data, user_id):
        process = BusinessProcess.query.get(process_id)
        if not process:
            return None, "Process not found", 404

        existing_stages = ProcessStage.query.filter_by(process_id=process_id).order_by(ProcessStage.sequence).all()
        seq = data.get('sequence')
        if not seq:
            seq = len(existing_stages) + 1

        stage = ProcessStage(
            process_id=process_id,
            name=data['name'].strip(),
            description=data.get('description', ''),
            sequence=int(seq),
            department_id=data['department_id'],
            responsible_role_id=data['responsible_role_id'],
            sla_duration_hours=float(data.get('sla_duration_hours', 4.0)),
            warning_threshold_pct=float(data.get('warning_threshold_pct', 75.0)),
            required=bool(data.get('required', True)),
            status=data.get('status', 'ACTIVE').upper()
        )
        db.session.add(stage)
        db.session.commit()

        AuditService.log_action(
            action="CREATE_STAGE",
            entity="ProcessStage",
            entity_id=stage.id,
            description=f"Added stage '{stage.name}' (sequence {stage.sequence}) to process '{process.name}'",
            user_id=user_id
        )
        return stage, "Stage added successfully", 201

    @staticmethod
    def update_stage(stage_id, data, user_id):
        stage = ProcessStage.query.get(stage_id)
        if not stage:
            return None, "Stage not found", 404

        if 'name' in data:
            stage.name = data['name'].strip()
        if 'description' in data:
            stage.description = data['description']
        if 'sequence' in data:
            stage.sequence = int(data['sequence'])
        if 'department_id' in data:
            stage.department_id = data['department_id']
        if 'responsible_role_id' in data:
            stage.responsible_role_id = data['responsible_role_id']
        if 'sla_duration_hours' in data:
            stage.sla_duration_hours = float(data['sla_duration_hours'])
        if 'warning_threshold_pct' in data:
            stage.warning_threshold_pct = float(data['warning_threshold_pct'])
        if 'required' in data:
            stage.required = bool(data['required'])
        if 'status' in data:
            stage.status = data['status'].upper()

        db.session.commit()

        AuditService.log_action(
            action="UPDATE_STAGE",
            entity="ProcessStage",
            entity_id=stage.id,
            description=f"Updated stage '{stage.name}'",
            user_id=user_id
        )
        return stage, "Stage updated successfully", 200
