import re


def validate_email(email: str) -> bool:
    if not email or not isinstance(email, str):
        return False
    pattern = r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$'
    return bool(re.match(pattern, email.strip()))


def validate_password_strength(password: str) -> tuple[bool, str]:
    if not password or len(password) < 6:
        return False, "Password must be at least 6 characters long"
    return True, ""


def validate_positive_number(val, name="Value") -> tuple[bool, str]:
    try:
        f = float(val)
        if f <= 0:
            return False, f"{name} must be greater than zero"
        return True, ""
    except (ValueError, TypeError):
        return False, f"{name} must be a valid number"
