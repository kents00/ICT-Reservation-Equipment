"""
Pytest configuration and fixtures for testing
"""
from werkzeug.security import generate_password_hash
from models import (User, Equipment, Reservation, UserRole, EquipmentStatus,
                    ReservationStatus)
from app import create_app, db
import pytest
import sys
import os
from datetime import datetime, timedelta, timezone

# Add backend directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


@pytest.fixture
def app():
    """Create application for testing"""
    app = create_app('testing')

    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()


@pytest.fixture
def client(app):
    """Test client"""
    return app.test_client()


@pytest.fixture
def runner(app):
    """CLI runner for testing"""
    return app.test_cli_runner()


class _AdminUser:
    """Wrapper for admin user that queries fresh within app context"""

    def __init__(self, app):
        self.app = app
        with app.app_context():
            admin = User.query.filter_by(username='admin1').first()
            if not admin:
                admin = User(
                    username='admin1',
                    email='admin@test.com',
                    password_hash=generate_password_hash('testpass123'),
                    first_name='Admin',
                    last_name='User',
                    role=UserRole.ADMIN,
                    is_active=True
                )
                db.session.add(admin)
                db.session.commit()

    @property
    def id(self):
        with self.app.app_context():
            return User.query.filter_by(username='admin1').first().id


class _StudentUser:
    """Wrapper for student user that queries fresh within app context"""

    def __init__(self, app):
        self.app = app
        with app.app_context():
            student = User.query.filter_by(username='student1').first()
            if not student:
                student = User(
                    username='student1',
                    email='student@test.com',
                    password_hash=generate_password_hash('testpass123'),
                    first_name='Student',
                    last_name='User',
                    student_id='STU-20250001',
                    role=UserRole.STUDENT,
                    is_active=True
                )
                db.session.add(student)
                db.session.commit()

    @property
    def id(self):
        with self.app.app_context():
            return User.query.filter_by(username='student1').first().id


class _Equipment:
    """Wrapper for equipment that queries fresh within app context"""

    def __init__(self, app):
        self.app = app
        with app.app_context():
            equipment = Equipment.query.filter_by(name='Test Laptop').first()
            if not equipment:
                admin = User.query.filter_by(username='admin1').first()
                if not admin:
                    admin = User(
                        username='admin1',
                        email='admin@test.com',
                        password_hash=generate_password_hash('testpass123'),
                        first_name='Admin',
                        last_name='User',
                        role=UserRole.ADMIN,
                        is_active=True
                    )
                    db.session.add(admin)
                    db.session.commit()

                equipment = Equipment(
                    name='Test Laptop',
                    description='Dell Laptop for testing',
                    category='Electronics',
                    quantity=5,
                    quantity_available=5,
                    serial_number='SN-TEST-001',
                    location='Lab A',
                    qr_code='test-qr-001',
                    created_by=admin.id,
                    status=EquipmentStatus.AVAILABLE
                )
                db.session.add(equipment)
                db.session.commit()

    @property
    def id(self):
        with self.app.app_context():
            return Equipment.query.filter_by(name='Test Laptop').first().id

    @property
    def qr_code(self):
        with self.app.app_context():
            return Equipment.query.filter_by(name='Test Laptop').first().qr_code


class _Reservation:
    """Wrapper for reservation that queries fresh within app context"""

    def __init__(self, app):
        self.app = app
        with app.app_context():
            # Ensure student and equipment exist
            student = User.query.filter_by(username='student1').first()
            if not student:
                student = User(
                    username='student1',
                    email='student@test.com',
                    password_hash=generate_password_hash('testpass123'),
                    first_name='Student',
                    last_name='User',
                    student_id='STU-20250001',
                    role=UserRole.STUDENT,
                    is_active=True
                )
                db.session.add(student)
                db.session.commit()

            equipment = Equipment.query.filter_by(name='Test Laptop').first()
            if not equipment:
                admin = User.query.filter_by(username='admin1').first()
                if not admin:
                    admin = User(
                        username='admin1',
                        email='admin@test.com',
                        password_hash=generate_password_hash('testpass123'),
                        full_name='Admin User',
                        role=UserRole.ADMIN,
                        is_active=True
                    )
                    db.session.add(admin)
                    db.session.commit()

                equipment = Equipment(
                    name='Test Laptop',
                    description='Dell Laptop for testing',
                    category='Electronics',
                    quantity=5,
                    quantity_available=5,
                    serial_number='SN-TEST-001',
                    location='Lab A',
                    qr_code='test-qr-001',
                    created_by=admin.id,
                    status=EquipmentStatus.AVAILABLE
                )
                db.session.add(equipment)
                db.session.commit()

            start = datetime.now(timezone.utc) + timedelta(days=1)
            end = start + timedelta(days=3)

            reservation = Reservation.query.filter_by(
                user_id=student.id, equipment_id=equipment.id).first()
            if not reservation:
                reservation = Reservation(
                    user_id=student.id,
                    equipment_id=equipment.id,
                    status=ReservationStatus.PENDING,
                    quantity_requested=1,
                    reason='Test reservation',
                    start_date=start,
                    end_date=end,
                    auto_cancel_date=datetime.now(
                        timezone.utc) + timedelta(days=3)
                )
                db.session.add(reservation)
                db.session.commit()

    @property
    def id(self):
        with self.app.app_context():
            student = User.query.filter_by(username='student1').first()
            equipment = Equipment.query.filter_by(name='Test Laptop').first()
            if student and equipment:
                return Reservation.query.filter_by(user_id=student.id, equipment_id=equipment.id).first().id


@pytest.fixture
def admin_user(app):
    """Create test admin user"""
    return _AdminUser(app)


@pytest.fixture
def student_user(app):
    """Create test student user"""
    return _StudentUser(app)


@pytest.fixture
def admin_token(app):
    """Get JWT token for admin user"""
    with app.app_context():
        from flask_jwt_extended import create_access_token
        admin = User.query.filter_by(username='admin1').first()
        if not admin:
            admin = User(
                username='admin1',
                email='admin@test.com',
                password_hash=generate_password_hash('testpass123'),
                first_name='Admin',
                last_name='User',
                role=UserRole.ADMIN,
                is_active=True
            )
            db.session.add(admin)
            db.session.commit()
        return create_access_token(identity=admin.id)


@pytest.fixture
def student_token(app):
    """Get JWT token for student user"""
    with app.app_context():
        from flask_jwt_extended import create_access_token
        student = User.query.filter_by(username='student1').first()
        if not student:
            student = User(
                username='student1',
                email='student@test.com',
                password_hash=generate_password_hash('testpass123'),
                first_name='Student',
                last_name='User',
                student_id='STU-20250001',
                role=UserRole.STUDENT,
                is_active=True
            )
            db.session.add(student)
            db.session.commit()
        return create_access_token(identity=student.id)


@pytest.fixture
def test_equipment(app):
    """Create test equipment"""
    return _Equipment(app)


@pytest.fixture
def test_reservation(app):
    """Create test reservation"""
    return _Reservation(app)
