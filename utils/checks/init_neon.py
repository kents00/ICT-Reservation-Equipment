"""
Initialize Neon database schema and add demo data
Two-step process: 1) Create schema, 2) Populate data
"""
import os
import sys
from dotenv import load_dotenv

load_dotenv()

print("\n" + "="*60)
print("STEP 1: INITIALIZING DATABASE SCHEMA")
print("="*60)

try:
    from app import create_app, db

    app = create_app('development')
    with app.app_context():
        print("\nCreating database tables...")
        db.create_all()
        print("✓ Database schema created successfully!")

except Exception as e:
    print(f"✗ Error creating schema: {e}")
    sys.exit(1)

print("\n" + "="*60)
print("STEP 2: POPULATING DEMO DATA")
print("="*60)

try:
    from models import User, Equipment, UserRole, EquipmentStatus, SystemSettings, Reservation, ReservationStatus
    from werkzeug.security import generate_password_hash
    import uuid
    import datetime

    app = create_app('development')
    with app.app_context():

        # 1. Create system settings
        print("\n1. Creating system settings...")
        settings = SystemSettings.query.first()
        if not settings:
            settings = SystemSettings(
                id=str(uuid.uuid4()),
                system_name='Equipment Reservation System',
                description='Manage and reserve equipment efficiently',
                max_reservation_duration=30,
                max_advance_booking=90,
                require_approval=True,
                email_notifications=False,
                sms_notifications=False,
                session_timeout=30,
                two_factor_auth=False
            )
            db.session.add(settings)
            db.session.commit()
            print("   ✓ System settings created")
        else:
            print("   ✓ System settings already exist")

        # 2. Create users
        print("\n2. Creating demo users...")

        # Admin user
        admin = User.query.filter_by(username='admin1').first()
        if not admin:
            admin = User(
                id=str(uuid.uuid4()),
                username='admin1',
                email='admin1@university.edu',
                password_hash=generate_password_hash('password123'),
                first_name='Jane',
                middle_name='Marie',
                last_name='Admin',
                phone='098-765-4321',
                department='Bachelor of Science in Information Technology',
                role=UserRole.ADMIN,
                is_active=True
            )
            db.session.add(admin)
            print("   ✓ Admin user created: admin1 / password123")
        else:
            print("   ✓ Admin user already exists")

        # Student user
        student = User.query.filter_by(username='student1').first()
        if not student:
            student = User(
                id=str(uuid.uuid4()),
                username='student1',
                email='student1@university.edu',
                password_hash=generate_password_hash('password123'),
                first_name='John',
                middle_name='Michael',
                last_name='Student',
                student_id='STU-20250001',
                phone='123-456-7890',
                department='Bachelor of Science in Information Technology',
                role=UserRole.STUDENT,
                is_active=True
            )
            db.session.add(student)
            print("   ✓ Student user created: student1 / password123")
        else:
            print("   ✓ Student user already exists")

        db.session.commit()

        # 3. Create equipment
        print("\n3. Creating demo equipment...")
        equipment_count = Equipment.query.count()

        if equipment_count == 0:
            creator_id = admin.id if admin else student.id

            equipment_data = [
                ('Laptop', 'Dell XPS 13 Laptop',
                 'Electronics', 5, 'Lab A', 'SN-LAPTOP-001'),
                ('Projector', '4K Projector',
                 'Electronics', 3, 'Lab B', 'SN-PROJ-001'),
                ('Camera', 'Canon EOS R5', 'Photography',
                 2, 'Photo Studio', 'SN-CAM-001'),
                ('Microscope', 'Compound Microscope',
                 'Lab Equipment', 4, 'Science Lab', 'SN-MICRO-001'),
            ]

            for name, desc, category, qty, location, serial in equipment_data:
                equipment = Equipment(
                    id=str(uuid.uuid4()),
                    name=name,
                    description=desc,
                    category=category,
                    quantity=qty,
                    quantity_available=qty,
                    location=location,
                    serial_number=serial,
                    status=EquipmentStatus.AVAILABLE,
                    qr_code=f"QR-{str(uuid.uuid4())[:8]}",
                    created_by=creator_id
                )
                db.session.add(equipment)
                print(f"   ✓ {name} ({serial})")

            db.session.commit()
        else:
            print(f"   ✓ Equipment already exists ({equipment_count} items)")

        # 4. Create sample reservations
        print("\n4. Creating sample reservations...")
        reservation_count = Reservation.query.count()

        if reservation_count == 0 and equipment_count > 0:
            equipment_list = Equipment.query.all()
            today = datetime.datetime.now()

            reservation_data = [
                (equipment_list[0].id, ReservationStatus.PENDING,
                 'Need for class project', 0),
                (equipment_list[1].id, ReservationStatus.APPROVED,
                 'Presentation in Lab B', 1),
                (equipment_list[2].id, ReservationStatus.CHECKED_OUT,
                 'Testing return verification', -2),
                (equipment_list[3].id, ReservationStatus.RETURN_PENDING,
                 'Return verification demo', -5),
            ]

            for eq_id, status, reason, days_offset in reservation_data:
                start = (today + datetime.timedelta(days=days_offset)).date()
                end = (today + datetime.timedelta(days=days_offset+3)).date()

                res = Reservation(
                    id=str(uuid.uuid4()),
                    user_id=student.id,
                    equipment_id=eq_id,
                    start_date=start,
                    end_date=end,
                    status=status,
                    reason=reason,
                    quantity_requested=1,
                    created_at=today,
                    updated_at=today
                )
                db.session.add(res)
                print(f"   ✓ {status.value} reservation")

            db.session.commit()
        else:
            print(
                f"   ✓ Reservations already exist ({reservation_count} items)")

        print("\n" + "="*60)
        print("✓ DATABASE INITIALIZATION COMPLETE!")
        print("="*60)
        print("\nLogin Credentials:")
        print("  Admin:   username=admin1,   password=password123")
        print("  Student: username=student1, password=password123")
        print("\nDatabase Statistics:")
        print(f"  Users: {User.query.count()}")
        print(f"  Equipment: {Equipment.query.count()}")
        print(f"  Reservations: {Reservation.query.count()}")
        print("="*60 + "\n")

except Exception as e:
    print(f"\n✗ Error during population: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
