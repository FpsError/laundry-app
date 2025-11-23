from apscheduler.schedulers.background import BackgroundScheduler
from database import db
from models import Booking, BookingStatus, TimeSlot
from services.waitlist_service import promote_from_waitlist
from datetime import datetime, timedelta
import atexit

scheduler = BackgroundScheduler()

def check_no_shows():
    """
    Automated job to check for no-shows
    Runs every minute to check if bookings should be marked as no-show
    5-minute rule: If student hasn't checked in 5 minutes before slot, cancel booking
    """
    try:
        print(f"Running no-show check at {datetime.now()}")
        
        # Find bookings that are:
        # 1. Status is CONFIRMED (not yet received)
        # 2. Start time is within next 5 minutes or already passed
        cutoff_time = datetime.utcnow() + timedelta(minutes=5)
        
        bookings_to_check = Booking.query.join(TimeSlot).filter(
            Booking.status == BookingStatus.CONFIRMED,
            TimeSlot.start_time <= cutoff_time
        ).all()
        
        for booking in bookings_to_check:
            # Mark as no-show
            booking.status = BookingStatus.NO_SHOW
            booking.updated_at = datetime.utcnow()
            
            # Free up machines
            booking.time_slot.available_machines += booking.machines_used
            
            print(f"Marking booking {booking.id} as no-show (slot starts at {booking.time_slot.start_time})")
            
            # Commit this booking
            db.session.commit()
            
            # Try to promote from waitlist
            promote_from_waitlist(booking.slot_id)
        
        if bookings_to_check:
            print(f"Marked {len(bookings_to_check)} bookings as no-show")
    
    except Exception as e:
        db.session.rollback()
        print(f"Error in no-show check: {str(e)}")

def start_scheduler(app):
    """Initialize and start the scheduler with Flask app context"""
    
    # Add job to run every minute
    scheduler.add_job(
        func=lambda: app.app_context().push() or check_no_shows(),
        trigger="interval",
        minutes=1,
        id='check_no_shows',
        name='Check for no-show bookings every minute',
        replace_existing=True
    )
    
    scheduler.start()
    print("Scheduler started - checking for no-shows every minute")
    
    # Shut down the scheduler when exiting the app
    atexit.register(lambda: scheduler.shutdown())
