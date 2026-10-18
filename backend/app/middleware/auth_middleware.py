from functools import wraps
from flask import g
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
from app.models.user import User
from app.extensions import db
from app.utils.response import error_response


def get_current_user():
    """Retrieve the currently authenticated User instance from Flask context."""
    if hasattr(g, 'current_user') and g.current_user:
        return g.current_user
    
    try:
        verify_jwt_in_request()
        identity = get_jwt_identity()
        if not identity:
            return None
        user = db.session.get(User, int(identity))
        if user and user.is_active:
            g.current_user = user
            return user
        return None
    except Exception:
        return None


def token_required(fn):
    """Decorator ensuring request has valid JWT and active user."""
    @wraps(fn)
    def wrapper(*args, **kwargs):
        try:
            verify_jwt_in_request()
        except Exception:
            return error_response(
                error_code="UNAUTHORIZED",
                message="Authentication required or token expired",
                status_code=401
            )
        
        identity = get_jwt_identity()
        user = db.session.get(User, int(identity))
        if not user or not user.is_active:
            return error_response(
                error_code="UNAUTHORIZED",
                message="User account is invalid or deactivated",
                status_code=401
            )
        
        g.current_user = user
        return fn(*args, **kwargs)
    return wrapper


def role_required(allowed_roles):
    """Decorator enforcing Role-Based Access Control (RBAC)."""
    if isinstance(allowed_roles, str):
        allowed_roles = [allowed_roles]

    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            try:
                verify_jwt_in_request()
            except Exception:
                return error_response(
                    error_code="UNAUTHORIZED",
                    message="Authentication required",
                    status_code=401
                )
            
            identity = get_jwt_identity()
            user = db.session.get(User, int(identity))
            if not user or not user.is_active:
                return error_response(
                    error_code="UNAUTHORIZED",
                    message="User account is invalid or deactivated",
                    status_code=401
                )
            
            role_name = user.role.name if user.role else ""
            if role_name not in allowed_roles:
                return error_response(
                    error_code="FORBIDDEN",
                    message=f"Access denied. Requires one of roles: {', '.join(allowed_roles)}",
                    status_code=403
                )
            
            g.current_user = user
            return fn(*args, **kwargs)
        return wrapper
    return decorator
