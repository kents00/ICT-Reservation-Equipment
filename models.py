"""
Database Models for Equipment Reservation System
"""
from extensions import db
from datetime import datetime, timedelta
from enum import Enum
import uuid
import secrets
from werkzeug.security import generate_password_hash, check_password_hash


class UserRole(str, Enum):
    ADMIN = "admin"
    STUDENT = "student"


class EquipmentStatus(str, Enum):
    AVAILABLE = "available"
    RESERVED = "reserved"
    CHECKED_OUT = "checked_out"
    MAINTENANCE = "maintenance"


class ReservationStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    CHECKED_OUT = "checked_out"
    # Student requested return, awaiting admin verification
    RETURN_PENDING = "return_pending"
    RETURNED = "returned"
    CANCELLED = "cancelled"


class User(db.Model):
    """User model for both Admin and Student"""
    __tablename__ = 'user'

    id = db.Column(db.String(36), primary_key=True,
                   default=lambda: str(uuid.uuid4()))
    username = db.Column(db.String(120), unique=True,
                         nullable=False, index=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), default=UserRole.STUDENT, nullable=False)
    first_name = db.Column(db.String(60), nullable=False)
    middle_name = db.Column(db.String(60))
    last_name = db.Column(db.String(60), nullable=False)
    student_id = db.Column(db.String(50), unique=True,
                           nullable=True, index=True)
    phone = db.Column(db.String(20))
    # Valid courses: Bachelor of Science in Marine Biology, Bachelor of Science in Information Technology,
    # Bachelor of Technology and Livelihood Education in Industrial Arts,
    # Bachelor of Technology and Livelihood Education in Home Economics
    # Increased length for longer course names
    department = db.Column(db.String(150))
    # User profile image path
    image_url = db.Column(db.String(500), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_active = db.Column(db.Boolean, default=True)

    # Two-Factor Authentication fields
    two_factor_enabled = db.Column(db.Boolean, default=False)
    verification_code = db.Column(db.String(10))
    verification_code_expiry = db.Column(db.DateTime)
    verification_attempts = db.Column(db.Integer, default=0)
    verification_locked_until = db.Column(db.DateTime)

    # Relationships
    reservations = db.relationship(
        'Reservation', back_populates='user', cascade='all, delete-orphan')
    created_equipment = db.relationship(
        'Equipment', back_populates='created_by_user')

    def set_password(self, password):
        """Set the user's password"""
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        """Check if the provided password is correct"""
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        """Convert user to dictionary representation"""
        result = {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'role': self.role,
            'first_name': self.first_name,
            'middle_name': self.middle_name,
            'last_name': self.last_name,
            'phone': self.phone,
            'department': self.department,
            'image_url': self.image_url,
            'status': 'active' if self.is_active else 'inactive',
            'created_at': self.created_at.isoformat(),
            'is_active': self.is_active,
            'two_factor_enabled': self.two_factor_enabled
        }
        # Include student_id if user is a student
        if self.role == UserRole.STUDENT:
            result['student_id'] = self.student_id
        return result


class Equipment(db.Model):
    """Equipment model"""
    __tablename__ = 'equipment'

    id = db.Column(db.String(36), primary_key=True,
                   default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String(120), nullable=False, index=True)
    description = db.Column(db.Text)
    category = db.Column(db.String(50), nullable=False, index=True)
    quantity = db.Column(db.Integer, default=1, nullable=False)
    quantity_available = db.Column(db.Integer, default=1, nullable=False)
    serial_number = db.Column(db.String(120), unique=True, nullable=True)
    location = db.Column(db.String(120))
    status = db.Column(db.String(20), default=EquipmentStatus.AVAILABLE)
    qr_code = db.Column(db.String(255), unique=True,
                        nullable=False)  # Unique QR code identifier
    # Equipment image path
    image_url = db.Column(db.String(500), nullable=True)
    created_by = db.Column(
        db.String(36), db.ForeignKey('user.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_maintenance = db.Column(db.DateTime)
    maintenance_interval_days = db.Column(db.Integer, default=90)

    # Relationships
    created_by_user = db.relationship(
        'User', back_populates='created_equipment')
    reservations = db.relationship(
        'Reservation', back_populates='equipment', cascade='all, delete-orphan')
    qr_scans = db.relationship(
        'QRCodeScan', back_populates='equipment', cascade='all, delete-orphan')

    def to_dict(self, include_creator=False):
        data = {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'category': self.category,
            'serial_number': self.serial_number,
            'quantity': self.quantity,
            'quantity_available': self.quantity_available,
            'location': self.location,
            'status': self.status,
            'qr_code': self.qr_code,
            'image_url': self.image_url,
            'maintenance_interval_days': self.maintenance_interval_days,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'last_maintenance': self.last_maintenance.isoformat() if self.last_maintenance else None,
        }
        if include_creator:
            data['created_by'] = self.created_by_user.to_dict()
        return data


class Reservation(db.Model):
    """Reservation model"""
    __tablename__ = 'reservation'

    id = db.Column(db.String(36), primary_key=True,
                   default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey(
        'user.id'), nullable=False, index=True)
    equipment_id = db.Column(db.String(36), db.ForeignKey(
        'equipment.id'), nullable=False, index=True)
    status = db.Column(
        db.String(20), default=ReservationStatus.PENDING, nullable=False, index=True)
    quantity_requested = db.Column(db.Integer, default=1, nullable=False)
    reason = db.Column(db.Text)
    reserved_at = db.Column(db.DateTime, default=datetime.utcnow)
    start_date = db.Column(db.DateTime, nullable=False)
    end_date = db.Column(db.DateTime, nullable=False)
    checked_out_at = db.Column(db.DateTime)
    returned_at = db.Column(db.DateTime)
    approved_at = db.Column(db.DateTime)
    rejected_at = db.Column(db.DateTime)
    rejection_reason = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    # Date when unclaimed reservation will auto-cancel
    auto_cancel_date = db.Column(db.DateTime)

    # Relationships
    user = db.relationship('User', back_populates='reservations')
    equipment = db.relationship('Equipment', back_populates='reservations')
    qr_scans = db.relationship(
        'QRCodeScan', back_populates='reservation', cascade='all, delete-orphan')
    notifications = db.relationship(
        'Notification', back_populates='reservation', cascade='all, delete-orphan')

    def to_dict(self, include_user=False, include_equipment=False):
        data = {
            'id': self.id,
            'user_id': self.user_id,
            'equipment_id': self.equipment_id,
            'status': self.status,
            'quantity_requested': self.quantity_requested,
            'reason': self.reason,
            'reserved_at': self.reserved_at.isoformat(),
            'start_date': self.start_date.isoformat(),
            'end_date': self.end_date.isoformat(),
            'checked_out_at': self.checked_out_at.isoformat() if self.checked_out_at else None,
            'returned_at': self.returned_at.isoformat() if self.returned_at else None,
            'approved_at': self.approved_at.isoformat() if self.approved_at else None,
            'rejected_at': self.rejected_at.isoformat() if self.rejected_at else None,
            'rejection_reason': self.rejection_reason,
            'created_at': self.created_at.isoformat(),
        }
        if include_user:
            data['user'] = self.user.to_dict()
        if include_equipment:
            data['equipment'] = self.equipment.to_dict()
        return data


class QRCodeScan(db.Model):
    """QR Code scan records for check-in/check-out"""
    __tablename__ = 'qr_scans'

    id = db.Column(db.String(36), primary_key=True,
                   default=lambda: str(uuid.uuid4()))
    equipment_id = db.Column(db.String(36), db.ForeignKey(
        'equipment.id'), nullable=False, index=True)
    reservation_id = db.Column(db.String(36), db.ForeignKey(
        'reservation.id'), nullable=True, index=True)
    # 'check_in' or 'check_out'
    scan_type = db.Column(db.String(20), nullable=False)
    scanned_at = db.Column(db.DateTime, default=datetime.utcnow)
    scanned_by = db.Column(
        db.String(36), db.ForeignKey('user.id'), nullable=True)
    latitude = db.Column(db.Float)
    longitude = db.Column(db.Float)
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    equipment = db.relationship('Equipment', back_populates='qr_scans')
    reservation = db.relationship('Reservation', back_populates='qr_scans')

    def to_dict(self):
        return {
            'id': self.id,
            'equipment_id': self.equipment_id,
            'reservation_id': self.reservation_id,
            'scan_type': self.scan_type,
            'scanned_at': self.scanned_at.isoformat(),
            'latitude': self.latitude,
            'longitude': self.longitude,
            'notes': self.notes,
        }


class Notification(db.Model):
    """Notifications for users"""
    __tablename__ = 'notification'

    id = db.Column(db.String(36), primary_key=True,
                   default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey(
        'user.id'), nullable=False, index=True)
    reservation_id = db.Column(db.String(36), db.ForeignKey(
        'reservation.id'), nullable=True)
    title = db.Column(db.String(200), nullable=False)
    message = db.Column(db.Text, nullable=False)
    # 'approval', 'rejection', 'cancellation', 'expiry'
    notification_type = db.Column(db.String(50), nullable=False)
    is_read = db.Column(db.Boolean, default=False)
    is_dismissed = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    reservation = db.relationship(
        'Reservation', back_populates='notifications')

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'reservation_id': self.reservation_id,
            'title': self.title,
            'message': self.message,
            'notification_type': self.notification_type,
            'is_read': self.is_read,
            'is_dismissed': self.is_dismissed,
            'created_at': self.created_at.isoformat(),
        }


class SystemSettings(db.Model):
    """System-wide settings (singleton pattern - only one record)"""
    __tablename__ = 'system_settings'

    id = db.Column(db.String(36), primary_key=True,
                   default=lambda: str(uuid.uuid4()))

    # General Settings
    system_name = db.Column(
        db.String(200), default='Equipment Reservation System', nullable=False)
    description = db.Column(db.Text)

    # Reservation Settings
    max_reservation_duration = db.Column(
        db.Integer, default=30, nullable=False)  # days
    max_advance_booking = db.Column(
        db.Integer, default=90, nullable=False)  # days
    require_approval = db.Column(db.Boolean, default=True, nullable=False)

    # Notification Settings
    email_notifications = db.Column(db.Boolean, default=False, nullable=False)
    sms_notifications = db.Column(db.Boolean, default=False, nullable=False)

    # Security Settings
    session_timeout = db.Column(
        db.Integer, default=30, nullable=False)  # minutes
    two_factor_auth = db.Column(db.Boolean, default=False, nullable=False)

    # Metadata
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'system_name': self.system_name,
            'description': self.description,
            'max_reservation_duration': self.max_reservation_duration,
            'max_advance_booking': self.max_advance_booking,
            'require_approval': self.require_approval,
            'email_notifications': self.email_notifications,
            'sms_notifications': self.sms_notifications,
            'session_timeout': self.session_timeout,
            'two_factor_auth': self.two_factor_auth,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }


class UsageReport(db.Model):
    """Usage statistics and reports"""
    __tablename__ = 'usage_reports'

    id = db.Column(db.String(36), primary_key=True,
                   default=lambda: str(uuid.uuid4()))
    equipment_id = db.Column(db.String(36), db.ForeignKey(
        'equipment.id'), nullable=False, index=True)
    date = db.Column(db.Date, nullable=False, index=True)
    total_reservations = db.Column(db.Integer, default=0)
    completed_reservations = db.Column(db.Integer, default=0)
    cancelled_reservations = db.Column(db.Integer, default=0)
    peak_hour = db.Column(db.Integer)  # 0-23 representing hour of day
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'equipment_id': self.equipment_id,
            'date': self.date.isoformat(),
            'total_reservations': self.total_reservations,
            'completed_reservations': self.completed_reservations,
            'cancelled_reservations': self.cancelled_reservations,
            'peak_hour': self.peak_hour,
        }
