"""
Test script to verify 2FA setup
This script tests the two-factor authentication implementation
"""
from models import User, SystemSettings, UserRole
from app import app, db
import sys
import os

# Add parent directory to path to import app modules
sys.path.insert(0, os.path.dirname(__file__))


def test_2fa_setup():
    """Test 2FA setup and configuration"""
    with app.app_context():
        print("=" * 60)
        print("Two-Factor Authentication Setup Test")
        print("=" * 60)
        print()

        # Check if User model has 2FA fields
        print("1. Checking User model for 2FA fields...")
        try:
            test_user = User.query.first()
            if test_user:
                has_2fa_fields = (
                    hasattr(test_user, 'two_factor_enabled') and
                    hasattr(test_user, 'verification_code') and
                    hasattr(test_user, 'verification_code_expiry') and
                    hasattr(test_user, 'verification_attempts') and
                    hasattr(test_user, 'verification_locked_until')
                )
                if has_2fa_fields:
                    print("   ✓ All 2FA fields present in User model")
                    print(
                        f"   - two_factor_enabled: {test_user.two_factor_enabled}")
                    print(
                        f"   - verification_code: {test_user.verification_code}")
                    print(
                        f"   - verification_code_expiry: {test_user.verification_code_expiry}")
                    print(
                        f"   - verification_attempts: {test_user.verification_attempts}")
                    print(
                        f"   - verification_locked_until: {test_user.verification_locked_until}")
                else:
                    print("   ✗ Some 2FA fields are missing")
                    return False
            else:
                print("   ⚠ No users found in database (creating test data recommended)")
        except Exception as e:
            print(f"   ✗ Error checking User model: {e}")
            return False

        print()

        # Check SystemSettings for 2FA toggle
        print("2. Checking SystemSettings for 2FA toggle...")
        try:
            settings = SystemSettings.query.first()
            if settings:
                print(f"   ✓ SystemSettings found")
                print(f"   - two_factor_auth: {settings.two_factor_auth}")

                if not settings.two_factor_auth:
                    print()
                    print("   ℹ 2FA is currently DISABLED in system settings")
                    print("   To enable 2FA:")
                    print("   1. Login to admin dashboard")
                    print("   2. Go to Settings page")
                    print("   3. Enable 'Require two-factor authentication' checkbox")
                    print("   4. Click 'Save Changes'")
                else:
                    print("   ✓ 2FA is ENABLED in system settings")
            else:
                print("   ⚠ No SystemSettings found, creating default...")
                settings = SystemSettings(
                    system_name='Equipment Reservation System',
                    two_factor_auth=False
                )
                db.session.add(settings)
                db.session.commit()
                print("   ✓ Default SystemSettings created (2FA disabled)")
        except Exception as e:
            print(f"   ✗ Error checking SystemSettings: {e}")
            return False

        print()

        # Check for admin users
        print("3. Checking for admin users...")
        try:
            admin_users = User.query.filter_by(role=UserRole.ADMIN).all()
            if admin_users:
                print(f"   ✓ Found {len(admin_users)} admin user(s):")
                for admin in admin_users:
                    print(f"   - {admin.username} ({admin.email})")
            else:
                print("   ⚠ No admin users found")
                print("   Please create an admin user to test 2FA")
        except Exception as e:
            print(f"   ✗ Error checking admin users: {e}")
            return False

        print()

        # Test two_factor utility functions
        print("4. Testing two_factor utility functions...")
        try:
            from utils.two_factor import (
                generate_verification_code,
                create_verification_code_for_user,
                validate_verification_code
            )

            # Test code generation
            code = generate_verification_code()
            if len(code) == 6 and code.isdigit():
                print(f"   ✓ Code generation works (sample: {code})")
            else:
                print(f"   ✗ Code generation failed (got: {code})")
                return False

            print("   ✓ Two-factor utilities imported successfully")
        except Exception as e:
            print(f"   ✗ Error testing two_factor utilities: {e}")
            return False

        print()

        # Test email service
        print("5. Testing email service import...")
        try:
            from utils.email_service import send_2fa_verification_email
            print("   ✓ Email service imported successfully")
            print("   ℹ To test email sending, login with an admin account")
        except Exception as e:
            print(f"   ✗ Error importing email service: {e}")
            return False

        print()
        print("=" * 60)
        print("✓ 2FA Setup Test Completed Successfully!")
        print("=" * 60)
        print()
        print("Next Steps:")
        print("1. Start the Flask backend server")
        print("2. Login to admin dashboard")
        print("3. Go to Settings and enable 'Require two-factor authentication'")
        print("4. Save settings")
        print("5. Logout and login again to test 2FA flow")
        print()

        return True


if __name__ == '__main__':
    success = test_2fa_setup()
    sys.exit(0 if success else 1)
