"""
Seed Neon database with demo users and equipment
Optimized for Neon PostgreSQL connection
"""
from app import create_app, db
from models import User, Equipment, UserRole, EquipmentStatus, SystemSettings, Reservation, ReservationStatus
from werkzeug.security import generate_password_hash
import uuid
import datetime


def seed_database():
    """Seed the database with demo data"""
    app = create_app('development')

    with app.app_context():
        try:
            print("Connecting to Neon database...")

            # Skip drop_all for Neon - just create tables if they don't exist
            print("Creating database tables (if they don't exist)...")
            db.create_all()
            print("✓ Database schema ready")

            # Initialize default system settings
            settings = SystemSettings.query.first()
            if not settings:
                print("\nCreating default system settings...")
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
                print("✓ Default system settings created")
            else:
                print("✓ System settings already exist")

            # Create demo student user
            student = User.query.filter_by(username='student1').first()
            if not student:
                print("\nCreating demo student user...")
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
                db.session.commit()
                print("✓ Demo student created: username=student1, password=password123")
            else:
                print("✓ Demo student already exists")

            # Create demo admin user
            admin = User.query.filter_by(username='admin1').first()
            if not admin:
                print("Creating demo admin user...")
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
                db.session.commit()
                print("✓ Demo admin created: username=admin1, password=password123")
            else:
                print("✓ Demo admin already exists")

            # Create demo equipment
            equipment_count = Equipment.query.count()
            if equipment_count == 0:
                print("\nCreating demo equipment...")

                equipment_list = [
                    {
                        'name': 'Laptop',
                        'description': 'Dell XPS 13 Laptop',
                        'category': 'Electronics',
                        'quantity': 5,
                        'location': 'Lab A',
                        'serial_number': 'SN-LAPTOP-001',
                    },
                    {
                        'name': 'Projector',
                        'description': '4K Projector',
                        'category': 'Electronics',
                        'quantity': 3,
                        'location': 'Lab B',
                        'serial_number': 'SN-PROJ-001',
                    },
                    {
                        'name': 'Camera',
                        'description': 'Canon EOS R5',
                        'category': 'Photography',
                        'quantity': 2,
                        'location': 'Photo Studio',
                        'serial_number': 'SN-CAM-001',
                    },
                    {
                        'name': 'Microscope',
                        'description': 'Compound Microscope',
                        'category': 'Lab Equipment',
                        'quantity': 4,
                        'location': 'Science Lab',
                        'serial_number': 'SN-MICRO-001',
                    }
                ]

                creator_id = admin.id if admin else student.id

                for eq in equipment_list:
                    equipment = Equipment(
                        id=str(uuid.uuid4()),
                        name=eq['name'],
                        description=eq['description'],
                        category=eq['category'],
                        quantity=eq['quantity'],
                        quantity_available=eq['quantity'],
                        location=eq['location'],
                        serial_number=eq['serial_number'],
                        status=EquipmentStatus.AVAILABLE,
                        qr_code=f"QR-{str(uuid.uuid4())[:8]}",
                        created_by=creator_id
                    )
                    db.session.add(equipment)
                    print(f"  ✓ {eq['name']} (Serial: {eq['serial_number']})")

                db.session.commit()
                print("✓ Equipment created successfully")
            else:
                print(
                    f"\n✓ Equipment already exists ({equipment_count} items)")

            # Create mock reservations
            reservation_count = Reservation.query.count()
            if reservation_count == 0:
                print("\nCreating mock reservations...")
                equipment_list = Equipment.query.all()
                if equipment_list and student:
                    today = datetime.datetime.now()

                    # Pending reservation
                    res_pending = Reservation(
                        id=str(uuid.uuid4()),
                        user_id=student.id,
                        equipment_id=equipment_list[0].id,
                        start_date=today.date(),
                        end_date=(today + datetime.timedelta(days=3)).date(),
                        status=ReservationStatus.PENDING,
                        reason="Need for class project",
                        quantity_requested=1,
                        created_at=today,
                        updated_at=today
                    )
                    db.session.add(res_pending)
                    print(
                        f"  ✓ PENDING reservation for {equipment_list[0].name}")

                    # Approved reservation
                    res_approved = Reservation(
                        id=str(uuid.uuid4()),
                        user_id=student.id,
                        equipment_id=equipment_list[1].id,
                        start_date=(today + datetime.timedelta(days=1)).date(),
                        end_date=(today + datetime.timedelta(days=4)).date(),
                        status=ReservationStatus.APPROVED,
                        reason="Presentation in Lab B",
                        quantity_requested=1,
                        approved_at=today,
                        created_at=today,
                        updated_at=today
                    )
                    db.session.add(res_approved)
                    print(
                        f"  ✓ APPROVED reservation for {equipment_list[1].name}")

                    db.session.commit()
                    print("✓ Mock reservations created successfully")
            else:
                print(
                    f"\n✓ Reservations already exist ({reservation_count} items)")

            print("\n" + "="*60)
            print("✓ DATABASE SEEDING COMPLETED SUCCESSFULLY!")
            print("="*60)
            print("\nTest Credentials:")
            print("  Student: username=student1, password=password123")
            print("  Admin:   username=admin1, password=password123")
            print("="*60)

        except Exception as e:
            print(f"\n✗ Error during seeding: {str(e)}")
            print("Attempting to rollback...")
            db.session.rollback()
            raise


if __name__ == '__main__':
    seed_database()
