"""
Drop all tables and recreate them with correct schema matching models.py
"""
from app import app, db

print("\n" + "="*60)
print("RECREATING DATABASE SCHEMA")
print("="*60)

with app.app_context():
    try:
        print("\nDropping all existing tables...")
        db.drop_all()
        print("✓ All tables dropped")

        print("\nCreating tables from models...")
        db.create_all()
        print("✓ All tables created successfully!")

        # List created tables
        from sqlalchemy import inspect
        inspector = inspect(db.engine)
        tables = inspector.get_table_names()

        print(f"\nCreated {len(tables)} tables:")
        for table in sorted(tables):
            print(f"  • {table}")

        print("\n" + "="*60)
        print("✓ SCHEMA RECREATION COMPLETE!")
        print("="*60 + "\n")

    except Exception as e:
        print(f"\n✗ Error: {e}")
        import traceback
        traceback.print_exc()
