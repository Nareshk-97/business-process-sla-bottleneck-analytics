from app.analytics.process_analyzer import ProcessAnalyzer
from app.analytics.stage_analyzer import StageAnalyzer
from app.analytics.department_analyzer import DepartmentAnalyzer
from app.analytics.report_generator import ReportGenerator


def test_analytics_and_simulation(client, seed_base_data):
    # 1. Login as admin
    res_login = client.post('/api/auth/login', json={
        'email': 'admin@test.com',
        'password': 'Password@123'
    })
    token = res_login.get_json()['data']['access_token']
    headers = {'Authorization': f'Bearer {token}'}

    # 2. Overview analytics endpoint
    res_over = client.get('/api/analytics/overview', headers=headers)
    assert res_over.status_code == 200
    assert 'total_requests' in res_over.get_json()['data']

    # 3. Process analytics endpoint
    res_proc = client.get('/api/analytics/processes', headers=headers)
    assert res_proc.status_code == 200
    assert isinstance(res_proc.get_json()['data'], list)

    # 4. Bottleneck endpoint
    res_bot = client.get('/api/analytics/bottlenecks', headers=headers)
    assert res_bot.status_code == 200
    assert 'ranked_bottlenecks' in res_bot.get_json()['data']

    # 5. Improvement report
    res_rep = client.get('/api/reports/improvement', headers=headers)
    assert res_rep.status_code == 200
    rep_data = res_rep.get_json()['data']
    assert 'executive_summary' in rep_data
    assert 'recommendations' in rep_data

    # 6. What-if simulation
    stage1_id = seed_base_data['stage1_id']
    res_sim = client.post('/api/analytics/simulation', headers=headers, json={
        'stage_id': stage1_id,
        'proposed_sla_hours': 3.0,
        'capacity_change_pct': 25.0
    })
    assert res_sim.status_code == 200
    sim_data = res_sim.get_json()['data']
    assert sim_data['proposed_sla_hours'] == 3.0
    assert 'projected_avg_time_hours' in sim_data
    assert 'disclaimer' in sim_data
