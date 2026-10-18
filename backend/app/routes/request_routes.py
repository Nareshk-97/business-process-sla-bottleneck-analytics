from flask import Blueprint, request, g
from app.services.workflow_engine import WorkflowEngine, WorkflowException
from app.models.request import Request
from app.models.request_stage import RequestStage
from app.services.sla_service import SlaService
from app.utils.response import success_response, error_response
from app.middleware.auth_middleware import token_required

request_bp = Blueprint('requests', __name__, url_prefix='/api/requests')


@request_bp.route('', methods=['GET'])
@token_required
def list_requests():
    user = g.current_user
    user_role = user.role.name if user.role else 'EMPLOYEE'

    query = Request.query

    # RBAC filtering: Employees see their submitted requests or requests in their department
    if user_role == 'EMPLOYEE':
        query = query.filter((Request.requester_id == user.id) | (Request.department_id == user.department_id))

    # Optional query filters
    process_id = request.args.get('process_id')
    department_id = request.args.get('department_id')
    status = request.args.get('status')
    priority = request.args.get('priority')
    search = request.args.get('search')

    if process_id:
        query = query.filter(Request.process_id == int(process_id))
    if department_id:
        query = query.filter(Request.department_id == int(department_id))
    if status:
        query = query.filter(Request.status == status.upper())
    if priority:
        query = query.filter(Request.priority == priority.upper())
    if search:
        query = query.filter((Request.request_id.ilike(f"%{search}%")) | (Request.title.ilike(f"%{search}%")))

    # Pagination
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 20))

    pagination = query.order_by(Request.created_at.desc()).paginate(page=page, per_page=per_page, error_out=False)

    return success_response(
        data={
            'items': [r.to_dict(include_stages=False) for r in pagination.items],
            'total': pagination.total,
            'page': pagination.page,
            'per_page': pagination.per_page,
            'total_pages': pagination.pages
        },
        message="Requests retrieved successfully"
    )


@request_bp.route('', methods=['POST'])
@token_required
def create_request():
    data = request.get_json() or {}
    process_id = data.get('process_id')
    title = data.get('title')
    description = data.get('description', '')
    priority = data.get('priority', 'MEDIUM')

    if not process_id or not title:
        return error_response(
            error_code="VALIDATION_ERROR",
            message="process_id and title are required fields",
            status_code=400
        )

    try:
        new_request = WorkflowEngine.create_request(
            process_id=int(process_id),
            requester_id=g.current_user.id,
            title=title.strip(),
            description=description,
            priority=priority
        )
        return success_response(
            data=new_request.to_dict(include_stages=True),
            message="Request submitted and workflow initialized",
            status_code=201
        )
    except WorkflowException as we:
        return error_response(error_code=we.error_code, message=we.message, status_code=we.status_code)


@request_bp.route('/<int:request_id>', methods=['GET'])
@token_required
def get_request(request_id):
    req = Request.query.get(request_id)
    if not req:
        return error_response(error_code="NOT_FOUND", message="Request not found", status_code=404)

    # Re-evaluate live SLA status on fetch
    SlaService.evaluate_request_sla(req)

    return success_response(
        data=req.to_dict(include_stages=True),
        message="Request retrieved successfully"
    )


@request_bp.route('/<int:request_id>/tracking', methods=['GET'])
@token_required
def get_tracking(request_id):
    req = Request.query.get(request_id)
    if not req:
        return error_response(error_code="NOT_FOUND", message="Request not found", status_code=404)

    # Update in-progress SLA calculations dynamically
    for s in req.stages:
        SlaService.evaluate_stage_sla(s)
    SlaService.evaluate_request_sla(req)

    tracking_data = {
        'request': req.to_dict(include_stages=False),
        'timeline': [s.to_dict(include_events=True) for s in sorted(req.stages, key=lambda x: x.sequence)]
    }
    return success_response(data=tracking_data, message="Tracking timeline loaded successfully")


@request_bp.route('/<int:request_id>/complete-stage', methods=['POST'])
@token_required
def complete_stage(request_id):
    data = request.get_json() or {}
    stage_id = data.get('stage_id') or data.get('stage_sequence')
    notes = data.get('notes')

    if stage_id is None:
        return error_response(error_code="VALIDATION_ERROR", message="stage_id or stage_sequence is required", status_code=400)

    try:
        updated_request = WorkflowEngine.complete_stage(
            request_id_or_code=request_id,
            stage_id_or_seq=int(stage_id),
            user=g.current_user,
            notes=notes
        )
        return success_response(
            data=updated_request.to_dict(include_stages=True),
            message="Stage successfully processed and completed"
        )
    except WorkflowException as we:
        return error_response(error_code=we.error_code, message=we.message, status_code=we.status_code)
