from app.extensions import db, hash_password, verify_password
from app.models.user import User
from app.models.role import Role
from app.models.department import Department
from app.services.audit_service import AuditService
from flask_jwt_extended import create_access_token


class AuthService:
    @staticmethod
    def register(email: str, password: str, full_name: str, role_name: str = 'EMPLOYEE', department_id: int = None):
        email_clean = email.strip().lower()
        if User.query.filter_by(email=email_clean).first():
            return None, "Email address is already registered", 409

        role = Role.query.filter_by(name=role_name.upper()).first()
        if not role:
            # Default to EMPLOYEE if role not found
            role = Role.query.filter_by(name='EMPLOYEE').first()

        user = User(
            email=email_clean,
            password_hash=hash_password(password),
            full_name=full_name.strip(),
            role_id=role.id,
            department_id=department_id,
            is_active=True
        )
        db.session.add(user)
        db.session.commit()

        AuditService.log_action(
            action="USER_REGISTERED",
            entity="User",
            entity_id=user.id,
            description=f"New user registered: {user.email} with role {role.name}",
            user_id=user.id
        )

        token = create_access_token(identity=str(user.id))
        return {
            'user': user.to_dict(),
            'access_token': token
        }, "Registration successful", 201

    @staticmethod
    def authenticate(email: str, password: str):
        email_clean = email.strip().lower()
        user = User.query.filter_by(email=email_clean).first()
        if not user or not verify_password(password, user.password_hash):
            return None, "Invalid email or password", 401

        if not user.is_active:
            return None, "Account is disabled. Please contact administrator.", 403

        token = create_access_token(identity=str(user.id))

        AuditService.log_action(
            action="USER_LOGIN",
            entity="User",
            entity_id=user.id,
            description=f"User logged in: {user.email}",
            user_id=user.id
        )

        return {
            'user': user.to_dict(),
            'access_token': token
        }, "Login successful", 200

    @staticmethod
    def reset_password(email: str, new_password: str):
        email_clean = email.strip().lower()
        user = User.query.filter_by(email=email_clean).first()
        if not user:
            return None, "No account found with this email", 404

        user.password_hash = hash_password(new_password)
        db.session.commit()

        AuditService.log_action(
            action="PASSWORD_RESET",
            entity="User",
            entity_id=user.id,
            description=f"Password was reset for {user.email}",
            user_id=user.id
        )

        return True, "Password has been successfully updated", 200
