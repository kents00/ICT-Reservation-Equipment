"""
Create Neon database schema using direct SQL
Avoids timeout issues with SQLAlchemy
"""
import os
from dotenv import load_dotenv
import psycopg2
from psycopg2 import sql

load_dotenv()

db_url = os.getenv('DATABASE_URL')

print("\n" + "="*60)
print("CREATING NEON DATABASE SCHEMA")
print("="*60)

try:
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()
    print("✓ Connected to Neon database")

    # Create tables using raw SQL
    print("\nCreating tables...")

    # 1. User table
    cur.execute("""
        CREATE TABLE IF NOT EXISTS "user" (
            id VARCHAR(36) PRIMARY KEY,
            username VARCHAR(120) UNIQUE NOT NULL,
            email VARCHAR(120) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            first_name VARCHAR(50),
            middle_name VARCHAR(50),
            last_name VARCHAR(50),
            student_id VARCHAR(20),
            phone VARCHAR(20),
            department VARCHAR(100),
            role VARCHAR(20) DEFAULT 'STUDENT',
            is_active BOOLEAN DEFAULT TRUE,
            email_verified BOOLEAN DEFAULT FALSE,
            two_factor_enabled BOOLEAN DEFAULT FALSE,
            two_factor_secret VARCHAR(32),
            failed_login_attempts INTEGER DEFAULT 0,
            locked_until TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    print("  ✓ user table")

    # 2. SystemSettings table
    cur.execute("""
        CREATE TABLE IF NOT EXISTS system_settings (
            id VARCHAR(36) PRIMARY KEY,
            system_name VARCHAR(255),
            description TEXT,
            max_reservation_duration INTEGER DEFAULT 30,
            max_advance_booking INTEGER DEFAULT 90,
            require_approval BOOLEAN DEFAULT TRUE,
            email_notifications BOOLEAN DEFAULT FALSE,
            sms_notifications BOOLEAN DEFAULT FALSE,
            session_timeout INTEGER DEFAULT 30,
            two_factor_auth BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    print("  ✓ system_settings table")

    # 3. Equipment table
    cur.execute("""
        CREATE TABLE IF NOT EXISTS equipment (
            id VARCHAR(36) PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            category VARCHAR(100),
            quantity INTEGER NOT NULL,
            quantity_available INTEGER NOT NULL,
            location VARCHAR(255),
            serial_number VARCHAR(100) UNIQUE,
            status VARCHAR(20) DEFAULT 'AVAILABLE',
            qr_code VARCHAR(100),
            image_path VARCHAR(255),
            created_by VARCHAR(36),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (created_by) REFERENCES "user"(id)
        )
    """)
    print("  ✓ equipment table")

    # 4. Reservation table
    cur.execute("""
        CREATE TABLE IF NOT EXISTS reservation (
            id VARCHAR(36) PRIMARY KEY,
            user_id VARCHAR(36) NOT NULL,
            equipment_id VARCHAR(36) NOT NULL,
            start_date DATE NOT NULL,
            end_date DATE NOT NULL,
            status VARCHAR(20) DEFAULT 'PENDING',
            reason TEXT,
            quantity_requested INTEGER DEFAULT 1,
            approved_by VARCHAR(36),
            approved_at TIMESTAMP,
            rejected_by VARCHAR(36),
            rejection_reason TEXT,
            rejected_at TIMESTAMP,
            checked_out_at TIMESTAMP,
            returned_at TIMESTAMP,
            return_verified_by VARCHAR(36),
            return_verified_at TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES "user"(id),
            FOREIGN KEY (equipment_id) REFERENCES equipment(id),
            FOREIGN KEY (approved_by) REFERENCES "user"(id),
            FOREIGN KEY (rejected_by) REFERENCES "user"(id),
            FOREIGN KEY (return_verified_by) REFERENCES "user"(id)
        )
    """)
    print("  ✓ reservation table")

    # 5. Notification table
    cur.execute("""
        CREATE TABLE IF NOT EXISTS notification (
            id VARCHAR(36) PRIMARY KEY,
            user_id VARCHAR(36) NOT NULL,
            reservation_id VARCHAR(36),
            type VARCHAR(50) NOT NULL,
            title VARCHAR(255),
            message TEXT,
            is_read BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES "user"(id),
            FOREIGN KEY (reservation_id) REFERENCES reservation(id)
        )
    """)
    print("  ✓ notification table")

    # 6. AuditLog table
    cur.execute("""
        CREATE TABLE IF NOT EXISTS audit_log (
            id VARCHAR(36) PRIMARY KEY,
            user_id VARCHAR(36),
            action VARCHAR(100) NOT NULL,
            resource_type VARCHAR(50),
            resource_id VARCHAR(36),
            details TEXT,
            ip_address VARCHAR(50),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES "user"(id)
        )
    """)
    print("  ✓ audit_log table")

    conn.commit()
    cur.close()
    conn.close()

    print("\n✓ Database schema created successfully!")
    print("="*60 + "\n")

except Exception as e:
    print(f"\n✗ Error: {e}")
    import traceback
    traceback.print_exc()
