"""
Two-Factor Authentication Utilities
Handles generation and validation of 2FA verification codes
"""
import secrets
import string
from datetime import datetime, timedelta
from extensions import db
from models import User


def generate_verification_code(length=6):
    """
    Generate a random verification code

    Args:
        length (int): Length of the code (default: 6)

    Returns:
        str: Random numeric code
    """
    return ''.join(secrets.choice(string.digits) for _ in range(length))


def create_verification_code_for_user(user_id, expiry_minutes=10):
    """
    Generate and store a verification code for a user

    Args:
        user_id (str): User ID
        expiry_minutes (int): Minutes until code expires (default: 10)

    Returns:
        tuple: (code, expiry_datetime) or (None, None) if user not found
    """
    user = User.query.get(user_id)

    if not user:
        return None, None

    # Generate new code
    code = generate_verification_code()
    expiry = datetime.utcnow() + timedelta(minutes=expiry_minutes)

    # Store in user record
    user.verification_code = code
    user.verification_code_expiry = expiry
    user.verification_attempts = 0  # Reset attempts on new code

    db.session.commit()

    return code, expiry


def validate_verification_code(user_id, code):
    """
    Validate a verification code for a user

    Args:
        user_id (str): User ID
        code (str): Verification code to validate

    Returns:
        dict: Result with 'valid' (bool), 'message' (str), 'attempts_remaining' (int)
    """
    user = User.query.get(user_id)

    if not user:
        return {
            'valid': False,
            'message': 'User not found',
            'attempts_remaining': 0
        }

    # Check if user is locked out
    if user.verification_locked_until:
        if datetime.utcnow() < user.verification_locked_until:
            remaining = (user.verification_locked_until -
                         datetime.utcnow()).seconds // 60
            return {
                'valid': False,
                'message': f'Too many failed attempts. Please try again in {remaining} minutes.',
                'attempts_remaining': 0,
                'locked': True
            }
        else:
            # Lockout expired, reset
            user.verification_locked_until = None
            user.verification_attempts = 0
            db.session.commit()

    # Check if code exists
    if not user.verification_code:
        return {
            'valid': False,
            'message': 'No verification code found. Please request a new code.',
            'attempts_remaining': 0
        }

    # Check if code expired
    if not user.verification_code_expiry or datetime.utcnow() > user.verification_code_expiry:
        return {
            'valid': False,
            'message': 'Verification code has expired. Please request a new code.',
            'attempts_remaining': 0,
            'expired': True
        }

    # Increment attempts
    user.verification_attempts = (user.verification_attempts or 0) + 1

    # Check if code matches
    if user.verification_code != code:
        max_attempts = 3
        attempts_remaining = max_attempts - user.verification_attempts

        # Lock user if max attempts reached
        if attempts_remaining <= 0:
            user.verification_locked_until = datetime.utcnow() + timedelta(minutes=5)
            db.session.commit()
            return {
                'valid': False,
                'message': 'Too many failed attempts. Account locked for 5 minutes.',
                'attempts_remaining': 0,
                'locked': True
            }

        db.session.commit()
        return {
            'valid': False,
            'message': f'Invalid verification code. {attempts_remaining} attempts remaining.',
            'attempts_remaining': attempts_remaining
        }

    # Code is valid - clear verification data
    user.verification_code = None
    user.verification_code_expiry = None
    user.verification_attempts = 0
    user.verification_locked_until = None

    db.session.commit()

    return {
        'valid': True,
        'message': 'Verification successful',
        'attempts_remaining': 3
    }


def clear_verification_code(user_id):
    """
    Clear verification code for a user

    Args:
        user_id (str): User ID

    Returns:
        bool: True if successful, False otherwise
    """
    user = User.query.get(user_id)

    if not user:
        return False

    user.verification_code = None
    user.verification_code_expiry = None
    user.verification_attempts = 0
    user.verification_locked_until = None

    db.session.commit()

    return True


def is_user_locked(user_id):
    """
    Check if user is currently locked out from verification attempts

    Args:
        user_id (str): User ID

    Returns:
        tuple: (is_locked (bool), minutes_remaining (int))
    """
    user = User.query.get(user_id)

    if not user or not user.verification_locked_until:
        return False, 0

    if datetime.utcnow() < user.verification_locked_until:
        remaining = (user.verification_locked_until -
                     datetime.utcnow()).seconds // 60
        return True, remaining

    return False, 0
