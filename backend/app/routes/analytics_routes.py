from flask import Blueprint, request
from app.analytics.process_analyzer import ProcessAnalyzer
from app.analytics.stage_analyzer import StageAnalyzer
from app.analytics.sla_analyzer import SlaAnalyzer
from app.analytics.bottleneck_detector import BottleneckDetector
from app.analytics.department_analyzer import DepartmentAnalyzer
from app.analytics.report_generator import ReportGenerator
from app.utils.response import success_response, error_response
from app.middleware.auth_middleware import token_required

analytics_bp = Blueprint('analytics', __name__, url_prefix='/api/analytics')


@analytics_bp.route('/overview', methods=['GET'])
@token_required
def get_overview():
    process_id = request.args.get('process_id')
    department_id = request.args.get('department_id')
    status = request.args.get('status')
    priority = request.args.get('priority')
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')

    data = ProcessAnalyzer.analyze_overview(
        process_id=process_id,
        department_id=department_id,
        status=status,
        priority=priority,
        start_date=start_date,
        end_date=end_date
    )
    return success_response(data=data, message="Overview analytics retrieved successfully")


@analytics_bp.route('/processes', methods=['GET'])
@token_required
def get_processes_analytics():
    data = ProcessAnalyzer.analyze_processes()
    return success_response(data=data, message="Process analytics retrieved successfully")


@analytics_bp.route('/stages', methods=['GET'])
@token_required
def get_stages_analytics():
    process_id = request.args.get('process_id')
    department_id = request.args.get('department_id')
    data = StageAnalyzer.analyze_stages(process_id=process_id, department_id=department_id)
    return success_response(data=data, message="Stage performance analytics retrieved successfully")


@analytics_bp.route('/departments', methods=['GET'])
@token_required
def get_departments_analytics():
    data = DepartmentAnalyzer.analyze_departments()
    return success_response(data=data, message="Department analytics retrieved successfully")


@analytics_bp.route('/sla', methods=['GET'])
@token_required
def get_sla_analytics():
    process_id = request.args.get('process_id')
    department_id = request.args.get('department_id')
    data = SlaAnalyzer.analyze_sla(process_id=process_id, department_id=department_id)
    return success_response(data=data, message="SLA performance analytics retrieved successfully")


@analytics_bp.route('/bottlenecks', methods=['GET'])
@token_required
def get_bottlenecks():
    process_id = request.args.get('process_id')
    department_id = request.args.get('department_id')
    data = BottleneckDetector.detect_bottlenecks(process_id=process_id, department_id=department_id)
    return success_response(data=data, message="Bottleneck analytics retrieved successfully")


@analytics_bp.route('/simulation', methods=['GET', 'POST'])
@token_required
def run_simulation():
    if request.method == 'POST':
        payload = request.get_json() or {}
    else:
        payload = request.args

    process_id = payload.get('process_id')
    stage_id = payload.get('stage_id')
    proposed_sla = payload.get('proposed_sla_hours')
    capacity_change = payload.get('capacity_change_pct', 0.0)

    if not stage_id or proposed_sla is None:
        return error_response(
            error_code="VALIDATION_ERROR",
            message="stage_id and proposed_sla_hours are required for simulation",
            status_code=400
        )

    data, err, code = ReportGenerator.simulate_sla_change(
        process_id=int(process_id) if process_id else None,
        stage_id=int(stage_id),
        proposed_sla_hours=float(proposed_sla),
        capacity_change_pct=float(capacity_change)
    )

    if err:
        return error_response(error_code="SIMULATION_ERROR", message=err, status_code=code)

    return success_response(data=data, message="Simulation computed successfully")
