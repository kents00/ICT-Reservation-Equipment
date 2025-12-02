"""
Check what data is in the Neon database
"""
import os
from dotenv import load_dotenv
import psycopg2

load_dotenv()

db_url = os.getenv('DATABASE_URL')

try:
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()

    print("\n" + "="*60)
    print("NEON DATABASE STATUS")
    print("="*60)

    # Check users
    cur.execute("SELECT COUNT(*) FROM \"user\";")
    user_count = cur.fetchone()[0]
    print(f"\n✓ Users: {user_count}")
    if user_count > 0:
        cur.execute("SELECT id, username, role FROM \"user\";")
        for row in cur.fetchall():
            print(f"  • {row[1]} ({row[2]}) - ID: {row[0]}")

    # Check equipment
    cur.execute("SELECT COUNT(*) FROM equipment;")
    eq_count = cur.fetchone()[0]
    print(f"\n✓ Equipment: {eq_count}")
    if eq_count > 0:
        cur.execute("SELECT name, serial_number, quantity FROM equipment;")
        for row in cur.fetchall():
            print(f"  • {row[0]} (Serial: {row[1]}, Qty: {row[2]})")

    # Check reservations
    cur.execute("SELECT COUNT(*) FROM reservation;")
    res_count = cur.fetchone()[0]
    print(f"\n✓ Reservations: {res_count}")

    # Check system settings
    cur.execute("SELECT COUNT(*) FROM system_settings;")
    settings_count = cur.fetchone()[0]
    print(f"✓ System Settings: {settings_count}")

    print("\n" + "="*60)

    cur.close()
    conn.close()

except Exception as e:
    print(f"✗ Error: {e}")
