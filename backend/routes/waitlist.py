from flask import Blueprint, request, jsonify
from database import db
from models import Waitlist, TimeSlot, User, WaitlistStatus, LoadType
from datetime import datetime

waitlist_bp = Blueprint('waitlist', __name__)

@waitlist_bp.route('/api/waitlist', methods=['POST'])
def join_waitlist():
    """Join waitlist for a full time slot"""
    try:
        data = request.json
        user_id = data.get('user_id')
        slot_id = data.get('slot_id')
        load_type = data.get('load_type', 'combined')
        
        # Validate user and slot exist
        user = User.query.get(user_id)
        if not user:
            return jsonify({'success': False, 'message': 'User not found'}), 404
        
        slot = TimeSlot.query.get(slot_id)
        if not slot:
            return jsonify({'success': False, 'message': 'Time slot not found'}), 404
        
        # Check if slot is in the past
        if slot.start_time < datetime.utcnow():
            return jsonify({'success': False, 'message': 'Cannot join waitlist for past slots'}), 400
        
        # Check waitlist cap (max 10 people)
        current_waitlist_count = Waitlist.query.filter_by(
            slot_id=slot_id,
            status=WaitlistStatus.WAITING
        ).count()
        
        if current_waitlist_count >= 10:
            return jsonify({'success': False, 'message': 'Waitlist is full (max 10 people)'}), 400
        
        # Check if user is already on waitlist for this slot
        existing_entry = Waitlist.query.filter_by(
            user_id=user_id,
            slot_id=slot_id,
            status=WaitlistStatus.WAITING
        ).first()
        
        if existing_entry:
            return jsonify({'success': False, 'message': 'Already on waitlist for this slot'}), 400
        
        # Calculate position (next available position)
        max_position = db.session.query(db.func.max(Waitlist.position)).filter_by(
            slot_id=slot_id,
            status=WaitlistStatus.WAITING
        ).scalar() or 0
        
        position = max_position + 1
        
        # Create waitlist entry
        waitlist_entry = Waitlist(
            user_id=user_id,
            slot_id=slot_id,
            position=position,
            status=WaitlistStatus.WAITING,
            load_type=LoadType[load_type.upper()] if isinstance(load_type, str) else load_type
        )
        
        db.session.add(waitlist_entry)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Successfully joined waitlist',
            'waitlist_entry': {
                'id': waitlist_entry.id,
                'position': waitlist_entry.position,
                'slot_id': waitlist_entry.slot_id,
                'status': waitlist_entry.status.value
            }
        }), 201
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500

@waitlist_bp.route('/api/waitlist/user/<int:user_id>', methods=['GET'])
def get_user_waitlist(user_id):
    """Get all waitlist entries for a user"""
    try:
        waitlist_entries = Waitlist.query.filter_by(
            user_id=user_id,
            status=WaitlistStatus.WAITING
        ).join(TimeSlot).order_by(TimeSlot.start_time).all()
        
        result = []
        for entry in waitlist_entries:
            result.append({
                'id': entry.id,
                'position': entry.position,
                'load_type': entry.load_type.value,
                'status': entry.status.value,
                'created_at': entry.created_at.isoformat(),
                'slot': {
                    'id': entry.time_slot.id,
                    'pair_id': entry.time_slot.pair_id,
                    'start_time': entry.time_slot.start_time.isoformat(),
                    'end_time': entry.time_slot.end_time.isoformat(),
                    'date': entry.time_slot.date.isoformat()
                }
            })
        
        return jsonify({'success': True, 'waitlist': result}), 200
    
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@waitlist_bp.route('/api/waitlist/<int:waitlist_id>', methods=['DELETE'])
def leave_waitlist(waitlist_id):
    """Leave waitlist"""
    try:
        entry = Waitlist.query.get(waitlist_id)
        if not entry:
            return jsonify({'success': False, 'message': 'Waitlist entry not found'}), 404
        
        slot_id = entry.slot_id
        position = entry.position
        
        # Remove entry
        db.session.delete(entry)
        
        # Update positions of entries after this one
        Waitlist.query.filter(
            Waitlist.slot_id == slot_id,
            Waitlist.position > position,
            Waitlist.status == WaitlistStatus.WAITING
        ).update({Waitlist.position: Waitlist.position - 1})
        
        db.session.commit()
        
        return jsonify({'success': True, 'message': 'Left waitlist successfully'}), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500
