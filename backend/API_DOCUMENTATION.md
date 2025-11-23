# API Documentation - Masbanat AlAkhawayn Laundry System

Base URL: `http://localhost:5000`

## Authentication

### Register Student
**POST** `/register`

Request:
```json
{
  "email": "student@aui.ma",
  "password": "mypassword",
  "student_id": "S12345",
  "full_name": "John Doe",
  "phone": "+212600000000"
}
```

Response (201):
```json
{
  "success": true,
  "message": "Registration successful!",
  "user": {
    "id": 1,
    "email": "student@aui.ma",
    "full_name": "John Doe",
    "student_id": "S12345"
  }
}
```

### Login
**POST** `/login`

Request:
```json
{
  "email": "student@aui.ma",
  "password": "mypassword"
}
```

Response (200):
```json
{
  "success": true,
  "message": "Login successful!",
  "user": {
    "id": 1,
    "email": "student@aui.ma",
    "full_name": "John Doe",
    "student_id": "S12345",
    "role": "student"
  }
}
```

---

## Booking Management

### Get Available Slots
**GET** `/api/slots?date=2025-11-23`

Response (200):
```json
{
  "success": true,
  "slots": [
    {
      "id": 1,
      "pair_id": 1,
      "date": "2025-11-23",
      "start_time": "2025-11-23T08:00:00",
      "end_time": "2025-11-23T09:00:00",
      "available_machines": 2,
      "can_book_combined": true,
      "can_book_separate": true
    },
    {
      "id": 2,
      "pair_id": 2,
      "date": "2025-11-23",
      "start_time": "2025-11-23T08:10:00",
      "end_time": "2025-11-23T09:10:00",
      "available_machines": 1,
      "can_book_combined": true,
      "can_book_separate": false
    }
  ]
}
```

### Create Booking
**POST** `/api/bookings`

Request (Combined Load):
```json
{
  "user_id": 1,
  "slot_id": 1,
  "load_type": "combined",
  "drop_off_time": "2025-11-23T07:30:00"
}
```

Request (Separate Loads):
```json
{
  "user_id": 1,
  "slot_id": 1,
  "load_type": "separate_whites"
}
```

Response (201):
```json
{
  "success": true,
  "message": "Booking created successfully",
  "booking": {
    "id": 1,
    "ticket_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "slot_id": 1,
    "load_type": "combined",
    "status": "confirmed",
    "start_time": "2025-11-23T08:00:00",
    "pair_id": 1
  }
}
```

Error (400 - Not enough machines):
```json
{
  "success": false,
  "message": "Not enough machines available. Need 2, available: 1"
}
```

### Get User Bookings
**GET** `/api/bookings/user/1`

Response (200):
```json
{
  "success": true,
  "bookings": [
    {
      "id": 1,
      "ticket_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "load_type": "combined",
      "status": "confirmed",
      "machines_used": 1,
      "drop_off_time": "2025-11-23T07:30:00",
      "created_at": "2025-11-22T15:30:00",
      "slot": {
        "id": 1,
        "pair_id": 1,
        "start_time": "2025-11-23T08:00:00",
        "end_time": "2025-11-23T09:00:00",
        "date": "2025-11-23"
      }
    }
  ]
}
```

### Cancel Booking
**DELETE** `/api/bookings/1`

Response (200):
```json
{
  "success": true,
  "message": "Booking cancelled successfully"
}
```

Error (400 - Too late):
```json
{
  "success": false,
  "message": "Cannot cancel booking less than 1 hour before scheduled time"
}
```

---

## Waitlist Management

### Join Waitlist
**POST** `/api/waitlist`

Request:
```json
{
  "user_id": 1,
  "slot_id": 1,
  "load_type": "combined"
}
```

Response (201):
```json
{
  "success": true,
  "message": "Successfully joined waitlist",
  "waitlist_entry": {
    "id": 1,
    "position": 3,
    "slot_id": 1,
    "status": "waiting"
  }
}
```

Error (400 - Waitlist full):
```json
{
  "success": false,
  "message": "Waitlist is full (max 10 people)"
}
```

### Get User Waitlist
**GET** `/api/waitlist/user/1`

Response (200):
```json
{
  "success": true,
  "waitlist": [
    {
      "id": 1,
      "position": 3,
      "load_type": "combined",
      "status": "waiting",
      "created_at": "2025-11-22T16:00:00",
      "slot": {
        "id": 1,
        "pair_id": 1,
        "start_time": "2025-11-23T08:00:00",
        "end_time": "2025-11-23T09:00:00",
        "date": "2025-11-23"
      }
    }
  ]
}
```

### Leave Waitlist
**DELETE** `/api/waitlist/1`

Response (200):
```json
{
  "success": true,
  "message": "Left waitlist successfully"
}
```

---

## Attendant Interface

### Get Today's Bookings
**GET** `/api/attendant/today`

Response (200):
```json
{
  "success": true,
  "bookings": [
    {
      "id": 1,
      "ticket_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "status": "confirmed",
      "load_type": "combined",
      "machines_used": 1,
      "student": {
        "id": 1,
        "name": "John Doe",
        "student_id": "S12345",
        "email": "student@aui.ma",
        "phone": "+212600000000"
      },
      "slot": {
        "id": 1,
        "pair_id": 1,
        "start_time": "2025-11-23T08:00:00",
        "end_time": "2025-11-23T09:00:00"
      },
      "drop_off_time": "2025-11-23T07:30:00",
      "created_at": "2025-11-22T15:30:00"
    }
  ]
}
```

### Check In Booking
**POST** `/api/attendant/checkin/a1b2c3d4-e5f6-7890-abcd-ef1234567890`

Response (200):
```json
{
  "success": true,
  "message": "Booking checked in successfully",
  "booking": {
    "id": 1,
    "ticket_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "status": "received",
    "student_name": "John Doe",
    "load_type": "combined"
  }
}
```

Error (404):
```json
{
  "success": false,
  "message": "Booking not found"
}
```

### Mark as No-Show
**POST** `/api/attendant/no-show/1`

Response (200):
```json
{
  "success": true,
  "message": "Booking marked as no-show",
  "booking_id": 1
}
```

### Update Booking Status
**PUT** `/api/attendant/update-status/1`

Request:
```json
{
  "status": "washing"
}
```

Valid statuses: `confirmed`, `received`, `washing`, `completed`, `no_show`, `cancelled`

Response (200):
```json
{
  "success": true,
  "message": "Status updated successfully",
  "booking": {
    "id": 1,
    "status": "washing"
  }
}
```

---

## Admin Management

### Initialize Machines
**POST** `/api/admin/initialize-machines`

Response (201):
```json
{
  "success": true,
  "message": "Machines initialized successfully",
  "machines": [
    {"id": 1, "machine_number": 1, "pair_id": 1, "status": "available"},
    {"id": 2, "machine_number": 2, "pair_id": 1, "status": "available"},
    // ... 8 more machines
  ]
}
```

### Generate Slots for Date
**POST** `/api/admin/generate-slots`

Request:
```json
{
  "date": "2025-11-24",
  "operational_hours": {
    "start": "08:00",
    "end": "20:00"
  },
  "slot_duration_minutes": 60
}
```

Response (201):
```json
{
  "success": true,
  "message": "Generated 60 time slots for 2025-11-24",
  "slots_created": 60
}
```

### Generate Week Slots
**POST** `/api/admin/generate-week-slots`

Request (optional):
```json
{
  "operational_hours": {
    "start": "08:00",
    "end": "20:00"
  }
}
```

Response (201):
```json
{
  "success": true,
  "message": "Generated 420 time slots for next 7 days",
  "slots_created": 420
}
```

### Get All Machines
**GET** `/api/admin/machines`

Response (200):
```json
{
  "success": true,
  "machines": [
    {"id": 1, "machine_number": 1, "pair_id": 1, "status": "available"},
    {"id": 2, "machine_number": 2, "pair_id": 1, "status": "available"},
    {"id": 3, "machine_number": 3, "pair_id": 2, "status": "out_of_order"}
  ]
}
```

### Update Machine Status
**PUT** `/api/admin/machines/3/status`

Request:
```json
{
  "status": "out_of_order"
}
```

Valid statuses: `available`, `out_of_order`, `maintenance`

Response (200):
```json
{
  "success": true,
  "message": "Machine status updated",
  "machine": {
    "id": 3,
    "machine_number": 3,
    "status": "out_of_order"
  }
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Invalid request parameters"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Internal server error"
}
```

---

## Enums Reference

### Load Types
- `combined` - Single load using 1 machine
- `separate_whites` - Whites load (requires 2 machines if separate)
- `separate_colors` - Colors load (requires 2 machines if separate)

### Booking Status
- `confirmed` - Booking created, awaiting check-in
- `received` - Student dropped off clothes
- `washing` - Currently washing
- `completed` - Wash cycle complete
- `no_show` - Student didn't show up
- `cancelled` - Booking cancelled by student

### User Roles
- `student` - Regular student user
- `attendant` - Laundry attendant
- `admin` - System administrator

### Waitlist Status
- `waiting` - In queue
- `promoted` - Promoted to booking
- `expired` - Time passed, no longer valid
