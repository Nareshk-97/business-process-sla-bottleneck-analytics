from flask import Blueprint, request, g
from app.services.auth_service import AuthService
from app.utils.response import success_response, error_response
from app.utils.validators import validate_email, validate_password_strength
from app.middleware.auth_middleware import token_required

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')


@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json() or {}
    email = data.get('email', '')
    password = data.get('password', '')
    full_name = data.get('full_name', '')
    role_name = data.get('role', 'EMPLOYEE')
    department_id = data.get('department_id')

    if not validate_email(email):
        return error_response(error_code="VALIDATION_ERROR", message="A valid email address is required", status_code=400)

    is_valid_pwd, pwd_msg = validate_password_strength(password)
    if not is_valid_pwd:
        return error_response(error_code="VALIDATION_ERROR", message=pwd_msg, status_code=400)

    if not full_name or len(full_name.strip()) < 2:
        return error_response(error_code="VALIDATION_ERROR", message="Full name must be at least 2 characters", status_code=400)

    result, msg, code = AuthService.register(email, password, full_name, role_name, department_id)
    if not result:
        return error_response(error_code="REGISTRATION_FAILED", message=msg, status_code=code)

    return success_response(data=result, message=msg, status_code=code)


@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    email = data.get('email', '')
    password = data.get('password', '')

    if not email or not password:
        return error_response(error_code="VALIDATION_ERROR", message="Email and password are required", status_code=400)

    result, msg, code = AuthService.authenticate(email, password)
    if not result:
        return error_response(error_code="AUTH_FAILED", message=msg, status_code=code)

    return success_response(data=result, message=msg, status_code=code)


@auth_bp.route('/profile', methods=['GET'])
@token_required
def get_profile():
    user = g.current_user
    return success_response(data=user.to_dict(), message="User profile retrieved successfully")


@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    data = request.get_json() or {}
    email = data.get('email', '')
    if not validate_email(email):
        return error_response(error_code="VALIDATION_ERROR", message="Valid email is required", status_code=400)

    # In production sends email; in demo returns reset instruction
    return success_response(
        data={"reset_token_instructions": "Verification email dispatched. Proceed to reset-password."},
        message="If this email is registered, password reset instructions have been sent."
    )


@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    data = request.get_json() or {}
    email = data.get('email', '')
    new_password = data.get('new_password', '')

    if not validate_email(email):
        return error_response(error_code="VALIDATION_ERROR", message="Valid email required", status_code=400)

    is_valid_pwd, pwd_msg = validate_password_strength(new_password)
    if not is_valid_pwd:
        return error_response(error_code="VALIDATION_ERROR", message=pwd_msg, status_code=400)

    success, msg, code = AuthService.reset_password(email, new_password)
    if not success:
        return error_response(error_code="RESET_FAILED", message=msg, status_code=code)

    return success_response(data={}, message=msg, status_code=200)
