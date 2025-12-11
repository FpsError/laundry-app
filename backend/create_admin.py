from app import app, db
from models import User, UserRole

with app.app_context():
    # Check if admin already exists
    admin = User.query.filter_by(email='admin@laundry.com').first()

    if not admin:
        admin = User(
            email='admin@laundry.com',
            password='admin123',  # Change this!
            student_id='ADMIN001',
            full_name='Admin User',
            phone='0662587421',
            role=UserRole.ADMIN
        )
        db.session.add(admin)
        db.session.commit()
        print("Admin user created successfully!")
        print("Email: admin@laundry.com")
        print("Password: admin123")
    else:
        print("Admin user already exists!")