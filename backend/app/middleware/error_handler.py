from werkzeug.exceptions import HTTPException
from sqlalchemy.exc import SQLAlchemyError, IntegrityError
from app.utils.response import error_response


def register_error_handlers(app):
    @app.errorhandler(400)
    def bad_request(error):
        return error_response(
            error_code="BAD_REQUEST",
            message=str(error.description) if hasattr(error, 'description') else "Bad request",
            status_code=400
        )

    @app.errorhandler(401)
    def unauthorized(error):
        return error_response(
            error_code="UNAUTHORIZED",
            message="Authentication credentials missing or invalid",
            status_code=401
        )

    @app.errorhandler(403)
    def forbidden(error):
        return error_response(
            error_code="FORBIDDEN",
            message="You do not have permission to perform this action",
            status_code=403
        )

    @app.errorhandler(404)
    def not_found(error):
        return error_response(
            error_code="NOT_FOUND",
            message="Requested resource was not found",
            status_code=404
        )

    @app.errorhandler(409)
    def conflict(error):
        return error_response(
            error_code="CONFLICT",
            message=str(error.description) if hasattr(error, 'description') else "Resource conflict",
            status_code=409
        )

    @app.errorhandler(422)
    def unprocessable_entity(error):
        return error_response(
            error_code="UNPROCESSABLE_ENTITY",
            message="Request parameters could not be processed",
            status_code=422
        )

    @app.errorhandler(IntegrityError)
    def handle_integrity_error(error):
        return error_response(
            error_code="DATABASE_INTEGRITY_ERROR",
            message="Operation violates database constraint (e.g. duplicate key or foreign key dependency)",
            status_code=409
        )

    @app.errorhandler(SQLAlchemyError)
    def handle_sqlalchemy_error(error):
        return error_response(
            error_code="DATABASE_ERROR",
            message="A database persistence error occurred",
            status_code=500
        )

    @app.errorhandler(Exception)
    def handle_unexpected_exception(error):
        if isinstance(error, HTTPException):
            return error_response(
                error_code="HTTP_ERROR",
                message=error.description,
                status_code=error.code
            )
        # Log error in production, do not leak raw stack trace
        app.logger.error(f"Unhandled exception: {error}", exc_info=True)
        return error_response(
            error_code="INTERNAL_SERVER_ERROR",
            message="An unexpected server error occurred. Please try again later.",
            status_code=500
        )
