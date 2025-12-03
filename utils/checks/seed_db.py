"""
Seed database with demo users and equipment for testing
"""
from app import create_app, db
from models import User, Equipment, UserRole, EquipmentStatus, SystemSettings
from werkzeug.security import generate_password_hash
import uuid


def seed_database():
    """Seed the database with demo data"""
    app = create_app('development')

    with app.app_context():
        # Clear existing data and recreate tables with new schema
        print("Dropping all tables...")
        db.drop_all()
        print("Creating all tables...")
        db.create_all()
        print("✓ Database schema created")

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

        # Check if demo users already exist
        student = User.query.filter_by(username='student1').first()
        admin = User.query.filter_by(username='admin1').first()

        if not student:
            print("Creating demo student user...")
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
            print("✓ Demo student created: username=student1, password=password123")
        else:
            print("✓ Demo student already exists")

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
            print("✓ Demo admin created: username=admin1, password=password123")
        else:
            print("✓ Demo admin already exists")

        db.session.commit()

        # Create some demo equipment
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
                    'created_by': admin.id if admin else student.id
                },
                {
                    'name': 'Projector',
                    'description': '4K Projector',
                    'category': 'Electronics',
                    'quantity': 3,
                    'location': 'Lab B',
                    'serial_number': 'SN-PROJ-001',
                    'created_by': admin.id if admin else student.id
                },
                {
                    'name': 'Camera',
                    'description': 'Canon EOS R5',
                    'category': 'Photography',
                    'quantity': 2,
                    'location': 'Photo Studio',
                    'serial_number': 'SN-CAM-001',
                    'created_by': admin.id if admin else student.id
                },
                {
                    'name': 'Microscope',
                    'description': 'Compound Microscope',
                    'category': 'Lab Equipment',
                    'quantity': 4,
                    'location': 'Science Lab',
                    'serial_number': 'SN-MICRO-001',
                    'created_by': admin.id if admin else student.id
                }
            ]

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
                    created_by=eq['created_by']
                )
                db.session.add(equipment)
                print(
                    f"✓ Created equipment: {eq['name']} (Serial: {eq['serial_number']})")

            db.session.commit()
            print("\n✓ Equipment created successfully")
        else:
            print(f"\n✓ Equipment already exists ({equipment_count} items)")

        # Create mock reservations
        from models import Reservation, ReservationStatus
        reservation_count = Reservation.query.count()
        if reservation_count == 0:
            print("\nCreating mock reservations...")
            import datetime
            equipment_list = Equipment.query.all()
            if equipment_list and student:
                today = datetime.datetime.now()
                # Pending reservation (for approvals)
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
                    f"✓ Created PENDING reservation for {student.username} on {equipment_list[0].name}")

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
                    f"✓ Created APPROVED reservation for {student.username} on {equipment_list[1].name}")

                # Rejected reservation
                res_rejected = Reservation(
                    id=str(uuid.uuid4()),
                    user_id=student.id,
                    equipment_id=equipment_list[2].id,
                    start_date=(today + datetime.timedelta(days=2)).date(),
                    end_date=(today + datetime.timedelta(days=5)).date(),
                    status=ReservationStatus.REJECTED,
                    reason="Photography assignment",
                    quantity_requested=1,
                    rejection_reason="Equipment not available for requested dates",
                    rejected_at=today,
                    created_at=today,
                    updated_at=today
                )
                db.session.add(res_rejected)
                print(
                    f"✓ Created REJECTED reservation for {student.username} on {equipment_list[2].name}")

                # Another pending reservation for variety
                res_pending2 = Reservation(
                    id=str(uuid.uuid4()),
                    user_id=student.id,
                    equipment_id=equipment_list[3].id,
                    start_date=(today + datetime.timedelta(days=3)).date(),
                    end_date=(today + datetime.timedelta(days=6)).date(),
                    status=ReservationStatus.PENDING,
                    reason="Lab experiment",
                    quantity_requested=1,
                    created_at=today,
                    updated_at=today
                )
                db.session.add(res_pending2)
                print(
                    f"✓ Created PENDING reservation for {student.username} on {equipment_list[3].name}")

                # Checked out reservation (for return testing)
                if len(equipment_list) > 0:
                    res_checked_out = Reservation(
                        id=str(uuid.uuid4()),
                        user_id=student.id,
                        equipment_id=equipment_list[0].id,
                        start_date=(today - datetime.timedelta(days=2)).date(),
                        end_date=(today + datetime.timedelta(days=5)).date(),
                        status=ReservationStatus.CHECKED_OUT,
                        reason="Testing return verification",
                        quantity_requested=1,
                        approved_at=today - datetime.timedelta(days=3),
                        checked_out_at=today - datetime.timedelta(days=2),
                        created_at=today - datetime.timedelta(days=3),
                        updated_at=today - datetime.timedelta(days=2)
                    )
                    db.session.add(res_checked_out)
                    # Update equipment availability
                    equipment_list[0].quantity_available -= 1
                    print(
                        f"✓ Created CHECKED_OUT reservation for {student.username} on {equipment_list[0].name}")

                # Return pending reservation (for admin verification testing)
                if len(equipment_list) > 1:
                    res_return_pending = Reservation(
                        id=str(uuid.uuid4()),
                        user_id=student.id,
                        equipment_id=equipment_list[1].id,
                        start_date=(today - datetime.timedelta(days=5)).date(),
                        end_date=(today + datetime.timedelta(days=2)).date(),
                        status=ReservationStatus.RETURN_PENDING,
                        reason="Return verification demo",
                        quantity_requested=1,
                        approved_at=today - datetime.timedelta(days=6),
                        checked_out_at=today - datetime.timedelta(days=5),
                        created_at=today - datetime.timedelta(days=6),
                        updated_at=today
                    )
                    db.session.add(res_return_pending)
                    # Update equipment availability
                    equipment_list[1].quantity_available -= 1
                    print(
                        f"✓ Created RETURN_PENDING reservation for {student.username} on {equipment_list[1].name}")

                # Returned reservation (completed return)
                if len(equipment_list) > 2:
                    res_returned = Reservation(
                        id=str(uuid.uuid4()),
                        user_id=student.id,
                        equipment_id=equipment_list[2].id,
                        start_date=(
                            today - datetime.timedelta(days=10)).date(),
                        end_date=(today - datetime.timedelta(days=3)).date(),
                        status=ReservationStatus.RETURNED,
                        reason="Completed reservation example",
                        quantity_requested=1,
                        approved_at=today - datetime.timedelta(days=11),
                        checked_out_at=today - datetime.timedelta(days=10),
                        returned_at=today - datetime.timedelta(days=3),
                        created_at=today - datetime.timedelta(days=11),
                        updated_at=today - datetime.timedelta(days=3)
                    )
                    db.session.add(res_returned)
                    print(
                        f"✓ Created RETURNED reservation for {student.username} on {equipment_list[2].name}")

            db.session.commit()
            print("✓ Mock reservations created successfully")
        else:
            print(
                f"\n✓ Reservations already exist ({reservation_count} items)")

        print("\n" + "="*50)
        print("Database seeding completed!")
        print("="*50)
        print("\nTest Credentials:")
        print("  Student: username=student1, password=password123")
        print("  Admin:   username=admin1, password=password123")
        print("="*50)


if __name__ == '__main__':
    seed_database()
