import json


def test_register_and_login(client, seed_base_data):
    # Test register new user
    res = client.post('/api/auth/register', json={
        'email': 'new.user@test.com',
        'password': 'SecurePassword123',
        'full_name': 'New User',
        'role': 'EMPLOYEE'
    })
    assert res.status_code == 201
    data = res.get_json()
    assert data['success'] is True
    assert 'access_token' in data['data']
    assert data['data']['user']['email'] == 'new.user@test.com'

    # Test duplicate register returns 409
    res_dup = client.post('/api/auth/register', json={
        'email': 'new.user@test.com',
        'password': 'SecurePassword123',
        'full_name': 'New User'
    })
    assert res_dup.status_code == 409

    # Test login success
    res_login = client.post('/api/auth/login', json={
        'email': 'new.user@test.com',
        'password': 'SecurePassword123'
    })
    assert res_login.status_code == 200
    login_data = res_login.get_json()
    assert login_data['success'] is True
    token = login_data['data']['access_token']

    # Test get profile with token
    res_prof = client.get('/api/auth/profile', headers={'Authorization': f'Bearer {token}'})
    assert res_prof.status_code == 200
    assert res_prof.get_json()['data']['email'] == 'new.user@test.com'


def test_auth_invalid_credentials(client, seed_base_data):
    # Wrong password
    res = client.post('/api/auth/login', json={
        'email': 'admin@test.com',
        'password': 'WrongPassword999'
    })
    assert res.status_code == 401
    assert res.get_json()['success'] is False

    # Unauthenticated access to protected endpoint
    res_unauth = client.get('/api/auth/profile')
    assert res_unauth.status_code == 401


def test_rbac_restrictions(client, seed_base_data):
    # Login as Employee
    res_emp = client.post('/api/auth/login', json={
        'email': 'employee@test.com',
        'password': 'Password@123'
    })
    emp_token = res_emp.get_json()['data']['access_token']

    # Employee attempting admin endpoint (should get 403 Forbidden)
    res_admin_users = client.get('/api/admin/users', headers={'Authorization': f'Bearer {emp_token}'})
    assert res_admin_users.status_code == 403

    # Login as Admin
    res_admin = client.post('/api/auth/login', json={
        'email': 'admin@test.com',
        'password': 'Password@123'
    })
    admin_token = res_admin.get_json()['data']['access_token']

    # Admin accessing admin endpoint (should succeed)
    res_admin_ok = client.get('/api/admin/users', headers={'Authorization': f'Bearer {admin_token}'})
    assert res_admin_ok.status_code == 200
    assert len(res_admin_ok.get_json()['data']) >= 3
