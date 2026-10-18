from flask import Blueprint, request, g
from app.services.process_service import ProcessService
from app.models.stage import ProcessStage
from app.utils.response import success_response, error_response
from app.middleware.auth_middleware import token_required, role_required

stage_bp = Blueprint('stages', __name__)


@stage_bp.route('/api/processes/<int:process_id>/stages', methods=['GET'])
@token_required
def get_process_stages(process_id):
    stages = ProcessStage.query.filter_by(process_id=process_id).order_by(ProcessStage.sequence).all()
    return success_response(
        data=[s.to_dict() for s in stages],
        message="Process stages retrieved successfully"
    )


@stage_bp.route('/api/processes/<int:process_id>/stages', methods=['POST'])
@role_required(['ADMIN'])
def create_process_stage(process_id):
    data = request.get_json() or {}
    name = data.get('name')
    dept_id = data.get('department_id')
    role_id = data.get('responsible_role_id')

    if not name or not dept_id or not role_id:
        return error_response(
            error_code="VALIDATION_ERROR",
            message="Stage name, department_id, and responsible_role_id are required",
            status_code=400
        )

    stage, msg, code = ProcessService.add_stage(process_id, data, g.current_user.id)
    if not stage:
        return error_response(error_code="STAGE_CREATION_FAILED", message=msg, status_code=code)

    return success_response(data=stage.to_dict(), message=msg, status_code=code)


@stage_bp.route('/api/stages/<int:stage_id>', methods=['PUT'])
@role_required(['ADMIN'])
def update_stage(stage_id):
    data = request.get_json() or {}
    stage, msg, code = ProcessService.update_stage(stage_id, data, g.current_user.id)
    if not stage:
        return error_response(error_code="STAGE_UPDATE_FAILED", message=msg, status_code=code)

    return success_response(data=stage.to_dict(), message=msg, status_code=code)
