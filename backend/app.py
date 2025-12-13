from flask import Flask, request, jsonify
from flask_cors import CORS
from database import db
from models import User, Booking, TimeSlot, Machine, Waitlist, UserRole, BookingStatus, LoadType, WaitlistStatus
from datetime import datetime, timedelta
import jwt
from functools import wraps
import os
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from flask_mail import Mail, Message
from threading import Thread

# Import slot generator functions
from services.slot_generator import generate_daily_slots, initialize_machines

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///masbana.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'your-secret-key-change-in-production')

# Email Configuration
app.config['MAIL_SERVER'] = 'smtp.mailersend.net'
app.config['MAIL_PORT'] = 2525
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = 'MS_IP6K3T@fpserror.casa'
app.config['MAIL_PASSWORD'] = 'mssp.jp0mMcL.vywj2lp3r6m47oqz.kM1DegQ'
app.config['MAIL_DEFAULT_SENDER'] = 'noreply@fpserror.casa'

mail = Mail(app)

db.init_app(app)
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Operational hours configuration
OPERATIONAL_HOURS = {
    0: {'start': '10:00', 'end': '19:00'},  # Monday
    1: {'start': '10:00', 'end': '19:00'},  # Tuesday
    2: {'start': '10:00', 'end': '19:00'},  # Wednesday
    3: {'start': '10:00', 'end': '19:00'},  # Thursday
    4: {'start': '10:00', 'end': '19:00'},  # Friday
    5: {'start': '12:00', 'end': '16:00'},  # Saturday
    6: None  # Sunday - Closed
}


def auto_generate_slots():
    """
    Automatically generate time slots for the next 15 days
    This runs daily to ensure slots are always available
    """
    print("=== AUTO GENERATE SLOTS STARTED ===")
    with app.app_context():
        try:
            print(f"Database path: {app.config['SQLALCHEMY_DATABASE_URI']}")
            today = datetime.now().date()
            slots_generated = 0

            for day_offset in range(15):
                target_date = today + timedelta(days=day_offset)
                day_of_week = target_date.weekday()

                # Skip if it's Sunday or if operational hours are not set
                if OPERATIONAL_HOURS.get(day_of_week) is None:
                    print(f"Skipping {target_date} (Sunday - Closed)")
                    continue

                operational_hours = OPERATIONAL_HOURS[day_of_week]

                # Check if slots already exist for this date
                existing_slots = TimeSlot.query.filter_by(date=target_date).count()

                if existing_slots == 0:
                    count = generate_daily_slots(
                        date=target_date,
                        operational_hours=operational_hours,
                        slot_duration_minutes=60
                    )
                    slots_generated += count
                    print(f"Generated {count} slots for {target_date}")
                else:
                    print(f"Slots already exist for {target_date}")

            print(f"Auto-generation complete: {slots_generated} total slots created")

        except Exception as e:
            print(f"Error in auto_generate_slots: {str(e)}")


# Initialize scheduler
scheduler = BackgroundScheduler()
scheduler.add_job(
    func=auto_generate_slots,
    trigger=CronTrigger(hour=3, minute=31),  # Run daily at 12:05 AM
    id='auto_generate_slots',
    name='Generate time slots for next 15 days',
    replace_existing=True
)


def send_async_email(app, msg):
    """Send email asynchronously"""
    with app.app_context():
        try:
            print(f"=== ATTEMPTING TO SEND EMAIL ===")
            print(f"From: {msg.sender}")
            print(f"To: {msg.recipients}")
            print(f"Subject: {msg.subject}")
            print(f"SMTP Server: {app.config['MAIL_SERVER']}")
            print(f"SMTP Port: {app.config['MAIL_PORT']}")
            print(f"SMTP Username: {app.config['MAIL_USERNAME']}")

            mail.send(msg)
            print(f"✅ Email sent successfully to {msg.recipients}")
        except Exception as e:
            print(f"❌ Failed to send email: {str(e)}")
            print(f"Error type: {type(e).__name__}")
            import traceback
            traceback.print_exc()


def send_email(subject, recipients, text_body, html_body):
    """Send email with both text and HTML versions"""
    print(f"\n=== SEND_EMAIL FUNCTION CALLED ===")
    print(f"Subject: {subject}")
    print(f"Recipients: {recipients}")

    try:
        msg = Message(subject, recipients=recipients)
        msg.body = text_body
        msg.html = html_body
        print(f"Message object created successfully")

        # Send asynchronously to avoid blocking the request
        Thread(target=send_async_email, args=(app, msg)).start()
        print(f"Email thread started")
    except Exception as e:
        print(f"❌ Error in send_email: {str(e)}")
        import traceback
        traceback.print_exc()


def send_booking_confirmation_email(user, booking, slot):
    """Send booking confirmation email to user"""
    subject = f"Booking Confirmed - Ticket #{booking.ticket_id}"

    # Format time for display
    start_time = slot.start_time.strftime("%I:%M %p")
    end_time = slot.end_time.strftime("%I:%M %p")
    date = slot.date.strftime("%B %d, %Y")

    # Text version
    text_body = f"""
Hello {user.full_name},

Your laundry booking has been confirmed!

Booking Details:
- Ticket ID: {booking.ticket_id}
- Date: {date}
- Time: {start_time} - {end_time}
- Machine Pair: {slot.pair_id}
- Load Type: {booking.load_type.value.replace('_', ' ').title()}
- Machines Used: {booking.machines_used}

Please arrive on time and present your ticket ID at the laundry facility.

Important Reminders:
- Arrive at least 5 minutes before your scheduled time
- Bring your laundry detergent and fabric softener
- Maximum load capacity per machine: 10kg
- Don't forget to collect your laundry after the cycle

Thank you for using our laundry service!

Best regards,
Laundry Management Team
"""

    # HTML version
    html_body = f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
        }}
        .container {{
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f9f9f9;
        }}
        .header {{
            background-color: #4CAF50;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 8px 8px 0 0;
        }}
        .content {{
            background-color: white;
            padding: 30px;
            border-radius: 0 0 8px 8px;
        }}
        .ticket-box {{
            background-color: #e8f5e9;
            border-left: 4px solid #4CAF50;
            padding: 20px;
            margin: 20px 0;
        }}
        .detail-row {{
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid #eee;
        }}
        .detail-label {{
            font-weight: bold;
            color: #666;
        }}
        .detail-value {{
            color: #333;
        }}
        .reminder-box {{
            background-color: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 20px 0;
        }}
        .footer {{
            text-align: center;
            margin-top: 20px;
            color: #666;
            font-size: 12px;
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🧺 Booking Confirmed!</h1>
        </div>
        <div class="content">
            <p>Hello <strong>{user.full_name}</strong>,</p>
            <p>Your laundry booking has been confirmed successfully!</p>

            <div class="ticket-box">
                <h2 style="margin-top: 0; color: #4CAF50;">Booking Details</h2>
                <div class="detail-row">
                    <span class="detail-label">🎫 Ticket ID:</span>
                    <span class="detail-value"><strong>{booking.ticket_id}</strong></span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">📅 Date:</span>
                    <span class="detail-value">{date}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">🕐 Time:</span>
                    <span class="detail-value">{start_time} - {end_time}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">🔧 Machine Pair:</span>
                    <span class="detail-value">Pair #{slot.pair_id}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">🧺 Load Type:</span>
                    <span class="detail-value">{booking.load_type.value.replace('_', ' ').title()}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">🔢 Machines Used:</span>
                    <span class="detail-value">{booking.machines_used}</span>
                </div>
            </div>

            <div class="reminder-box">
                <h3 style="margin-top: 0;">⚠️ Important Reminders:</h3>
                <ul>
                    <li>Arrive at least <strong>5 minutes before</strong> your scheduled time</li>
                    <li>Bring your <strong>laundry detergent</strong> and fabric softener</li>
                    <li>Maximum load capacity per machine: <strong>10kg</strong></li>
                    <li>Present your <strong>Ticket ID</strong> at the facility</li>
                    <li>Don't forget to <strong>collect your laundry</strong> after the cycle</li>
                </ul>
            </div>

            <p>Thank you for using our laundry service!</p>
            <p><strong>Best regards,</strong><br>Laundry Management Team</p>
        </div>
        <div class="footer">
            <p>This is an automated message, please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>
"""

    send_email(subject, [user.email], text_body, html_body)


def send_booking_completed_email(user, booking, slot):
    """Send booking completion notification email to user"""
    subject = f"Laundry Completed - Ticket #{booking.ticket_id}"

    # Format time for display
    start_time = slot.start_time.strftime("%I:%M %p")
    end_time = slot.end_time.strftime("%I:%M %p")
    date = slot.date.strftime("%B %d, %Y")

    # Text version
    text_body = f"""
Hello {user.full_name},

Good news! Your laundry has been completed and is ready for pickup.

Booking Details:
- Ticket ID: {booking.ticket_id}
- Date: {date}
- Time Slot: {start_time} - {end_time}
- Machine Pair: {slot.pair_id}
- Load Type: {booking.load_type.value.replace('_', ' ').title()}

Please collect your laundry as soon as possible.

⏰ Reminder: Laundry left uncollected for more than 2 hours may be removed to free up space.

Thank you for using our laundry service!

Best regards,
Laundry Management Team
"""

    # HTML version
    html_body = f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
        }}
        .container {{
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f9f9f9;
        }}
        .header {{
            background-color: #2196F3;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 8px 8px 0 0;
        }}
        .content {{
            background-color: white;
            padding: 30px;
            border-radius: 0 0 8px 8px;
        }}
        .completed-box {{
            background-color: #e3f2fd;
            border-left: 4px solid #2196F3;
            padding: 20px;
            margin: 20px 0;
            text-align: center;
        }}
        .detail-row {{
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid #eee;
        }}
        .detail-label {{
            font-weight: bold;
            color: #666;
        }}
        .detail-value {{
            color: #333;
        }}
        .warning-box {{
            background-color: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 20px 0;
        }}
        .footer {{
            text-align: center;
            margin-top: 20px;
            color: #666;
            font-size: 12px;
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>✅ Laundry Completed!</h1>
        </div>
        <div class="content">
            <p>Hello <strong>{user.full_name}</strong>,</p>

            <div class="completed-box">
                <h2 style="margin: 0; color: #2196F3;">🎉 Your laundry is ready for pickup!</h2>
            </div>

            <h3>Booking Details:</h3>
            <div class="detail-row">
                <span class="detail-label">🎫 Ticket ID:</span>
                <span class="detail-value"><strong>{booking.ticket_id}</strong></span>
            </div>
            <div class="detail-row">
                <span class="detail-label">📅 Date:</span>
                <span class="detail-value">{date}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">🕐 Time Slot:</span>
                <span class="detail-value">{start_time} - {end_time}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">🔧 Machine Pair:</span>
                <span class="detail-value">Pair #{slot.pair_id}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">🧺 Load Type:</span>
                <span class="detail-value">{booking.load_type.value.replace('_', ' ').title()}</span>
            </div>

            <div class="warning-box">
                <h3 style="margin-top: 0;">⏰ Important Reminder:</h3>
                <p style="margin: 0;">Please collect your laundry as soon as possible. Laundry left uncollected for more than <strong>2 hours</strong> may be removed to free up space for other users.</p>
            </div>

            <p>Thank you for using our laundry service!</p>
            <p><strong>Best regards,</strong><br>Laundry Management Team</p>
        </div>
        <div class="footer">
            <p>This is an automated message, please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>
"""

    send_email(subject, [user.email], text_body, html_body)

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
            'full_name': user.full_name,
            'phone': user.phone,
            'student_id': user.student_id,
            'created_at': user.created_at.isoformat() if user.created_at else None
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

    available_slots = []
    for slot in slots:
        # Refresh the slot from database to get current value
        db.session.refresh(slot)
        is_disabled = (slot.available_machines == 0)

        # For STUDENTS: Apply TIME filters only, but include all slots (even full ones)
        if current_user.role == UserRole.STUDENT:
            # Skip ONLY disabled slots (admin manually disabled)
            if is_disabled:
                print(f"Skipping disabled slot {slot.id} for student")
                continue

            # Skip slots that are in the past or less than 2 hours from now
            if slot.date == now.date():
                time_until_slot = (slot.start_time - now).total_seconds() / 3600  # hours
                if time_until_slot < 2:
                    continue
            elif slot.date < now.date():
                continue

        # Get machines for this slot's pair
        available_machines_in_pair = Machine.query.filter_by(
            pair_id=slot.pair_id,
            status='available'
        ).count()

        total_machines_in_pair = Machine.query.filter_by(
            pair_id=slot.pair_id
        ).count()

        print(
            f"Slot {slot.id} - Pair {slot.pair_id}: {available_machines_in_pair}/{total_machines_in_pair} machines available (not in maintenance)")

        # CRITICAL FIX: Separate "machines in maintenance" from "slot full"
        # If ALL machines are in maintenance, this is different from "slot is full"
        all_machines_in_maintenance = (available_machines_in_pair == 0)

        if all_machines_in_maintenance:
            print(f"All machines in pair {slot.pair_id} are in maintenance")
            if current_user.role == UserRole.STUDENT:
                # Don't show to students - they can't book OR join waitlist
                continue
            else:
                # For admins, show but mark as disabled
                available_slots.append({
                    'id': slot.id,
                    'pair_id': slot.pair_id,
                    'date': slot.date.isoformat(),
                    'start_time': slot.start_time.isoformat(),
                    'end_time': slot.end_time.isoformat(),
                    'available_machines': 0,
                    'total_machines': total_machines_in_pair,
                    'is_disabled': True,
                    'is_full': False,
                    'machines_in_maintenance': True,  # New flag
                    'reason': 'All machines in maintenance'
                })
                continue

        # Calculate actual available machines based on confirmed bookings
        confirmed_bookings = Booking.query.filter_by(
            slot_id=slot.id
        ).filter(
            Booking.status.in_([BookingStatus.CONFIRMED, BookingStatus.RECEIVED, BookingStatus.WASHING])
        ).all()

        total_machines_used = sum(booking.machines_used for booking in confirmed_bookings)

        # Calculate available based on working machines minus bookings
        if is_disabled:
            actual_available = 0
        else:
            actual_available = max(0, available_machines_in_pair - total_machines_used)

        # CRITICAL: Determine if slot is "full due to bookings" vs "unavailable due to maintenance"
        slot_full_due_to_bookings = (actual_available == 0 and not is_disabled and not all_machines_in_maintenance)

        slot_data = {
            'id': slot.id,
            'pair_id': slot.pair_id,
            'date': slot.date.isoformat(),
            'start_time': slot.start_time.isoformat(),
            'end_time': slot.end_time.isoformat(),
            'available_machines': actual_available,
            'total_machines': available_machines_in_pair,
            'is_disabled': is_disabled,
            'is_full': slot_full_due_to_bookings,  # Only true if full due to bookings, not maintenance
            'machines_in_maintenance': all_machines_in_maintenance
        }

        print(
            f"Slot {slot.id}: available={actual_available}, total={available_machines_in_pair}, is_full={slot_full_due_to_bookings}, maintenance={all_machines_in_maintenance}")
        available_slots.append(slot_data)

    print(f"Returning {len(available_slots)} slots for {current_user.role.value}")
    return jsonify(available_slots)

@app.route('/api/timeslots/<int:slot_id>', methods=['DELETE'])
@token_required
@role_required(UserRole.ADMIN)
def delete_timeslot(current_user, slot_id):
    """Admin can delete a time slot"""
    slot = TimeSlot.query.get_or_404(slot_id)

    # Check if there are any active bookings for this slot
    active_bookings = Booking.query.filter_by(slot_id=slot_id).filter(
        Booking.status.in_([BookingStatus.CONFIRMED, BookingStatus.RECEIVED, BookingStatus.WASHING])
    ).all()

    if active_bookings:
        return jsonify({
            'message': f'Cannot delete slot with {len(active_bookings)} active booking(s). Please cancel bookings first.'
        }), 400

    db.session.delete(slot)
    db.session.commit()

    return jsonify({'message': 'Time slot deleted successfully'})



@app.route('/api/timeslots/<int:slot_id>/disable', methods=['PUT'])
@token_required
@role_required(UserRole.ADMIN)
def disable_timeslot(current_user, slot_id):
    """Admin can disable a time slot (set available_machines to 0)"""
    slot = TimeSlot.query.get_or_404(slot_id)

    # Set available_machines to 0 to disable
    slot.available_machines = 0

    try:
        db.session.commit()
        print(f"Slot {slot_id} disabled - available_machines set to 0")
        return jsonify({
            'message': 'Time slot disabled successfully',
            'slot_id': slot_id,
            'available_machines': 0
        })
    except Exception as e:
        db.session.rollback()
        print(f"Error disabling slot {slot_id}: {str(e)}")
        return jsonify({'message': f'Failed to disable slot: {str(e)}'}), 500


@app.route('/api/timeslots/<int:slot_id>/enable', methods=['PUT'])
@token_required
@role_required(UserRole.ADMIN)
def enable_timeslot(current_user, slot_id):
    """Admin can re-enable a time slot"""
    slot = TimeSlot.query.get_or_404(slot_id)

    # Calculate actual available machines based on confirmed bookings
    confirmed_bookings = Booking.query.filter_by(slot_id=slot_id).filter(
        Booking.status.in_([BookingStatus.CONFIRMED, BookingStatus.RECEIVED, BookingStatus.WASHING])
    ).all()

    total_machines_used = sum(booking.machines_used for booking in confirmed_bookings)
    slot.available_machines = max(0, 2 - total_machines_used)

    try:
        db.session.commit()
        print(f"Slot {slot_id} enabled - available_machines set to {slot.available_machines}")
        return jsonify({
            'message': 'Time slot enabled successfully',
            'slot_id': slot_id,
            'available_machines': slot.available_machines
        })
    except Exception as e:
        db.session.rollback()
        print(f"Error enabling slot {slot_id}: {str(e)}")
        return jsonify({'message': f'Failed to enable slot: {str(e)}'}), 500

@app.route('/api/admin/regenerate-slots', methods=['POST'])
@token_required
@role_required(UserRole.ADMIN)
def manual_regenerate_slots(current_user):
    """Admin can manually trigger slot regeneration"""
    auto_generate_slots()
    return jsonify({'message': 'Slot regeneration triggered successfully'})


# Booking Routes
# Replace your current get_bookings function with this:

@app.route('/api/bookings', methods=['GET'])
@token_required
def get_bookings(current_user):
    if current_user.role == UserRole.STUDENT:
        # Get bookings with time slot information for the current student
        bookings = db.session.query(Booking, TimeSlot).join(
            TimeSlot, Booking.slot_id == TimeSlot.id
        ).filter(
            Booking.user_id == current_user.id
        ).order_by(
            TimeSlot.date.desc(),
            TimeSlot.start_time.desc()
        ).all()
    else:
        # Get all bookings with time slot information for admin/attendant
        bookings = db.session.query(Booking, TimeSlot).join(
            TimeSlot, Booking.slot_id == TimeSlot.id
        ).order_by(
            TimeSlot.date.desc(),
            TimeSlot.start_time.desc()
        ).all()

    result = []
    for booking, slot in bookings:
        # Debug: Print slot data to see what we're getting
        print(f"Slot {slot.id}: date={slot.date}, start={slot.start_time}, end={slot.end_time}")

        result.append({
            'id': booking.id,
            'ticket_id': booking.ticket_id,
            'user_id': booking.user_id,
            'slot_id': booking.slot_id,
            'load_type': booking.load_type.value,
            'status': booking.status.value,
            'machines_used': booking.machines_used,
            'created_at': booking.created_at.isoformat() if booking.created_at else None,
            # Add time slot information with proper null checking
            'date': slot.date.isoformat() if slot.date else None,
            'start_time': slot.start_time.isoformat() if slot.start_time else None,
            'end_time': slot.end_time.isoformat() if slot.end_time else None,
            'pair_id': slot.pair_id,
            'machine_type': 'both'  # You can enhance this based on load_type if needed
        })

    return jsonify(result)


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
        time_until_slot = (slot.start_time - now).total_seconds() / 3600
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

    # Check if user is already on waitlist for this slot
    existing_waitlist = Waitlist.query.filter_by(
        user_id=current_user.id,
        slot_id=slot.id,
        status=WaitlistStatus.WAITING
    ).first()

    if existing_waitlist:
        return jsonify({'message': 'You are already on the waitlist for this time slot'}), 400

    # Check for bookings in adjacent time slots (10-minute buffer rule)
    user_bookings_same_date = db.session.query(Booking).join(TimeSlot).filter(
        Booking.user_id == current_user.id,
        TimeSlot.date == slot.date,
        Booking.status.in_([BookingStatus.CONFIRMED, BookingStatus.RECEIVED, BookingStatus.WASHING])
    ).all()

    buffer_minutes = 10

    for booking in user_bookings_same_date:
        booking_slot = booking.time_slot
        time_after_existing = (slot.start_time - booking_slot.end_time).total_seconds() / 60
        time_after_new = (booking_slot.start_time - slot.end_time).total_seconds() / 60

        if (-1 < time_after_existing < buffer_minutes) or (-1 < time_after_new < buffer_minutes):
            return jsonify({
                'message': f'Cannot book: You have another booking at {booking_slot.start_time.strftime("%I:%M %p")}. Please allow at least 10 minutes between bookings.'
            }), 400

    load_type = LoadType(data.get('load_type', 'combined'))
    machines_needed = 2 if load_type != LoadType.COMBINED else 1

    # Calculate actual available machines
    confirmed_bookings = Booking.query.filter_by(slot_id=slot.id).filter(
        Booking.status.in_([BookingStatus.CONFIRMED, BookingStatus.RECEIVED, BookingStatus.WASHING])
    ).all()

    total_machines_used = sum(booking.machines_used for booking in confirmed_bookings)
    actual_available = 2 - total_machines_used

    # Check if slot is disabled
    if slot.available_machines == 0:
        return jsonify({'message': 'This time slot has been disabled by the administrator'}), 400

    if actual_available < machines_needed:
        # Slot is full - add to waitlist

        # Check waitlist cap (max 10 people per slot)
        current_waitlist_count = Waitlist.query.filter_by(
            slot_id=slot.id,
            status=WaitlistStatus.WAITING
        ).count()

        if current_waitlist_count >= 10:
            return jsonify({
                'message': 'Waitlist is full for this time slot. Please try another slot.',
                'waitlist_full': True
            }), 400

        # Add to waitlist
        position = current_waitlist_count + 1
        waitlist_entry = Waitlist(
            user_id=current_user.id,
            slot_id=slot.id,
            position=position,
            load_type=load_type
        )

        db.session.add(waitlist_entry)
        db.session.commit()

        return jsonify({
            'message': f'Time slot is full. You have been added to the waitlist.',
            'waitlist': True,
            'position': position,
            'waitlist_id': waitlist_entry.id
        }), 202

    # Create booking
    new_booking = Booking(
        user_id=current_user.id,
        slot_id=slot.id,
        load_type=load_type,
        machines_used=machines_needed
    )

    db.session.add(new_booking)
    db.session.commit()

    # Send confirmation email
    try:
        send_booking_confirmation_email(current_user, new_booking, slot)
        print(f"Booking confirmation email sent to {current_user.email}")
    except Exception as e:
        print(f"Failed to send booking confirmation email: {str(e)}")
        # Don't fail the booking if email fails

    return jsonify({
        'message': 'Booking created successfully',
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
    old_status = booking.status

    if 'status' in data:
        booking.status = BookingStatus(data['status'])
    if 'drop_off_time' in data:
        booking.drop_off_time = datetime.fromisoformat(data['drop_off_time'])

    db.session.commit()

    # Send completion email when status changes to COMPLETED
    if 'status' in data and booking.status == BookingStatus.COMPLETED and old_status != BookingStatus.COMPLETED:
        try:
            user = User.query.get(booking.user_id)
            slot = booking.time_slot
            send_booking_completed_email(user, booking, slot)
            print(f"Booking completion email sent to {user.email}")
        except Exception as e:
            print(f"Failed to send booking completion email: {str(e)}")

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

    booking.status = BookingStatus.CANCELLED

    db.session.commit()

    # Promote waitlist
    promote_from_waitlist(slot.id)

    return jsonify({'message': 'Booking cancelled successfully'})


# Waitlist Routes
@app.route('/api/waitlist', methods=['GET'])
@token_required
def get_waitlist(current_user):
    """Get user's waitlist entries"""
    if current_user.role == UserRole.STUDENT:
        entries = Waitlist.query.filter_by(
            user_id=current_user.id,
            status=WaitlistStatus.WAITING
        ).order_by(Waitlist.created_at).all()
    else:
        # Admins see all waitlist entries
        entries = Waitlist.query.filter_by(
            status=WaitlistStatus.WAITING
        ).order_by(Waitlist.slot_id, Waitlist.position).all()

    return jsonify([{
        'id': entry.id,
        'user_id': entry.user_id,
        'slot_id': entry.slot_id,
        'position': entry.position,
        'load_type': entry.load_type.value,
        'status': entry.status.value,
        'created_at': entry.created_at.isoformat()
    } for entry in entries])


@app.route('/api/waitlist/<int:waitlist_id>', methods=['DELETE'])
@token_required
def leave_waitlist(current_user, waitlist_id):
    """Remove user from waitlist"""
    entry = Waitlist.query.get_or_404(waitlist_id)

    # Check authorization
    if current_user.role == UserRole.STUDENT and entry.user_id != current_user.id:
        return jsonify({'message': 'Unauthorized'}), 403

    slot_id = entry.slot_id
    position_removed = entry.position

    # Remove the entry
    db.session.delete(entry)

    # Update positions for remaining waitlist entries in the same slot
    remaining_entries = Waitlist.query.filter_by(
        slot_id=slot_id,
        status=WaitlistStatus.WAITING
    ).filter(
        Waitlist.position > position_removed
    ).all()

    for remaining_entry in remaining_entries:
        remaining_entry.position -= 1

    db.session.commit()

    return jsonify({'message': 'Successfully left the waitlist'})


@app.route('/api/admin/waitlist', methods=['GET'])
@token_required
@role_required(UserRole.ADMIN, UserRole.ATTENDANT)
def get_all_waitlist(current_user):
    """Get all waitlist entries with details (admin/attendant only)"""
    entries = Waitlist.query.filter_by(
        status=WaitlistStatus.WAITING
    ).order_by(Waitlist.slot_id, Waitlist.position).all()

    result = []
    for entry in entries:
        slot = entry.time_slot
        user = entry.user

        result.append({
            'id': entry.id,
            'user': {
                'id': user.id,
                'full_name': user.full_name,
                'email': user.email,
                'student_id': user.student_id
            },
            'slot': {
                'id': slot.id,
                'date': slot.date.isoformat(),
                'start_time': slot.start_time.isoformat(),
                'end_time': slot.end_time.isoformat(),
                'pair_id': slot.pair_id
            },
            'position': entry.position,
            'load_type': entry.load_type.value,
            'created_at': entry.created_at.isoformat()
        })

    return jsonify(result)

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


# Add this endpoint to your app.py (after the auth routes):

@app.route('/api/user/profile', methods=['GET'])
@token_required
def get_user_profile(current_user):
    """Get current user's profile information"""
    return jsonify({
        'id': current_user.id,
        'email': current_user.email,
        'full_name': current_user.full_name,
        'student_id': current_user.student_id,
        'phone': current_user.phone,
        'role': current_user.role.value,
        'created_at': current_user.created_at.isoformat() if current_user.created_at else None
    })


@app.route('/api/user/profile', methods=['PUT'])
@token_required
def update_user_profile(current_user):
    """Update current user's profile information"""
    data = request.get_json()

    # Update allowed fields
    if 'full_name' in data:
        current_user.full_name = data['full_name']
    if 'phone' in data:
        current_user.phone = data['phone']

    # Students can't change their student_id, only admins can
    if 'student_id' in data and current_user.role == UserRole.ADMIN:
        current_user.student_id = data['student_id']

    try:
        db.session.commit()
        return jsonify({
            'message': 'Profile updated successfully',
            'user': {
                'id': current_user.id,
                'email': current_user.email,
                'full_name': current_user.full_name,
                'student_id': current_user.student_id,
                'phone': current_user.phone,
                'role': current_user.role.value
            }
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed to update profile: {str(e)}'}), 500


def promote_from_waitlist(slot_id):
    """
    Promote waitlist entries when slots become available
    This is called when a booking is cancelled
    """
    slot = TimeSlot.query.get(slot_id)
    if not slot:
        return

    # Get waitlist entries ordered by position
    waitlist = Waitlist.query.filter_by(
        slot_id=slot_id,
        status=WaitlistStatus.WAITING
    ).order_by(Waitlist.position).all()

    print(f"Processing waitlist for slot {slot_id}: {len(waitlist)} entries")

    for entry in waitlist:
        # Check if slot still has available machines
        if slot.available_machines == 0:
            print(f"Slot {slot_id} is full or disabled, stopping promotion")
            break

        machines_needed = 2 if entry.load_type != LoadType.COMBINED else 1

        if slot.available_machines >= machines_needed:
            try:
                # Create booking for this waitlist entry
                new_booking = Booking(
                    user_id=entry.user_id,
                    slot_id=slot_id,
                    load_type=entry.load_type,
                    machines_used=machines_needed
                )

                # Update slot available machines
                slot.available_machines -= machines_needed

                # Mark waitlist entry as promoted
                entry.status = WaitlistStatus.PROMOTED

                db.session.add(new_booking)

                print(f"Promoted waitlist entry {entry.id} to booking for user {entry.user_id}")

                # Here you would send a notification to the user
                # For now, we'll just log it
                print(f"NOTIFICATION: User {entry.user_id} promoted from waitlist for slot {slot_id}")

            except Exception as e:
                print(f"Error promoting waitlist entry {entry.id}: {str(e)}")
                db.session.rollback()
                continue
        else:
            # Not enough machines, update positions for remaining entries
            remaining_entries = Waitlist.query.filter_by(
                slot_id=slot_id,
                status=WaitlistStatus.WAITING
            ).order_by(Waitlist.position).all()

            for idx, remaining_entry in enumerate(remaining_entries, start=1):
                remaining_entry.position = idx

            break

    try:
        db.session.commit()
        print(f"Waitlist promotion completed for slot {slot_id}")
    except Exception as e:
        print(f"Error committing waitlist promotions: {str(e)}")
        db.session.rollback()


# Initialize database
def init_db():
    with app.app_context():
        db.create_all()
        # Initialize machines if not exist
        if Machine.query.count() == 0:
            initialize_machines()

        # Generate initial slots for next 15 days
        auto_generate_slots()



# if __name__ == '__main__':
#     init_db()
#     scheduler.start()
#     try:
#         app.run(debug=True, port=5000)
#     except (KeyboardInterrupt, SystemExit):
#         scheduler.shutdown()

init_db()
scheduler.start()

if __name__ == '__main__':
    try:
        app.run(debug=True, port=5000)
    except (KeyboardInterrupt, SystemExit):
        scheduler.shutdown()