def test_workflow_lifecycle(client, seed_base_data):
    # 1. Login as employee
    res_login = client.post('/api/auth/login', json={
        'email': 'employee@test.com',
        'password': 'Password@123'
    })
    emp_token = res_login.get_json()['data']['access_token']

    # 2. Create request
    proc_id = seed_base_data['process_id']
    res_create = client.post('/api/requests', headers={'Authorization': f'Bearer {emp_token}'}, json={
        'process_id': proc_id,
        'title': 'Test Laptop Onboarding Request',
        'description': 'Please configure new hire equipment',
        'priority': 'HIGH'
    })
    assert res_create.status_code == 201
    req_data = res_create.get_json()['data']
    req_id = req_data['id']
    assert req_data['status'] == 'IN_PROGRESS'
    assert req_data['current_stage_sequence'] == 1
    assert len(req_data['stages']) == 2
    assert req_data['stages'][0]['status'] == 'IN_PROGRESS'
    assert req_data['stages'][1]['status'] == 'PENDING'

    # 3. Employee attempts to skip stage 1 and complete stage 2 directly (should fail 400 or 403)
    res_skip = client.post(f'/api/requests/{req_id}/complete-stage', headers={'Authorization': f'Bearer {emp_token}'}, json={
        'stage_sequence': 2
    })
    assert res_skip.status_code in (400, 403)

    # 4. Employee completes stage 1
    res_comp_1 = client.post(f'/api/requests/{req_id}/complete-stage', headers={'Authorization': f'Bearer {emp_token}'}, json={
        'stage_sequence': 1,
        'notes': 'Documents validated and uploaded.'
    })
    assert res_comp_1.status_code == 200
    updated_1 = res_comp_1.get_json()['data']
    assert updated_1['stages'][0]['status'] == 'COMPLETED'
    assert updated_1['stages'][1]['status'] == 'IN_PROGRESS'
    assert updated_1['current_stage_sequence'] == 2

    # 5. Cannot complete stage 1 a second time
    res_repeat = client.post(f'/api/requests/{req_id}/complete-stage', headers={'Authorization': f'Bearer {emp_token}'}, json={
        'stage_sequence': 1
    })
    assert res_repeat.status_code == 400

    # 6. Login as manager to complete stage 2
    res_mgr_login = client.post('/api/auth/login', json={
        'email': 'manager@test.com',
        'password': 'Password@123'
    })
    mgr_token = res_mgr_login.get_json()['data']['access_token']

    res_comp_2 = client.post(f'/api/requests/{req_id}/complete-stage', headers={'Authorization': f'Bearer {mgr_token}'}, json={
        'stage_sequence': 2,
        'notes': 'Final manager approval granted.'
    })
    assert res_comp_2.status_code == 200
    updated_2 = res_comp_2.get_json()['data']
    assert updated_2['status'] == 'COMPLETED'
    assert updated_2['stages'][1]['status'] == 'COMPLETED'
    assert updated_2['completed_at'] is not None

    # 7. Completed request cannot be modified
    res_after = client.post(f'/api/requests/{req_id}/complete-stage', headers={'Authorization': f'Bearer {mgr_token}'}, json={
        'stage_sequence': 2
    })
    assert res_after.status_code == 400
