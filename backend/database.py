from flask_sqlalchemy import SQLAlchemy
import os

db = SQLAlchemy()


def init_db(app):
    """Initialize database with Flask app - sets the database URI and initializes db"""

    # Define paths based on project structure
    # For Windows - get absolute paths
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(backend_dir)  # Go up one level from backend
    data_dir = os.path.join(project_root, 'data')

    # Create data directory if it doesn't exist
    if not os.path.exists(data_dir):
        os.makedirs(data_dir, exist_ok=True)

    # Set database path - Windows compatible
    db_path = os.path.join(data_dir, 'masbana.db')

    # Normalize path for Windows (replace backslashes with forward slashes)
    db_path_normalized = db_path.replace('\\', '/')

    # Set database URI - use 4 slashes for absolute path
    app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path_normalized}'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    # Initialize the db with the app
    db.init_app(app)

    with app.app_context():
        db.create_all()
        print(f"✅ Database initialized at: {db_path}")
        print("✅ Database tables created successfully!")

    return db_path