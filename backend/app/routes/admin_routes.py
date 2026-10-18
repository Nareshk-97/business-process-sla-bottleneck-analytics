from flask import Blueprint, request, g
from app.models.user import User
from app.models.department import Department
from app.models.audit_log import AuditLog
from app.extensions import db
from app.services.audit_service import AuditService
from app.utils.response import success_response, error_response
from app.middleware.auth_middleware import role_required

admin_bp = Blueprint('admin', __name__, url_prefix='/api/admin')


@admin_bp.route('/users', methods=['GET'])
@role_required(['ADMIN'])
def list_users():
    users = User.query.order_by(User.id.asc()).all()
    return success_response(
        data=[u.to_dict() for u in users],
        message="Users retrieved successfully"
    )


@admin_bp.route('/users/<int:user_id>/status', methods=['PUT'])
@role_required(['ADMIN'])
def toggle_user_status(user_id):
    user = User.query.get(user_id)
    if not user:
        return error_response(error_code="NOT_FOUND", message="User not found", status_code=404)

    data = request.get_json() or {}
    new_status = data.get('is_active', not user.is_active)
    user.is_active = bool(new_status)
    db.session.commit()

    AuditService.log_action(
        action="USER_STATUS_CHANGE",
        entity="User",
        entity_id=user.id,
        description=f"Admin toggled active status for user {user.email} to {user.is_active}",
        user_id=g.current_user.id
    )

    return success_response(
        data=user.to_dict(),
        message="User status updated successfully"
    )


@admin_bp.route('/departments', methods=['GET'])
@role_required(['ADMIN', 'MANAGER'])
def list_departments():
    depts = Department.query.order_by(Department.name.asc()).all()
    return success_response(
        data=[d.to_dict() for d in depts],
        message="Departments retrieved successfully"
    )


@admin_bp.route('/departments', methods=['POST'])
@role_required(['ADMIN'])
def create_department():
    data = request.get_json() or {}
    name = data.get('name')
    code = data.get('code')
    desc = data.get('description', '')

    if not name or not code:
        return error_response(error_code="VALIDATION_ERROR", message="Department name and code are required", status_code=400)

    if Department.query.filter((Department.name == name) | (Department.code == code)).first():
        return error_response(error_code="CONFLICT", message="Department name or code already exists", status_code=409)

    dept = Department(name=name.strip(), code=code.strip().upper(), description=desc)
    db.session.add(dept)
    db.session.commit()

    AuditService.log_action(
        action="CREATE_DEPARTMENT",
        entity="Department",
        entity_id=dept.id,
        description=f"Created department {dept.name} ({dept.code})",
        user_id=g.current_user.id
    )

    return success_response(data=dept.to_dict(), message="Department created successfully", status_code=201)


@admin_bp.route('/audit-logs', methods=['GET'])
@role_required(['ADMIN'])
def list_audit_logs():
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 50))
    action_filter = request.args.get('action')
    entity_filter = request.args.get('entity')

    query = AuditLog.query
    if action_filter:
        query = query.filter(AuditLog.action.ilike(f"%{action_filter}%"))
    if entity_filter:
        query = query.filter(AuditLog.entity.ilike(f"%{entity_filter}%"))

    pagination = query.order_by(AuditLog.timestamp.desc()).paginate(page=page, per_page=per_page, error_out=False)

    return success_response(
        data={
            'items': [log.to_dict() for log in pagination.items],
            'total': pagination.total,
            'page': pagination.page,
            'per_page': pagination.per_page,
            'total_pages': pagination.pages
        },
        message="Audit logs retrieved successfully"
    )
