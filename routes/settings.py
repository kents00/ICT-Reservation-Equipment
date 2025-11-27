"""
System Settings Management Routes
"""
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from models import User, UserRole, SystemSettings
from datetime import datetime
from werkzeug.utils import secure_filename
import os

settings_bp = Blueprint('settings', __name__)


def check_admin(user_id):
    """Check if user is admin"""
    user = User.query.get(user_id)
    if not user or user.role != UserRole.ADMIN:
        return None
    return user


def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower(
           ) in current_app.config['ALLOWED_EXTENSIONS']


def save_user_image(file):
    """Save uploaded user profile image and return the URL path"""
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        # Add timestamp to make filename unique
        timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
        unique_filename = f"{timestamp}_{filename}"

        # Ensure upload directory exists
        upload_folder = os.path.join(
            current_app.root_path, 'static', 'uploads', 'users')
        os.makedirs(upload_folder, exist_ok=True)

        # Save file
        filepath = os.path.join(upload_folder, unique_filename)
        file.save(filepath)

        # Return relative URL path
        return f"/static/uploads/users/{unique_filename}"
    return None


def delete_user_image(image_url):
    """Delete user profile image file from filesystem"""
    if image_url and image_url.startswith('/static/uploads/users/'):
        try:
            filename = image_url.split('/')[-1]
            filepath = os.path.join(
                current_app.root_path, 'static', 'uploads', 'users', filename)
            if os.path.exists(filepath):
                os.remove(filepath)
        except Exception as e:
            print(f"Error deleting user image: {e}")


def get_or_create_settings():
    """Get existing settings or create default settings"""
    settings = SystemSettings.query.first()
    if not settings:
        settings = SystemSettings(
            system_name='Equipment Reservation System',
            description='',
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
    return settings


@settings_bp.route('/', methods=['GET'])
@jwt_required()
def get_settings():
    """Get system settings (Admin only)"""
    user_id = get_jwt_identity()

    if not check_admin(user_id):
        return jsonify({'error': 'Admin access required'}), 403

    try:
        settings = get_or_create_settings()
        return jsonify(settings.to_dict()), 200
    except Exception as e:
        return jsonify({'error': f'Failed to fetch settings: {str(e)}'}), 500


@settings_bp.route('/', methods=['PUT'])
@jwt_required()
def update_settings():
    """Update system settings (Admin only)"""
    user_id = get_jwt_identity()

    if not check_admin(user_id):
        return jsonify({'error': 'Admin access required'}), 403

    data = request.get_json()

    try:
        settings = get_or_create_settings()

        # Update general settings
        if 'system_name' in data:
            settings.system_name = data['system_name']
        if 'description' in data:
            settings.description = data['description']

        # Update reservation settings
        if 'max_reservation_duration' in data:
            max_duration = int(data['max_reservation_duration'])
            if max_duration < 1 or max_duration > 365:
                return jsonify({'error': 'Maximum reservation duration must be between 1 and 365 days'}), 400
            settings.max_reservation_duration = max_duration

        if 'max_advance_booking' in data:
            max_advance = int(data['max_advance_booking'])
            if max_advance < 1 or max_advance > 365:
                return jsonify({'error': 'Maximum advance booking must be between 1 and 365 days'}), 400
            settings.max_advance_booking = max_advance

        if 'require_approval' in data:
            settings.require_approval = bool(data['require_approval'])

        # Update notification settings
        if 'email_notifications' in data:
            settings.email_notifications = bool(data['email_notifications'])
        if 'sms_notifications' in data:
            settings.sms_notifications = bool(data['sms_notifications'])

        # Update security settings
        if 'session_timeout' in data:
            timeout = int(data['session_timeout'])
            if timeout < 5 or timeout > 1440:  # 5 minutes to 24 hours
                return jsonify({'error': 'Session timeout must be between 5 and 1440 minutes'}), 400
            settings.session_timeout = timeout

        if 'two_factor_auth' in data:
            settings.two_factor_auth = bool(data['two_factor_auth'])

        settings.updated_at = datetime.utcnow()
        db.session.commit()

        return jsonify({
            'message': 'Settings updated successfully',
            'settings': settings.to_dict()
        }), 200

    except ValueError as e:
        return jsonify({'error': f'Invalid data type: {str(e)}'}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to update settings: {str(e)}'}), 500


@settings_bp.route('/admin-profile', methods=['GET'])
@jwt_required()
def get_admin_profile():
    """Get current admin profile (Admin only)"""
    user_id = get_jwt_identity()

    admin = check_admin(user_id)
    if not admin:
        return jsonify({'error': 'Admin access required'}), 403

    try:
        return jsonify(admin.to_dict()), 200
    except Exception as e:
        return jsonify({'error': f'Failed to fetch admin profile: {str(e)}'}), 500


@settings_bp.route('/admin-profile', methods=['PUT'])
@jwt_required()
def update_admin_profile():
    """Update current admin profile (Admin only)"""
    user_id = get_jwt_identity()

    admin = check_admin(user_id)
    if not admin:
        return jsonify({'error': 'Admin access required'}), 403

    try:
        # Check for profile image upload
        profile_image = request.files.get('profile_image')
        if profile_image:
            # Delete old image if exists
            if admin.image_url:
                delete_user_image(admin.image_url)
            # Save new image
            admin.image_url = save_user_image(profile_image)

        # Get data from form if files present, otherwise from JSON
        if request.files or request.form:
            data = request.form.to_dict()
        else:
            data = request.get_json() or {}
    except Exception as e:
        return jsonify({'error': f'Failed to process request: {str(e)}'}), 400

    try:
        # Update admin fields
        if 'username' in data:
            username = data['username'].strip()
            if not username:
                return jsonify({'error': 'Username cannot be empty'}), 400
            existing_user = User.query.filter_by(username=username).first()
            if existing_user and existing_user.id != admin.id:
                return jsonify({'error': 'Username already taken'}), 400
            admin.username = username

        if 'email' in data:
            email = data['email'].strip()
            if not email:
                return jsonify({'error': 'Email cannot be empty'}), 400
            existing_user = User.query.filter_by(email=email).first()
            if existing_user and existing_user.id != admin.id:
                return jsonify({'error': 'Email already taken'}), 400
            admin.email = email

        if 'first_name' in data:
            admin.first_name = data['first_name'].strip()

        if 'middle_name' in data:
            admin.middle_name = data['middle_name'].strip(
            ) if data['middle_name'] else None

        if 'last_name' in data:
            admin.last_name = data['last_name'].strip()

        if 'phone' in data:
            admin.phone = data['phone'].strip() if data['phone'] else None

        # Handle password update
        if 'password' in data and data['password']:
            password = data['password']
            confirm_password = data.get('confirm_password', '')

            if password != confirm_password:
                return jsonify({'error': 'Passwords do not match'}), 400

            if len(password) < 6:
                return jsonify({'error': 'Password must be at least 6 characters long'}), 400

            admin.set_password(password)

        admin.updated_at = datetime.utcnow()
        db.session.commit()

        return jsonify({
            'message': 'Admin profile updated successfully',
            'admin': admin.to_dict()
        }), 200

    except ValueError as e:
        return jsonify({'error': f'Invalid data: {str(e)}'}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to update admin profile: {str(e)}'}), 500
