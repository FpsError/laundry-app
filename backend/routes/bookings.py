from flask import Blueprint, request, jsonify
from database import db
from models import TimeSlot, Booking, User, BookingStatus, LoadType
from datetime import datetime, timedelta
from services.waitlist_service import promote_from_waitlist
import uuid

bookings_bp = Blueprint('bookings', __name__)

@bookings_bp.route('/api/slots', methods=['GET'])
def get_available_slots():
    """Get available time slots with machine pair availability"""
    try:
        # Get date parameter (default to today)
        date_str = request.args.get('date', datetime.now().strftime('%Y-%m-%d'))
        date = datetime.strptime(date_str, '%Y-%m-%d').date()
        
        # Query available slots
        slots = TimeSlot.query.filter(
            TimeSlot.date == date,
            TimeSlot.available_machines > 0
        ).order_by(TimeSlot.start_time).all()
        
        result = []
        for slot in slots:
            result.append({
                'id': slot.id,
                'pair_id': slot.pair_id,
                'date': slot.date.isoformat(),
                'start_time': slot.start_time.isoformat(),
                'end_time': slot.end_time.isoformat(),
                'available_machines': slot.available_machines,
                'can_book_combined': slot.available_machines >= 1,
                'can_book_separate': slot.available_machines >= 2
            })
        
        return jsonify({'success': True, 'slots': result}), 200
    
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@bookings_bp.route('/api/bookings', methods=['POST'])
def create_booking():
    """Create a new booking"""
    try:
        data = request.json
        user_id = data.get('user_id')
        slot_id = data.get('slot_id')
        load_type = data.get('load_type', 'combined')
        drop_off_time = data.get('drop_off_time')
        
        # Validate user exists
        user = User.query.get(user_id)
        if not user:
            return jsonify({'success': False, 'message': 'User not found'}), 404
        
        # Validate slot exists and is available
        slot = TimeSlot.query.get(slot_id)
        if not slot:
            return jsonify({'success': False, 'message': 'Time slot not found'}), 404
        
        # Check availability based on load type
        machines_needed = 2 if load_type in ['separate_whites', 'separate_colors'] else 1
        
        if slot.available_machines < machines_needed:
            return jsonify({
                'success': False, 
                'message': f'Not enough machines available. Need {machines_needed}, available: {slot.available_machines}'
            }), 400
        
        # Create booking with unique ticket ID
        ticket_id = str(uuid.uuid4())
        booking = Booking(
            ticket_id=ticket_id,
            user_id=user_id,
            slot_id=slot_id,
            load_type=LoadType[load_type.upper()] if isinstance(load_type, str) else load_type,
            status=BookingStatus.CONFIRMED,
            machines_used=machines_needed,
            drop_off_time=datetime.fromisoformat(drop_off_time) if drop_off_time else None
        )
        
        # Decrement available machines
        slot.available_machines -= machines_needed
        
        db.session.add(booking)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Booking created successfully',
            'booking': {
                'id': booking.id,
                'ticket_id': booking.ticket_id,
                'slot_id': booking.slot_id,
                'load_type': booking.load_type.value,
                'status': booking.status.value,
                'start_time': slot.start_time.isoformat(),
                'pair_id': slot.pair_id
            }
        }), 201
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500

@bookings_bp.route('/api/bookings/user/<int:user_id>', methods=['GET'])
def get_user_bookings(user_id):
    """Get all bookings for a specific user"""
    try:
        bookings = Booking.query.filter_by(user_id=user_id).join(TimeSlot).order_by(TimeSlot.start_time.desc()).all()
        
        result = []
        for booking in bookings:
            result.append({
                'id': booking.id,
                'ticket_id': booking.ticket_id,
                'load_type': booking.load_type.value,
                'status': booking.status.value,
                'machines_used': booking.machines_used,
                'drop_off_time': booking.drop_off_time.isoformat() if booking.drop_off_time else None,
                'created_at': booking.created_at.isoformat(),
                'slot': {
                    'id': booking.time_slot.id,
                    'pair_id': booking.time_slot.pair_id,
                    'start_time': booking.time_slot.start_time.isoformat(),
                    'end_time': booking.time_slot.end_time.isoformat(),
                    'date': booking.time_slot.date.isoformat()
                }
            })
        
        return jsonify({'success': True, 'bookings': result}), 200
    
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@bookings_bp.route('/api/bookings/<int:booking_id>', methods=['DELETE'])
def cancel_booking(booking_id):
    """Cancel a booking (allowed up to 1 hour before scheduled time)"""
    try:
        booking = Booking.query.get(booking_id)
        if not booking:
            return jsonify({'success': False, 'message': 'Booking not found'}), 404
        
        # Check if cancellation is allowed (>1 hour before slot)
        time_until_slot = booking.time_slot.start_time - datetime.utcnow()
        if time_until_slot < timedelta(hours=1):
            return jsonify({
                'success': False,
                'message': 'Cannot cancel booking less than 1 hour before scheduled time'
            }), 400
        
        # Free up the machines
        booking.time_slot.available_machines += booking.machines_used
        
        # Update booking status
        booking.status = BookingStatus.CANCELLED
        
        db.session.commit()
        
        # Trigger waitlist promotion
        promote_from_waitlist(booking.slot_id)
        
        return jsonify({
            'success': True,
            'message': 'Booking cancelled successfully'
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500
