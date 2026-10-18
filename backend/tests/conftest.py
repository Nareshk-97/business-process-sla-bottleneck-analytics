import pytest
import sys
import os

# Ensure backend root is on Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app
from app.extensions import db, hash_password
from app.models.role import Role
from app.models.department import Department
from app.models.user import User
from app.models.process import BusinessProcess
from app.models.stage import ProcessStage


@pytest.fixture(scope='session')
def app():
    os.environ['FLASK_ENV'] = 'testing'
    test_app = create_app('testing')
    return test_app


@pytest.fixture(scope='function')
def client(app):
    with app.app_context():
        db.create_all()
        yield app.test_client()
        db.session.remove()
        db.drop_all()


@pytest.fixture(scope='function')
def seed_base_data(app, client):
    with app.app_context():
        # Roles
        admin_role = Role(name='ADMIN', description='Admin')
        manager_role = Role(name='MANAGER', description='Manager')
        employee_role = Role(name='EMPLOYEE', description='Employee')
        db.session.add_all([admin_role, manager_role, employee_role])
        db.session.flush()

        # Departments
        hr_dept = Department(name='Human Resources', code='HR')
        it_dept = Department(name='Information Technology', code='IT')
        db.session.add_all([hr_dept, it_dept])
        db.session.flush()

        # Users
        admin_user = User(
            email='admin@test.com',
            password_hash=hash_password('Password@123'),
            full_name='Admin Test',
            role_id=admin_role.id,
            is_active=True
        )
        manager_user = User(
            email='manager@test.com',
            password_hash=hash_password('Password@123'),
            full_name='Manager Test',
            role_id=manager_role.id,
            department_id=hr_dept.id,
            is_active=True
        )
        employee_user = User(
            email='employee@test.com',
            password_hash=hash_password('Password@123'),
            full_name='Employee Test',
            role_id=employee_role.id,
            department_id=hr_dept.id,
            is_active=True
        )
        db.session.add_all([admin_user, manager_user, employee_user])
        db.session.flush()

        # Process & Stages
        proc = BusinessProcess(
            name='Test Onboarding',
            department_id=hr_dept.id,
            priority='HIGH',
            overall_sla_hours=24.0,
            created_by=admin_user.id
        )
        db.session.add(proc)
        db.session.flush()

        s1 = ProcessStage(
            process_id=proc.id,
            name='Document Check',
            sequence=1,
            department_id=hr_dept.id,
            responsible_role_id=employee_role.id,
            sla_duration_hours=4.0,
            warning_threshold_pct=75.0,
            required=True
        )
        s2 = ProcessStage(
            process_id=proc.id,
            name='Manager Sign-Off',
            sequence=2,
            department_id=hr_dept.id,
            responsible_role_id=manager_role.id,
            sla_duration_hours=6.0,
            warning_threshold_pct=75.0,
            required=True
        )
        db.session.add_all([s1, s2])
        db.session.commit()

        # Return dict with safe IDs and names
        data = {
            'admin_id': admin_user.id,
            'manager_id': manager_user.id,
            'employee_id': employee_user.id,
            'process_id': proc.id,
            'stage1_id': s1.id,
            'stage2_id': s2.id,
            'hr_dept_id': hr_dept.id,
            'it_dept_id': it_dept.id
        }
        return data
