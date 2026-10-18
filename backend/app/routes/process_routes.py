from flask import Blueprint, request, g
from app.services.process_service import ProcessService
from app.models.process import BusinessProcess
from app.utils.response import success_response, error_response
from app.middleware.auth_middleware import token_required, role_required

process_bp = Blueprint('processes', __name__, url_prefix='/api/processes')


@process_bp.route('', methods=['GET'])
@token_required
def list_processes():
    dept_id = request.args.get('department_id')
    status = request.args.get('status')
    processes = ProcessService.get_all_processes(department_id=dept_id, status=status)
    return success_response(
        data=[p.to_dict(include_stages=True) for p in processes],
        message="Processes retrieved successfully"
    )


@process_bp.route('', methods=['POST'])
@role_required(['ADMIN'])
def create_process():
    data = request.get_json() or {}
    name = data.get('name')
    dept_id = data.get('department_id')

    if not name or not dept_id:
        return error_response(error_code="VALIDATION_ERROR", message="Name and Department ID are required", status_code=400)

    process = ProcessService.create_process(data, g.current_user.id)
    return success_response(
        data=process.to_dict(include_stages=True),
        message="Business process created successfully",
        status_code=201
    )


@process_bp.route('/<int:process_id>', methods=['GET'])
@token_required
def get_process(process_id):
    process = BusinessProcess.query.get(process_id)
    if not process:
        return error_response(error_code="NOT_FOUND", message="Process not found", status_code=404)

    return success_response(
        data=process.to_dict(include_stages=True),
        message="Process retrieved successfully"
    )


@process_bp.route('/<int:process_id>', methods=['PUT'])
@role_required(['ADMIN'])
def update_process(process_id):
    data = request.get_json() or {}
    process, msg, code = ProcessService.update_process(process_id, data, g.current_user.id)
    if not process:
        return error_response(error_code="UPDATE_FAILED", message=msg, status_code=code)

    return success_response(
        data=process.to_dict(include_stages=True),
        message=msg,
        status_code=code
    )
