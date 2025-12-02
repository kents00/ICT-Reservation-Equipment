"""
Add image_data column to user table for storing base64 encoded images
This solves the issue of images not persisting on Render's ephemeral filesystem
"""
import os
from dotenv import load_dotenv
import psycopg2

load_dotenv()

db_url = os.getenv('DATABASE_URL')

print("\n" + "="*60)
print("ADDING IMAGE_DATA COLUMN TO USER TABLE")
print("="*60)

try:
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()
    print("✓ Connected to Neon database")

    # Check if column already exists
    cur.execute("""
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'user' AND column_name = 'image_data'
    """)

    if cur.fetchone():
        print("✓ Column 'image_data' already exists")
    else:
        # Add the new column
        cur.execute("""
            ALTER TABLE "user" ADD COLUMN image_data BYTEA;
        """)
        conn.commit()
        print("✓ Added column 'image_data' (BYTEA) to user table")

    # Display current user columns
    cur.execute("""
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'user'
        ORDER BY ordinal_position
    """)

    columns = cur.fetchall()
    print(f"\n✓ User table now has {len(columns)} columns:")
    for col_name, data_type in columns:
        print(f"  - {col_name}: {data_type}")

    cur.close()
    conn.close()
    print("\n" + "="*60)
    print("✓ MIGRATION COMPLETE!")
    print("="*60 + "\n")

except Exception as e:
    print(f"\n✗ Error: {e}")
    import traceback
    traceback.print_exc()
