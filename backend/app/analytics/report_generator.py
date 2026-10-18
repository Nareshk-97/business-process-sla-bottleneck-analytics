import os
import numpy as np
import pandas as pd
from app.analytics.process_analyzer import ProcessAnalyzer
from app.analytics.stage_analyzer import StageAnalyzer
from app.analytics.sla_analyzer import SlaAnalyzer
from app.analytics.bottleneck_detector import BottleneckDetector
from app.analytics.department_analyzer import DepartmentAnalyzer
from app.models.stage import ProcessStage
from app.models.request_stage import RequestStage
from app.models.process import BusinessProcess


class ReportGenerator:
    @classmethod
    def generate_improvement_report(cls, process_id=None):
        # 1. Gather analytics through Python engines
        overview = ProcessAnalyzer.analyze_overview(process_id=process_id)
        stage_data = StageAnalyzer.analyze_stages(process_id=process_id)
        sla_data = SlaAnalyzer.analyze_sla(process_id=process_id)
        bottlenecks = BottleneckDetector.detect_bottlenecks(process_id=process_id)
        dept_data = DepartmentAnalyzer.analyze_departments()

        major_bottleneck = bottlenecks.get('major_bottleneck')
        slowest_stage = stage_data['highlights'].get('slowest_stage')
        most_violated = stage_data['highlights'].get('most_violated_stage')

        # 2. Derive key findings deterministically from concrete metrics
        findings = []
        recommendations = []

        if major_bottleneck:
            b_name = major_bottleneck['stage_name']
            b_score = major_bottleneck['bottleneck_score']
            b_time = major_bottleneck['average_processing_time']
            b_sla = major_bottleneck['sla_duration_hours']
            b_viol = major_bottleneck['violation_rate_pct']
            b_dept = major_bottleneck['department_name']

            findings.append({
                'category': 'Critical Bottleneck',
                'title': f"Major Workflow Impediment in '{b_name}' ({b_dept})",
                'description': f"Stage '{b_name}' has a composite bottleneck score of {b_score}/100 ({major_bottleneck['risk_level']} Risk). Average processing time is {b_time}h against an SLA target of {b_sla}h, driving a {b_viol}% SLA breach rate with {major_bottleneck['pending_queue']} pending requests."
            })

            # Data-driven recommendations
            if b_time > b_sla:
                ratio = round(b_time / b_sla, 1)
                recommendations.append({
                    'target_stage': b_name,
                    'department': b_dept,
                    'priority': 'CRITICAL',
                    'action': f"Capacity Expansion & Load Balancing",
                    'detail': f"Processing time is {ratio}x the current SLA limit. Redistribute queue allocations, automate initial document validations, and introduce auto-escalation when queue dwell time hits 60% of SLA."
                })
            else:
                recommendations.append({
                    'target_stage': b_name,
                    'department': b_dept,
                    'priority': 'HIGH',
                    'action': "SLA Calibration & Warning Threshold Adjustment",
                    'detail': f"Adjust stage warning threshold from standard to 60% to trigger earlier supervisor alerts before breaches occur."
                })

        if most_violated and (not major_bottleneck or most_violated['stage_name'] != major_bottleneck['stage_name']):
            findings.append({
                'category': 'SLA Compliance Friction',
                'title': f"High Breach Velocity in '{most_violated['stage_name']}'",
                'description': f"Stage '{most_violated['stage_name']}' demonstrates the highest breach rate across all stages at {most_violated['sla_violation_percentage']}%, with {most_violated['sla_violations']} total recorded violations."
            })
            recommendations.append({
                'target_stage': most_violated['stage_name'],
                'department': most_violated['department_name'],
                'priority': 'HIGH',
                'action': "Streamline Approval Hierarchy",
                'detail': "Implement delegation rules for out-of-office approvers and establish a secondary sign-off pool to avoid single-point dependencies."
            })

        overloaded_dept = dept_data['highlights'].get('most_overloaded_department')
        if overloaded_dept and overloaded_dept['pending_workload'] > 0:
            findings.append({
                'category': 'Department Capacity',
                'title': f"Backlog Concentration in {overloaded_dept['name']}",
                'description': f"{overloaded_dept['name']} currently carries {overloaded_dept['pending_workload']} pending stage tasks, representing the highest operational load across the enterprise."
            })
            recommendations.append({
                'target_stage': 'Cross-Departmental',
                'department': overloaded_dept['name'],
                'priority': 'MEDIUM',
                'action': "Resource Reallocation",
                'detail': f"Temporarily assign cross-trained personnel to assist {overloaded_dept['name']} during peak request intake cycles."
            })

        executive_summary = (
            f"The business process platform has recorded {overview['total_requests']} total requests with an overall "
            f"completion rate of {overview['completion_rate_pct']}% and an SLA compliance rate of {overview['sla_compliance_rate_pct']}%. "
            f"The analysis identified '{major_bottleneck['stage_name'] if major_bottleneck else 'None'}' as the primary operational "
            f"bottleneck with a risk classification of {major_bottleneck['risk_level'] if major_bottleneck else 'LOW'}. "
            f"Implementing the recommended triage workflows and SLA calibrations is projected to significantly reduce cycle times."
        )

        return {
            'executive_summary': executive_summary,
            'overview_kpis': overview,
            'bottleneck_analysis': bottlenecks,
            'stage_performance': stage_data,
            'sla_performance': sla_data,
            'department_performance': dept_data,
            'key_findings': findings,
            'recommendations': recommendations
        }

    @classmethod
    def simulate_sla_change(cls, process_id: int, stage_id: int, proposed_sla_hours: float, capacity_change_pct: float = 0.0):
        """
        What-If Simulation Engine:
        Estimates the impact of proposed SLA targets or capacity changes
        based on historical empirical distributions.
        """
        from app.extensions import db
        stage = db.session.get(ProcessStage, stage_id)
        if not stage:
            return None, "Stage not found", 404

        executions = RequestStage.query.filter_by(stage_id=stage.id, status='COMPLETED').all()
        current_sla = float(stage.sla_duration_hours or 0.0)
        proposed_sla = float(proposed_sla_hours)

        if not executions:
            # Baseline estimation if no historical records
            return {
                'stage_id': stage.id,
                'stage_name': stage.name,
                'current_sla_hours': current_sla,
                'proposed_sla_hours': proposed_sla,
                'current_avg_time_hours': current_sla,
                'projected_avg_time_hours': proposed_sla,
                'current_violation_rate_pct': 0.0,
                'projected_violation_rate_pct': 0.0,
                'estimated_improvement_pct': 0.0,
                'sample_size': 0,
                'disclaimer': "Historical-data-based estimate. Projections are mathematical simulations based on past execution records."
            }, None, 200

        actual_times = np.array([float(e.processing_time_hours or 0.0) for e in executions])
        current_avg_time = round(float(np.mean(actual_times)), 2)

        # Current violation rate with existing SLA
        current_violations = np.sum(actual_times > current_sla)
        current_violation_rate = round(float(current_violations / len(actual_times) * 100.0), 1)

        # Projected impact of capacity change (e.g. +20% staff reduces duration by factor)
        # capacity_change_pct: e.g. +20 means times are scaled by 1 / 1.20
        speedup_factor = 1.0 / (1.0 + (capacity_change_pct / 100.0)) if capacity_change_pct != 0 else 1.0
        projected_times = actual_times * speedup_factor
        projected_avg_time = round(float(np.mean(projected_times)), 2)

        # Projected violations against the proposed SLA threshold
        projected_violations = np.sum(projected_times > proposed_sla)
        projected_violation_rate = round(float(projected_violations / len(projected_times) * 100.0), 1)

        # Estimated improvement in average cycle time
        if current_avg_time > 0:
            improvement_pct = round(((current_avg_time - projected_avg_time) / current_avg_time) * 100.0, 1)
        else:
            improvement_pct = 0.0

        return {
            'stage_id': stage.id,
            'stage_name': stage.name,
            'process_id': stage.process_id,
            'process_name': stage.process.name if stage.process else 'N/A',
            'current_sla_hours': current_sla,
            'proposed_sla_hours': proposed_sla,
            'capacity_change_pct': float(capacity_change_pct),
            'current_avg_time_hours': current_avg_time,
            'projected_avg_time_hours': projected_avg_time,
            'current_violation_rate_pct': current_violation_rate,
            'projected_violation_rate_pct': projected_violation_rate,
            'estimated_improvement_pct': improvement_pct,
            'sample_size': len(executions),
            'disclaimer': "Historical-data-based estimate. Projections are mathematical simulations derived from recorded historical executions and do not guarantee future performance."
        }, None, 200
