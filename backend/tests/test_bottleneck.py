from app.analytics.bottleneck_detector import BottleneckDetector
from app.models.stage import ProcessStage
from app.models.request_stage import RequestStage
from app.models.request import Request
from app.extensions import db


def test_bottleneck_edge_cases_empty(client, seed_base_data):
    # Case 1: Detect bottlenecks when stages have zero request executions
    res = BottleneckDetector.detect_bottlenecks()
    assert res['total_stages_analyzed'] >= 2
    # When all queues and times are 0, score is 0.0 and risk is LOW
    for b in res['ranked_bottlenecks']:
        assert b['bottleneck_score'] >= 0.0
        assert b['risk_level'] in ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')


def test_bottleneck_normalization_single_value():
    # Test normalization function with identical values
    arr = [10.0, 10.0, 10.0]
    norm = BottleneckDetector._normalize_series(arr)
    assert len(norm) == 3
    # Should not produce NaN or ZeroDivisionError
    assert not any(x != x for x in norm)

    # Empty array
    norm_empty = BottleneckDetector._normalize_series([])
    assert len(norm_empty) == 0


def test_bottleneck_risk_classification():
    assert BottleneckDetector.classify_risk(95.0) == 'CRITICAL'
    assert BottleneckDetector.classify_risk(75.0) == 'HIGH'
    assert BottleneckDetector.classify_risk(50.0) == 'MEDIUM'
    assert BottleneckDetector.classify_risk(15.0) == 'LOW'


def test_bottleneck_algorithm_scoring(client, seed_base_data):
    stage1_id = seed_base_data['stage1_id']
    stage2_id = seed_base_data['stage2_id']
    proc_id = seed_base_data['process_id']
    admin_id = seed_base_data['admin_id']
    dept_id = seed_base_data['hr_dept_id']

    # Inject executions for stage 2 making it heavily violated and delayed
    # and stage 1 fast
    req = Request(
        request_id='REQ-TEST-1',
        process_id=proc_id,
        requester_id=admin_id,
        department_id=dept_id,
        title='Sample',
        status='COMPLETED'
    )
    db.session.add(req)
    db.session.flush()

    # Stage 1: fast (1h vs 4h SLA, 0% violation)
    rs1 = RequestStage(
        request_id=req.id,
        stage_id=stage1_id,
        sequence=1,
        department_id=dept_id,
        responsible_role_id=1,
        status='COMPLETED',
        sla_duration_hours=4.0,
        processing_time_hours=1.0,
        sla_violation=False,
        sla_status='COMPLETED_WITHIN_SLA'
    )
    # Stage 2: huge delay (18h vs 6h SLA, 100% violation)
    rs2 = RequestStage(
        request_id=req.id,
        stage_id=stage2_id,
        sequence=2,
        department_id=dept_id,
        responsible_role_id=2,
        status='COMPLETED',
        sla_duration_hours=6.0,
        processing_time_hours=18.0,
        sla_violation=True,
        sla_status='COMPLETED_AFTER_SLA'
    )
    db.session.add_all([rs1, rs2])
    db.session.commit()

    results = BottleneckDetector.detect_bottlenecks()
    ranked = results['ranked_bottlenecks']
    assert len(ranked) >= 2

    # Stage 2 must rank higher than stage 1 due to high violation and processing time
    top = results['major_bottleneck']
    assert top['stage_id'] == stage2_id
    assert top['bottleneck_score'] > ranked[1]['bottleneck_score']
    assert "exceeds" in top['explanation'] or "Risk" in top['explanation']
