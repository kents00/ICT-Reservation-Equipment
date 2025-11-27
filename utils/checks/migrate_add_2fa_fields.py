"""
Migration script to add two-factor authentication fields to users table
Run this script to add the 2FA columns to an existing database
"""
import os
import sqlite3
from pathlib import Path


def migrate_add_2fa_fields():
    """Add two-factor authentication columns to users table"""
    # Try multiple possible database locations
    possible_paths = [
        Path(__file__).parent / 'instance' / 'equipment_reservation.db',
        Path(__file__).parent / 'equipment_reservation.db',
        Path(__file__).parent.parent / 'instance' / 'equipment_reservation.db',
    ]

    db_path = None
    for path in possible_paths:
        if path.exists():
            db_path = path
            break

    if not db_path:
        print(f"Database not found. Tried:")
        for path in possible_paths:
            print(f"  - {path}")
        print("\nPlease ensure the database exists before running this migration")
        return False

    print(f"Using database at: {db_path}")

    try:
        conn = sqlite3.connect(str(db_path))
        cursor = conn.cursor()

        # Check if columns already exist
        cursor.execute("PRAGMA table_info(users)")
        columns = [col[1] for col in cursor.fetchall()]

        changes_made = False

        # Add two_factor_enabled column if it doesn't exist
        if 'two_factor_enabled' not in columns:
            cursor.execute("""
                ALTER TABLE users
                ADD COLUMN two_factor_enabled BOOLEAN DEFAULT 0
            """)
            print("✓ Added 'two_factor_enabled' column to users table")
            changes_made = True
        else:
            print("⚠ Column 'two_factor_enabled' already exists in users table")

        # Add verification_code column if it doesn't exist
        if 'verification_code' not in columns:
            cursor.execute("""
                ALTER TABLE users
                ADD COLUMN verification_code VARCHAR(10)
            """)
            print("✓ Added 'verification_code' column to users table")
            changes_made = True
        else:
            print("⚠ Column 'verification_code' already exists in users table")

        # Add verification_code_expiry column if it doesn't exist
        if 'verification_code_expiry' not in columns:
            cursor.execute("""
                ALTER TABLE users
                ADD COLUMN verification_code_expiry DATETIME
            """)
            print("✓ Added 'verification_code_expiry' column to users table")
            changes_made = True
        else:
            print("⚠ Column 'verification_code_expiry' already exists in users table")

        # Add verification_attempts column if it doesn't exist (for rate limiting)
        if 'verification_attempts' not in columns:
            cursor.execute("""
                ALTER TABLE users
                ADD COLUMN verification_attempts INTEGER DEFAULT 0
            """)
            print("✓ Added 'verification_attempts' column to users table")
            changes_made = True
        else:
            print("⚠ Column 'verification_attempts' already exists in users table")

        # Add verification_locked_until column if it doesn't exist
        if 'verification_locked_until' not in columns:
            cursor.execute("""
                ALTER TABLE users
                ADD COLUMN verification_locked_until DATETIME
            """)
            print("✓ Added 'verification_locked_until' column to users table")
            changes_made = True
        else:
            print("⚠ Column 'verification_locked_until' already exists in users table")

        if changes_made:
            conn.commit()
            print("\n✓ Migration completed successfully!")
            print("Two-factor authentication fields have been added to the users table.")
        else:
            print("\n✓ No changes needed - all 2FA columns already exist")

        conn.close()
        return True

    except sqlite3.OperationalError as e:
        print(f"✗ Error running migration: {e}")
        return False
    except Exception as e:
        print(f"✗ Unexpected error: {e}")
        return False


if __name__ == '__main__':
    print("=" * 60)
    print("Two-Factor Authentication Migration Script")
    print("=" * 60)
    print()
    success = migrate_add_2fa_fields()
    print()
    if success:
        print("You can now enable 2FA in the system settings.")
    exit(0 if success else 1)
