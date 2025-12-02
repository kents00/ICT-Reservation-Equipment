"""
Fix reservation table schema - add missing columns
"""
import os
from dotenv import load_dotenv
import psycopg2

load_dotenv()

db_url = os.getenv('DATABASE_URL')

print("\n" + "="*60)
print("FIXING RESERVATION TABLE SCHEMA")
print("="*60)

try:
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()
    print("✓ Connected to Neon database")

    # Check existing columns in reservation table
    cur.execute("""
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'reservation'
        ORDER BY ordinal_position
    """)
    existing_cols = {row[0] for row in cur.fetchall()}
    print(f"\n✓ Current reservation columns: {len(existing_cols)}")
    print(f"  Columns: {sorted(existing_cols)}")

    # Define required columns per the Reservation model
    required_columns = {
        'id': 'VARCHAR(36)',
        'user_id': 'VARCHAR(36)',
        'equipment_id': 'VARCHAR(36)',
        'status': 'VARCHAR(20)',
        'quantity_requested': 'INTEGER',
        'reason': 'TEXT',
        'reserved_at': 'TIMESTAMP',  # MISSING!
        'start_date': 'TIMESTAMP',
        'end_date': 'TIMESTAMP',
        'checked_out_at': 'TIMESTAMP',
        'returned_at': 'TIMESTAMP',
        'approved_at': 'TIMESTAMP',
        'rejected_at': 'TIMESTAMP',
        'rejection_reason': 'TEXT',
        'created_at': 'TIMESTAMP',
        'updated_at': 'TIMESTAMP',
        'auto_cancel_date': 'TIMESTAMP',
    }

    # Add missing columns
    missing_cols = set(required_columns.keys()) - existing_cols
    print(f"\n✓ Missing columns: {missing_cols if missing_cols else 'None'}")

    if missing_cols:
        for col_name in sorted(missing_cols):
            col_type = required_columns[col_name]
            try:
                cur.execute(
                    f'ALTER TABLE "reservation" ADD COLUMN "{col_name}" {col_type};'
                )
                print(f"  ✓ Added column: {col_name} ({col_type})")
            except psycopg2.Error as e:
                if 'already exists' in str(e):
                    print(f"  ✓ Column already exists: {col_name}")
                else:
                    print(f"  ! Error adding {col_name}: {e}")

        conn.commit()
        print("\n✓ Schema changes committed")
    else:
        print("\n✓ All required columns already exist")

    # Verify final schema
    cur.execute("""
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'reservation'
        ORDER BY ordinal_position
    """)
    final_cols = cur.fetchall()
    print(
        f"\n✓ Final reservation table structure ({len(final_cols)} columns):")
    for col_name, data_type in final_cols:
        print(f"  - {col_name}: {data_type}")

    cur.close()
    conn.close()
    print("\n" + "="*60)
    print("✓ RESERVATION TABLE SCHEMA FIXED!")
    print("="*60 + "\n")

except Exception as e:
    print(f"\n✗ Error: {e}")
    import traceback
    traceback.print_exc()
