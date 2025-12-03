"""
Authentication Routes
"""
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from extensions import db
from models import User, UserRole, SystemSettings
from datetime import datetime, timedelta
from werkzeug.utils import secure_filename
import os
import secrets
import base64
from utils.two_factor import (
    create_verification_code_for_user,
    validate_verification_code,
    is_user_locked
)
from utils.email_service import send_2fa_verification_email, send_password_reset_email

auth_bp = Blueprint('auth', __name__)


def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower(
           ) in current_app.config['ALLOWED_EXTENSIONS']


def save_user_image(file):
    """Save uploaded user profile image as base64 and return the encoded data"""
    if file and allowed_file(file.filename):
        try:
            # Read file data and encode as base64
            file_data = file.read()
            image_base64 = base64.b64encode(file_data).decode('utf-8')
            return image_base64
        except Exception as e:
            print(f"Error encoding image: {e}")
            return None
    return None


def delete_user_image(image_url):
    """Delete user profile image file from filesystem (legacy - no longer needed with base64)"""
    # This function is kept for backwards compatibility but doesn't do anything
    # since images are now stored as base64 in the database
    pass
    print(f"Error deleting user image: {e}")


@auth_bp.route('/register', methods=['POST'])
def register():
    """Register a new user"""
    data = request.get_json()

    # Validation
    if not data.get('username') or not data.get('email') or not data.get('password'):
        return jsonify({'error': 'Missing required fields'}), 400

    if User.query.filter_by(username=data['username']).first():
        return jsonify({'error': 'Username already exists'}), 409

    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already exists'}), 409

    try:
        user = User(
            username=data['username'],
            email=data['email'],
            full_name=data.get('full_name', data['username']),
            phone=data.get('phone'),
            role=data.get('role', UserRole.STUDENT)
        )
        user.set_password(data['password'])

        db.session.add(user)
        db.session.commit()

        return jsonify({
            'message': 'User created successfully',
            'user': user.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@auth_bp.route('/login', methods=['POST'])
def login():
    """Login user"""
    data = request.get_json()

    if not data.get('username') or not data.get('password'):
        return jsonify({'error': 'Missing username or password'}), 400

    user = User.query.filter_by(username=data['username']).first()

    if not user or not user.check_password(data['password']):
        return jsonify({'error': 'Invalid credentials'}), 401

    if not user.is_active:
        return jsonify({'error': 'User account is inactive'}), 403

    # Check if 2FA is enabled
    # For admins: Check system settings
    # For students: Check individual user preference
    settings = SystemSettings.query.first()
    requires_2fa = False

    if user.role == UserRole.ADMIN:
        # Admin 2FA controlled by system settings
        requires_2fa = settings and settings.two_factor_auth
    elif user.role == UserRole.STUDENT:
        # Student 2FA controlled by individual user preference
        requires_2fa = user.two_factor_enabled

    if requires_2fa:
        # Check if user is locked out
        is_locked, minutes_remaining = is_user_locked(user.id)
        if is_locked:
            return jsonify({
                'error': f'Too many failed attempts. Please try again in {minutes_remaining} minutes.'
            }), 429

        # Generate and send verification code
        code, expiry = create_verification_code_for_user(
            user.id, expiry_minutes=10)

        if code:
            try:
                # Display verification code prominently in console
                print("\n" + "=" * 80)
                print(f"[2FA] User: {user.username} ({user.email})")
                print(f"[2FA] ⚠️  VERIFICATION CODE: {code}")
                print("[2FA] Valid for: 10 minutes")
                print("=" * 80 + "\n")

                send_2fa_verification_email(user, code, expiry_minutes=10)
                print("[2FA] Verification email sent successfully")
                return jsonify({
                    'message': 'Verification code sent to your email',
                    'requires_2fa': True,
                    'user_id': user.id,
                    'email': user.email[:3] + '***@' + user.email.split('@')[1] if '@' in user.email else '***'
                }), 200
            except Exception as e:
                print(f"[2FA] Error sending verification email: {str(e)}")
                import traceback
                traceback.print_exc()
                return jsonify({'error': 'Failed to send verification code. Please try again.'}), 500
        else:
            return jsonify({'error': 'Failed to generate verification code'}), 500

    # Regular login without 2FA
    access_token = create_access_token(identity=user.id)

    return jsonify({
        'message': 'Login successful',
        'access_token': access_token,
        'user': user.to_dict()
    }), 200


@auth_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    """Get current user profile"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if not user:
        return jsonify({'error': 'User not found'}), 404

    return jsonify(user.to_dict()), 200


@auth_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    """Update user profile"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if not user:
        return jsonify({'error': 'User not found'}), 404

    try:
        # Debug logging
        print(f"\n[PROFILE UPDATE] Content-Type: {request.content_type}")
        print(f"[PROFILE UPDATE] Has files: {bool(request.files)}")
        print(f"[PROFILE UPDATE] Has form: {bool(request.form)}")
        print(f"[PROFILE UPDATE] Files keys: {list(request.files.keys())}")
        print(f"[PROFILE UPDATE] Form keys: {list(request.form.keys())}")

        # Check for profile image upload
        profile_image = request.files.get('profile_image')
        if profile_image:
            print(
                f"[PROFILE UPDATE] Found profile image: {profile_image.filename}")
            # Save new image as base64
            image_base64 = save_user_image(profile_image)
            if image_base64:
                user.image_data = base64.b64decode(image_base64)
                # Clear the old file-based URL
                user.image_url = None

        # Get data from form or JSON
        data = request.form.to_dict() if request.files or request.form else request.get_json()

        if not data:
            print("[PROFILE UPDATE] No data provided in request")
            return jsonify({'error': 'No data provided'}), 400

        print(f"[PROFILE UPDATE] Data fields: {list(data.keys())}")
    except Exception as e:
        print(f"[PROFILE UPDATE] Error parsing request: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'Invalid request format'}), 400

    # Update name fields
    if 'first_name' in data:
        user.first_name = data['first_name']
    if 'middle_name' in data:
        user.middle_name = data['middle_name']
    if 'last_name' in data:
        user.last_name = data['last_name']

    # Update contact fields
    if 'phone' in data:
        user.phone = data['phone']
    if 'email' in data:
        if User.query.filter_by(email=data['email']).filter(User.id != user_id).first():
            return jsonify({'error': 'Email already in use'}), 409
        user.email = data['email']

    # Update academic fields (for students)
    if 'student_id' in data:
        # Check if student_id is already in use by another user
        if User.query.filter_by(student_id=data['student_id']).filter(User.id != user_id).first():
            return jsonify({'error': 'Student ID already in use'}), 409
        user.student_id = data['student_id']
    if 'department' in data:
        user.department = data['department']

    # Update two-factor authentication setting (for students only)
    if 'two_factor_enabled' in data and user.role == UserRole.STUDENT:
        two_fa_enabled = data['two_factor_enabled'].lower() in [
            'true', '1', 'yes']
        user.two_factor_enabled = two_fa_enabled
        print(
            f"[PROFILE UPDATE] Updated 2FA setting for {user.username}: {two_fa_enabled}")

    # Update password if provided
    if 'password' in data and data['password']:
        user.set_password(data['password'])

    try:
        user.updated_at = datetime.utcnow()
        db.session.commit()

        return jsonify({
            'message': 'Profile updated successfully',
            'user': user.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        print(f"[PROFILE UPDATE] Database error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'Failed to update profile in database'}), 500


@auth_bp.route('/verify-2fa', methods=['POST'])
def verify_2fa():
    """Verify two-factor authentication code"""
    data = request.get_json()

    if not data.get('user_id') or not data.get('code'):
        return jsonify({'error': 'Missing user_id or verification code'}), 400

    user = User.query.get(data['user_id'])

    if not user:
        return jsonify({'error': 'User not found'}), 404

    # Validate the verification code
    result = validate_verification_code(data['user_id'], data['code'])

    if result['valid']:
        # Generate access token
        access_token = create_access_token(identity=user.id)

        return jsonify({
            'message': 'Verification successful',
            'access_token': access_token,
            'user': user.to_dict()
        }), 200
    else:
        status_code = 429 if result.get('locked') else 401
        return jsonify({
            'error': result['message'],
            'attempts_remaining': result.get('attempts_remaining', 0),
            'locked': result.get('locked', False),
            'expired': result.get('expired', False)
        }), status_code


@auth_bp.route('/resend-2fa', methods=['POST'])
def resend_2fa():
    """Resend two-factor authentication code"""
    data = request.get_json()

    if not data.get('user_id'):
        return jsonify({'error': 'Missing user_id'}), 400

    user = User.query.get(data['user_id'])

    if not user:
        return jsonify({'error': 'User not found'}), 404

    # Check if user is locked out
    is_locked, minutes_remaining = is_user_locked(data['user_id'])
    if is_locked:
        return jsonify({
            'error': f'Too many failed attempts. Please try again in {minutes_remaining} minutes.'
        }), 429

    # Generate and send new verification code
    code, expiry = create_verification_code_for_user(
        data['user_id'], expiry_minutes=10)

    if code:
        try:
            print(
                f"[2FA RESEND] Sending new verification code to user: {user.username} ({user.email})")
            print(f"[2FA RESEND] Verification code: {code}")
            send_2fa_verification_email(user, code, expiry_minutes=10)
            print(f"[2FA RESEND] Verification email sent successfully")
            return jsonify({
                'message': 'Verification code sent successfully',
                'email': user.email[:3] + '***@' + user.email.split('@')[1] if '@' in user.email else '***'
            }), 200
        except Exception as e:
            print(f"[2FA RESEND] Error sending verification email: {str(e)}")
            import traceback
            traceback.print_exc()
            return jsonify({'error': 'Failed to send verification code. Please try again.'}), 500
    else:
        return jsonify({'error': 'Failed to generate verification code'}), 500


@auth_bp.route('/change-password', methods=['POST'])
@jwt_required()
def change_password():
    """Change user password"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if not user:
        return jsonify({'error': 'User not found'}), 404

    data = request.get_json()

    if not data.get('old_password') or not data.get('new_password'):
        return jsonify({'error': 'Missing old or new password'}), 400

    if not user.check_password(data['old_password']):
        return jsonify({'error': 'Invalid old password'}), 401

    user.set_password(data['new_password'])
    user.updated_at = datetime.utcnow()
    db.session.commit()

    return jsonify({'message': 'Password changed successfully'}), 200


@auth_bp.route('/toggle-2fa', methods=['POST'])
@jwt_required()
def toggle_2fa():
    """Toggle two-factor authentication for current user"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if not user:
        return jsonify({'error': 'User not found'}), 404

    data = request.get_json()

    if 'enabled' not in data:
        return jsonify({'error': 'Missing enabled parameter'}), 400

    enabled = bool(data['enabled'])

    # Only allow students to toggle their own 2FA
    # Admin 2FA is controlled by system settings
    if user.role != UserRole.STUDENT:
        return jsonify({'error': 'Only students can manage their own 2FA settings'}), 403

    user.two_factor_enabled = enabled
    user.updated_at = datetime.utcnow()
    db.session.commit()

    # If enabling 2FA, send a test verification code
    if enabled:
        try:
            code, _ = create_verification_code_for_user(
                user.id, expiry_minutes=10)
            if code:
                send_2fa_verification_email(user, code, expiry_minutes=10)
                return jsonify({
                    'message': '2FA enabled successfully. A test verification code has been sent to your email.',
                    'two_factor_enabled': True
                }), 200
            else:
                # Rollback if we couldn't send the email
                user.two_factor_enabled = False
                db.session.commit()
                return jsonify({'error': 'Failed to send verification code. 2FA not enabled.'}), 500
        except Exception as e:
            print(f"[2FA TOGGLE] Error sending test email: {str(e)}")
            # Rollback if we couldn't send the email
            user.two_factor_enabled = False
            db.session.commit()
            return jsonify({'error': 'Failed to send verification email. 2FA not enabled.'}), 500

    return jsonify({
        'message': '2FA disabled successfully',
        'two_factor_enabled': False
    }), 200


@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    """Request password reset - sends verification code to email"""
    print("\n" + "=" * 100)
    print("[FORGOT PASSWORD] REQUEST RECEIVED")
    print("=" * 100)

    try:
        data = request.get_json()
        print(f"[FORGOT PASSWORD] Request data received")

        if not data.get('email'):
            print("[FORGOT PASSWORD] ❌ Email is required but not provided")
            return jsonify({'error': 'Email is required'}), 400

        email = data.get('email').lower().strip()
        print(f"[FORGOT PASSWORD] Looking for user with email: {email}")

        # Find user by email
        user = User.query.filter_by(email=email).first()

        if not user:
            # Don't reveal if email exists or not
            print(
                f"[FORGOT PASSWORD] ⚠️  User not found with email: {email} (returning generic success for security)")
            return jsonify({
                'success': True,
                'message': 'If the email exists, a verification code has been sent',
                # Dummy token for security
                'reset_token': secrets.token_urlsafe(32)
            }), 200

        print(f"[FORGOT PASSWORD] ✓ User found: {user.username}")

        # Generate verification code
        print(
            f"[FORGOT PASSWORD] Generating verification code for user: {user.id}")
        code, expiry = create_verification_code_for_user(
            user.id, expiry_minutes=10)

        if code:
            try:
                print(
                    f"[FORGOT PASSWORD] ✓ Verification code generated: {code}")
                print(f"[FORGOT PASSWORD] Code expires at: {expiry}")

                # Create a temporary reset token
                reset_token = secrets.token_urlsafe(32)
                print(
                    f"[FORGOT PASSWORD] Reset token generated (length: {len(reset_token)})")

                # Store reset token in user's verification_code field temporarily
                # (we'll validate it when verifying the code)
                user.verification_code = f"{code}:{reset_token}"
                user.verification_code_expiry = expiry
                user.verification_attempts = 0
                db.session.commit()
                print(f"[FORGOT PASSWORD] ✓ Verification code stored in database")

                # Send verification email
                print("\n" + "=" * 100)
                print(f"[PASSWORD RESET] SENDING EMAIL")
                print(f"[PASSWORD RESET] To: {user.email}")
                print(f"[PASSWORD RESET] User: {user.username}")
                print(f"[PASSWORD RESET] VERIFICATION CODE: {code}")
                print(
                    f"[PASSWORD RESET] Valid for: 10 minutes (until {expiry})")
                print("=" * 100 + "\n")

                send_password_reset_email(user, code, expiry_minutes=10)
                print(f"[FORGOT PASSWORD] ✓ Email sending completed")

                print(
                    f"[FORGOT PASSWORD] ✓ SUCCESS - Returning response to frontend")
                print("=" * 100 + "\n")

                return jsonify({
                    'success': True,
                    'message': 'Verification code sent to your email',
                    'reset_token': reset_token
                }), 200
            except Exception as e:
                print(f"[PASSWORD RESET] ❌ ERROR: {str(e)}")
                import traceback
                traceback.print_exc()
                print("=" * 100 + "\n")
                return jsonify({'error': 'Failed to send verification code'}), 500
        else:
            print(f"[FORGOT PASSWORD] ❌ Failed to generate verification code")
            return jsonify({'error': 'Failed to generate verification code'}), 500
    except Exception as e:
        print(f"[FORGOT PASSWORD] ❌ UNEXPECTED ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        print("=" * 100 + "\n")
        return jsonify({'error': 'An unexpected error occurred'}), 500


@auth_bp.route('/verify-reset-code', methods=['POST'])
def verify_reset_code():
    """Verify the reset code and return a verified token"""
    data = request.get_json()

    if not data.get('email') or not data.get('code') or not data.get('reset_token'):
        return jsonify({'error': 'Missing required fields'}), 400

    user = User.query.filter_by(email=data['email']).first()

    if not user:
        return jsonify({'error': 'Invalid verification code'}), 401

    # Check if code is expired
    if not user.verification_code_expiry or user.verification_code_expiry < datetime.utcnow():
        return jsonify({'error': 'Verification code has expired'}), 401

    # Check if user is locked
    if user.verification_locked_until and user.verification_locked_until > datetime.utcnow():
        minutes_remaining = int(
            (user.verification_locked_until - datetime.utcnow()).total_seconds() / 60) + 1
        return jsonify({
            'error': f'Too many failed attempts. Try again in {minutes_remaining} minutes.'
        }), 429

    # Verify the code and token
    stored_data = user.verification_code.split(':')
    if len(stored_data) != 2:
        return jsonify({'error': 'Invalid verification code'}), 401

    stored_code, stored_token = stored_data

    if stored_code != data['code'] or stored_token != data['reset_token']:
        # Increment failed attempts
        user.verification_attempts = (user.verification_attempts or 0) + 1

        if user.verification_attempts >= 5:
            # Lock user for 30 minutes
            user.verification_locked_until = datetime.utcnow() + timedelta(minutes=30)
            db.session.commit()
            return jsonify({
                'error': 'Too many failed attempts. Account locked for 30 minutes.'
            }), 429

        db.session.commit()
        return jsonify({
            'error': 'Invalid verification code',
            'attempts_remaining': 5 - user.verification_attempts
        }), 401

    # Code is valid - generate a verified token for password reset
    verified_token = secrets.token_urlsafe(32)

    # Store the verified token with expiry (15 minutes to complete password reset)
    user.verification_code = f"VERIFIED:{verified_token}"
    user.verification_code_expiry = datetime.utcnow() + timedelta(minutes=15)
    user.verification_attempts = 0
    user.verification_locked_until = None
    db.session.commit()

    return jsonify({
        'success': True,
        'message': 'Code verified successfully',
        'verified_token': verified_token
    }), 200


@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    """Reset password using verified token"""
    data = request.get_json()

    if not data.get('token') or not data.get('new_password'):
        return jsonify({'error': 'Missing required fields'}), 400

    if len(data['new_password']) < 6:
        return jsonify({'error': 'Password must be at least 6 characters'}), 400

    # Find user with matching verified token
    users = User.query.filter(
        User.verification_code.like(f"VERIFIED:{data['token']}")
    ).all()

    if not users or len(users) == 0:
        return jsonify({'error': 'Invalid or expired reset token'}), 401

    user = users[0]

    # Check if token is expired
    if not user.verification_code_expiry or user.verification_code_expiry < datetime.utcnow():
        return jsonify({'error': 'Reset token has expired. Please request a new one.'}), 401

    # Reset password
    user.set_password(data['new_password'])

    # Clear verification data
    user.verification_code = None
    user.verification_code_expiry = None
    user.verification_attempts = 0
    user.verification_locked_until = None
    user.updated_at = datetime.utcnow()

    db.session.commit()

    return jsonify({
        'success': True,
        'message': 'Password reset successfully'
    }), 200
