"""
Simple test script to verify database connection and basic functionality
Run this after setting up PostgreSQL to ensure everything works
"""

from flask import Flask
from database import db, init_db
from models import User, Machine, TimeSlot, Booking, Waitlist, UserRole
from services.slot_generator import initialize_machines, generate_daily_slots
from datetime import datetime, timedelta

def test_database_connection():
    """Test database connection and table creation"""
    print("\n=== Testing Database Connection ===")
    
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://postgres:password@localhost:5432/laundry_db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    db.init_app(app)
    
    with app.app_context():
        try:
            # Create all tables
            db.create_all()
            print("✓ Database tables created successfully")
            
            # Test creating a user
            test_user = User(
                email="test@aui.ma",
                password="test123",
                student_id="S12345",
                full_name="Test Student",
                phone="+212600000000",
                role=UserRole.STUDENT
            )
            db.session.add(test_user)
            db.session.commit()
            print("✓ Test user created successfully")
            
            # Initialize machines
            if Machine.query.count() == 0:
                initialize_machines()
                print("✓ Machines initialized (10 machines in 5 pairs)")
            else:
                print("✓ Machines already exist")
            
            # Generate time slots for today
            today = datetime.now().date()
            slots_created = generate_daily_slots(today)
            print(f"✓ Generated {slots_created} time slots for today")
            
            # Verify data
            print("\n=== Database Summary ===")
            print(f"Users: {User.query.count()}")
            print(f"Machines: {Machine.query.count()}")
            print(f"Time Slots: {TimeSlot.query.count()}")
            print(f"Bookings: {Booking.query.count()}")
            print(f"Waitlist Entries: {Waitlist.query.count()}")
            
            # Show machine pairs
            print("\n=== Machine Pairs ===")
            for pair_id in range(1, 6):
                machines = Machine.query.filter_by(pair_id=pair_id).all()
                machine_nums = [m.machine_number for m in machines]
                print(f"Pair {pair_id}: Machines {machine_nums}")
            
            # Show sample time slots
            print("\n=== Sample Time Slots (First 5) ===")
            slots = TimeSlot.query.order_by(TimeSlot.start_time).limit(5).all()
            for slot in slots:
                print(f"Pair {slot.pair_id}: {slot.start_time.strftime('%H:%M')} - {slot.end_time.strftime('%H:%M')} ({slot.available_machines} machines available)")
            
            print("\n✅ All tests passed! Backend is ready.")
            return True
            
        except Exception as e:
            print(f"\n❌ Error: {str(e)}")
            return False

if __name__ == '__main__':
    test_database_connection()
