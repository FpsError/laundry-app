from flask import Blueprint, request, jsonify
from database import db
from models import Booking, TimeSlot, User, BookingStatus
from datetime import datetime, timedelta
from services.waitlist_service import promote_from_waitlist

attendant_bp = Blueprint('attendant', __name__)

@attendant_bp.route('/api/attendant/today', methods=['GET'])
def get_today_bookings():
    """Get all bookings for today, ordered by time slot"""
    try:
        today = datetime.now().date()
        
        bookings = Booking.query.join(TimeSlot).join(User).filter(
            TimeSlot.date == today,
            Booking.status.in_([BookingStatus.CONFIRMED, BookingStatus.RECEIVED, BookingStatus.WASHING])
        ).order_by(TimeSlot.start_time).all()
        
        result = []
        for booking in bookings:
            result.append({
                'id': booking.id,
                'ticket_id': booking.ticket_id,
                'status': booking.status.value,
                'load_type': booking.load_type.value,
                'machines_used': booking.machines_used,
                'student': {
                    'id': booking.user.id,
                    'name': booking.user.full_name,
                    'student_id': booking.user.student_id,
                    'email': booking.user.email,
                    'phone': booking.user.phone
                },
                'slot': {
                    'id': booking.time_slot.id,
                    'pair_id': booking.time_slot.pair_id,
                    'start_time': booking.time_slot.start_time.isoformat(),
                    'end_time': booking.time_slot.end_time.isoformat()
                },
                'drop_off_time': booking.drop_off_time.isoformat() if booking.drop_off_time else None,
                'created_at': booking.created_at.isoformat()
            })
        
        return jsonify({'success': True, 'bookings': result}), 200
    
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@attendant_bp.route('/api/attendant/checkin/<ticket_id>', methods=['POST'])
def checkin_booking(ticket_id):
    """Mark booking as received when student drops off clothes"""
    try:
        booking = Booking.query.filter_by(ticket_id=ticket_id).first()
        
        if not booking:
            return jsonify({'success': False, 'message': 'Booking not found'}), 404
        
        if booking.status == BookingStatus.CANCELLED:
            return jsonify({'success': False, 'message': 'Booking has been cancelled'}), 400
        
        if booking.status == BookingStatus.NO_SHOW:
            return jsonify({'success': False, 'message': 'Booking was marked as no-show'}), 400
        
        # Update status to received
        booking.status = BookingStatus.RECEIVED
        booking.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Booking checked in successfully',
            'booking': {
                'id': booking.id,
                'ticket_id': booking.ticket_id,
                'status': booking.status.value,
                'student_name': booking.user.full_name,
                'load_type': booking.load_type.value
            }
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500

@attendant_bp.route('/api/attendant/no-show/<int:booking_id>', methods=['POST'])
def mark_no_show(booking_id):
    """Mark booking as no-show (manually by attendant)"""
    try:
        booking = Booking.query.get(booking_id)
        
        if not booking:
            return jsonify({'success': False, 'message': 'Booking not found'}), 404
        
        # Free up the machines
        booking.time_slot.available_machines += booking.machines_used
        
        # Update booking status
        booking.status = BookingStatus.NO_SHOW
        booking.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        # Trigger waitlist promotion
        promote_from_waitlist(booking.slot_id)
        
        return jsonify({
            'success': True,
            'message': 'Booking marked as no-show',
            'booking_id': booking.id
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500

@attendant_bp.route('/api/attendant/update-status/<int:booking_id>', methods=['PUT'])
def update_booking_status(booking_id):
    """Update booking status (washing, completed, etc.)"""
    try:
        data = request.json
        new_status = data.get('status')
        
        if not new_status:
            return jsonify({'success': False, 'message': 'Status is required'}), 400
        
        booking = Booking.query.get(booking_id)
        if not booking:
            return jsonify({'success': False, 'message': 'Booking not found'}), 404
        
        # Validate status
        try:
            status_enum = BookingStatus[new_status.upper()]
        except KeyError:
            return jsonify({'success': False, 'message': f'Invalid status: {new_status}'}), 400
        
        booking.status = status_enum
        booking.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Status updated successfully',
            'booking': {
                'id': booking.id,
                'status': booking.status.value
            }
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500
