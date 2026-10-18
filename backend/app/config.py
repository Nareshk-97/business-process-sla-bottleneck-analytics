import os
from datetime import timedelta
from dotenv import load_dotenv

# Load .env file from backend directory if present
basedir = os.path.abspath(os.path.dirname(os.path.dirname(__file__)))
load_dotenv(os.path.join(basedir, '.env'))


def get_database_uri():
    configured_uri = os.getenv('DATABASE_URL')
    
    # If explicitly SQLite, use it
    if configured_uri and configured_uri.startswith('sqlite'):
        return configured_uri
    
    # Default MySQL connection string
    mysql_user = os.getenv('MYSQL_USER', 'root')
    mysql_pwd = os.getenv('MYSQL_PASSWORD', 'password')
    mysql_host = os.getenv('MYSQL_HOST', 'localhost')
    mysql_port = os.getenv('MYSQL_PORT', '3306')
    mysql_db = os.getenv('MYSQL_DATABASE', 'business_sla_analytics')
    
    mysql_uri = configured_uri or f"mysql+pymysql://{mysql_user}:{mysql_pwd}@{mysql_host}:{mysql_port}/{mysql_db}?charset=utf8mb4"
    
    # Test connection quickly; fallback to SQLite if MySQL service is inaccessible or unauthorized
    try:
        from sqlalchemy import create_engine
        test_engine = create_engine(mysql_uri, connect_args={"connect_timeout": 2})
        with test_engine.connect() as conn:
            pass
        return mysql_uri
    except Exception as e:
        sqlite_fallback = f"sqlite:///{os.path.join(basedir, 'business_sla_analytics.db')}"
        print(f"[DatabaseConfig] Notice: MySQL not reachable ({e}). Using local fallback: {sqlite_fallback}")
        return sqlite_fallback


class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'bpo-sla-super-secret-key-prod-2026')
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'bpo-sla-jwt-secret-key-prod-2026')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=int(os.getenv('JWT_ACCESS_TOKEN_EXPIRES_MINUTES', 1440)))
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_DATABASE_URI = get_database_uri()
    JSON_SORT_KEYS = False


class DevelopmentConfig(Config):
    DEBUG = True


class TestingConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=60)


class ProductionConfig(Config):
    DEBUG = False


config_by_name = {
    'development': DevelopmentConfig,
    'testing': TestingConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}
