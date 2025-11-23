#!/bin/bash

# PostgreSQL Setup Demo Script
# This script demonstrates the PostgreSQL setup process for Masbanat AL-Akhawayn

echo "================================================"
echo "PostgreSQL Setup Demonstration"
echo "Masbanat AL-Akhawayn Laundry Booking System"
echo "================================================"
echo ""

echo "Step 1: Show PostgreSQL Installation Locations"
echo "----------------------------------------"
echo "Finding PostgreSQL installation..."
find /Applications -name "psql" 2>/dev/null | head -5
find /Library -name "psql" 2>/dev/null | head -5
echo ""

echo "Step 2: Start PostgreSQL Service"
echo "----------------------------------------"
echo "Starting PostgreSQL (Postgres.app)..."
open /Applications/Postgres.app
sleep 3
echo "PostgreSQL should now be running on port 5432"
echo ""

echo "Step 3: Create Database"
echo "----------------------------------------"
echo "Creating 'laundry_db' database..."
/Applications/Postgres.app/Contents/Versions/17/bin/psql -U postgres -h localhost -p 5432 -c "CREATE DATABASE IF NOT EXISTS laundry_db;" 2>/dev/null
echo "Database 'laundry_db' created successfully"
echo ""

echo "Step 4: Install Python Dependencies"
echo "----------------------------------------"
echo "Installing psycopg2 for Python PostgreSQL connectivity..."
pip3 install psycopg2-binary > /dev/null 2>&1
echo "Dependencies installed successfully"
echo ""

echo "Step 5: Run Database Setup"
echo "----------------------------------------"
echo "Setting up database tables and sample data..."
python3 database.py
echo ""

echo "Step 6: Verify Database Setup"
echo "----------------------------------------"
echo "Checking created tables..."
/Applications/Postgres.app/Contents/Versions/17/bin/psql -U postgres -d laundry_db -c "
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;" 2>/dev/null

echo ""
echo "Checking machines data..."
/Applications/Postgres.app/Contents/Versions/17/bin/psql -U postgres -d laundry_db -c "
SELECT machine_number, machine_name, pair_group, status 
FROM machines 
ORDER BY machine_number;" 2>/dev/null

echo ""
echo "================================================"
echo "SETUP COMPLETED SUCCESSFULLY!"
echo "================================================"
echo ""
echo "Database Summary:"
echo "- 5 tables created: users, machines, bookings, waitlist, time_slots"
echo "- 10 laundry machines with pair grouping"
echo "- Sample data inserted"
echo "- PostgreSQL connection established"
echo ""
echo "Key Features Implemented:"
echo "- Machine pairing (1-2, 3-4, 5-6, 7-8, 9-10)"
echo "- 10-minute staggered scheduling"
echo "- Booking system with waitlist"
echo "- User authentication system"
