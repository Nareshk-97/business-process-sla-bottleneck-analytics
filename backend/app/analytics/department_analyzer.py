import numpy as np
from app.models.department import Department
from app.models.request import Request
from app.models.request_stage import RequestStage
from app.extensions import db


class DepartmentAnalyzer:
    @classmethod
    def analyze_departments(cls):
        departments = Department.query.all()
        dept_data = []

        for d in departments:
            # Direct requests belonging to department
            requests = Request.query.filter_by(department_id=d.id).all()
            total_reqs = len(requests)
            completed_reqs = [r for r in requests if r.status == 'COMPLETED']
            pending_reqs = [r for r in requests if r.status in ('PENDING', 'IN_PROGRESS')]
            violations = [r for r in requests if r.sla_status in ('VIOLATED', 'COMPLETED_AFTER_SLA')]

            req_durations = [float(r.total_processing_time_hours or 0.0) for r in completed_reqs]
            avg_req_time = round(float(np.mean(req_durations)), 2) if req_durations else 0.0
            compliance_pct = round(((total_reqs - len(violations)) / total_reqs * 100.0), 1) if total_reqs > 0 else 100.0

            # Stages handled by this department across all requests
            handled_stages = RequestStage.query.filter_by(department_id=d.id).all()
            completed_stages = [s for s in handled_stages if s.status == 'COMPLETED']
            stage_durations = [float(s.processing_time_hours or 0.0) for s in completed_stages]
            avg_stage_time = round(float(np.mean(stage_durations)), 2) if stage_durations else 0.0

            pending_stages = [s for s in handled_stages if s.status in ('PENDING', 'IN_PROGRESS')]

            dept_data.append({
                'department_id': d.id,
                'name': d.name,
                'code': d.code,
                'total_requests': total_reqs,
                'completed_requests': len(completed_reqs),
                'pending_workload': len(pending_stages),
                'sla_violations': len(violations),
                'sla_compliance_pct': compliance_pct,
                'avg_request_processing_time': avg_req_time,
                'avg_stage_duration': avg_stage_time,
                'total_stages_handled': len(handled_stages)
            })

        # Identify slowest, most overloaded, and highest violations
        slowest_dept = None
        most_overloaded_dept = None
        highest_violation_dept = None

        depts_with_data = [d for d in dept_data if d['total_requests'] > 0]
        if depts_with_data:
            slowest_dept = max(depts_with_data, key=lambda x: x['avg_request_processing_time'])
            highest_violation_dept = max(depts_with_data, key=lambda x: x['sla_violations'])

        if dept_data:
            most_overloaded_dept = max(dept_data, key=lambda x: x['pending_workload'])

        return {
            'departments': dept_data,
            'highlights': {
                'slowest_department': slowest_dept,
                'most_overloaded_department': most_overloaded_dept,
                'highest_violation_department': highest_violation_dept
            }
        }
