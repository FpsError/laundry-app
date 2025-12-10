from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from urllib.parse import quote_plus

db = SQLAlchemy()

def init_db(app):
    """Initialize database with Flask app"""
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///masbana.db'  # Use SQLite
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    db.init_app(app)
    
    with app.app_context():
        db.create_all()
        print("Database tables created successfully!")
