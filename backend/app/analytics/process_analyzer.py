from datetime import datetime
import pandas as pd
import numpy as np
from app.models.request import Request
from app.models.process import BusinessProcess
from app.models.department import Department
from app.models.request_stage import RequestStage
from app.extensions import db


class ProcessAnalyzer:
    @staticmethod
    def get_filtered_query(process_id=None, department_id=None, status=None, priority=None, start_date=None, end_date=None):
        query = Request.query
        if process_id:
            query = query.filter(Request.process_id == int(process_id))
        if department_id:
            query = query.filter(Request.department_id == int(department_id))
        if status:
            query = query.filter(Request.status == status.upper())
        if priority:
            query = query.filter(Request.priority == priority.upper())
        if start_date:
            if isinstance(start_date, str):
                start_date = datetime.fromisoformat(start_date.replace('Z', ''))
            query = query.filter(Request.created_at >= start_date)
        if end_date:
            if isinstance(end_date, str):
                end_date = datetime.fromisoformat(end_date.replace('Z', ''))
            query = query.filter(Request.created_at <= end_date)
        return query

    @classmethod
    def analyze_overview(cls, **filters):
        query = cls.get_filtered_query(**filters)
        requests = query.all()

        total_requests = len(requests)
        if total_requests == 0:
            return {
                'total_requests': 0,
                'completed_requests': 0,
                'pending_requests': 0,
                'in_progress_requests': 0,
                'sla_violations': 0,
                'completion_rate_pct': 0.0,
                'sla_compliance_rate_pct': 100.0,
                'avg_completion_time_hours': 0.0,
                'median_completion_time_hours': 0.0,
                'min_completion_time_hours': 0.0,
                'max_completion_time_hours': 0.0,
                'status_distribution': {},
                'priority_distribution': {},
                'timeline': []
            }

        completed = [r for r in requests if r.status == 'COMPLETED']
        pending = [r for r in requests if r.status == 'PENDING']
        in_progress = [r for r in requests if r.status == 'IN_PROGRESS']
        violations = [r for r in requests if r.sla_status in ('VIOLATED', 'COMPLETED_AFTER_SLA')]

        completed_count = len(completed)
        pending_count = len(pending)
        in_progress_count = len(in_progress)
        violation_count = len(violations)

        completion_rate = round((completed_count / total_requests) * 100.0, 1)
        sla_compliance = round(((total_requests - violation_count) / total_requests) * 100.0, 1)

        # Durations for completed requests
        durations = [float(r.total_processing_time_hours or 0.0) for r in completed if r.total_processing_time_hours is not None]

        if durations:
            s_durations = pd.Series(durations)
            avg_time = round(float(s_durations.mean()), 2)
            median_time = round(float(s_durations.median()), 2)
            min_time = round(float(s_durations.min()), 2)
            max_time = round(float(s_durations.max()), 2)
        else:
            avg_time = 0.0
            median_time = 0.0
            min_time = 0.0
            max_time = 0.0

        # Status distribution
        status_dist = {
            'COMPLETED': completed_count,
            'IN_PROGRESS': in_progress_count,
            'PENDING': pending_count
        }

        # Priority distribution
        priority_dist = {}
        for r in requests:
            p = r.priority or 'MEDIUM'
            priority_dist[p] = priority_dist.get(p, 0) + 1

        # Requests over time (timeline aggregation by week or month)
        dates = [r.created_at.strftime('%Y-%m-%d') for r in requests if r.created_at]
        if dates:
            df_dates = pd.DataFrame({'date': dates})
            df_dates['count'] = 1
            grouped = df_dates.groupby('date').count().reset_index().sort_values('date')
            timeline = [{'date': row['date'], 'requests': int(row['count'])} for _, row in grouped.tail(30).iterrows()]
        else:
            timeline = []

        return {
            'total_requests': total_requests,
            'completed_requests': completed_count,
            'pending_requests': pending_count,
            'in_progress_requests': in_progress_count,
            'sla_violations': violation_count,
            'completion_rate_pct': completion_rate,
            'sla_compliance_rate_pct': sla_compliance,
            'avg_completion_time_hours': avg_time,
            'median_completion_time_hours': median_time,
            'min_completion_time_hours': min_time,
            'max_completion_time_hours': max_time,
            'status_distribution': status_dist,
            'priority_distribution': priority_dist,
            'timeline': timeline
        }

    @classmethod
    def analyze_processes(cls, **filters):
        processes = BusinessProcess.query.all()
        results = []

        for proc in processes:
            proc_requests = Request.query.filter_by(process_id=proc.id).all()
            total = len(proc_requests)
            if total == 0:
                results.append({
                    'id': proc.id,
                    'name': proc.name,
                    'department_name': proc.department.name if proc.department else 'N/A',
                    'priority': proc.priority,
                    'status': proc.status,
                    'overall_sla_hours': proc.overall_sla_hours,
                    'total_requests': 0,
                    'completed_requests': 0,
                    'in_progress_requests': 0,
                    'pending_requests': 0,
                    'sla_violations': 0,
                    'sla_compliance_pct': 100.0,
                    'avg_completion_time_hours': 0.0
                })
                continue

            completed = [r for r in proc_requests if r.status == 'COMPLETED']
            violations = [r for r in proc_requests if r.sla_status in ('VIOLATED', 'COMPLETED_AFTER_SLA')]
            durations = [float(r.total_processing_time_hours or 0.0) for r in completed]
            avg_time = round(float(np.mean(durations)), 2) if durations else 0.0
            sla_comp = round(((total - len(violations)) / total) * 100.0, 1)

            results.append({
                'id': proc.id,
                'name': proc.name,
                'department_name': proc.department.name if proc.department else 'N/A',
                'priority': proc.priority,
                'status': proc.status,
                'overall_sla_hours': float(proc.overall_sla_hours or 0.0),
                'total_requests': total,
                'completed_requests': len(completed),
                'in_progress_requests': sum(1 for r in proc_requests if r.status == 'IN_PROGRESS'),
                'pending_requests': sum(1 for r in proc_requests if r.status == 'PENDING'),
                'sla_violations': len(violations),
                'sla_compliance_pct': sla_comp,
                'avg_completion_time_hours': avg_time
            })

        return results
