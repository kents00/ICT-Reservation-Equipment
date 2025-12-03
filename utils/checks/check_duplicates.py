"""
Check for duplicate tables in Neon database
"""
import os
from dotenv import load_dotenv
import psycopg2

load_dotenv()

db_url = os.getenv('DATABASE_URL')

print("\n" + "="*60)
print("CHECKING FOR DUPLICATE TABLES IN NEON")
print("="*60)

try:
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()
    print("✓ Connected to Neon database")

    # Get all tables
    cur.execute("""
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        ORDER BY table_name
    """)

    tables = [row[0] for row in cur.fetchall()]
    print(f"\n✓ Found {len(tables)} tables in database:")
    for table in tables:
        print(f"  • {table}")

    # Check for duplicates
    print("\n" + "="*60)
    print("CHECKING FOR DUPLICATES")
    print("="*60)

    duplicates = {
        'user': ['user', 'users'],
        'reservation': ['reservation', 'reservations'],
        'notification': ['notification', 'notifications']
    }

    found_duplicates = False
    for base_name, variants in duplicates.items():
        found = [v for v in variants if v in tables]
        if len(found) > 1:
            found_duplicates = True
            print(f"\n⚠ DUPLICATE FOUND for '{base_name}':")
            for variant in found:
                # Count rows
                cur.execute(f'SELECT COUNT(*) FROM "{variant}"')
                count = cur.fetchone()[0]
                print(f"  • {variant} ({count} rows)")
        elif len(found) == 1:
            cur.execute(f'SELECT COUNT(*) FROM "{found[0]}"')
            count = cur.fetchone()[0]
            print(f"\n✓ {found[0]} exists ({count} rows)")

    if not found_duplicates:
        print("\n✓ No duplicate tables found!")

    cur.close()
    conn.close()
    print("\n" + "="*60 + "\n")

except Exception as e:
    print(f"\n✗ Error: {e}")
    import traceback
    traceback.print_exc()
