import random
from datetime import datetime, timedelta
from app.extensions import db, hash_password
from app.models.department import Department
from app.models.role import Role
from app.models.user import User
from app.models.process import BusinessProcess
from app.models.stage import ProcessStage
from app.models.request import Request
from app.models.request_stage import RequestStage
from app.models.stage_event import StageEvent
from app.models.audit_log import AuditLog
from app.services.sla_service import SlaService


def seed_database():
    print("[Seed] Initializing database schema...")
    db.create_all()

    # Check if already seeded
    if User.query.filter_by(email='admin@enterprise.com').first():
        print("[Seed] Database already seeded. Skipping initial seed.")
        return

    print("[Seed] Seeding Roles...")
    roles = {
        'ADMIN': Role(name='ADMIN', description='Enterprise System Administrator with global access'),
        'MANAGER': Role(name='MANAGER', description='Department and Operational Workflow Manager'),
        'EMPLOYEE': Role(name='EMPLOYEE', description='Department Staff and Request Processor')
    }
    for r in roles.values():
        db.session.add(r)
    db.session.flush()

    print("[Seed] Seeding Departments...")
    depts = {
        'HR': Department(name='Human Resources', code='HR', description='People Operations, Talent, and Onboarding'),
        'FIN': Department(name='Finance & Accounting', code='FIN', description='Accounts, Invoicing, and Procurement Approvals'),
        'IT': Department(name='Information Technology', code='IT', description='IT Infrastructure, Systems, and Access Management'),
        'OPS': Department(name='Operations & Facilities', code='OPS', description='Physical Logistics, Equipment, and Facilities'),
        'CS': Department(name='Customer Support', code='CS', description='Client Inquiries, Incident Resolution, and Escalations'),
        'LEG': Department(name='Legal & Compliance', code='LEG', description='Regulatory Governance and Contract Audits')
    }
    for d in depts.values():
        db.session.add(d)
    db.session.flush()

    print("[Seed] Seeding Users...")
    hashed_pwd = hash_password('Password@123')
    users_data = [
        ('admin@enterprise.com', 'Alexander Vance (System Admin)', roles['ADMIN'], None),
        ('hr.manager@enterprise.com', 'Sarah Jenkins (HR Director)', roles['MANAGER'], depts['HR']),
        ('fin.manager@enterprise.com', 'Marcus Chen (Finance Director)', roles['MANAGER'], depts['FIN']),
        ('it.manager@enterprise.com', 'Elena Rostova (IT Systems Lead)', roles['MANAGER'], depts['IT']),
        ('ops.manager@enterprise.com', 'Robert Sterling (Operations Lead)', roles['MANAGER'], depts['OPS']),
        ('cs.manager@enterprise.com', 'Priya Sharma (Support Lead)', roles['MANAGER'], depts['CS']),
        ('john.hr@enterprise.com', 'Johnathan Doe (HR Specialist)', roles['EMPLOYEE'], depts['HR']),
        ('alice.fin@enterprise.com', 'Alice Martin (Financial Analyst)', roles['EMPLOYEE'], depts['FIN']),
        ('bob.it@enterprise.com', 'Robert Taylor (Systems Admin)', roles['EMPLOYEE'], depts['IT']),
        ('carol.ops@enterprise.com', 'Carol Williams (Logistics Officer)', roles['EMPLOYEE'], depts['OPS']),
        ('dave.cs@enterprise.com', 'David Miller (Support Specialist)', roles['EMPLOYEE'], depts['CS']),
        ('emma.emp@enterprise.com', 'Emma Watson (Business Requester)', roles['EMPLOYEE'], depts['HR'])
    ]

    users = {}
    for email, full_name, role_obj, dept_obj in users_data:
        u = User(
            email=email,
            password_hash=hashed_pwd,
            full_name=full_name,
            role_id=role_obj.id,
            department_id=dept_obj.id if dept_obj else None,
            is_active=True
        )
        db.session.add(u)
        users[email] = u
    db.session.flush()

    admin_user = users['admin@enterprise.com']

    print("[Seed] Seeding Business Processes and 22 Stages...")
    processes_def = [
        {
            'name': 'Employee Onboarding',
            'key': 'ONBOARDING',
            'dept': depts['HR'],
            'priority': 'HIGH',
            'overall_sla': 38.0,
            'description': 'End-to-end new hire setup spanning verification, approval, workstation provision, and orientation.',
            'stages': [
                ('HR Verification & Verification', 'Document verification and background screening', 1, depts['HR'], roles['EMPLOYEE'], 8.0, 75.0),
                ('Manager Approval & Role Clearance', 'Hiring manager formal sign-off and role permissions authorization', 2, depts['HR'], roles['MANAGER'], 6.0, 75.0),  # Bottleneck stage
                ('IT Account & Security Setup', 'Domain account creation, VPN access, and SSO credentials', 3, depts['IT'], roles['EMPLOYEE'], 8.0, 75.0),
                ('Hardware & Equipment Allocation', 'Laptop build, peripherals assignment, and desk preparation', 4, depts['OPS'], roles['EMPLOYEE'], 12.0, 75.0),
                ('Final Onboarding & Induction', 'Corporate orientation, policy briefing, and badge activation', 5, depts['HR'], roles['MANAGER'], 4.0, 75.0)
            ]
        },
        {
            'name': 'Purchase Order Approval',
            'key': 'PURCHASE',
            'dept': depts['FIN'],
            'priority': 'HIGH',
            'overall_sla': 32.0,
            'description': 'Corporate purchase requisition, vendor compliance evaluation, and budget authorization.',
            'stages': [
                ('Requisition Review & Budget Check', 'Verify budget allocation and item necessity', 1, depts['FIN'], roles['EMPLOYEE'], 6.0, 75.0),
                ('Department Head Sign-Off', 'Executive authorization for capital expenditure', 2, depts['FIN'], roles['MANAGER'], 8.0, 75.0),  # Bottleneck stage
                ('Vendor Compliance Audit', 'Tax credentials, vendor screening, and sanctions verification', 3, depts['LEG'], roles['EMPLOYEE'], 8.0, 75.0),
                ('PO Issuance & Dispatch', 'ERP purchase order generation and supplier notification', 4, depts['FIN'], roles['EMPLOYEE'], 4.0, 75.0),
                ('Receiving & Finance Clearance', 'Proof of delivery matching and payment queue release', 5, depts['FIN'], roles['MANAGER'], 6.0, 75.0)
            ]
        },
        {
            'name': 'Vendor Invoice Processing',
            'key': 'INVOICE',
            'dept': depts['FIN'],
            'priority': 'MEDIUM',
            'overall_sla': 24.0,
            'description': 'Multi-tier verification and settlement of vendor bills against purchase orders.',
            'stages': [
                ('Digital Capture & Extraction', 'Receipt ingestion and automated line item extraction', 1, depts['FIN'], roles['EMPLOYEE'], 4.0, 75.0),
                ('3-Way Matching Validation', 'Cross-match invoice with PO and Goods Received Note', 2, depts['FIN'], roles['EMPLOYEE'], 6.0, 75.0),
                ('Disbursement Authorization', 'Finance leadership approval for cash release', 3, depts['FIN'], roles['MANAGER'], 8.0, 75.0),  # Bottleneck stage
                ('Payment Execution & Reconciliation', 'Wire initiation and bank ledger reconciliation', 4, depts['FIN'], roles['EMPLOYEE'], 6.0, 75.0)
            ]
        },
        {
            'name': 'IT System Access Request',
            'key': 'IT_ACCESS',
            'dept': depts['IT'],
            'priority': 'CRITICAL',
            'overall_sla': 18.0,
            'description': 'Elevated security permissions, VPN setup, and production database credential requests.',
            'stages': [
                ('Ticket Triage & Scoping', 'Initial review of requested privileges against role matrices', 1, depts['IT'], roles['EMPLOYEE'], 2.0, 70.0),
                ('Information Security Audit', 'Risk assessment and least-privilege compliance check', 2, depts['IT'], roles['MANAGER'], 6.0, 75.0),  # Bottleneck stage
                ('Privilege Provisioning', 'Configuration of IAM roles, LDAP groups, and API tokens', 3, depts['IT'], roles['EMPLOYEE'], 6.0, 75.0),
                ('User Verification & Sign-Off', 'Requester validation and multi-factor authentication enrollment', 4, depts['IT'], roles['EMPLOYEE'], 4.0, 75.0)
            ]
        },
        {
            'name': 'Customer Escalation Resolution',
            'key': 'COMPLAINT',
            'dept': depts['CS'],
            'priority': 'CRITICAL',
            'overall_sla': 26.0,
            'description': 'Formal handling of tier-2 customer disputes, service failure root-cause analysis, and compensation.',
            'stages': [
                ('Escalation Triage & Intake', 'Review customer history and determine dispute category', 1, depts['CS'], roles['EMPLOYEE'], 2.0, 70.0),
                ('Cross-Team Root Cause Analysis', 'Investigate operational or billing failure with respective teams', 2, depts['CS'], roles['EMPLOYEE'], 8.0, 75.0),
                ('Settlement & Credit Approval', 'Executive approval for financial credit, refund, or concession', 3, depts['CS'], roles['MANAGER'], 10.0, 75.0),  # Bottleneck stage
                ('Resolution Delivery & Closure', 'Formal customer communication and post-mortem closure', 4, depts['CS'], roles['EMPLOYEE'], 6.0, 75.0)
            ]
        }
    ]

    processes = {}
    all_stages = {}

    for p_def in processes_def:
        bp = BusinessProcess(
            name=p_def['name'],
            description=p_def['description'],
            department_id=p_def['dept'].id,
            priority=p_def['priority'],
            status='ACTIVE',
            overall_sla_hours=p_def['overall_sla'],
            created_by=admin_user.id
        )
        db.session.add(bp)
        db.session.flush()
        processes[p_def['key']] = bp

        stage_list = []
        for s_name, s_desc, seq, s_dept, s_role, sla_h, warn_pct in p_def['stages']:
            st = ProcessStage(
                process_id=bp.id,
                name=s_name,
                description=s_desc,
                sequence=seq,
                department_id=s_dept.id,
                responsible_role_id=s_role.id,
                sla_duration_hours=sla_h,
                warning_threshold_pct=warn_pct,
                required=True,
                status='ACTIVE'
            )
            db.session.add(st)
            db.session.flush()
            stage_list.append(st)
        all_stages[p_def['key']] = stage_list

    print(f"[Seed] Created {len(processes)} processes with {sum(len(s) for s in all_stages.values())} stages.")

    print("[Seed] Generating 120 realistic historical requests across 60 days...")
    now = datetime.utcnow()
    requester_pool = [
        users['emma.emp@enterprise.com'],
        users['john.hr@enterprise.com'],
        users['alice.fin@enterprise.com'],
        users['bob.it@enterprise.com'],
        users['carol.ops@enterprise.com'],
        users['dave.cs@enterprise.com']
    ]

    request_titles = {
        'ONBOARDING': [
            "Senior Data Engineer Onboarding - Analytics Team",
            "Customer Support Lead Onboarding - APAC Shift",
            "Account Executive Hire - Enterprise Sales",
            "QA Automation Lead Onboarding - Core Platform",
            "DevOps Specialist Provisioning - Cloud Infra",
            "Finance Controller Onboarding - Treasury",
            "Product Designer Setup - Mobile Experience",
            "Security Operations Analyst Onboarding"
        ],
        'PURCHASE': [
            "Production Cloud Cluster Annual Contract Renewal",
            "High-Capacity Dual-Screen Workstations for Eng Team",
            "Enterprise CRM License Expansion (50 Seats)",
            "Quarterly Office Supplies & Equipment Requisition",
            "Security Penetration Testing Engagement Contract",
            "Data Center Fiber Optical Interconnect Hardware",
            "Ergonomic Chair Fleet Replacement - Floor 3"
        ],
        'INVOICE': [
            "Vendor Bill INV-9941: Cloud Hosting Infrastructure",
            "Vendor Bill INV-8820: Legal Advisory Retainer",
            "Vendor Bill INV-7712: Hardware Maintenance Support",
            "Vendor Bill INV-6604: Global SaaS Tool Subscriptions",
            "Vendor Bill INV-5531: Facilities Security Contract",
            "Vendor Bill INV-4490: Corporate Travel Management"
        ],
        'IT_ACCESS': [
            "Production RDS Database Read-Write Access Request",
            "Kubernetes Admin Role Escalation for Deployment",
            "Corporate VPN & Zero-Trust Gateway Enrollment",
            "Enterprise Git Repository Ownership Transfer",
            "CI/CD Pipeline Production Secrets Access",
            "Customer Database Anonymized Export Permission"
        ],
        'COMPLAINT': [
            "Customer Incident #8821: SLA Failure on Batch Invoicing",
            "Client Escalation #9102: API Latency Spike During Peak Hours",
            "Priority Ticket #7743: Billing Discrepancy on Overage",
            "Account Dispute #6619: Service Disruption Downtime Credit",
            "Escalation #5544: Data Export Pipeline Timeout Glitch",
            "Client Case #4411: Unresponsive Support Ticket SLA Breach"
        ]
    }

    req_counter = 1000

    # Let's seed 120 requests across the 5 processes
    for proc_key, proc_obj in processes.items():
        stages_for_proc = all_stages[proc_key]
        num_requests_for_proc = 24  # 5 * 24 = 120 total requests

        for i in range(num_requests_for_proc):
            req_counter += 1
            req_id_code = f"REQ-2026-{req_counter}"
            requester = random.choice(requester_pool)
            titles = request_titles[proc_key]
            title = titles[i % len(titles)] + f" (Batch {i+1})"
            priority = random.choices(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], weights=[15, 45, 30, 10])[0]

            # Created between 60 days ago and 2 days ago
            days_ago = random.uniform(0.5, 58.0)
            created_at = now - timedelta(days=days_ago)

            # Determine request status: ~65% completed, ~20% in progress, ~15% pending
            status_rand = random.random()
            if status_rand < 0.65:
                target_status = 'COMPLETED'
            elif status_rand < 0.85:
                target_status = 'IN_PROGRESS'
            else:
                target_status = 'PENDING'

            req = Request(
                request_id=req_id_code,
                process_id=proc_obj.id,
                requester_id=requester.id,
                department_id=proc_obj.department_id,
                priority=priority,
                title=title,
                description=f"Automated business workflow request for {proc_obj.name}. Standard operational intake.",
                status=target_status,
                current_stage_sequence=1,
                created_at=created_at,
                started_at=created_at
            )
            db.session.add(req)
            db.session.flush()

            # Create RequestStages
            current_cursor_time = created_at
            active_stage_idx = 0
            if target_status == 'IN_PROGRESS':
                # Pick a random stage as currently active
                active_stage_idx = random.randint(0, len(stages_for_proc) - 1)

            total_proc_time = 0.0

            for idx, stage in enumerate(stages_for_proc):
                sla_h = float(stage.sla_duration_hours)
                is_bottleneck = ("Approval" in stage.name or "Sign-Off" in stage.name or "Security Audit" in stage.name)

                if target_status == 'COMPLETED':
                    # All stages completed
                    stage_status = 'COMPLETED'
                    start_t = current_cursor_time

                    # Bottleneck stages have ~50% probability of taking 1.2x to 2.8x SLA duration!
                    if is_bottleneck and random.random() < 0.55:
                        actual_dur = round(sla_h * random.uniform(1.2, 2.5), 2)
                    else:
                        actual_dur = round(sla_h * random.uniform(0.3, 0.95), 2)

                    end_t = start_t + timedelta(hours=actual_dur)
                    current_cursor_time = end_t
                    total_proc_time += actual_dur

                    is_violation = (actual_dur > sla_h)
                    sla_status = 'COMPLETED_AFTER_SLA' if is_violation else 'COMPLETED_WITHIN_SLA'
                    pct_used = round(actual_dur / sla_h * 100.0, 1)

                    req_stage = RequestStage(
                        request_id=req.id,
                        stage_id=stage.id,
                        sequence=stage.sequence,
                        department_id=stage.department_id,
                        responsible_role_id=stage.responsible_role_id,
                        status=stage_status,
                        sla_duration_hours=sla_h,
                        stage_start_time=start_t,
                        stage_end_time=end_t,
                        processing_time_hours=actual_dur,
                        sla_percentage_used=pct_used,
                        sla_status=sla_status,
                        sla_violation=is_violation,
                        completed_by_id=random.choice(requester_pool).id,
                        notes=f"Processed stage {stage.sequence}. Dur: {actual_dur}h."
                    )
                    db.session.add(req_stage)
                    db.session.flush()

                    db.session.add(StageEvent(
                        request_stage_id=req_stage.id,
                        user_id=requester.id,
                        event_type='STAGE_INITIALIZED',
                        timestamp=start_t,
                        details=f"Stage {stage.name} initialized"
                    ))
                    db.session.add(StageEvent(
                        request_stage_id=req_stage.id,
                        user_id=req_stage.completed_by_id,
                        event_type='STAGE_COMPLETED',
                        timestamp=end_t,
                        details=f"Stage completed in {actual_dur} hours. Violation: {is_violation}"
                    ))

                elif target_status == 'IN_PROGRESS':
                    if idx < active_stage_idx:
                        # Completed prior stage
                        start_t = current_cursor_time
                        actual_dur = round(sla_h * (random.uniform(1.1, 1.8) if (is_bottleneck and random.random() < 0.5) else random.uniform(0.4, 0.9)), 2)
                        end_t = start_t + timedelta(hours=actual_dur)
                        current_cursor_time = end_t
                        total_proc_time += actual_dur
                        is_viol = (actual_dur > sla_h)

                        req_stage = RequestStage(
                            request_id=req.id,
                            stage_id=stage.id,
                            sequence=stage.sequence,
                            department_id=stage.department_id,
                            responsible_role_id=stage.responsible_role_id,
                            status='COMPLETED',
                            sla_duration_hours=sla_h,
                            stage_start_time=start_t,
                            stage_end_time=end_t,
                            processing_time_hours=actual_dur,
                            sla_percentage_used=round(actual_dur / sla_h * 100.0, 1),
                            sla_status='COMPLETED_AFTER_SLA' if is_viol else 'COMPLETED_WITHIN_SLA',
                            sla_violation=is_viol,
                            completed_by_id=random.choice(requester_pool).id
                        )
                        db.session.add(req_stage)
                        db.session.flush()

                    elif idx == active_stage_idx:
                        # Current active stage
                        start_t = current_cursor_time
                        elapsed = max(0.2, (now - start_t).total_seconds() / 3600.0)
                        pct_used = round(elapsed / sla_h * 100.0, 1)
                        is_viol = elapsed > sla_h
                        if is_viol:
                            s_stat = 'VIOLATED'
                        elif pct_used >= 75.0:
                            s_stat = 'WARNING'
                        else:
                            s_stat = 'NORMAL'

                        req_stage = RequestStage(
                            request_id=req.id,
                            stage_id=stage.id,
                            sequence=stage.sequence,
                            department_id=stage.department_id,
                            responsible_role_id=stage.responsible_role_id,
                            status='IN_PROGRESS',
                            sla_duration_hours=sla_h,
                            stage_start_time=start_t,
                            stage_end_time=None,
                            processing_time_hours=round(elapsed, 2),
                            sla_percentage_used=pct_used,
                            sla_status=s_stat,
                            sla_violation=is_viol,
                            completed_by_id=None
                        )
                        db.session.add(req_stage)
                        db.session.flush()

                        req.current_stage_id = stage.id
                        req.current_stage_sequence = stage.sequence
                        total_proc_time += elapsed

                        db.session.add(StageEvent(
                            request_stage_id=req_stage.id,
                            user_id=requester.id,
                            event_type='STAGE_STARTED',
                            timestamp=start_t,
                            details=f"Stage {stage.name} started"
                        ))

                    else:
                        # Future pending stage
                        req_stage = RequestStage(
                            request_id=req.id,
                            stage_id=stage.id,
                            sequence=stage.sequence,
                            department_id=stage.department_id,
                            responsible_role_id=stage.responsible_role_id,
                            status='PENDING',
                            sla_duration_hours=sla_h,
                            stage_start_time=None,
                            stage_end_time=None,
                            processing_time_hours=0.0,
                            sla_percentage_used=0.0,
                            sla_status='PENDING',
                            sla_violation=False,
                            completed_by_id=None
                        )
                        db.session.add(req_stage)
                        db.session.flush()

                else:  # PENDING
                    is_first = (idx == 0)
                    req_stage = RequestStage(
                        request_id=req.id,
                        stage_id=stage.id,
                        sequence=stage.sequence,
                        department_id=stage.department_id,
                        responsible_role_id=stage.responsible_role_id,
                        status='IN_PROGRESS' if is_first else 'PENDING',
                        sla_duration_hours=sla_h,
                        stage_start_time=created_at if is_first else None,
                        stage_end_time=None,
                        processing_time_hours=0.1 if is_first else 0.0,
                        sla_percentage_used=5.0 if is_first else 0.0,
                        sla_status='NORMAL' if is_first else 'PENDING',
                        sla_violation=False,
                        completed_by_id=None
                    )
                    db.session.add(req_stage)
                    db.session.flush()
                    if is_first:
                        req.current_stage_id = stage.id
                        req.current_stage_sequence = stage.sequence

            # Finalize request timestamps and overall SLA
            req.total_processing_time_hours = round(total_proc_time, 2)
            if target_status == 'COMPLETED':
                req.completed_at = current_cursor_time
                req.current_stage_id = None
            SlaService.evaluate_request_sla(req)

    print("[Seed] Seeding sample Audit Logs...")
    audit_samples = [
        ("INITIALIZE_SCHEMA", "System", "1", "Initialized production enterprise schema and tables", admin_user.id),
        ("SEED_ROLES", "Role", "3", "Configured ADMIN, MANAGER, and EMPLOYEE roles", admin_user.id),
        ("CREATE_PROCESS", "BusinessProcess", "1", "Created Employee Onboarding workflow with 5 stages", admin_user.id),
        ("CREATE_PROCESS", "BusinessProcess", "2", "Created Purchase Order Approval workflow with 5 stages", admin_user.id),
        ("CONFIGURE_SLA", "ProcessStage", "2", "Configured SLA duration of 6 hours on Manager Approval stage", admin_user.id),
        ("BATCH_WORKFLOW_EXEC", "Request", "120", "Executed high-volume simulated operational workflow batches", admin_user.id)
    ]
    for action, entity, entity_id, desc, uid in audit_samples:
        db.session.add(AuditLog(
            user_id=uid,
            action=action,
            entity=entity,
            entity_id=entity_id,
            description=desc,
            timestamp=now - timedelta(days=random.randint(1, 45))
        ))

    db.session.commit()
    print("[Seed] Database seeding completed successfully with 120 requests and realistic historical events!")
