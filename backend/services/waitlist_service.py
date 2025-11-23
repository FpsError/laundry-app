from database import db
from models import Waitlist, Booking, TimeSlot, WaitlistStatus, BookingStatus, LoadType
import uuid
from datetime import datetime

def promote_from_waitlist(slot_id):
    """
    Automatically promote the first person in waitlist for a given slot
    Called when a booking is cancelled or marked as no-show
    """
    try:
        # Get the slot
        slot = TimeSlot.query.get(slot_id)
        if not slot:
            return False
        
        # Check if there are machines available
        if slot.available_machines <= 0:
            return False
        
        # Find the first person in waitlist (lowest position, oldest created_at)
        waitlist_entry = Waitlist.query.filter_by(
            slot_id=slot_id,
            status=WaitlistStatus.WAITING
        ).order_by(Waitlist.position, Waitlist.created_at).first()
        
        if not waitlist_entry:
            return False  # No one in waitlist
        
        # Check if enough machines are available for their load type
        machines_needed = 2 if waitlist_entry.load_type in [LoadType.SEPARATE_WHITES, LoadType.SEPARATE_COLORS] else 1
        
        if slot.available_machines < machines_needed:
            return False  # Not enough machines for this person's needs
        
        # Create booking for the promoted user
        ticket_id = str(uuid.uuid4())
        booking = Booking(
            ticket_id=ticket_id,
            user_id=waitlist_entry.user_id,
            slot_id=slot_id,
            load_type=waitlist_entry.load_type,
            status=BookingStatus.CONFIRMED,
            machines_used=machines_needed
        )
        
        # Decrement available machines
        slot.available_machines -= machines_needed
        
        # Update waitlist entry status
        waitlist_entry.status = WaitlistStatus.PROMOTED
        
        # Update positions of remaining waitlist entries
        Waitlist.query.filter(
            Waitlist.slot_id == slot_id,
            Waitlist.position > waitlist_entry.position,
            Waitlist.status == WaitlistStatus.WAITING
        ).update({Waitlist.position: Waitlist.position - 1})
        
        db.session.add(booking)
        db.session.commit()
        
        # TODO: Send notification to promoted user
        # from services.notifications import send_waitlist_promotion
        # send_waitlist_promotion(waitlist_entry.user, booking)
        
        print(f"Promoted user {waitlist_entry.user_id} from waitlist for slot {slot_id}")
        return True
    
    except Exception as e:
        db.session.rollback()
        print(f"Error promoting from waitlist: {str(e)}")
        return False
