from datetime import datetime
import pandas as pd
from app.models.request import Request
from app.models.request_stage import RequestStage
from app.models.department import Department
from app.extensions import db


class SlaAnalyzer:
    @classmethod
    def analyze_sla(cls, process_id=None, department_id=None):
        query = Request.query
        if process_id:
            query = query.filter_by(process_id=int(process_id))
        if department_id:
            query = query.filter_by(department_id=int(department_id))

        requests = query.all()
        total_requests = len(requests)
        if total_requests == 0:
            return {
                'overall_compliance_pct': 100.0,
                'total_violations': 0,
                'violations_by_priority': {},
                'violations_by_department': {},
                'violations_trend': [],
                'at_risk_requests': []
            }

        violated_requests = [r for r in requests if r.sla_status in ('VIOLATED', 'COMPLETED_AFTER_SLA')]
        total_violations = len(violated_requests)
        compliance_pct = round(((total_requests - total_violations) / total_requests * 100.0), 1)

        # Violations by priority
        by_priority = {'LOW': 0, 'MEDIUM': 0, 'HIGH': 0, 'CRITICAL': 0}
        for r in violated_requests:
            p = (r.priority or 'MEDIUM').upper()
            by_priority[p] = by_priority.get(p, 0) + 1

        # Violations by department
        by_department = {}
        for r in violated_requests:
            dept_name = r.department.name if r.department else 'Unknown'
            by_department[dept_name] = by_department.get(dept_name, 0) + 1

        # Violations over time (monthly/weekly trend)
        trend = []
        if violated_requests:
            dates = [r.created_at.strftime('%Y-%m-%d') for r in violated_requests if r.created_at]
            if dates:
                df = pd.DataFrame({'date': dates})
                df['violations'] = 1
                grouped = df.groupby('date').count().reset_index().sort_values('date')
                trend = [{'date': row['date'], 'violations': int(row['violations'])} for _, row in grouped.tail(20).iterrows()]

        # Active at-risk requests (in progress stages with status WARNING or VIOLATED)
        active_stages = RequestStage.query.filter_by(status='IN_PROGRESS').all()
        at_risk = []
        for s in active_stages:
            if s.sla_status in ('WARNING', 'VIOLATED'):
                at_risk.append({
                    'request_id': s.request.request_id if s.request else None,
                    'process_name': s.request.process.name if s.request and s.request.process else None,
                    'stage_name': s.stage.name if s.stage else None,
                    'sequence': s.sequence,
                    'department_name': s.department.name if s.department else None,
                    'sla_duration_hours': float(s.sla_duration_hours or 0.0),
                    'processing_time_hours': float(s.processing_time_hours or 0.0),
                    'sla_percentage_used': float(s.sla_percentage_used or 0.0),
                    'sla_status': s.sla_status
                })

        return {
            'overall_compliance_pct': compliance_pct,
            'total_violations': total_violations,
            'violations_by_priority': by_priority,
            'violations_by_department': by_department,
            'violations_trend': trend,
            'at_risk_requests': at_risk
        }
