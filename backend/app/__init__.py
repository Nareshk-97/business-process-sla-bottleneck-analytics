import os
from flask import Flask, jsonify
from app.config import config_by_name
from app.extensions import db, jwt, cors
from app.middleware.error_handler import register_error_handlers
from app.routes import register_blueprints


def create_app(config_name=None):
    if config_name is None:
        config_name = os.getenv('FLASK_ENV', 'development')

    app = Flask(__name__)
    config_cls = config_by_name.get(config_name, config_by_name['default'])
    app.config.from_object(config_cls)

    # Initialize extensions
    db.init_app(app)
    jwt.init_app(app)
    cors.init_app(app, resources={r"/api/*": {"origins": "*"}})

    # Centralized error handlers
    register_error_handlers(app)

    # Register all API endpoints
    register_blueprints(app)

    @app.route('/api/health', methods=['GET'])
    def health_check():
        return jsonify({
            'status': 'healthy',
            'service': 'Business Process SLA & Bottleneck Analytics Platform',
            'version': '1.0.0'
        }), 200

    return app
