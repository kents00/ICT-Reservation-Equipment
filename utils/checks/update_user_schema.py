"""
Add missing columns to user table and repopulate data
"""
import os
from dotenv import load_dotenv
import psycopg2

load_dotenv()

db_url = os.getenv('DATABASE_URL')

print("\n" + "="*60)
print("UPDATING USER TABLE SCHEMA")
print("="*60)

try:
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()
    print("✓ Connected to Neon database")

    # Add missing columns to user table
    missing_columns = [
        ('first_name', 'VARCHAR(60)'),
        ('middle_name', 'VARCHAR(60)'),
        ('last_name', 'VARCHAR(60)'),
        ('image_url', 'VARCHAR(500)'),
        ('two_factor_enabled', 'BOOLEAN DEFAULT FALSE'),
        ('verification_code', 'VARCHAR(10)'),
        ('verification_code_expiry', 'TIMESTAMP'),
        ('verification_attempts', 'INTEGER DEFAULT 0'),
        ('verification_locked_until', 'TIMESTAMP'),
    ]

    print("\nChecking and adding missing columns...")

    # Get existing columns
    cur.execute("""
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'user'
    """)
    existing_cols = {row[0] for row in cur.fetchall()}

    for col_name, col_type in missing_columns:
        if col_name not in existing_cols:
            try:
                cur.execute(
                    f'ALTER TABLE "user" ADD COLUMN {col_name} {col_type};')
                print(f"  ✓ Added column: {col_name}")
            except Exception as e:
                if 'already exists' in str(e):
                    print(f"  ✓ Column already exists: {col_name}")
                else:
                    print(f"  ! Error adding {col_name}: {e}")
        else:
            print(f"  ✓ Column already exists: {col_name}")

    conn.commit()

    # Now repopulate users with full data
    print("\nRepopulating users...")
    from werkzeug.security import generate_password_hash
    import uuid

    # Delete existing reservations first (foreign key constraint)
    cur.execute('DELETE FROM reservation;')
    print("  ✓ Cleared existing reservations")

    # Delete existing users
    cur.execute('DELETE FROM "user";')
    print("  ✓ Cleared existing users")

    # Add admin
    admin_id = str(uuid.uuid4())
    admin_pass = generate_password_hash('password123')
    cur.execute("""
        INSERT INTO "user"
        (id, username, email, password_hash, first_name, middle_name, last_name,
         phone, department, role, is_active, image_url)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """, (
        admin_id, 'admin1', 'admin1@university.edu', admin_pass,
        'Jane', 'Marie', 'Admin', '098-765-4321',
        'Bachelor of Science in Information Technology', 'admin', True, None
    ))
    print("  ✓ Admin user created: admin1 / password123")

    # Add student
    student_id = str(uuid.uuid4())
    student_pass = generate_password_hash('password123')
    cur.execute("""
        INSERT INTO "user"
        (id, username, email, password_hash, first_name, middle_name, last_name,
         student_id, phone, department, role, is_active, image_url)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """, (
        student_id, 'student1', 'student1@university.edu', student_pass,
        'John', 'Michael', 'Student', 'STU-20250001', '123-456-7890',
        'Bachelor of Science in Information Technology', 'student', True, None
    ))
    print("  ✓ Student user created: student1 / password123")

    conn.commit()
    cur.close()
    conn.close()

    print("\n" + "="*60)
    print("✓ USER TABLE UPDATED AND REPOPULATED!")
    print("="*60)
    print("\nLogin Credentials:")
    print("  Admin:   username=admin1,   password=password123")
    print("  Student: username=student1, password=password123")
    print("=" * 60 + "\n")

except Exception as e:
    print(f"\n✗ Error: {e}")
    import traceback
    traceback.print_exc()
