# backend/database.py
import psycopg2
from datetime import datetime

class Database:
    def __init__(self):
        self.connection = None
    
    def connect(self):
        """Connect to PostgreSQL database"""
        try:
            self.connection = psycopg2.connect(
                host="localhost",
                database="laundry_db",
                user="postgres",
                password="",  # Empty password for Postgres.app
                port="5432"
            )
            print("✅ Connected to PostgreSQL successfully!")
            return self.connection
        except Exception as e:
            print(f"❌ Connection failed: {e}")
            return None
    
    def create_tables(self):
        """Create all necessary tables for the laundry system"""
        commands = [
            # Users table
            """
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                student_id VARCHAR(20) UNIQUE NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                full_name VARCHAR(100) NOT NULL,
                phone_number VARCHAR(15),
                user_type VARCHAR(20) CHECK (user_type IN ('student', 'staff', 'admin')) DEFAULT 'student',
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """,
            
            # Machines table
            """
            CREATE TABLE IF NOT EXISTS machines (
                id SERIAL PRIMARY KEY,
                machine_number INTEGER UNIQUE NOT NULL,
                machine_name VARCHAR(50) NOT NULL,
                status VARCHAR(20) CHECK (status IN ('available', 'in_use', 'maintenance')) DEFAULT 'available',
                pair_group INTEGER NOT NULL,
                location VARCHAR(100) DEFAULT 'Laundry Room',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """,
            
            # Time slots table
            """
            CREATE TABLE IF NOT EXISTS time_slots (
                id SERIAL PRIMARY KEY,
                start_time TIME NOT NULL,
                end_time TIME NOT NULL,
                slot_date DATE NOT NULL,
                machine_id INTEGER REFERENCES machines(id),
                is_available BOOLEAN DEFAULT TRUE,
                UNIQUE(machine_id, slot_date, start_time)
            )
            """,
            
            # Bookings table
            """
            CREATE TABLE IF NOT EXISTS bookings (
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
            )
            """,
            
            # Waitlist table
            """
            CREATE TABLE IF NOT EXISTS waitlist (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id),
                preferred_date DATE NOT NULL,
                preferred_time TIME NOT NULL,
                wash_type VARCHAR(20) CHECK (wash_type IN ('mixed', 'separate')) NOT NULL,
                status VARCHAR(20) CHECK (status IN ('waiting', 'notified', 'cancelled')) DEFAULT 'waiting',
                position INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """
        ]
        
        conn = self.connect()
        if conn is None:
            print("❌ Cannot create tables - no database connection")
            return
        
        try:
            cursor = conn.cursor()
            
            print("🔄 Creating tables...")
            for i, command in enumerate(commands):
                cursor.execute(command)
                print(f"✅ Table {i+1} created successfully")
            
            conn.commit()
            cursor.close()
            print("🎉 All tables created successfully!")
            
        except Exception as e:
            print(f"❌ Error creating tables: {e}")
        finally:
            conn.close()
    
    def insert_sample_data(self):
        """Insert sample machines and data"""
        conn = self.connect()
        if conn is None:
            print("❌ Cannot insert data - no database connection")
            return
        
        try:
            cursor = conn.cursor()
            
            # Insert 10 machines (5 pairs)
            machines_data = [
                (1, "Washer 1 - Pair A", 1),
                (2, "Washer 2 - Pair A", 1),
                (3, "Washer 3 - Pair B", 2),
                (4, "Washer 4 - Pair B", 2),
                (5, "Washer 5 - Pair C", 3),
                (6, "Washer 6 - Pair C", 3),
                (7, "Washer 7 - Pair D", 4),
                (8, "Washer 8 - Pair D", 4),
                (9, "Washer 9 - Pair E", 5),
                (10, "Washer 10 - Pair E", 5)
            ]
            
            print("📊 Adding sample machines...")
            for machine in machines_data:
                cursor.execute("""
                    INSERT INTO machines (machine_number, machine_name, pair_group)
                    VALUES (%s, %s, %s)
                    ON CONFLICT (machine_number) DO NOTHING
                """, machine)
                print(f"✅ Machine {machine[0]} added")
            
            # Insert a sample admin user
            cursor.execute("""
                INSERT INTO users (student_id, email, password_hash, full_name, user_type)
                VALUES (%s, %s, %s, %s, %s)
                ON CONFLICT (email) DO NOTHING
            """, ("admin001", "admin@aui.ma", "hashed_password_123", "System Admin", "admin"))
            print("✅ Admin user added")
            
            conn.commit()
            cursor.close()
            print("📊 Sample data inserted successfully!")
            
        except Exception as e:
            print(f"❌ Error inserting sample data: {e}")
        finally:
            conn.close()
    
    def close(self):
        """Close database connection"""
        if self.connection:
            self.connection.close()

def setup_database():
    db = Database()
    print("🚀 Starting Masbanat AL-Akhawayn Database Setup...")
    print("=" * 50)
    
    db.create_tables()
    print("-" * 50)
    db.insert_sample_data()
    
    print("=" * 50)
    print("🎊 Database setup completed successfully!")
    print("💡 PostgreSQL is now ready for your laundry app!")

if __name__ == "__main__":
    setup_database()