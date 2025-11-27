"""
Migration script to add is_dismissed column to notifications table
Run this script to add the column to an existing database
"""
import os
import sqlite3
from pathlib import Path


def migrate_add_is_dismissed():
    """Add is_dismissed column to notifications table"""
    db_path = Path(__file__).parent / 'instance' / 'equipment_reservation.db'

    # Try default location first
    if not db_path.exists():
        db_path = Path(__file__).parent / 'equipment_reservation.db'

    if not db_path.exists():
        print(f"Database not found at {db_path}")
        print("Please ensure the database exists before running this migration")
        return False

    try:
        conn = sqlite3.connect(str(db_path))
        cursor = conn.cursor()

        # Check if columns already exist
        cursor.execute("PRAGMA table_info(notifications)")
        columns = [col[1] for col in cursor.fetchall()]

        changes_made = False

        # Add is_dismissed column if it doesn't exist
        if 'is_dismissed' not in columns:
            cursor.execute("""
                ALTER TABLE notifications
                ADD COLUMN is_dismissed BOOLEAN DEFAULT 0
            """)
            print("Added 'is_dismissed' column to notifications table")
            changes_made = True
        else:
            print("Column 'is_dismissed' already exists in notifications table")

        # Add updated_at column if it doesn't exist
        if 'updated_at' not in columns:
            cursor.execute("""
                ALTER TABLE notifications
                ADD COLUMN updated_at DATETIME
            """)
            print("Added 'updated_at' column to notifications table")
            changes_made = True
        else:
            print("Column 'updated_at' already exists in notifications table")

        if changes_made:
            conn.commit()
            print("\n✓ Migration completed successfully!")
        else:
            print("\n✓ No changes needed - all columns already exist")

        conn.close()
        return True

    except sqlite3.OperationalError as e:
        print(f"Error running migration: {e}")
        return False
    except Exception as e:
        print(f"Unexpected error: {e}")
        return False


if __name__ == '__main__':
    success = migrate_add_is_dismissed()
    exit(0 if success else 1)
