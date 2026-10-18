from flask import Blueprint, request
from app.analytics.report_generator import ReportGenerator
from app.analytics.sla_analyzer import SlaAnalyzer
from app.analytics.process_analyzer import ProcessAnalyzer
from app.models.process import BusinessProcess
from app.utils.response import success_response, error_response
from app.middleware.auth_middleware import token_required

report_bp = Blueprint('reports', __name__, url_prefix='/api/reports')


@report_bp.route('/improvement', methods=['GET'])
@token_required
def get_improvement_report():
    process_id = request.args.get('process_id')
    data = ReportGenerator.generate_improvement_report(process_id=process_id)
    return success_response(data=data, message="Improvement report generated successfully")


@report_bp.route('/sla', methods=['GET'])
@token_required
def get_sla_report():
    process_id = request.args.get('process_id')
    data = SlaAnalyzer.analyze_sla(process_id=process_id)
    return success_response(data=data, message="SLA compliance report generated successfully")


@report_bp.route('/process/<int:process_id>', methods=['GET'])
@token_required
def get_process_report(process_id):
    process = BusinessProcess.query.get(process_id)
    if not process:
        return error_response(error_code="NOT_FOUND", message="Process not found", status_code=404)

    report_data = ReportGenerator.generate_improvement_report(process_id=process_id)
    report_data['process_details'] = process.to_dict(include_stages=True)
    return success_response(data=report_data, message="Comprehensive process report generated successfully")
