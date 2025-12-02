"""
Clean up duplicate tables in Neon database
Consolidates: user/users, notification/notifications, reservation/reservations
"""
import os
from dotenv import load_dotenv
import psycopg2

load_dotenv()

db_url = os.getenv('DATABASE_URL')

print("\n" + "="*60)
print("CLEANING UP DUPLICATE TABLES")
print("="*60)

try:
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()

    print("\n1. Handling user / users tables...")

    # Get user count from both tables
    cur.execute('SELECT COUNT(*) FROM "user";')
    user_count = cur.fetchone()[0]
    cur.execute('SELECT COUNT(*) FROM users;')
    users_count = cur.fetchone()[0]

    print(f"   • user table: {user_count} records")
    print(f"   • users table: {users_count} records")

    # Keep 'user' table, drop 'users'
    if users_count > 0 and user_count == 0:
        print("\n   Copying data from 'users' to 'user'...")
        cur.execute("""
            INSERT INTO "user" (id, username, email, password_hash, first_name, middle_name,
                               last_name, student_id, phone, department, role, is_active,
                               email_verified, created_at, updated_at)
            SELECT id, username, email, password_hash, first_name, middle_name,
                   last_name, student_id, phone, department, role, is_active,
                   email_verified, created_at, updated_at FROM users;
        """)
        print("   ✓ Data copied")

    print("   Dropping 'users' table...")
    cur.execute('DROP TABLE IF EXISTS users CASCADE;')
    print("   ✓ 'users' table dropped")

    print("\n2. Handling notification / notifications tables...")

    # Get notification count from both tables
    cur.execute('SELECT COUNT(*) FROM notification;')
    notification_count = cur.fetchone()[0]
    cur.execute('SELECT COUNT(*) FROM notifications;')
    notifications_count = cur.fetchone()[0]

    print(f"   • notification table: {notification_count} records")
    print(f"   • notifications table: {notifications_count} records")

    # Keep 'notification' table, drop 'notifications'
    if notifications_count > 0 and notification_count == 0:
        print("\n   Copying data from 'notifications' to 'notification'...")
        cur.execute("""
            INSERT INTO notification (id, user_id, reservation_id, type, title, message, is_read, created_at)
            SELECT id, user_id, reservation_id, type, title, message, is_read, created_at
            FROM notifications;
        """)
        print("   ✓ Data copied")

    print("   Dropping 'notifications' table...")
    cur.execute('DROP TABLE IF EXISTS notifications CASCADE;')
    print("   ✓ 'notifications' table dropped")

    print("\n3. Handling reservation / reservations tables...")

    # Get reservation count from both tables
    cur.execute('SELECT COUNT(*) FROM reservation;')
    reservation_count = cur.fetchone()[0]
    cur.execute('SELECT COUNT(*) FROM reservations;')
    reservations_count = cur.fetchone()[0]

    print(f"   • reservation table: {reservation_count} records")
    print(f"   • reservations table: {reservations_count} records")

    # Keep 'reservation' table, drop 'reservations'
    if reservations_count > 0 and reservation_count == 0:
        print("\n   Copying data from 'reservations' to 'reservation'...")
        cur.execute("""
            INSERT INTO reservation (id, user_id, equipment_id, start_date, end_date, status,
                                    reason, quantity_requested, approved_by, approved_at,
                                    rejected_by, rejection_reason, rejected_at, checked_out_at,
                                    returned_at, return_verified_by, return_verified_at, created_at, updated_at)
            SELECT id, user_id, equipment_id, start_date, end_date, status,
                   reason, quantity_requested, approved_by, approved_at,
                   rejected_by, rejection_reason, rejected_at, checked_out_at,
                   returned_at, return_verified_by, return_verified_at, created_at, updated_at
            FROM reservations;
        """)
        print("   ✓ Data copied")

    print("   Dropping 'reservations' table...")
    cur.execute('DROP TABLE IF EXISTS reservations CASCADE;')
    print("   ✓ 'reservations' table dropped")

    conn.commit()
    cur.close()
    conn.close()

    print("\n" + "="*60)
    print("✓ CLEANUP COMPLETE!")
    print("="*60)
    print("\nRemaining tables:")
    print("  • user (consolidated)")
    print("  • notification (consolidated)")
    print("  • reservation (consolidated)")
    print("  • equipment")
    print("  • system_settings")
    print("  • audit_log")
    print("  • qr_scans")
    print("  • usage_reports")
    print("\n" + "="*60 + "\n")

except Exception as e:
    print(f"\n✗ Error: {e}")
    import traceback
    traceback.print_exc()
