from datetime import datetime


def calculate_hours_between(start_dt: datetime, end_dt: datetime) -> float:
    if not start_dt or not end_dt:
        return 0.0
    diff = end_dt - start_dt
    return max(0.0, diff.total_seconds() / 3600.0)


def format_iso(dt: datetime) -> str:
    return dt.isoformat() if dt else None
