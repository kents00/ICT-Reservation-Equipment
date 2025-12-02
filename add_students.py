"""
Add specific student records to the Neon database
"""
import os
from dotenv import load_dotenv
import psycopg2
from werkzeug.security import generate_password_hash
import uuid

load_dotenv()

db_url = os.getenv('DATABASE_URL')

print("\n" + "="*60)
print("ADDING STUDENT RECORDS TO NEON DATABASE")
print("="*60)

# Student data to add
students = [
    {
        'first_name': 'Vincent',
        'middle_name': '',
        'last_name': 'Cimafranca',
        'username': 'Vincent',
        'email': 'itsmevincent@gmail.com',
        'student_id': '2024005740',
        'phone': '09101199245',
    },
    {
        'first_name': 'Renalyn',
        'middle_name': 'Viña',
        'last_name': 'Macala',
        'username': 'Renalyn',
        'email': 'renalynmacala@gmail.com',
        'student_id': '2023303318',
        'phone': '09816272692',
    },
    {
        'first_name': 'Abegail',
        'middle_name': 'D.',
        'last_name': 'Gambel',
        'username': 'Abegail',
        'email': 'gambelabegail26@gmail.com',
        'student_id': '2023301360',
        'phone': '09154569326',
    },
    {
        'first_name': 'Eden May',
        'middle_name': 'V.',
        'last_name': 'Lingolingo',
        'username': 'Edenya',
        'email': 'itsedenya0923@gmail.com',
        'student_id': '2023304427',
        'phone': '',  # No phone provided
    },
]

try:
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()
    print("✓ Connected to Neon database")

    # Default password for new students
    default_password = generate_password_hash('password123')
    
    added_count = 0
    failed_count = 0

    print(f"\nAdding {len(students)} student records...\n")

    for student in students:
        try:
            student_uuid = str(uuid.uuid4())
            
            # Check if email already exists
            cur.execute('SELECT id FROM "user" WHERE email = %s', (student['email'],))
            if cur.fetchone():
                print(f"⚠ SKIPPED: {student['username']} ({student['email']}) - Email already exists")
                failed_count += 1
                continue
            
            # Check if username already exists
            cur.execute('SELECT id FROM "user" WHERE username = %s', (student['username'],))
            if cur.fetchone():
                print(f"⚠ SKIPPED: {student['username']} - Username already exists")
                failed_count += 1
                continue
            
            # Check if student_id already exists
            cur.execute('SELECT id FROM "user" WHERE student_id = %s', (student['student_id'],))
            if cur.fetchone():
                print(f"⚠ SKIPPED: {student['username']} - Student ID already exists")
                failed_count += 1
                continue

            # Insert the student
            cur.execute("""
                INSERT INTO "user"
                (id, username, email, password_hash, first_name, middle_name, last_name,
                 student_id, phone, department, role, is_active)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                student_uuid,
                student['username'],
                student['email'],
                default_password,
                student['first_name'],
                student['middle_name'],
                student['last_name'],
                student['student_id'],
                student['phone'],
                'Bachelor of Science in Information Technology',
                'student',
                True
            ))
            
            print(f"✓ ADDED: {student['username']} ({student['email']}) - ID: {student['student_id']}")
            added_count += 1

        except Exception as e:
            print(f"✗ ERROR adding {student['username']}: {str(e)}")
            failed_count += 1

    conn.commit()
    
    # Display summary
    print("\n" + "="*60)
    print("SUMMARY")
    print("="*60)
    print(f"✓ Successfully added: {added_count} students")
    if failed_count > 0:
        print(f"✗ Failed/Skipped: {failed_count} students")
    print(f"✓ Default password for all new students: password123")
    print("\nVerifying added students...")

    # Verify by fetching all student records
    cur.execute("""
        SELECT username, email, student_id, first_name, last_name
        FROM "user"
        WHERE role = 'student'
        ORDER BY created_at DESC
        LIMIT 10
    """)
    
    records = cur.fetchall()
    print(f"\n✓ Current students in database ({len(records)} total):")
    for record in records:
        username, email, student_id, first_name, last_name = record
        print(f"  • {username} ({email}) - ID: {student_id} - {first_name} {last_name}")

    cur.close()
    conn.close()
    print("\n" + "="*60)
    print("✓ COMPLETED!")
    print("="*60 + "\n")

except Exception as e:
    print(f"\n✗ Error: {e}")
    import traceback
    traceback.print_exc()
