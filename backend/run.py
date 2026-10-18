import sys
import os

# Ensure backend root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app import create_app
from app.extensions import db
from seed.seed_data import seed_database

app = create_app(os.getenv('FLASK_ENV', 'development'))


def init_and_seed():
    with app.app_context():
        db.create_all()
        seed_database()


if __name__ == '__main__':
    if len(sys.argv) > 1 and sys.argv[1] == 'seed':
        print("[CLI] Running manual seed command...")
        init_and_seed()
        print("[CLI] Seed command finished.")
        sys.exit(0)

    # Initialize tables and seed automatically if needed
    with app.app_context():
        db.create_all()
        # Automatically seed if database is brand new
        from app.models.user import User
        if not User.query.first():
            print("[Startup] Empty database detected. Running initial seeding...")
            seed_database()

    port = int(os.getenv('PORT', 5000))
    debug = os.getenv('FLASK_ENV', 'development') == 'development'
    print(f"\n=======================================================")
    print(f"🚀 Business Process SLA Analytics API running on port {port}")
    print(f"🔗 Health Check: http://localhost:{port}/api/health")
    print(f"=======================================================\n")
    app.run(host='0.0.0.0', port=port, debug=debug)
