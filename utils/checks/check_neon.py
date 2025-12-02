"""
Direct Neon seeding - Simple approach
"""
from psycopg2.extras import execute_values
import psycopg2
import os
from dotenv import load_dotenv
load_dotenv()

# Direct psycopg2 connection for testing

db_url = os.getenv('DATABASE_URL')
print(f"Connecting to: {db_url[:40]}...")

try:
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()
    print("✓ Connected to Neon database")

    # Check if users table exists
    cur.execute("""
        SELECT EXISTS (
            SELECT FROM information_schema.tables
            WHERE table_name = 'user'
        );
    """)
    exists = cur.fetchone()[0]

    if exists:
        print("✓ Users table already exists")
        cur.execute("SELECT COUNT(*) FROM \"user\";")
        count = cur.fetchone()[0]
        print(f"✓ Current user records: {count}")
    else:
        print("! Users table doesn't exist yet - run Flask app first to initialize")

    cur.close()
    conn.close()
    print("\n✓ Database connection successful!")

except Exception as e:
    print(f"✗ Error: {e}")
