from database import db
from datetime import datetime
import uuid
from enum import Enum

class UserRole(str, Enum):
    STUDENT = 'student'
    ATTENDANT = 'attendant'
    ADMIN = 'admin'

class BookingStatus(str, Enum):
    CONFIRMED = 'confirmed'
    RECEIVED = 'received'
    WASHING = 'washing'
    COMPLETED = 'completed'
    NO_SHOW = 'no_show'
    CANCELLED = 'cancelled'

class LoadType(str, Enum):
    COMBINED = 'combined'
    SEPARATE_WHITES = 'separate_whites'
    SEPARATE_COLORS = 'separate_colors'

class WaitlistStatus(str, Enum):
    WAITING = 'waiting'
    PROMOTED = 'promoted'
    EXPIRED = 'expired'

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    student_id = db.Column(db.String(50), unique=True)
    full_name = db.Column(db.String(100))
    phone = db.Column(db.String(20))
    role = db.Column(db.Enum(UserRole), default=UserRole.STUDENT, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    bookings = db.relationship('Booking', back_populates='user', lazy=True)
    waitlist_entries = db.relationship('Waitlist', back_populates='user', lazy=True)

class Machine(db.Model):
    __tablename__ = 'machines'
    
    id = db.Column(db.Integer, primary_key=True)
    machine_number = db.Column(db.Integer, nullable=False)  # 1-10
    pair_id = db.Column(db.Integer, nullable=False)  # 1-5 (Pair 1: machines 1&2, Pair 2: machines 3&4, etc.)
    status = db.Column(db.String(20), default='available')  # available, out_of_order, maintenance
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class TimeSlot(db.Model):
    __tablename__ = 'time_slots'
    
    id = db.Column(db.Integer, primary_key=True)
    pair_id = db.Column(db.Integer, nullable=False)  # 1-5
    date = db.Column(db.Date, nullable=False)
    start_time = db.Column(db.DateTime, nullable=False)
    end_time = db.Column(db.DateTime, nullable=False)
    available_machines = db.Column(db.Integer, default=2)  # 0, 1, or 2
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    bookings = db.relationship('Booking', back_populates='time_slot', lazy=True)
    waitlist_entries = db.relationship('Waitlist', back_populates='time_slot', lazy=True)
    
    # Unique constraint: one slot per pair per time
    __table_args__ = (db.UniqueConstraint('pair_id', 'start_time', name='unique_pair_time'),)

class Booking(db.Model):
    __tablename__ = 'bookings'
    
    id = db.Column(db.Integer, primary_key=True)
    ticket_id = db.Column(db.String(36), unique=True, nullable=False, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    slot_id = db.Column(db.Integer, db.ForeignKey('time_slots.id'), nullable=False)
    load_type = db.Column(db.Enum(LoadType), default=LoadType.COMBINED, nullable=False)
    status = db.Column(db.Enum(BookingStatus), default=BookingStatus.CONFIRMED, nullable=False)
    drop_off_time = db.Column(db.DateTime)
    machines_used = db.Column(db.Integer, default=1)  # 1 for combined, 2 for separate
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = db.relationship('User', back_populates='bookings')
    time_slot = db.relationship('TimeSlot', back_populates='bookings')

class Waitlist(db.Model):
    __tablename__ = 'waitlist'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    slot_id = db.Column(db.Integer, db.ForeignKey('time_slots.id'), nullable=False)
    position = db.Column(db.Integer, nullable=False)
    status = db.Column(db.Enum(WaitlistStatus), default=WaitlistStatus.WAITING, nullable=False)
    load_type = db.Column(db.Enum(LoadType), default=LoadType.COMBINED, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    user = db.relationship('User', back_populates='waitlist_entries')
    time_slot = db.relationship('TimeSlot', back_populates='waitlist_entries')
