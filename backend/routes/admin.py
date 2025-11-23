from flask import Blueprint, request, jsonify
from database import db
from models import Machine
from services.slot_generator import generate_daily_slots, initialize_machines
from datetime import datetime, timedelta

admin_bp = Blueprint('admin', __name__)

@admin_bp.route('/api/admin/generate-slots', methods=['POST'])
def generate_slots():
    """Manually generate time slots for a specific date"""
    try:
        data = request.json
        date_str = data.get('date', datetime.now().strftime('%Y-%m-%d'))
        date = datetime.strptime(date_str, '%Y-%m-%d').date()
        
        operational_hours = data.get('operational_hours', {
            'start': '08:00',
            'end': '20:00'
        })
        
        slot_duration = data.get('slot_duration_minutes', 60)
        
        slots_created = generate_daily_slots(date, operational_hours, slot_duration)
        
        return jsonify({
            'success': True,
            'message': f'Generated {slots_created} time slots for {date}',
            'slots_created': slots_created
        }), 201
    
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@admin_bp.route('/api/admin/generate-week-slots', methods=['POST'])
def generate_week_slots():
    """Generate time slots for the next 7 days"""
    try:
        data = request.json
        operational_hours = data.get('operational_hours', {
            'start': '08:00',
            'end': '20:00'
        })
        
        total_slots = 0
        start_date = datetime.now().date()
        
        for i in range(7):
            date = start_date + timedelta(days=i)
            slots_created = generate_daily_slots(date, operational_hours)
            total_slots += slots_created
        
        return jsonify({
            'success': True,
            'message': f'Generated {total_slots} time slots for next 7 days',
            'slots_created': total_slots
        }), 201
    
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@admin_bp.route('/api/admin/initialize-machines', methods=['POST'])
def init_machines():
    """Initialize the 10 machines (run once during setup)"""
    try:
        initialize_machines()
        
        machines = Machine.query.all()
        result = []
        for machine in machines:
            result.append({
                'id': machine.id,
                'machine_number': machine.machine_number,
                'pair_id': machine.pair_id,
                'status': machine.status
            })
        
        return jsonify({
            'success': True,
            'message': 'Machines initialized successfully',
            'machines': result
        }), 201
    
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@admin_bp.route('/api/admin/machines', methods=['GET'])
def get_machines():
    """Get all machines and their status"""
    try:
        machines = Machine.query.order_by(Machine.machine_number).all()
        
        result = []
        for machine in machines:
            result.append({
                'id': machine.id,
                'machine_number': machine.machine_number,
                'pair_id': machine.pair_id,
                'status': machine.status
            })
        
        return jsonify({'success': True, 'machines': result}), 200
    
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@admin_bp.route('/api/admin/machines/<int:machine_id>/status', methods=['PUT'])
def update_machine_status(machine_id):
    """Update machine status (available, out_of_order, maintenance)"""
    try:
        data = request.json
        new_status = data.get('status')
        
        if new_status not in ['available', 'out_of_order', 'maintenance']:
            return jsonify({'success': False, 'message': 'Invalid status'}), 400
        
        machine = Machine.query.get(machine_id)
        if not machine:
            return jsonify({'success': False, 'message': 'Machine not found'}), 404
        
        machine.status = new_status
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Machine status updated',
            'machine': {
                'id': machine.id,
                'machine_number': machine.machine_number,
                'status': machine.status
            }
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500
