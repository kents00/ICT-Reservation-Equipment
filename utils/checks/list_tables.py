"""
List all tables in the Neon database
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
    print("ALL TABLES IN NEON DATABASE")
    print("="*60)

    # Get all tables
    cur.execute("""
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        ORDER BY table_name;
    """)

    tables = cur.fetchall()

    if tables:
        print(f"\nFound {len(tables)} tables:\n")
        for table in tables:
            table_name = table[0]

            # Count records in each table
            cur.execute(f'SELECT COUNT(*) FROM "{table_name}";')
            count = cur.fetchone()[0]
            print(f"  • {table_name:30} ({count} records)")
    else:
        print("\nNo tables found!")

    print("\n" + "="*60 + "\n")

    cur.close()
    conn.close()

except Exception as e:
    print(f"✗ Error: {e}")
