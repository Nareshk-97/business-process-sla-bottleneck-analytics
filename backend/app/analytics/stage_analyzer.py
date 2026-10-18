import pandas as pd
import numpy as np
from app.models.stage import ProcessStage
from app.models.request_stage import RequestStage
from app.models.process import BusinessProcess
from app.extensions import db


class StageAnalyzer:
    @classmethod
    def analyze_stages(cls, process_id=None, department_id=None):
        query = ProcessStage.query
        if process_id:
            query = query.filter_by(process_id=int(process_id))
        if department_id:
            query = query.filter_by(department_id=int(department_id))

        stages = query.all()
        stage_metrics = []

        for stage in stages:
            executions = RequestStage.query.filter_by(stage_id=stage.id).all()
            total_execs = len(executions)
            completed_execs = [e for e in executions if e.status == 'COMPLETED']
            pending_execs = [e for e in executions if e.status in ('PENDING', 'IN_PROGRESS')]
            violations = [e for e in executions if e.sla_violation or e.sla_status in ('VIOLATED', 'COMPLETED_AFTER_SLA')]

            durations = [float(e.processing_time_hours or 0.0) for e in completed_execs]
            sla_target = float(stage.sla_duration_hours or 0.0)

            if durations:
                s_dur = pd.Series(durations)
                avg_time = round(float(s_dur.mean()), 2)
                med_time = round(float(s_dur.median()), 2)
                min_time = round(float(s_dur.min()), 2)
                max_time = round(float(s_dur.max()), 2)
                avg_util = round((avg_time / sla_target * 100.0) if sla_target > 0 else 0.0, 1)
            else:
                avg_time = 0.0
                med_time = 0.0
                min_time = 0.0
                max_time = 0.0
                avg_util = 0.0

            violation_count = len(violations)
            violation_pct = round((violation_count / total_execs * 100.0) if total_execs > 0 else 0.0, 1)

            stage_metrics.append({
                'stage_id': stage.id,
                'stage_name': stage.name,
                'process_id': stage.process_id,
                'process_name': stage.process.name if stage.process else 'N/A',
                'department_id': stage.department_id,
                'department_name': stage.department.name if stage.department else 'N/A',
                'sequence': stage.sequence,
                'sla_duration_hours': sla_target,
                'total_executions': total_execs,
                'completed_executions': len(completed_execs),
                'pending_executions': len(pending_execs),
                'average_processing_time': avg_time,
                'median_processing_time': med_time,
                'minimum_processing_time': min_time,
                'maximum_processing_time': max_time,
                'sla_violations': violation_count,
                'sla_violation_percentage': violation_pct,
                'sla_utilization_percentage': avg_util
            })

        # Identify key highlight stages
        fastest_stage = None
        slowest_stage = None
        most_violated_stage = None
        most_loaded_stage = None

        stages_with_data = [s for s in stage_metrics if s['completed_executions'] > 0]
        if stages_with_data:
            fastest_stage = min(stages_with_data, key=lambda s: s['average_processing_time'])
            slowest_stage = max(stages_with_data, key=lambda s: s['average_processing_time'])
            most_violated_stage = max(stages_with_data, key=lambda s: s['sla_violation_percentage'])

        if stage_metrics:
            most_loaded_stage = max(stage_metrics, key=lambda s: s['total_executions'])

        return {
            'stages': stage_metrics,
            'highlights': {
                'fastest_stage': fastest_stage,
                'slowest_stage': slowest_stage,
                'most_violated_stage': most_violated_stage,
                'most_loaded_stage': most_loaded_stage
            }
        }
