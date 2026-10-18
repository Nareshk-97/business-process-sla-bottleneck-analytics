from flask import jsonify


def success_response(data=None, message="Operation completed successfully", status_code=200):
    payload = {
        "success": True,
        "message": message,
        "data": data if data is not None else {}
    }
    return jsonify(payload), status_code


def error_response(error_code="ERROR", message="An error occurred", status_code=400, details=None):
    payload = {
        "success": False,
        "error": error_code,
        "message": message
    }
    if details:
        payload["details"] = details
    return jsonify(payload), status_code
