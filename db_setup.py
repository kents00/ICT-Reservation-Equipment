#!/usr/bin/env python3
"""
Database Setup Helper Script
Helps with PostgreSQL/Neon database initialization and migration
"""

import os
import sys
import secrets
from dotenv import load_dotenv
from sqlalchemy import text

# Load environment variables
load_dotenv()


def generate_secrets():
    """Generate secure secret keys for production"""
    print("\n" + "="*60)
    print("GENERATING SECURE SECRET KEYS")
    print("="*60)

    secret_key = secrets.token_hex(32)
    jwt_key = secrets.token_hex(32)

    print("\nAdd these to your .env file (production):\n")
    print(f"SECRET_KEY={secret_key}")
    print(f"JWT_SECRET_KEY={jwt_key}")
    print("\n" + "="*60 + "\n")


def test_database_connection():
    """Test database connection"""
    print("\nTesting database connection...")
    print("="*60)

    try:
        import psycopg2

        database_url = os.getenv(
            'DATABASE_URL', 'sqlite:///equipment_reservation.db')
        if not database_url or database_url.startswith('sqlite'):
            print("⚠ Using SQLite (local development)")
            return True

        # Test PostgreSQL connection directly
        print(f"Connecting to: {database_url[:50]}...")
        conn = psycopg2.connect(database_url)
        cur = conn.cursor()
        cur.execute("SELECT 1")
        cur.fetchone()
        cur.close()
        conn.close()
        print("✓ Database connection successful!")
        return True
    except Exception as e:
        print(f"✗ Database connection failed: {str(e)}")
        print("\nChecklist:")
        print("  [ ] DATABASE_URL is set in .env")
        print("  [ ] Database URL format is correct")
        print("  [ ] PostgreSQL/Neon database exists")
        print("  [ ] Network connectivity is good")
        return False


def initialize_database():
    """Initialize database tables"""
    print("\nInitializing database...")
    print("="*60)

    try:
        from app import create_app, db

        app = create_app()

        with app.app_context():
            print("Creating tables...")
            db.create_all()
            print("✓ Database tables created successfully!")

            # List created tables
            result = db.session.execute(
                text("""
                SELECT table_name
                FROM information_schema.tables
                WHERE table_schema = 'public'
                ORDER BY table_name
                """)
            )

            tables = [row[0] for row in result]
            if tables:
                print(f"\nCreated {len(tables)} tables:")
                for table in tables:
                    print(f"  • {table}")
            else:
                print("\nNo tables created. Check your models.")

            return True
    except Exception as e:
        print(f"✗ Database initialization failed: {str(e)}")
        print("\nTroubleshooting:")
        print("  [ ] Ensure DATABASE_URL is set to PostgreSQL")
        print("  [ ] Test connection first with: python db_setup.py test")
        print("  [ ] Check database credentials")
        return False


def check_requirements():
    """Check if required packages are installed"""
    print("\nChecking requirements...")
    print("="*60)

    required = ['psycopg2', 'flask_sqlalchemy', 'sqlalchemy']
    missing = []

    for package in required:
        try:
            __import__(package)
            print(f"✓ {package} installed")
        except ImportError:
            print(f"✗ {package} NOT installed")
            missing.append(package)

    if missing:
        print(f"\nInstall missing packages with:")
        print(f"  pip install {' '.join(missing)}")
        return False

    return True


def display_neon_help():
    """Display help for Neon setup"""
    print("\n" + "="*60)
    print("NEON DATABASE SETUP GUIDE")
    print("="*60)
    print("""
1. Go to https://neon.tech and create an account
2. Create a new project (e.g., "Equipment-Reservation")
3. Get your connection string from the dashboard
4. Copy the pooled connection string
5. Add to your .env file:
   DATABASE_URL=postgresql://user:password@host.neon.tech/dbname?sslmode=require

Connection string format:
  postgresql://[user]:[password]@[host]/[database]?sslmode=require

Important: Always use ?sslmode=require with Neon
""")
    print("="*60 + "\n")


def display_render_help():
    """Display help for Render deployment"""
    print("\n" + "="*60)
    print("RENDER DEPLOYMENT GUIDE")
    print("="*60)
    print("""
1. Go to https://render.com and sign up with GitHub
2. Create a new Web Service
3. Connect your GitHub repository
4. Configure:
   - Name: equipment-reservation-api
   - Environment: Python 3
   - Build Command: pip install -r requirements.txt
   - Start Command: gunicorn -w 4 -b 0.0.0.0:$PORT app:app

5. Add Environment Variables:
   - FLASK_ENV=production
   - DATABASE_URL=postgresql://...
   - JWT_SECRET_KEY=...
   - SECRET_KEY=...
   - (other config variables)

6. Deploy and monitor logs

Costs: Free tier has 15-minute inactivity sleep
       Upgrade to Starter ($7/month) for always-on
""")
    print("="*60 + "\n")


def main():
    """Main menu"""
    if len(sys.argv) > 1:
        command = sys.argv[1].lower()

        if command == 'test':
            test_database_connection()
        elif command == 'init':
            if test_database_connection():
                initialize_database()
            else:
                print("\n⚠ Fix connection before initializing!")
        elif command == 'secrets':
            generate_secrets()
        elif command == 'neon':
            display_neon_help()
        elif command == 'render':
            display_render_help()
        elif command == 'check':
            check_requirements()
        else:
            print_help()
    else:
        print_help()


def print_help():
    """Print help message"""
    print("""
Equipment Reservation System - Database Setup Helper

Usage: python db_setup.py [command]

Commands:
  test      Test database connection
  init      Initialize database tables
  secrets   Generate secure SECRET_KEY and JWT_SECRET_KEY
  check     Check if required packages are installed
  neon      Display Neon database setup instructions
  render    Display Render deployment instructions
  help      Show this help message

Examples:
  python db_setup.py check      # Verify dependencies
  python db_setup.py test       # Test database connection
  python db_setup.py init       # Initialize database
  python db_setup.py secrets    # Generate security keys
  python db_setup.py neon       # Get Neon setup help
  python db_setup.py render     # Get Render deployment help

Setup Steps:
  1. python db_setup.py check              # Check dependencies
  2. python db_setup.py neon               # Follow Neon instructions
  3. Update .env with DATABASE_URL
  4. python db_setup.py test               # Test connection
  5. python db_setup.py init               # Initialize database
  6. python db_setup.py render             # Get Render instructions
  7. Deploy to Render using web dashboard
    """)


if __name__ == '__main__':
    main()
