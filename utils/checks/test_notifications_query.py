"""
Test admin notifications endpoint
"""
import os
from dotenv import load_dotenv
import psycopg2
from datetime import datetime, timedelta

load_dotenv()

db_url = os.getenv('DATABASE_URL')

print("\n" + "="*60)
print("TESTING ADMIN NOTIFICATIONS ENDPOINT")
print("="*60)

try:
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()
    print("✓ Connected to Neon database")

    # Test the exact query from the notifications endpoint
    # From routes/admin.py line 688-691
    print("\nTesting query from get_admin_notifications()...")

    # Query that was failing
    cur.execute("""
        SELECT reservation.id, reservation.user_id, reservation.equipment_id,
               reservation.status, reservation.quantity_requested, reservation.reason,
               reservation.reserved_at, reservation.start_date, reservation.end_date,
               reservation.checked_out_at, reservation.returned_at, reservation.approved_at,
               reservation.rejected_at, reservation.rejection_reason, reservation.created_at,
               reservation.updated_at, reservation.auto_cancel_date
        FROM reservation
        WHERE reservation.status = %s AND reservation.approved_at >= %s
        ORDER BY reservation.approved_at DESC
        LIMIT 10
    """, ('approved', datetime.utcnow() - timedelta(days=7)))

    results = cur.fetchall()
    print(f"✓ Query executed successfully!")
    print(f"✓ Found {len(results)} approved reservations from last 7 days")

    # Test the other query from dashboard
    print("\nTesting query from get_dashboard_stats()...")
    cur.execute("""
        SELECT reservation.id, reservation.user_id, reservation.equipment_id,
               reservation.status, reservation.quantity_requested, reservation.reason,
               reservation.reserved_at, reservation.start_date, reservation.end_date,
               reservation.checked_out_at, reservation.returned_at, reservation.approved_at,
               reservation.rejected_at, reservation.rejection_reason, reservation.created_at,
               reservation.updated_at, reservation.auto_cancel_date
        FROM reservation
        ORDER BY reservation.created_at DESC
        LIMIT 5
    """)

    results = cur.fetchall()
    print(f"✓ Query executed successfully!")
    print(f"✓ Found {len(results)} recent reservations")

    cur.close()
    conn.close()
    print("\n" + "="*60)
    print("✓ ALL QUERIES WORKING - DATABASE SCHEMA COMPLETE!")
    print("="*60 + "\n")

except Exception as e:
    print(f"\n✗ Error: {e}")
    import traceback
    traceback.print_exc()
