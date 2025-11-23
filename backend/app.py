from flask import Flask, request, jsonify
from flask_cors import CORS
from database import db
from models import User, Booking, TimeSlot, Machine, Waitlist, UserRole, BookingStatus, LoadType, WaitlistStatus
from datetime import datetime, timedelta
import jwt
from functools import wraps
import os

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///masbana.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'your-secret-key-change-in-production')

db.init_app(app)
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Authentication decorator
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'message': 'Token is missing'}), 401
        try:
            if token.startswith('Bearer '):
                token = token[7:]
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
            current_user = User.query.get(data['user_id'])
        except:
            return jsonify({'message': 'Token is invalid'}), 401
        return f(current_user, *args, **kwargs)
    return decorated

def role_required(*roles):
    def decorator(f):
        @wraps(f)
        def decorated_function(current_user, *args, **kwargs):
            if current_user.role not in roles:
                return jsonify({'message': 'Unauthorized'}), 403
            return f(current_user, *args, **kwargs)
        return decorated_function
    return decorator

# Auth Routes
@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json()
    
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'message': 'Email already exists'}), 400
    
    if User.query.filter_by(student_id=data.get('student_id')).first():
        return jsonify({'message': 'Student ID already exists'}), 400
    
    try:
        new_user = User(
            email=data['email'],
            password=data['password'],  # Hash this in production!
            student_id=data.get('student_id'),
            full_name=data.get('full_name'),
            phone=data.get('phone'),
            role=UserRole.STUDENT
        )
        
        db.session.add(new_user)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Registration failed: {str(e)}'}), 500
    
    token = jwt.encode({
        'user_id': new_user.id,
        'exp': datetime.utcnow() + timedelta(days=7)
    }, app.config['SECRET_KEY'], algorithm="HS256")
    
    return jsonify({
        'message': 'Registration successful',
        'token': token,
        'user': {
            'id': new_user.id,
            'email': new_user.email,
            'role': new_user.role.value,
            'full_name': new_user.full_name
        }
    }), 201

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    user = User.query.filter_by(email=data['email']).first()
    
    if not user or user.password != data['password']:  # Use proper password hashing!
        return jsonify({'message': 'Invalid credentials'}), 401
    
    token = jwt.encode({
        'user_id': user.id,
        'exp': datetime.utcnow() + timedelta(days=7)
    }, app.config['SECRET_KEY'], algorithm="HS256")
    
    return jsonify({
        'token': token,
        'user': {
            'id': user.id,
            'email': user.email,
            'role': user.role.value,
            'full_name': user.full_name
        }
    })

# Time Slots Routes
@app.route('/api/timeslots', methods=['GET'])
@token_required
def get_timeslots(current_user):
    date_str = request.args.get('date')
    pair_id = request.args.get('pair_id')
    
    query = TimeSlot.query
    if date_str:
        date = datetime.strptime(date_str, '%Y-%m-%d').date()
        query = query.filter_by(date=date)
    if pair_id:
        query = query.filter_by(pair_id=int(pair_id))
    
    slots = query.all()
    now = datetime.now()
    
    # Filter out slots that are in the past or less than 2 hours from now
    available_slots = []
    for slot in slots:
        # If slot is today, check if it's at least 2 hours from now
        if slot.date == now.date():
            time_until_slot = (slot.start_time - now).total_seconds() / 3600  # hours
            if time_until_slot < 2:
                continue  # Skip slots less than 2 hours away
        # Skip past dates
        elif slot.date < now.date():
            continue
        
        # Calculate actual available machines based on confirmed bookings
        confirmed_bookings = Booking.query.filter_by(
            slot_id=slot.id
        ).filter(
            Booking.status.in_([BookingStatus.CONFIRMED, BookingStatus.RECEIVED, BookingStatus.WASHING])
        ).all()
        
        total_machines_used = sum(booking.machines_used for booking in confirmed_bookings)
        actual_available = 2 - total_machines_used  # 2 machines per pair
        
        available_slots.append({
            'id': slot.id,
            'pair_id': slot.pair_id,
            'date': slot.date.isoformat(),
            'start_time': slot.start_time.isoformat(),
            'end_time': slot.end_time.isoformat(),
            'available_machines': max(0, actual_available)
        })
    
    return jsonify(available_slots)

@app.route('/api/timeslots', methods=['POST'])
@token_required
@role_required(UserRole.ADMIN)
def create_timeslot(current_user):
    data = request.get_json()
    
    new_slot = TimeSlot(
        pair_id=data['pair_id'],
        date=datetime.strptime(data['date'], '%Y-%m-%d').date(),
        start_time=datetime.fromisoformat(data['start_time']),
        end_time=datetime.fromisoformat(data['end_time']),
        available_machines=2
    )
    
    db.session.add(new_slot)
    db.session.commit()
    
    return jsonify({'message': 'Time slot created', 'id': new_slot.id}), 201

# Booking Routes
@app.route('/api/bookings', methods=['GET'])
@token_required
def get_bookings(current_user):
    if current_user.role == UserRole.STUDENT:
        bookings = Booking.query.filter_by(user_id=current_user.id).all()
    else:
        bookings = Booking.query.all()
    
    return jsonify([{
        'id': booking.id,
        'ticket_id': booking.ticket_id,
        'user_id': booking.user_id,
        'slot_id': booking.slot_id,
        'load_type': booking.load_type.value,
        'status': booking.status.value,
        'machines_used': booking.machines_used,
        'created_at': booking.created_at.isoformat()
    } for booking in bookings])

@app.route('/api/bookings', methods=['POST'])
@token_required
def create_booking(current_user):
    data = request.get_json()
    
    slot = TimeSlot.query.get(data['slot_id'])
    if not slot:
        return jsonify({'message': 'Time slot not found'}), 404
    
    # Check if slot is in the past or less than 2 hours from now
    now = datetime.now()
    if slot.date == now.date():
        time_until_slot = (slot.start_time - now).total_seconds() / 3600  # hours
        if time_until_slot < 2:
            return jsonify({'message': 'Cannot book slots less than 2 hours in advance'}), 400
    elif slot.date < now.date():
        return jsonify({'message': 'Cannot book past time slots'}), 400
    
    # Check if user already has a booking for this slot
    existing_booking = Booking.query.filter_by(
        user_id=current_user.id,
        slot_id=slot.id
    ).filter(
        Booking.status.in_([BookingStatus.CONFIRMED, BookingStatus.RECEIVED, BookingStatus.WASHING])
    ).first()
    
    if existing_booking:
        return jsonify({'message': 'You already have a booking for this time slot'}), 400
    
    # Check for bookings in adjacent time slots (10-minute buffer rule)
    # Get all user's active bookings on the same date
    user_bookings_same_date = db.session.query(Booking).join(TimeSlot).filter(
        Booking.user_id == current_user.id,
        TimeSlot.date == slot.date,
        Booking.status.in_([BookingStatus.CONFIRMED, BookingStatus.RECEIVED, BookingStatus.WASHING])
    ).all()
    
    from datetime import timedelta
    buffer_minutes = 10
    
    for booking in user_bookings_same_date:
        booking_slot = booking.time_slot
        
        # Check if new slot starts too soon after existing booking ends
        # or if existing booking starts too soon after new slot ends
        time_after_existing = (slot.start_time - booking_slot.end_time).total_seconds() / 60
        time_after_new = (booking_slot.start_time - slot.end_time).total_seconds() / 60
        
        # If either gap is less than 10 minutes (and positive), or if they overlap (negative), reject
        if (-1 < time_after_existing < buffer_minutes) or (-1 < time_after_new < buffer_minutes):
            return jsonify({
                'message': f'Cannot book: You have another booking at {booking_slot.start_time.strftime("%I:%M %p")}. Please allow at least 10 minutes between bookings for setup and transition.'
            }), 400
    
    load_type = LoadType(data.get('load_type', 'combined'))
    machines_needed = 2 if load_type != LoadType.COMBINED else 1
    
    # Calculate actual available machines based on confirmed bookings
    confirmed_bookings = Booking.query.filter_by(
        slot_id=slot.id
    ).filter(
        Booking.status.in_([BookingStatus.CONFIRMED, BookingStatus.RECEIVED, BookingStatus.WASHING])
    ).all()
    
    total_machines_used = sum(booking.machines_used for booking in confirmed_bookings)
    actual_available = 2 - total_machines_used
    
    if actual_available < machines_needed:
        # Add to waitlist
        position = Waitlist.query.filter_by(slot_id=slot.id, status=WaitlistStatus.WAITING).count() + 1
        waitlist_entry = Waitlist(
            user_id=current_user.id,
            slot_id=slot.id,
            position=position,
            load_type=load_type
        )
        db.session.add(waitlist_entry)
        db.session.commit()
        return jsonify({'message': 'Time slot is fully booked. Added to waitlist', 'position': position}), 202
    
    # Create booking
    new_booking = Booking(
        user_id=current_user.id,
        slot_id=slot.id,
        load_type=load_type,
        machines_used=machines_needed
    )
    
    # Update slot available machines
    slot.available_machines = actual_available - machines_needed
    
    db.session.add(new_booking)
    db.session.commit()
    
    return jsonify({
        'message': 'Booking created',
        'ticket_id': new_booking.ticket_id,
        'booking': {
            'id': new_booking.id,
            'ticket_id': new_booking.ticket_id,
            'status': new_booking.status.value
        }
    }), 201

@app.route('/api/bookings/<int:booking_id>', methods=['PUT'])
@token_required
def update_booking(current_user, booking_id):
    booking = Booking.query.get_or_404(booking_id)
    
    if current_user.role == UserRole.STUDENT and booking.user_id != current_user.id:
        return jsonify({'message': 'Unauthorized'}), 403
    
    data = request.get_json()
    if 'status' in data:
        booking.status = BookingStatus(data['status'])
    if 'drop_off_time' in data:
        booking.drop_off_time = datetime.fromisoformat(data['drop_off_time'])
    
    db.session.commit()
    
    return jsonify({'message': 'Booking updated'})

@app.route('/api/bookings/<int:booking_id>', methods=['DELETE'])
@token_required
def cancel_booking(current_user, booking_id):
    booking = Booking.query.get_or_404(booking_id)
    
    if current_user.role == UserRole.STUDENT and booking.user_id != current_user.id:
        return jsonify({'message': 'Unauthorized'}), 403
    
    # Check if booking can be cancelled (not already completed/cancelled)
    if booking.status in [BookingStatus.COMPLETED, BookingStatus.CANCELLED]:
        return jsonify({'message': f'Cannot cancel booking with status: {booking.status.value}'}), 400
    
    slot = booking.time_slot
    
    # Calculate current available machines based on active bookings
    confirmed_bookings = Booking.query.filter_by(
        slot_id=slot.id
    ).filter(
        Booking.status.in_([BookingStatus.CONFIRMED, BookingStatus.RECEIVED, BookingStatus.WASHING])
    ).all()
    
    total_machines_used = sum(b.machines_used for b in confirmed_bookings if b.id != booking_id)
    slot.available_machines = 2 - total_machines_used
    
    booking.status = BookingStatus.CANCELLED
    
    db.session.commit()
    
    # Promote waitlist
    promote_from_waitlist(slot.id)
    
    return jsonify({'message': 'Booking cancelled successfully'})

# Waitlist Routes
@app.route('/api/waitlist', methods=['GET'])
@token_required
def get_waitlist(current_user):
    if current_user.role == UserRole.STUDENT:
        entries = Waitlist.query.filter_by(user_id=current_user.id, status=WaitlistStatus.WAITING).all()
    else:
        entries = Waitlist.query.filter_by(status=WaitlistStatus.WAITING).all()
    
    return jsonify([{
        'id': entry.id,
        'user_id': entry.user_id,
        'slot_id': entry.slot_id,
        'position': entry.position,
        'load_type': entry.load_type.value,
        'created_at': entry.created_at.isoformat()
    } for entry in entries])

# Machine Routes
@app.route('/api/machines', methods=['GET'])
@token_required
def get_machines(current_user):
    machines = Machine.query.all()
    return jsonify([{
        'id': machine.id,
        'machine_number': machine.machine_number,
        'pair_id': machine.pair_id,
        'status': machine.status
    } for machine in machines])

@app.route('/api/machines/<int:machine_id>', methods=['PUT'])
@token_required
@role_required(UserRole.ADMIN, UserRole.ATTENDANT)
def update_machine(current_user, machine_id):
    machine = Machine.query.get_or_404(machine_id)
    data = request.get_json()
    
    if 'status' in data:
        machine.status = data['status']
    
    db.session.commit()
    
    return jsonify({'message': 'Machine updated'})

def promote_from_waitlist(slot_id):
    """Promote waitlist entries when slots become available"""
    slot = TimeSlot.query.get(slot_id)
    waitlist = Waitlist.query.filter_by(slot_id=slot_id, status=WaitlistStatus.WAITING).order_by(Waitlist.position).all()
    
    for entry in waitlist:
        machines_needed = 2 if entry.load_type != LoadType.COMBINED else 1
        if slot.available_machines >= machines_needed:
            # Create booking
            new_booking = Booking(
                user_id=entry.user_id,
                slot_id=slot_id,
                load_type=entry.load_type,
                machines_used=machines_needed
            )
            slot.available_machines -= machines_needed
            entry.status = WaitlistStatus.PROMOTED
            
            db.session.add(new_booking)
            # Send notification to user here
    
    db.session.commit()

# Initialize database
def init_db():
    with app.app_context():
        db.create_all()
        # Initialize machines if not exist
        if Machine.query.count() == 0:
            for i in range(1, 11):
                machine = Machine(machine_number=i, pair_id=(i + 1) // 2)
                db.session.add(machine)
            db.session.commit()

if __name__ == '__main__':
    init_db()
    app.run(debug=True, port=5000)