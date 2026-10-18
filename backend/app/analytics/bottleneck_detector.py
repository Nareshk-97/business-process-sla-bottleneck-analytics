import numpy as np
import pandas as pd
from app.models.stage import ProcessStage
from app.models.request_stage import RequestStage
from app.extensions import db


class BottleneckDetector:
    # Defined multi-factor weights totaling 1.0 (100%)
    WEIGHTS = {
        'processing_time': 0.30,      # 30%
        'violation_rate': 0.25,       # 25%
        'pending_queue': 0.20,        # 20%
        'request_volume': 0.15,       # 15%
        'sla_utilization': 0.10       # 10%
    }

    @classmethod
    def _normalize_series(cls, values):
        """
        Min-max normalization scaling an array of values to [0, 100].
        Safely handles identical min/max and empty arrays.
        """
        arr = np.array(values, dtype=float)
        if len(arr) == 0:
            return arr
        v_min = float(np.min(arr))
        v_max = float(np.max(arr))
        if v_max == v_min:
            # If all non-zero, treat as baseline 50, otherwise 0
            return np.full_like(arr, 50.0 if v_max > 0 else 0.0)
        return ((arr - v_min) / (v_max - v_min)) * 100.0

    @classmethod
    def classify_risk(cls, score: float) -> str:
        if score >= 81.0:
            return 'CRITICAL'
        elif score >= 61.0:
            return 'HIGH'
        elif score >= 31.0:
            return 'MEDIUM'
        return 'LOW'

    @classmethod
    def generate_explanation(cls, raw_data, norm_data, score, risk_level) -> str:
        reasons = []
        sla_hours = raw_data['sla_duration_hours']
        avg_time = raw_data['average_processing_time']
        viol_pct = raw_data['violation_rate_pct']
        pending = raw_data['pending_queue']
        util = raw_data['sla_utilization_pct']

        if avg_time > sla_hours and sla_hours > 0:
            ratio = round(avg_time / sla_hours, 1)
            reasons.append(f"Average processing time ({avg_time}h) exceeds the SLA threshold ({sla_hours}h) by {ratio}x")
        elif util >= 80.0:
            reasons.append(f"Stage consumes {util}% of available SLA window, leaving minimal buffer for variations")

        if viol_pct >= 30.0:
            reasons.append(f"High SLA violation rate of {viol_pct}% indicates systemic process friction")
        elif viol_pct > 0.0:
            reasons.append(f"SLA violation rate is {viol_pct}%")

        if pending >= 10:
            reasons.append(f"Heavy pending queue of {pending} requests indicates upstream backlog buildup")
        elif pending > 0:
            reasons.append(f"{pending} requests currently pending in queue")

        if not reasons:
            return "Stage operations are running smoothly within designated SLA limits and workload parameters."

        return f"Risk Level: {risk_level}. " + "; ".join(reasons) + "."

    @classmethod
    def detect_bottlenecks(cls, process_id=None, department_id=None):
        query = ProcessStage.query
        if process_id:
            query = query.filter_by(process_id=int(process_id))
        if department_id:
            query = query.filter_by(department_id=int(department_id))

        stages = query.all()
        if not stages:
            return {
                'major_bottleneck': None,
                'ranked_bottlenecks': [],
                'weights': cls.WEIGHTS,
                'total_stages_analyzed': 0
            }

        stage_records = []
        for s in stages:
            execs = RequestStage.query.filter_by(stage_id=s.id).all()
            total_execs = len(execs)
            completed = [e for e in execs if e.status == 'COMPLETED']
            pending = [e for e in execs if e.status in ('PENDING', 'IN_PROGRESS')]
            violations = [e for e in execs if e.sla_violation or e.sla_status in ('VIOLATED', 'COMPLETED_AFTER_SLA')]

            durations = [float(e.processing_time_hours or 0.0) for e in completed]
            avg_time = float(np.mean(durations)) if durations else 0.0
            sla_target = float(s.sla_duration_hours or 0.0)

            viol_pct = (len(violations) / total_execs * 100.0) if total_execs > 0 else 0.0
            util_pct = (avg_time / sla_target * 100.0) if sla_target > 0 else 0.0

            stage_records.append({
                'stage': s,
                'raw': {
                    'stage_id': s.id,
                    'stage_name': s.name,
                    'process_id': s.process_id,
                    'process_name': s.process.name if s.process else 'N/A',
                    'department_id': s.department_id,
                    'department_name': s.department.name if s.department else 'N/A',
                    'sequence': s.sequence,
                    'sla_duration_hours': sla_target,
                    'average_processing_time': round(avg_time, 2),
                    'violation_rate_pct': round(viol_pct, 1),
                    'pending_queue': len(pending),
                    'request_volume': total_execs,
                    'sla_utilization_pct': round(util_pct, 1),
                    'completed_count': len(completed),
                    'violation_count': len(violations)
                }
            })

        if not stage_records:
            return {
                'major_bottleneck': None,
                'ranked_bottlenecks': [],
                'weights': cls.WEIGHTS,
                'total_stages_analyzed': 0
            }

        # Extract metric arrays for normalization
        proc_times = [r['raw']['average_processing_time'] for r in stage_records]
        viol_rates = [r['raw']['violation_rate_pct'] for r in stage_records]
        queues = [r['raw']['pending_queue'] for r in stage_records]
        volumes = [r['raw']['request_volume'] for r in stage_records]
        utils = [r['raw']['sla_utilization_pct'] for r in stage_records]

        # Normalize arrays to [0, 100]
        norm_proc = cls._normalize_series(proc_times)
        norm_viol = cls._normalize_series(viol_rates)
        norm_queue = cls._normalize_series(queues)
        norm_vol = cls._normalize_series(volumes)
        norm_util = cls._normalize_series(utils)

        ranked = []
        for i, item in enumerate(stage_records):
            score = (
                norm_proc[i] * cls.WEIGHTS['processing_time'] +
                norm_viol[i] * cls.WEIGHTS['violation_rate'] +
                norm_queue[i] * cls.WEIGHTS['pending_queue'] +
                norm_vol[i] * cls.WEIGHTS['request_volume'] +
                norm_util[i] * cls.WEIGHTS['sla_utilization']
            )
            final_score = round(float(score), 1)
            risk = cls.classify_risk(final_score)

            norm_components = {
                'norm_processing_time': round(float(norm_proc[i]), 1),
                'norm_violation_rate': round(float(norm_viol[i]), 1),
                'norm_pending_queue': round(float(norm_queue[i]), 1),
                'norm_request_volume': round(float(norm_vol[i]), 1),
                'norm_sla_utilization': round(float(norm_util[i]), 1)
            }

            explanation = cls.generate_explanation(item['raw'], norm_components, final_score, risk)

            ranked.append({
                'stage_id': item['raw']['stage_id'],
                'stage_name': item['raw']['stage_name'],
                'process_id': item['raw']['process_id'],
                'process_name': item['raw']['process_name'],
                'department_id': item['raw']['department_id'],
                'department_name': item['raw']['department_name'],
                'sequence': item['raw']['sequence'],
                'bottleneck_score': final_score,
                'risk_level': risk,
                'average_processing_time': item['raw']['average_processing_time'],
                'sla_duration_hours': item['raw']['sla_duration_hours'],
                'violation_rate_pct': item['raw']['violation_rate_pct'],
                'pending_queue': item['raw']['pending_queue'],
                'request_volume': item['raw']['request_volume'],
                'sla_utilization_pct': item['raw']['sla_utilization_pct'],
                'explanation': explanation,
                'norm_components': norm_components
            })

        # Rank stages descending by bottleneck score
        ranked.sort(key=lambda x: x['bottleneck_score'], reverse=True)

        for rank_idx, r in enumerate(ranked, start=1):
            r['rank'] = rank_idx

        major = ranked[0] if ranked else None

        return {
            'major_bottleneck': major,
            'ranked_bottlenecks': ranked,
            'weights': cls.WEIGHTS,
            'total_stages_analyzed': len(ranked)
        }
