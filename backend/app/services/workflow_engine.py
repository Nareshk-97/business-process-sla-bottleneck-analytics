import uuid
from datetime import datetime
from app.extensions import db
from app.models.request import Request
from app.models.request_stage import RequestStage
from app.models.stage_event import StageEvent
from app.models.process import BusinessProcess
from app.models.stage import ProcessStage
from app.models.user import User
from app.services.sla_service import SlaService
from app.services.audit_service import AuditService


class WorkflowException(Exception):
    def __init__(self, message, error_code="WORKFLOW_ERROR", status_code=400):
        super().__init__(message)
        self.message = message
        self.error_code = error_code
        self.status_code = status_code


class WorkflowEngine:
    @staticmethod
    def generate_request_code():
        short_id = uuid.uuid4().hex[:6].upper()
        year = datetime.utcnow().year
        return f"REQ-{year}-{short_id}"

    @classmethod
    def create_request(cls, process_id: int, requester_id: int, title: str, description: str, priority: str = 'MEDIUM'):
        process = db.session.get(BusinessProcess, process_id)
        if not process:
            raise WorkflowException("Target business process not found", "NOT_FOUND", 404)
        if process.status != 'ACTIVE':
            raise WorkflowException("Cannot create request for an inactive process", "INACTIVE_PROCESS", 400)

        active_stages = ProcessStage.query.filter_by(process_id=process.id, status='ACTIVE').order_by(ProcessStage.sequence).all()
        if not active_stages:
            raise WorkflowException("Business process has no active configured stages", "NO_STAGES_CONFIGURED", 400)

        server_now = datetime.utcnow()
        req_code = cls.generate_request_code()

        first_stage = active_stages[0]
        new_request = Request(
            request_id=req_code,
            process_id=process.id,
            requester_id=requester_id,
            department_id=process.department_id,
            priority=priority.upper() if priority else 'MEDIUM',
            title=title,
            description=description,
            status='IN_PROGRESS',
            current_stage_id=first_stage.id,
            current_stage_sequence=first_stage.sequence,
            sla_status='NORMAL',
            created_at=server_now,
            started_at=server_now
        )
        db.session.add(new_request)
        db.session.flush()

        # Create tracking entries for each stage in sequence
        for idx, stage in enumerate(active_stages):
            is_first = (idx == 0)
            req_stage = RequestStage(
                request_id=new_request.id,
                stage_id=stage.id,
                sequence=stage.sequence,
                department_id=stage.department_id,
                responsible_role_id=stage.responsible_role_id,
                status='IN_PROGRESS' if is_first else 'PENDING',
                sla_duration_hours=stage.sla_duration_hours,
                stage_start_time=server_now if is_first else None,
                processing_time_hours=0.0,
                sla_percentage_used=0.0,
                sla_status='NORMAL' if is_first else 'PENDING',
                sla_violation=False
            )
            db.session.add(req_stage)
            db.session.flush()

            # Record initial events
            init_event = StageEvent(
                request_stage_id=req_stage.id,
                user_id=requester_id,
                event_type='STAGE_INITIALIZED',
                timestamp=server_now,
                details=f"Stage '{stage.name}' initialized in sequence {stage.sequence}"
            )
            db.session.add(init_event)

            if is_first:
                start_event = StageEvent(
                    request_stage_id=req_stage.id,
                    user_id=requester_id,
                    event_type='STAGE_STARTED',
                    timestamp=server_now,
                    details=f"Stage 1 '{stage.name}' automatically started upon request submission"
                )
                db.session.add(start_event)

        db.session.commit()

        AuditService.log_action(
            action="CREATE_REQUEST",
            entity="Request",
            entity_id=new_request.id,
            description=f"Created request {new_request.request_id} for process '{process.name}'",
            user_id=requester_id
        )

        return new_request

    @classmethod
    def check_user_authorization(cls, user: User, request_stage: RequestStage):
        if not user:
            raise WorkflowException("Authentication required to process workflow stage", "UNAUTHORIZED", 401)
        
        user_role = user.role.name if user.role else ""
        if user_role == 'ADMIN':
            return True  # Admin can process any stage

        responsible_role_name = request_stage.responsible_role.name if request_stage.responsible_role else ""

        if user_role == 'MANAGER':
            # Managers can process stages if role matches OR department matches
            if user_role == responsible_role_name or user.department_id == request_stage.department_id:
                return True
        elif user_role == 'EMPLOYEE':
            # Employee must match responsible role and department
            if (user_role == responsible_role_name) and (user.department_id is None or user.department_id == request_stage.department_id):
                return True

        raise WorkflowException(
            f"You are not authorized to process this stage. Responsible Role: {responsible_role_name}, Department: {request_stage.department.name if request_stage.department else 'N/A'}",
            "FORBIDDEN",
            403
        )

    @classmethod
    def complete_stage(cls, request_id_or_code, stage_id_or_seq, user: User, notes: str = None):
        if isinstance(request_id_or_code, int):
            request_record = db.session.get(Request, request_id_or_code)
        else:
            request_record = Request.query.filter((Request.id == request_id_or_code) | (Request.request_id == str(request_id_or_code))).first()

        if not request_record:
            raise WorkflowException("Request record not found", "NOT_FOUND", 404)

        if request_record.status == 'COMPLETED':
            raise WorkflowException("This request is already completed and cannot be modified", "REQUEST_ALREADY_COMPLETED", 400)
        if request_record.status == 'REJECTED':
            raise WorkflowException("This request has been rejected and cannot be modified", "REQUEST_REJECTED", 400)

        stages = sorted(request_record.stages, key=lambda s: s.sequence)
        target_stage = None
        for s in stages:
            if s.id == stage_id_or_seq or s.stage_id == stage_id_or_seq or s.sequence == stage_id_or_seq:
                target_stage = s
                break

        if not target_stage:
            raise WorkflowException("Specified stage tracking record not found for this request", "NOT_FOUND", 404)

        # Validation 1: User authorization
        cls.check_user_authorization(user, target_stage)

        # Validation 2: Cannot complete an unstarted stage
        if target_stage.status == 'PENDING':
            raise WorkflowException("Cannot complete a stage that has not been started yet", "STAGE_NOT_STARTED", 400)

        # Validation 3: Cannot complete the same stage twice
        if target_stage.status == 'COMPLETED':
            raise WorkflowException("Stage has already been completed", "STAGE_ALREADY_COMPLETED", 400)

        # Validation 4: Cannot skip prior required stages
        for prev in stages:
            if prev.sequence < target_stage.sequence:
                if prev.status != 'COMPLETED' and prev.stage.required:
                    raise WorkflowException(
                        f"Cannot complete stage {target_stage.sequence} before prior stage {prev.sequence} ('{prev.stage.name}') is completed",
                        "PREVIOUS_STAGE_INCOMPLETE",
                        400
                    )

        # Execution
        server_now = datetime.utcnow()
        target_stage.stage_end_time = server_now
        target_stage.status = 'COMPLETED'
        target_stage.completed_by_id = user.id
        if notes:
            target_stage.notes = notes

        # Server-side SLA evaluation
        SlaService.evaluate_stage_sla(target_stage, server_now)

        # Add StageEvent
        comp_event = StageEvent(
            request_stage_id=target_stage.id,
            user_id=user.id,
            event_type='STAGE_COMPLETED',
            timestamp=server_now,
            details=f"Completed by {user.full_name}. Processing duration: {target_stage.processing_time_hours}h. SLA Status: {target_stage.sla_status}"
        )
        db.session.add(comp_event)

        # Determine next stage
        next_stage = None
        for s in stages:
            if s.sequence > target_stage.sequence and s.status == 'PENDING':
                next_stage = s
                break

        if next_stage:
            # Advance to next stage
            next_stage.status = 'IN_PROGRESS'
            next_stage.stage_start_time = server_now
            SlaService.evaluate_stage_sla(next_stage, server_now)

            request_record.current_stage_id = next_stage.stage_id
            request_record.current_stage_sequence = next_stage.sequence

            next_event = StageEvent(
                request_stage_id=next_stage.id,
                user_id=user.id,
                event_type='STAGE_STARTED',
                timestamp=server_now,
                details=f"Stage {next_stage.sequence} ('{next_stage.stage.name}') started automatically"
            )
            db.session.add(next_event)
        else:
            # Final stage completed! Request is now finished.
            request_record.status = 'COMPLETED'
            request_record.completed_at = server_now
            request_record.current_stage_id = None

        # Re-evaluate overall request SLA
        SlaService.evaluate_request_sla(request_record, server_now)

        db.session.commit()

        AuditService.log_action(
            action="COMPLETE_STAGE",
            entity="RequestStage",
            entity_id=target_stage.id,
            description=f"Completed stage {target_stage.sequence} ('{target_stage.stage.name}') for request {request_record.request_id}",
            user_id=user.id
        )

        return request_record
