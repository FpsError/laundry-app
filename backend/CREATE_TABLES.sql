-- PostgreSQL Table Creation Script
-- Masbanat AL-Akhawayn Laundry Booking System

-- Create Users Table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    student_id VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(15),
    user_type VARCHAR(20) CHECK (user_type IN ('student', 'staff', 'admin')) DEFAULT 'student',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Machines Table
CREATE TABLE machines (
    id SERIAL PRIMARY KEY,
    machine_number INTEGER UNIQUE NOT NULL,
    machine_name VARCHAR(50) NOT NULL,
    status VARCHAR(20) CHECK (status IN ('available', 'in_use', 'maintenance')) DEFAULT 'available',
    pair_group INTEGER NOT NULL,
    location VARCHAR(100) DEFAULT 'Laundry Room',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Time Slots Table
CREATE TABLE time_slots (
    id SERIAL PRIMARY KEY,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    slot_date DATE NOT NULL,
    machine_id INTEGER REFERENCES machines(id),
    is_available BOOLEAN DEFAULT TRUE,
    UNIQUE(machine_id, slot_date, start_time)
);

-- Create Bookings Table
CREATE TABLE bookings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    machine_id INTEGER REFERENCES machines(id),
    time_slot_id INTEGER REFERENCES time_slots(id),
    wash_type VARCHAR(20) CHECK (wash_type IN ('mixed', 'separate')) NOT NULL,
    status VARCHAR(20) CHECK (status IN ('confirmed', 'completed', 'cancelled', 'no_show')) DEFAULT 'confirmed',
    clothes_description TEXT,
    booking_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    scheduled_time TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Waitlist Table
CREATE TABLE waitlist (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    preferred_date DATE NOT NULL,
    preferred_time TIME NOT NULL,
    wash_type VARCHAR(20) CHECK (wash_type IN ('mixed', 'separate')) NOT NULL,
    status VARCHAR(20) CHECK (status IN ('waiting', 'notified', 'cancelled')) DEFAULT 'waiting',
    position INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert Sample Machines
INSERT INTO machines (machine_number, machine_name, pair_group) VALUES
(1, 'Washer 1 - Pair A', 1),
(2, 'Washer 2 - Pair A', 1),
(3, 'Washer 3 - Pair B', 2),
(4, 'Washer 4 - Pair B', 2),
(5, 'Washer 5 - Pair C', 3),
(6, 'Washer 6 - Pair C', 3),
(7, 'Washer 7 - Pair D', 4),
(8, 'Washer 8 - Pair D', 4),
(9, 'Washer 9 - Pair E', 5),
(10, 'Washer 10 - Pair E', 5);

-- Insert Admin User
INSERT INTO users (student_id, email, password_hash, full_name, user_type) VALUES
('admin001', 'admin@aui.ma', 'hashed_password_123', 'System Administrator', 'admin');

-- Display created tables
SELECT 'Database tables created successfully!' as message;
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;
