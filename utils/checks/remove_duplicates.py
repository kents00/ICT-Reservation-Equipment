"""
Remove duplicate tables from Neon database
Keep singular versions (user, reservation, notification)
Remove plural versions (users, reservations, notifications)
"""
import os
from dotenv import load_dotenv
import psycopg2

load_dotenv()

db_url = os.getenv('DATABASE_URL')

print("\n" + "="*60)
print("CLEANING UP DUPLICATE TABLES IN NEON")
print("="*60)

try:
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()
    print("✓ Connected to Neon database")

    # Tables to remove (plural versions)
    tables_to_remove = ['users', 'reservations', 'notifications']

    print("\nRemoving duplicate tables...\n")

    for table in tables_to_remove:
        try:
            # Check if table exists
            cur.execute("""
                SELECT EXISTS (
                    SELECT 1 FROM information_schema.tables
                    WHERE table_schema = 'public'
                    AND table_name = %s
                )
            """, (table,))

            exists = cur.fetchone()[0]
            if exists:
                # Drop the table
                cur.execute(f'DROP TABLE IF EXISTS "{table}" CASCADE')
                conn.commit()
                print(f"✓ Removed table: {table}")
            else:
                print(f"⚠ Table {table} does not exist (skipped)")
        except Exception as e:
            print(f"✗ Error removing {table}: {e}")

    # Verify remaining tables
    print("\n" + "="*60)
    print("VERIFYING CLEANUP")
    print("="*60)

    cur.execute("""
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        ORDER BY table_name
    """)

    tables = [row[0] for row in cur.fetchall()]
    print(f"\n✓ Remaining tables ({len(tables)}):")
    for table in tables:
        cur.execute(f'SELECT COUNT(*) FROM "{table}"')
        count = cur.fetchone()[0]
        print(f"  • {table} ({count} rows)")

    cur.close()
    conn.close()
    print("\n" + "="*60)
    print("✓ CLEANUP COMPLETE!")
    print("="*60 + "\n")

except Exception as e:
    print(f"\n✗ Error: {e}")
    import traceback
    traceback.print_exc()
