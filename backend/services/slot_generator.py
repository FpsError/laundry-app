from database import db
from models import TimeSlot, Machine
from datetime import datetime, timedelta, time

def generate_daily_slots(date, operational_hours={'start': '08:00', 'end': '20:00'}, slot_duration_minutes=60):
    """
    Generate time slots for all 5 machine pairs with 10-minute stagger
    
    Machine Pairs:
    - Pair 1: Machines 1 & 2
    - Pair 2: Machines 3 & 4
    - Pair 3: Machines 5 & 6
    - Pair 4: Machines 7 & 8
    - Pair 5: Machines 9 & 10
    
    Stagger Pattern (10-minute intervals):
    - Pair 1: 8:00-9:00, 9:00-10:00, 10:00-11:00...
    - Pair 2: 8:10-9:10, 9:10-10:10, 10:10-11:10...
    - Pair 3: 8:20-9:20, 9:20-10:20, 10:20-11:20...
    - Pair 4: 8:30-9:30, 9:30-10:30, 10:30-11:30...
    - Pair 5: 8:40-9:40, 9:40-10:40, 10:40-11:40...
    """
    try:
        # Parse operational hours
        start_hour, start_minute = map(int, operational_hours['start'].split(':'))
        end_hour, end_minute = map(int, operational_hours['end'].split(':'))
        
        start_time = datetime.combine(date, time(start_hour, start_minute))
        end_time = datetime.combine(date, time(end_hour, end_minute))
        
        slots_created = 0
        
        # Generate slots for each of the 5 pairs
        for pair_id in range(1, 6):
            # Calculate stagger offset: 10 minutes * (pair_id - 1)
            stagger_minutes = 10 * (pair_id - 1)
            
            # Start time for this pair
            pair_start = start_time + timedelta(minutes=stagger_minutes)
            
            # Generate slots for this pair
            current_slot_start = pair_start
            
            while current_slot_start + timedelta(minutes=slot_duration_minutes) <= end_time + timedelta(minutes=stagger_minutes):
                current_slot_end = current_slot_start + timedelta(minutes=slot_duration_minutes)
                
                # Check if slot already exists
                existing_slot = TimeSlot.query.filter_by(
                    pair_id=pair_id,
                    start_time=current_slot_start
                ).first()
                
                if not existing_slot:
                    slot = TimeSlot(
                        pair_id=pair_id,
                        date=date,
                        start_time=current_slot_start,
                        end_time=current_slot_end,
                        available_machines=2  # Each pair has 2 machines
                    )
                    db.session.add(slot)
                    slots_created += 1
                
                # Move to next slot
                current_slot_start += timedelta(minutes=slot_duration_minutes)
        
        db.session.commit()
        print(f"Generated {slots_created} time slots for {date}")
        return slots_created
    
    except Exception as e:
        db.session.rollback()
        print(f"Error generating slots: {str(e)}")
        return 0

def initialize_machines():
    """
    Initialize the 10 machines grouped into 5 pairs
    Only run this once during setup
    """
    try:
        # Check if machines already exist
        if Machine.query.count() > 0:
            print("Machines already initialized")
            return
        
        # Create 10 machines in 5 pairs
        for machine_num in range(1, 11):
            pair_id = ((machine_num - 1) // 2) + 1
            
            machine = Machine(
                machine_number=machine_num,
                pair_id=pair_id,
                status='available'
            )
            db.session.add(machine)
        
        db.session.commit()
        print("Initialized 10 machines in 5 pairs")
    
    except Exception as e:
        db.session.rollback()
        print(f"Error initializing machines: {str(e)}")
