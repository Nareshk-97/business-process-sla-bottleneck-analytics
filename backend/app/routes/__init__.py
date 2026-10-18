from app.routes.auth_routes import auth_bp
from app.routes.process_routes import process_bp
from app.routes.stage_routes import stage_bp
from app.routes.request_routes import request_bp
from app.routes.analytics_routes import analytics_bp
from app.routes.report_routes import report_bp
from app.routes.admin_routes import admin_bp


def register_blueprints(app):
    app.register_blueprint(auth_bp)
    app.register_blueprint(process_bp)
    app.register_blueprint(stage_bp)
    app.register_blueprint(request_bp)
    app.register_blueprint(analytics_bp)
    app.register_blueprint(report_bp)
    app.register_blueprint(admin_bp)
