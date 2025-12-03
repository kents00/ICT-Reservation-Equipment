#!/usr/bin/env python
"""
Test Password Reset Email Configuration
This script verifies that email configuration is working for password reset functionality
"""

import os
import sys
from dotenv import load_dotenv

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Load environment variables
load_dotenv()


def test_email_config():
    """Test email configuration"""
    print("\n" + "=" * 80)
    print("PASSWORD RESET EMAIL CONFIGURATION TEST")
    print("=" * 80)

    # Check environment variables
    mail_server = os.getenv('MAIL_SERVER')
    mail_port = os.getenv('MAIL_PORT')
    mail_username = os.getenv('MAIL_USERNAME')
    mail_password = os.getenv('MAIL_PASSWORD')
    mail_use_tls = os.getenv('MAIL_USE_TLS')
    mail_sender = os.getenv('MAIL_DEFAULT_SENDER')

    print("\n1. ENVIRONMENT VARIABLES:")
    print(f"   MAIL_SERVER: {mail_server}")
    print(f"   MAIL_PORT: {mail_port}")
    print(f"   MAIL_USE_TLS: {mail_use_tls}")
    print(f"   MAIL_USERNAME: {mail_username}")
    print(f"   MAIL_PASSWORD: {'*' * 10 if mail_password else 'NOT SET'}")
    print(f"   MAIL_DEFAULT_SENDER: {mail_sender}")

    # Validate configuration
    errors = []
    if not mail_server:
        errors.append("MAIL_SERVER not set")
    if not mail_port:
        errors.append("MAIL_PORT not set")
    if not mail_username:
        errors.append("MAIL_USERNAME not set")
    if not mail_password:
        errors.append("MAIL_PASSWORD not set")

    if errors:
        print("\n❌ CONFIGURATION ERRORS:")
        for error in errors:
            print(f"   - {error}")
        return False

    print("\n✓ All environment variables are configured")

    # Test SMTP connection
    print("\n2. TESTING SMTP CONNECTION:")
    try:
        import smtplib
        print(f"   Connecting to {mail_server}:{mail_port}...")

        server = smtplib.SMTP(mail_server, int(mail_port), timeout=5)
        print(f"   ✓ Connected to SMTP server")

        if mail_use_tls and mail_use_tls.lower() == 'true':
            print(f"   Starting TLS...")
            server.starttls()
            print(f"   ✓ TLS started")

        print(f"   Authenticating as {mail_username}...")
        server.login(mail_username, mail_password)
        print(f"   ✓ Authentication successful")

        server.quit()
        print(f"   ✓ SMTP connection successful!")

    except smtplib.SMTPAuthenticationError as e:
        print(f"   ❌ Authentication failed: {str(e)}")
        print(f"   Please verify MAIL_USERNAME and MAIL_PASSWORD are correct")
        return False
    except smtplib.SMTPException as e:
        print(f"   ❌ SMTP error: {str(e)}")
        return False
    except Exception as e:
        print(f"   ❌ Connection error: {str(e)}")
        return False

    # Test Flask-Mail
    print("\n3. TESTING FLASK-MAIL:")
    try:
        from flask import Flask
        from flask_mail import Mail, Message

        app = Flask(__name__)
        app.config['MAIL_SERVER'] = mail_server
        app.config['MAIL_PORT'] = int(mail_port)
        app.config['MAIL_USE_TLS'] = mail_use_tls.lower() == 'true'
        app.config['MAIL_USERNAME'] = mail_username
        app.config['MAIL_PASSWORD'] = mail_password
        app.config['MAIL_DEFAULT_SENDER'] = mail_sender

        mail = Mail(app)

        with app.app_context():
            # Create a test message
            msg = Message(
                subject="Password Reset Test",
                recipients=[mail_username],
                html="<p>This is a test password reset email</p>"
            )

            print(f"   Sending test email to {mail_username}...")
            mail.send(msg)
            print(f"   ✓ Test email sent successfully!")

    except Exception as e:
        print(f"   ❌ Flask-Mail error: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

    return True


def test_password_reset_flow():
    """Test the password reset flow"""
    print("\n4. TESTING PASSWORD RESET FLOW:")
    try:
        from app import create_app
        from models import User
        from extensions import db
        from utils.two_factor import create_verification_code_for_user
        from utils.email_service import send_password_reset_email

        # Create app
        app = create_app()

        with app.app_context():
            # Find a test user or create one
            test_user = User.query.filter_by(username='testuser').first()

            if not test_user:
                print("   Creating test user...")
                test_user = User(
                    username='testuser',
                    # Send to configured email
                    email=os.getenv('MAIL_USERNAME'),
                    first_name='Test',
                    last_name='User'
                )
                test_user.set_password('password123')
                db.session.add(test_user)
                db.session.commit()
                print(f"   ✓ Test user created: {test_user.username}")

            # Generate verification code
            print(
                f"   Generating verification code for {test_user.username}...")
            code, expiry = create_verification_code_for_user(
                test_user.id, expiry_minutes=10)

            if not code:
                print("   ❌ Failed to generate verification code")
                return False

            print(f"   ✓ Verification code generated: {code}")

            # Send password reset email
            print(f"   Sending password reset email to {test_user.email}...")
            send_password_reset_email(test_user, code, expiry_minutes=10)
            print(f"   ✓ Password reset email queued/sent")

    except Exception as e:
        print(f"   ❌ Error in password reset flow: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

    return True


if __name__ == '__main__':
    print("\nPassword Reset Email Configuration Test\n")

    # Test configuration
    config_ok = test_email_config()

    if config_ok:
        print("\n" + "=" * 80)
        print("✓ EMAIL CONFIGURATION IS VALID")
        print("=" * 80)
        print("\nThe email system is properly configured.")
        print("Password reset emails should be sent successfully.")

        # Optionally test the full flow
        try:
            if test_password_reset_flow():
                print("\n" + "=" * 80)
                print("✓ PASSWORD RESET FLOW TEST SUCCESSFUL")
                print("=" * 80)
                print("\nThe password reset functionality is working correctly.")
            else:
                print("\n⚠️  Password reset flow test had issues")
        except Exception as e:
            print(f"\n⚠️  Could not test full flow: {str(e)}")
    else:
        print("\n" + "=" * 80)
        print("❌ EMAIL CONFIGURATION ERROR")
        print("=" * 80)
        print("\nPlease verify your email configuration in .env file:")
        print("  - MAIL_SERVER should be 'smtp.gmail.com' for Gmail")
        print("  - MAIL_PORT should be '587' for Gmail with TLS")
        print("  - MAIL_USERNAME should be your Gmail address")
        print("  - MAIL_PASSWORD should be your Gmail app password (not regular password)")
        print("  - MAIL_USE_TLS should be 'True'")
        sys.exit(1)
