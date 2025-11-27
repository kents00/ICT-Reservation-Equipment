"""
Test Email Notifications
Run this script to verify email configuration is working
"""
from flask import Flask
from flask_mail import Mail, Message
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Create Flask app for testing
app = Flask(__name__)
app.config['MAIL_SERVER'] = os.getenv('MAIL_SERVER', 'smtp.gmail.com')
app.config['MAIL_PORT'] = int(os.getenv('MAIL_PORT', 587))
app.config['MAIL_USE_TLS'] = os.getenv('MAIL_USE_TLS', 'True') == 'True'
app.config['MAIL_USERNAME'] = os.getenv('MAIL_USERNAME')
app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASSWORD')
app.config['MAIL_DEFAULT_SENDER'] = os.getenv('MAIL_DEFAULT_SENDER')

mail = Mail(app)

print("=" * 60)
print("EMAIL NOTIFICATION TEST")
print("=" * 60)
print("\nConfiguration:")
print(f"  MAIL_SERVER: {app.config['MAIL_SERVER']}")
print(f"  MAIL_PORT: {app.config['MAIL_PORT']}")
print(f"  MAIL_USE_TLS: {app.config['MAIL_USE_TLS']}")
print(f"  MAIL_USERNAME: {app.config['MAIL_USERNAME']}")
print(f"  MAIL_DEFAULT_SENDER: {app.config['MAIL_DEFAULT_SENDER']}")
print(f"  Password: {'*' * 16 if app.config['MAIL_PASSWORD'] else 'NOT SET'}")

if not app.config['MAIL_USERNAME'] or not app.config['MAIL_PASSWORD']:
    print("\n❌ ERROR: Email credentials not configured!")
    print("Please set MAIL_USERNAME and MAIL_PASSWORD in .env file")
    exit(1)


def test_approved_email():
    """Test reservation approved email"""
    print("\n" + "-" * 60)
    print("TEST 1: Reservation Approved Email")
    print("-" * 60)

    test_email = app.config['MAIL_USERNAME']
    start_date = datetime.now() + timedelta(days=2)
    end_date = start_date + timedelta(days=5)

    subject = "Reservation Approved - Dell Laptop XPS 15"
    html_body = f"""
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: #007AFF; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }}
        .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }}
        .details {{ background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }}
        .detail-row {{ margin: 10px 0; }}
        .status {{ display: inline-block; padding: 8px 16px; background: #34C759; color: white; border-radius: 20px; }}
        .footer {{ text-align: center; margin-top: 30px; color: #999; font-size: 12px; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>✓ Reservation Approved</h1>
        </div>
        <div class="content">
            <p>Hello <strong>Test User</strong>,</p>
            <p>Great news! Your reservation request has been approved.</p>
            <div class="details">
                <div class="detail-row"><strong>Equipment:</strong> Dell Laptop XPS 15</div>
                <div class="detail-row"><strong>Category:</strong> Laptops</div>
                <div class="detail-row"><strong>Start Date:</strong> {start_date.strftime('%B %d, %Y')}</div>
                <div class="detail-row"><strong>End Date:</strong> {end_date.strftime('%B %d, %Y')}</div>
                <div class="detail-row"><span class="status">Approved</span></div>
            </div>
            <p><strong>Admin Notes:</strong> Please bring valid ID for pickup.</p>
            <p>Please check out the equipment during your reservation period.</p>
            <div class="footer"><p>Equipment Reservation System</p></div>
        </div>
    </div>
</body>
</html>
"""

    try:
        with app.app_context():
            msg = Message(subject, recipients=[test_email])
            msg.html = html_body
            mail.send(msg)
        print("✓ Approval email sent successfully!")
        print(f"  Sent to: {test_email}")
        return True
    except Exception as e:
        print(f"✗ Failed to send approval email: {str(e)}")
        return False


def test_rejected_email():
    """Test reservation rejected email"""
    print("\n" + "-" * 60)
    print("TEST 2: Reservation Rejected Email")
    print("-" * 60)

    test_email = app.config['MAIL_USERNAME']

    subject = "Reservation Rejected - Canon DSLR Camera"
    html_body = """
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #FF3B30; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .reason { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #999; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>✗ Reservation Rejected</h1>
        </div>
        <div class="content">
            <p>Hello <strong>Test User</strong>,</p>
            <p>We regret to inform you that your reservation request has been rejected.</p>
            <div class="details">
                <div><strong>Equipment:</strong> Canon DSLR Camera</div>
                <div><strong>Category:</strong> Photography</div>
            </div>
            <div class="reason">
                <strong>Reason:</strong> Equipment unavailable for requested dates. Please choose different dates.
            </div>
            <p>If you have any questions, please contact the administrator.</p>
            <div class="footer"><p>Equipment Reservation System</p></div>
        </div>
    </div>
</body>
</html>
"""

    try:
        with app.app_context():
            msg = Message(subject, recipients=[test_email])
            msg.html = html_body
            mail.send(msg)
        print("✓ Rejection email sent successfully!")
        print(f"  Sent to: {test_email}")
        return True
    except Exception as e:
        print(f"✗ Failed to send rejection email: {str(e)}")
        return False


def test_overdue_email():
    """Test equipment overdue email"""
    print("\n" + "-" * 60)
    print("TEST 3: Equipment Overdue Email")
    print("-" * 60)

    test_email = app.config['MAIL_USERNAME']
    due_date = datetime.now() - timedelta(days=3)

    subject = "Equipment Overdue - MacBook Pro"
    html_body = f"""
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: #FF3B30; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }}
        .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }}
        .warning {{ background: #fee; border-left: 4px solid #FF3B30; padding: 15px; margin: 20px 0; }}
        .footer {{ text-align: center; margin-top: 30px; color: #999; font-size: 12px; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>⚠️ Equipment Overdue</h1>
        </div>
        <div class="content">
            <p>Hello <strong>Test User</strong>,</p>
            <div class="warning">
                <strong>URGENT:</strong> The equipment you checked out is now overdue for return.
            </div>
            <div>
                <p><strong>Equipment:</strong> MacBook Pro</p>
                <p><strong>Due Date:</strong> {due_date.strftime('%B %d, %Y')}</p>
                <p><strong>Days Overdue:</strong> 3 days</p>
            </div>
            <p>Please return the equipment as soon as possible to avoid penalties.</p>
            <div class="footer"><p>Equipment Reservation System</p></div>
        </div>
    </div>
</body>
</html>
"""

    try:
        with app.app_context():
            msg = Message(subject, recipients=[test_email])
            msg.html = html_body
            mail.send(msg)
        print("✓ Overdue email sent successfully!")
        print(f"  Sent to: {test_email}")
        return True
    except Exception as e:
        print(f"✗ Failed to send overdue email: {str(e)}")
        return False


def test_admin_notification():
    """Test new reservation admin notification"""
    print("\n" + "-" * 60)
    print("TEST 4: Admin Notification Email")
    print("-" * 60)

    admin_email = app.config['MAIL_USERNAME']
    start_date = datetime.now() + timedelta(days=1)
    end_date = start_date + timedelta(days=3)

    subject = "New Reservation Request - Projector"
    html_body = f"""
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: #007AFF; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }}
        .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }}
        .details {{ background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }}
        .btn {{ display: inline-block; padding: 12px 24px; background: #007AFF; color: white; text-decoration: none; border-radius: 6px; margin: 10px 5px; }}
        .footer {{ text-align: center; margin-top: 30px; color: #999; font-size: 12px; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📋 New Reservation Request</h1>
        </div>
        <div class="content">
            <p>Hello <strong>Admin</strong>,</p>
            <p>A new reservation request requires your approval.</p>
            <div class="details">
                <p><strong>Student:</strong> John Doe (johndoe)</p>
                <p><strong>Email:</strong> johndoe@example.com</p>
                <p><strong>Equipment:</strong> Projector - Epson EB-X05</p>
                <p><strong>Category:</strong> Presentation</p>
                <p><strong>Start Date:</strong> {start_date.strftime('%B %d, %Y')}</p>
                <p><strong>End Date:</strong> {end_date.strftime('%B %d, %Y')}</p>
                <p><strong>Reason:</strong> Need for class presentation on Computer Networks</p>
            </div>
            <p style="text-align: center;">
                <a href="#" class="btn">View in Dashboard</a>
            </p>
            <p>Please review and approve/reject this request in the admin dashboard.</p>
            <div class="footer"><p>Equipment Reservation System</p></div>
        </div>
    </div>
</body>
</html>
"""

    try:
        with app.app_context():
            msg = Message(subject, recipients=[admin_email])
            msg.html = html_body
            mail.send(msg)
        print("✓ Admin notification sent successfully!")
        print(f"  Sent to: {admin_email}")
        return True
    except Exception as e:
        print(f"✗ Failed to send admin notification: {str(e)}")
        return False


if __name__ == '__main__':
    print("\nStarting email tests...")
    print(f"All test emails will be sent to: {app.config['MAIL_USERNAME']}")
    print("\nNote: Emails are sent asynchronously, so they may take a few seconds to arrive.")

    results = []

    # Run all tests
    results.append(('Approval Email', test_approved_email()))
    results.append(('Rejection Email', test_rejected_email()))
    results.append(('Overdue Email', test_overdue_email()))
    results.append(('Admin Notification', test_admin_notification()))

    # Summary
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)

    passed = sum(1 for _, result in results if result)
    total = len(results)

    for test_name, result in results:
        status = "✓ PASS" if result else "✗ FAIL"
        print(f"  {status} - {test_name}")

    print(f"\nResults: {passed}/{total} tests passed")

    if passed == total:
        print("\n🎉 All email tests passed! Check your inbox.")
    else:
        print("\n⚠️  Some tests failed. Check the error messages above.")
        print("\nCommon issues:")
        print("  - Gmail: Use App Password (not regular password)")
        print("  - Enable 2FA and generate App Password at:")
        print("    https://myaccount.google.com/apppasswords")
        print("  - Check MAIL_SERVER and MAIL_PORT settings")
        print("  - Verify firewall/antivirus not blocking SMTP")

    print("\n" + "=" * 60)
