from datetime import datetime
from app.utils.date_utils import calculate_hours_between


class SlaService:
    @staticmethod
    def evaluate_stage_sla(request_stage, current_time=None):
        """
        Calculates processing time, SLA percentage used, SLA status, and violation flag
        for a RequestStage record strictly server-side.
        """
        if current_time is None:
            current_time = datetime.utcnow()

        sla_duration = float(request_stage.sla_duration_hours or 0.0)
        warning_pct = float(request_stage.stage.warning_threshold_pct or 75.0) if request_stage.stage else 75.0

        if request_stage.status == 'PENDING':
            request_stage.processing_time_hours = 0.0
            request_stage.sla_percentage_used = 0.0
            request_stage.sla_status = 'PENDING'
            request_stage.sla_violation = False
            return request_stage

        if request_stage.status == 'IN_PROGRESS':
            if request_stage.stage_start_time:
                elapsed = calculate_hours_between(request_stage.stage_start_time, current_time)
            else:
                elapsed = 0.0
            request_stage.processing_time_hours = round(elapsed, 2)
            pct_used = (elapsed / sla_duration * 100.0) if sla_duration > 0 else 100.0
            request_stage.sla_percentage_used = round(pct_used, 1)

            if elapsed > sla_duration:
                request_stage.sla_status = 'VIOLATED'
                request_stage.sla_violation = True
            elif pct_used >= warning_pct:
                request_stage.sla_status = 'WARNING'
                request_stage.sla_violation = False
            else:
                request_stage.sla_status = 'NORMAL'
                request_stage.sla_violation = False
            return request_stage

        if request_stage.status == 'COMPLETED':
            if request_stage.stage_start_time and request_stage.stage_end_time:
                actual_duration = calculate_hours_between(request_stage.stage_start_time, request_stage.stage_end_time)
            else:
                actual_duration = float(request_stage.processing_time_hours or 0.0)
            
            request_stage.processing_time_hours = round(actual_duration, 2)
            pct_used = (actual_duration / sla_duration * 100.0) if sla_duration > 0 else 100.0
            request_stage.sla_percentage_used = round(pct_used, 1)

            if actual_duration > sla_duration:
                request_stage.sla_status = 'COMPLETED_AFTER_SLA'
                request_stage.sla_violation = True
            else:
                request_stage.sla_status = 'COMPLETED_WITHIN_SLA'
                request_stage.sla_violation = False
            return request_stage

        return request_stage

    @staticmethod
    def evaluate_request_sla(request_record, current_time=None):
        """
        Evaluates the overarching SLA status for a Request record.
        """
        if current_time is None:
            current_time = datetime.utcnow()

        stages = sorted(request_record.stages, key=lambda s: s.sequence)
        total_time = sum(float(s.processing_time_hours or 0.0) for s in stages)
        request_record.total_processing_time_hours = round(total_time, 2)

        has_violation = any(s.sla_violation for s in stages)
        has_warning = any(s.sla_status == 'WARNING' for s in stages)

        overall_sla = float(request_record.process.overall_sla_hours or 24.0) if request_record.process else 24.0

        if request_record.status == 'COMPLETED':
            if has_violation or total_time > overall_sla:
                request_record.sla_status = 'COMPLETED_AFTER_SLA'
            else:
                request_record.sla_status = 'COMPLETED_WITHIN_SLA'
        else:
            if has_violation or total_time > overall_sla:
                request_record.sla_status = 'VIOLATED'
            elif has_warning:
                request_record.sla_status = 'WARNING'
            else:
                request_record.sla_status = 'NORMAL'

        return request_record
