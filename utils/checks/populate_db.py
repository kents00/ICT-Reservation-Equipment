"""
Populate Neon database with demo data using direct SQL
"""
import os
from dotenv import load_dotenv
import psycopg2
import uuid
from datetime import datetime, timedelta
from werkzeug.security import generate_password_hash

load_dotenv()

db_url = os.getenv('DATABASE_URL')

print("\n" + "="*60)
print("POPULATING NEON DATABASE WITH DEMO DATA")
print("="*60)

try:
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()
    print("✓ Connected to Neon database")

    # Check if data already exists
    cur.execute("SELECT COUNT(*) FROM \"user\";")
    user_count = cur.fetchone()[0]

    if user_count > 0:
        print(
            f"\n✓ Database already has {user_count} users - skipping population")
        cur.close()
        conn.close()
        print("="*60 + "\n")
        exit(0)

    print("\n1. Creating system settings...")
    settings_id = str(uuid.uuid4())
    cur.execute("""
        INSERT INTO system_settings (id, system_name, description, max_reservation_duration,
                                    max_advance_booking, require_approval, email_notifications,
                                    sms_notifications, session_timeout, two_factor_auth)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """, (
        settings_id,
        'Equipment Reservation System',
        'Manage and reserve equipment efficiently',
        30, 90, True, False, False, 30, False
    ))
    print("   ✓ System settings created")

    print("\n2. Creating demo users...")

    # Admin user
    admin_id = str(uuid.uuid4())
    admin_pass = generate_password_hash('password123')
    cur.execute("""
        INSERT INTO "user" (id, username, email, password_hash, first_name, middle_name,
                           last_name, phone, department, role, is_active, email_verified)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """, (
        admin_id, 'admin1', 'admin1@university.edu', admin_pass,
        'Jane', 'Marie', 'Admin', '098-765-4321',
        'Bachelor of Science in Information Technology', 'ADMIN', True, True
    ))
    print("   ✓ Admin user created: admin1 / password123")

    # Student user
    student_id = str(uuid.uuid4())
    student_pass = generate_password_hash('password123')
    cur.execute("""
        INSERT INTO "user" (id, username, email, password_hash, first_name, middle_name,
                           last_name, student_id, phone, department, role, is_active, email_verified)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """, (
        student_id, 'student1', 'student1@university.edu', student_pass,
        'John', 'Michael', 'Student', 'STU-20250001', '123-456-7890',
        'Bachelor of Science in Information Technology', 'STUDENT', True, True
    ))
    print("   ✓ Student user created: student1 / password123")

    print("\n3. Getting existing equipment...")

    # Get equipment IDs from database (they already exist)
    cur.execute("SELECT id FROM equipment ORDER BY created_at LIMIT 4;")
    equipment_ids = [row[0] for row in cur.fetchall()]
    print(f"   ✓ Found {len(equipment_ids)} equipment items")

    print("\n4. Creating sample reservations...")

    today = datetime.now()
    reservation_data = [
        (equipment_ids[0], 'PENDING', 'Need for class project', 0),
        (equipment_ids[1], 'APPROVED', 'Presentation in Lab B', 1),
        (equipment_ids[2], 'CHECKED_OUT', 'Testing return verification', -2),
        (equipment_ids[3], 'RETURN_PENDING', 'Return verification demo', -5),
    ]

    for eq_id, status, reason, days_offset in reservation_data:
        res_id = str(uuid.uuid4())
        start_date = (today + timedelta(days=days_offset)).date()
        end_date = (today + timedelta(days=days_offset+3)).date()

        cur.execute("""
            INSERT INTO reservation (id, user_id, equipment_id, start_date, end_date,
                                    status, reason, quantity_requested, created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            res_id, student_id, eq_id, start_date, end_date,
            status, reason, 1, today, today
        ))
        print(f"   ✓ {status} reservation")

    conn.commit()
    cur.close()
    conn.close()

    print("\n" + "="*60)
    print("✓ DATABASE POPULATION COMPLETE!")
    print("="*60)
    print("\nLogin Credentials:")
    print("  Admin:   username=admin1,   password=password123")
    print("  Student: username=student1, password=password123")
    print("\nDatabase Summary:")
    print("  • Users: 2 (1 admin, 1 student)")
    print("  • Equipment: 4 items")
    print("  • Reservations: 4 samples")
    print("  • System Settings: Configured")
    print("="*60 + "\n")

except Exception as e:
    print(f"\n✗ Error: {e}")
    import traceback
    traceback.print_exc()
