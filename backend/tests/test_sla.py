from datetime import datetime, timedelta
from app.models.request_stage import RequestStage
from app.models.stage import ProcessStage
from app.services.sla_service import SlaService


def test_sla_evaluation():
    # Setup test stage
    dummy_stage = ProcessStage(
        sla_duration_hours=4.0,
        warning_threshold_pct=75.0
    )

    now = datetime.utcnow()

    # Case 1: Normal in-progress (1 hour elapsed of 4 hours)
    rs_normal = RequestStage(
        status='IN_PROGRESS',
        sla_duration_hours=4.0,
        stage_start_time=now - timedelta(hours=1.0)
    )
    rs_normal.stage = dummy_stage
    SlaService.evaluate_stage_sla(rs_normal, now)
    assert rs_normal.sla_status == 'NORMAL'
    assert rs_normal.sla_violation is False
    assert rs_normal.processing_time_hours == 1.0
    assert rs_normal.sla_percentage_used == 25.0

    # Case 2: Warning threshold exceeded (3.2 hours elapsed of 4 hours = 80%)
    rs_warn = RequestStage(
        status='IN_PROGRESS',
        sla_duration_hours=4.0,
        stage_start_time=now - timedelta(hours=3.2)
    )
    rs_warn.stage = dummy_stage
    SlaService.evaluate_stage_sla(rs_warn, now)
    assert rs_warn.sla_status == 'WARNING'
    assert rs_warn.sla_violation is False
    assert rs_warn.sla_percentage_used == 80.0

    # Case 3: Breached while in-progress (5 hours elapsed of 4 hours)
    rs_breach = RequestStage(
        status='IN_PROGRESS',
        sla_duration_hours=4.0,
        stage_start_time=now - timedelta(hours=5.0)
    )
    rs_breach.stage = dummy_stage
    SlaService.evaluate_stage_sla(rs_breach, now)
    assert rs_breach.sla_status == 'VIOLATED'
    assert rs_breach.sla_violation is True

    # Case 4: Completed within SLA
    rs_comp_ok = RequestStage(
        status='COMPLETED',
        sla_duration_hours=4.0,
        stage_start_time=now - timedelta(hours=3.0),
        stage_end_time=now
    )
    rs_comp_ok.stage = dummy_stage
    SlaService.evaluate_stage_sla(rs_comp_ok, now)
    assert rs_comp_ok.sla_status == 'COMPLETED_WITHIN_SLA'
    assert rs_comp_ok.sla_violation is False

    # Case 5: Completed after SLA
    rs_comp_late = RequestStage(
        status='COMPLETED',
        sla_duration_hours=4.0,
        stage_start_time=now - timedelta(hours=6.5),
        stage_end_time=now
    )
    rs_comp_late.stage = dummy_stage
    SlaService.evaluate_stage_sla(rs_comp_late, now)
    assert rs_comp_late.sla_status == 'COMPLETED_AFTER_SLA'
    assert rs_comp_late.sla_violation is True
