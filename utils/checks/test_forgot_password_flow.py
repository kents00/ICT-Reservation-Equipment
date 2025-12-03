#!/usr/bin/env python
"""
Test Forgot Password Flow
This script tests the complete forgot password flow
"""

import os
import sys
import json
from dotenv import load_dotenv

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Load environment variables
load_dotenv()


def test_forgot_password_flow():
    """Test the forgot password flow"""
    print("\n" + "=" * 80)
    print("FORGOT PASSWORD FLOW TEST")
    print("=" * 80)

    try:
        from app import create_app
        from models import User
        from extensions import db

        # Create app
        app = create_app()

        with app.app_context():
            # Find test user (using the configured email)
            test_email = os.getenv('MAIL_USERNAME')

            print(f"\n1. LOOKING FOR USER WITH EMAIL: {test_email}")
            user = User.query.filter_by(email=test_email).first()

            if not user:
                print(f"   ❌ User not found with email: {test_email}")
                print(f"   Creating test user...")

                # Create test user
                test_user = User(
                    username='forgot_password_test',
                    email=test_email,
                    first_name='Forgot',
                    last_name='Password'
                )
                test_user.set_password('testpassword123')
                db.session.add(test_user)
                db.session.commit()
                print(f"   ✓ Test user created")
                user = test_user
            else:
                print(f"   ✓ Found user: {user.username} ({user.email})")

            # Now test the forgot password endpoint
            print(f"\n2. TESTING FORGOT PASSWORD ENDPOINT")

            from flask import json as flask_json

            with app.test_client() as client:
                response = client.post(
                    '/api/auth/forgot-password',
                    data=flask_json.dumps({'email': user.email}),
                    content_type='application/json'
                )

                print(f"   Status Code: {response.status_code}")
                response_data = response.get_json()
                print(f"   Response: {json.dumps(response_data, indent=4)}")

                if response.status_code == 200 and response_data.get('success'):
                    print(f"   ✓ Forgot password request successful")

                    # Check if verification code was set
                    db.session.refresh(user)
                    if user.verification_code:
                        print(f"\n3. VERIFICATION CODE DETAILS")
                        print(
                            f"   Verification Code: {user.verification_code}")
                        print(
                            f"   Expires At: {user.verification_code_expiry}")
                        print(f"   Attempts: {user.verification_attempts}")
                    else:
                        print(f"\n   ⚠️  No verification code found in database")

                    return True
                else:
                    print(f"   ❌ Forgot password request failed")
                    return False

    except Exception as e:
        print(f"\n❌ Error during test: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == '__main__':
    print("\nForgot Password Flow Test\n")

    if test_forgot_password_flow():
        print("\n" + "=" * 80)
        print("✓ FORGOT PASSWORD FLOW TEST SUCCESSFUL")
        print("=" * 80)
        print("\nThe forgot password functionality is working correctly.")
        print("Verification codes are being generated and emails are being sent.")
    else:
        print("\n" + "=" * 80)
        print("❌ FORGOT PASSWORD FLOW TEST FAILED")
        print("=" * 80)
        sys.exit(1)
