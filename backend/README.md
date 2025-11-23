# Masbanat AlAkhawayn - Laundry Management System Backend

## Setup Instructions

### 1. Install PostgreSQL

**Windows:**
- Download PostgreSQL from https://www.postgresql.org/download/windows/
- Install with default settings
- Remember the password you set for the `postgres` user

**Or use Docker:**
```powershell
docker run -d --name laundry-db -p 5432:5432 -e POSTGRES_PASSWORD=password postgres:15
```

### 2. Create Database

```powershell
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE laundry_db;
\q
```

### 3. Install Python Dependencies

```powershell
cd backend
pip install -r requirements.txt
```

### 4. Configure Environment

Copy `.env.example` to `.env` and update the values:
```powershell
cp .env.example .env
```

Edit `.env` with your database credentials.

### 5. Initialize Database and Machines

```powershell
# Start the Flask app (this will create tables automatically)
python app.py
```

In another terminal, initialize machines:
```powershell
curl -X POST http://localhost:5000/api/admin/initialize-machines
```

### 6. Generate Time Slots

Generate slots for the next 7 days:
```powershell
curl -X POST http://localhost:5000/api/admin/generate-week-slots -H "Content-Type: application/json"
```

## API Endpoints

### Authentication
- `POST /login` - Student/Attendant login
- `POST /register` - Student registration

### Bookings
- `GET /api/slots?date=YYYY-MM-DD` - Get available time slots
- `POST /api/bookings` - Create new booking
- `GET /api/bookings/user/<user_id>` - Get user's bookings
- `DELETE /api/bookings/<booking_id>` - Cancel booking

### Waitlist
- `POST /api/waitlist` - Join waitlist
- `GET /api/waitlist/user/<user_id>` - Get user's waitlist entries
- `DELETE /api/waitlist/<waitlist_id>` - Leave waitlist

### Attendant
- `GET /api/attendant/today` - Get today's bookings
- `POST /api/attendant/checkin/<ticket_id>` - Check in booking
- `POST /api/attendant/no-show/<booking_id>` - Mark as no-show
- `PUT /api/attendant/update-status/<booking_id>` - Update booking status

### Admin
- `POST /api/admin/generate-slots` - Generate slots for a date
- `POST /api/admin/generate-week-slots` - Generate slots for 7 days
- `POST /api/admin/initialize-machines` - Initialize 10 machines
- `GET /api/admin/machines` - Get all machines
- `PUT /api/admin/machines/<machine_id>/status` - Update machine status

## Database Models

### User
- Student account with email, student_id, full_name, phone
- Role: student, attendant, admin

### Machine
- 10 machines grouped into 5 pairs
- Pair 1: Machines 1&2, Pair 2: Machines 3&4, etc.

### TimeSlot
- Each pair has time slots staggered by 10 minutes
- Pair 1: 8:00, Pair 2: 8:10, Pair 3: 8:20, etc.
- Tracks available_machines (0, 1, or 2)

### Booking
- Links user to time slot
- Load types: combined, separate_whites, separate_colors
- Status: confirmed, received, washing, completed, no_show, cancelled
- Unique ticket_id (UUID) for check-in

### Waitlist
- Max 10 people per slot
- Automatic promotion when booking cancelled

## Automated Features

### 5-Minute No-Show Rule
- Background scheduler checks every minute
- Auto-cancels bookings if student hasn't checked in 5 minutes before slot
- Automatically promotes first person in waitlist

### Waitlist Promotion
- When booking cancelled or marked no-show
- Automatically creates booking for first person in queue
- Sends notification (TODO: implement email)

## Testing the API

### Create a Test User
```powershell
curl -X POST http://localhost:5000/register -H "Content-Type: application/json" -d '{\"email\":\"student@aui.ma\",\"password\":\"test123\",\"student_id\":\"S12345\",\"full_name\":\"Test Student\",\"phone\":\"+212600000000\"}'
```

### Login
```powershell
curl -X POST http://localhost:5000/login -H "Content-Type: application/json" -d '{\"email\":\"student@aui.ma\",\"password\":\"test123\"}'
```

### View Available Slots
```powershell
curl http://localhost:5000/api/slots
```

### Make a Booking
```powershell
curl -X POST http://localhost:5000/api/bookings -H "Content-Type: application/json" -d '{\"user_id\":1,\"slot_id\":1,\"load_type\":\"combined\"}'
```

## Next Steps

1. **Password Hashing**: Install `flask-bcrypt` and hash passwords
2. **JWT Authentication**: Install `flask-jwt-extended` for token-based auth
3. **Email Notifications**: Configure Flask-Mail and implement notification functions
4. **QR Code Generation**: Install `qrcode` library for ticket QR codes
5. **Testing**: Write unit tests for all endpoints
6. **Deployment**: Deploy to production server with proper environment variables

## Architecture

```
backend/
├── app.py                  # Main Flask app
├── database.py             # Database configuration
├── models.py               # SQLAlchemy models
├── requirements.txt        # Python dependencies
├── routes/
│   ├── bookings.py        # Booking endpoints
│   ├── waitlist.py        # Waitlist endpoints
│   ├── attendant.py       # Attendant endpoints
│   └── admin.py           # Admin endpoints
└── services/
    ├── slot_generator.py  # Time slot generation
    ├── waitlist_service.py # Waitlist promotion logic
    ├── scheduler.py       # Background jobs (no-show check)
    └── notifications.py   # Email/push notifications
```
