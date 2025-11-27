"""
Migration script to add image_url column to equipment table
Run this script to update existing database schema
"""
import sqlite3
import os


def migrate_add_image_url():
    """Add image_url column to equipment table if it doesn't exist"""

    # Path to the database file
    db_path = os.path.join(os.path.dirname(__file__),
                           '..', '..', 'instance', 'equipment_reservation.db')

    if not os.path.exists(db_path):
        print(f"✗ Database not found at: {db_path}")
        print("  Please ensure the database exists before running this migration.")
        return

    print(f"Using database: {db_path}")

    try:
        # Connect to the database
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        # Check if column already exists
        cursor.execute("PRAGMA table_info(equipment)")
        columns = [col[1] for col in cursor.fetchall()]

        if 'image_url' in columns:
            print("✓ Column 'image_url' already exists in equipment table")
            conn.close()
            return

        print("Adding 'image_url' column to equipment table...")

        # Add the column
        cursor.execute(
            'ALTER TABLE equipment ADD COLUMN image_url VARCHAR(500)')
        conn.commit()

        print("✓ Successfully added 'image_url' column to equipment table")
        print("✓ Migration complete!")

        conn.close()

    except Exception as e:
        print(f"✗ Error during migration: {e}")
        import traceback
        traceback.print_exc()


if __name__ == '__main__':
    print("=" * 60)
    print("Equipment Image URL Migration")
    print("=" * 60)
    migrate_add_image_url()
    print("=" * 60)
