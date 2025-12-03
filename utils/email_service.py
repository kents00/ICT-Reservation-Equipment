"""
Email Service for Equipment Reservation System
Handles sending email notifications to users
"""
from flask import current_app, render_template_string
from flask_mail import Mail, Message
from threading import Thread


mail = Mail()


def send_async_email(app, msg):
    """Send email asynchronously"""
    print(f"\n[EMAIL::SEND_ASYNC] Starting async email send")
    print(f"[EMAIL::SEND_ASYNC] Recipients: {msg.recipients}")
    print(f"[EMAIL::SEND_ASYNC] Subject: {msg.subject}")

    try:
        with app.app_context():
            print(
                f"[EMAIL::CONFIG] Mail server: {app.config.get('MAIL_SERVER')}")
            print(f"[EMAIL::CONFIG] Mail port: {app.config.get('MAIL_PORT')}")
            print(
                f"[EMAIL::CONFIG] Mail username: {app.config.get('MAIL_USERNAME')}")
            print(
                f"[EMAIL::CONFIG] Mail use TLS: {app.config.get('MAIL_USE_TLS')}")
            print(
                f"[EMAIL::CONFIG] Mail suppress send: {app.config.get('MAIL_SUPPRESS_SEND', False)}")

            if app.config.get('MAIL_SUPPRESS_SEND'):
                print(
                    f"[EMAIL::WARNING] ⚠️  MAIL_SUPPRESS_SEND is enabled - email will NOT be sent")

            print(f"[EMAIL::ATTEMPT] Calling mail.send()...")
            mail.send(msg)
            print(
                f"[EMAIL::SUCCESS] ✓ Email sent successfully to: {msg.recipients}")
            print(f"[EMAIL::SUCCESS] Subject: {msg.subject}\n")
    except OSError as e:
        # Network errors - common in development or when SMTP is unreachable
        print(
            f"[EMAIL::ERROR::NETWORK] ✗ Network error - email not sent: {str(e)}")
        print(
            f"[EMAIL::ERROR::NETWORK] ℹ️  Email was intended for: {msg.recipients}")
        print(f"[EMAIL::ERROR::NETWORK] ℹ️  Subject: {msg.subject}")
        print(
            f"[EMAIL::ERROR::NETWORK] ℹ️  This usually means SMTP server is unreachable\n")
        # Don't print full traceback for network errors to reduce noise
    except Exception as e:
        print(f"[EMAIL::ERROR::EXCEPTION] ✗ Failed to send email: {str(e)}")
        print(
            f"[EMAIL::ERROR::EXCEPTION] Exception type: {type(e).__name__}\n")
        import traceback
        traceback.print_exc()


def send_email(subject, recipients, text_body, html_body, synchronous=False):
    """Send email with both text and HTML versions

    Args:
        subject: Email subject
        recipients: List of email recipients
        text_body: Plain text version of email
        html_body: HTML version of email
        synchronous: If True, send immediately. If False, send in background thread

    Returns:
        bool: True if email was sent/queued successfully
    """
    print(f"\n{'='*100}")
    print(f"[EMAIL::PREPARE] PREPARING EMAIL")
    print(f"{'='*100}")
    print(f"[EMAIL::PREPARE] Subject: {subject}")
    print(f"[EMAIL::PREPARE] Recipients: {recipients}")
    print(
        f"[EMAIL::PREPARE] Mode: {'SYNCHRONOUS (immediate)' if synchronous else 'ASYNCHRONOUS (background thread)'}")
    print(f"[EMAIL::PREPARE] Text body length: {len(text_body)} chars")
    print(f"[EMAIL::PREPARE] HTML body length: {len(html_body)} chars")

    try:
        app = current_app._get_current_object()
        print(f"[EMAIL::PREPARE] ✓ Got Flask app context")

        msg = Message(subject, recipients=recipients)
        msg.body = text_body
        msg.html = html_body
        print(f"[EMAIL::PREPARE] ✓ Message object created")

        if synchronous:
            # Send immediately (useful for critical emails like password reset)
            print(f"[EMAIL::QUEUE] Sending SYNCHRONOUSLY (waiting for completion)...")
            send_async_email(app, msg)
            print(f"[EMAIL::QUEUE] ✓ Synchronous send completed")
        else:
            # Send in background thread
            print(f"[EMAIL::QUEUE] Starting background thread for email...")
            thread = Thread(target=send_async_email, args=(app, msg))
            thread.daemon = True
            thread.start()
            print(
                f"[EMAIL::QUEUE] ✓ Background thread started (thread name: {thread.name})")

        print(f"[EMAIL::RESULT] ✓ Email prepared and queued successfully")
        print(f"{'='*100}\n")
        return True
    except Exception as e:
        print(f"[EMAIL::ERROR] ✗ Error preparing email: {str(e)}")
        print(f"[EMAIL::ERROR] Exception type: {type(e).__name__}")
        print(f"{'='*100}\n")
        import traceback
        traceback.print_exc()
        return False


def send_reservation_approved_email(user, reservation, equipment):
    """Send email when reservation is approved"""
    subject = f"Reservation Approved - {equipment.name}"

    text_body = f"""
Hello {user.first_name},

Your reservation request has been approved!

Equipment: {equipment.name}
Reservation Period: {reservation.start_date.strftime('%Y-%m-%d')} to {reservation.end_date.strftime('%Y-%m-%d')}
Status: Approved

Please check out the equipment during your reservation period.

Best regards,
Equipment Reservation System
"""

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
        .label {{ font-weight: bold; color: #555; }}
        .value {{ color: #333; }}
        .status {{ display: inline-block; padding: 8px 16px; background: #34C759; color: white; border-radius: 20px; }}
        .footer {{ text-align: center; margin-top: 30px; color: #999; font-size: 12px; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Reservation Approved</h1>
        </div>
        <div class="content">
            <p>Hello <strong>{user.first_name}</strong>,</p>
            <p>Great news! Your reservation request has been approved.</p>

            <div class="details">
                <div class="detail-row">
                    <span class="label">Equipment:</span>
                    <span class="value">{equipment.name}</span>
                </div>
                <div class="detail-row">
                    <span class="label">Category:</span>
                    <span class="value">{equipment.category}</span>
                </div>
                <div class="detail-row">
                    <span class="label">Reservation Period:</span>
                    <span class="value">{reservation.start_date.strftime('%Y-%m-%d')} to {reservation.end_date.strftime('%Y-%m-%d')}</span>
                </div>
                <div class="detail-row">
                    <span class="label">Status:</span>
                    <span class="status">Approved</span>
                </div>
            </div>

            <p>Please check out the equipment during your reservation period.</p>

            <div class="footer">
                <p>Equipment Reservation System</p>
            </div>
        </div>
    </div>
</body>
</html>
"""

    send_email(subject, [user.email], text_body, html_body)


def send_reservation_rejected_email(user, reservation, equipment, reason):
    """Send email when reservation is rejected"""
    subject = f"Reservation Rejected - {equipment.name}"

    text_body = f"""
Hello {user.first_name},

Unfortunately, your reservation request has been rejected.

Equipment: {equipment.name}
Reason: {reason}

If you have any questions, please contact the administrator.

Best regards,
Equipment Reservation System
"""

    html_body = f"""
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: #FF3B30; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }}
        .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }}
        .details {{ background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }}
        .reason {{ background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }}
        .footer {{ text-align: center; margin-top: 30px; color: #999; font-size: 12px; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Reservation Rejected</h1>
        </div>
        <div class="content">
            <p>Hello <strong>{user.first_name}</strong>,</p>
            <p>We regret to inform you that your reservation request has been rejected.</p>

            <div class="details">
                <div><strong>Equipment:</strong> {equipment.name}</div>
                <div><strong>Category:</strong> {equipment.category}</div>
            </div>

            <div class="reason">
                <strong>Reason:</strong> {reason}
            </div>

            <p>If you have any questions, please contact the administrator.</p>

            <div class="footer">
                <p>Equipment Reservation System</p>
            </div>
        </div>
    </div>
</body>
</html>
"""

    send_email(subject, [user.email], text_body, html_body)


def send_equipment_overdue_email(user, reservation, equipment):
    """Send email when equipment is overdue"""
    subject = f"Equipment Overdue - {equipment.name}"

    text_body = f"""
Hello {user.first_name},

The equipment you checked out is now overdue for return.

Equipment: {equipment.name}
Due Date: {reservation.end_date.strftime('%Y-%m-%d')}

Please return the equipment as soon as possible to avoid penalties.

Best regards,
Equipment Reservation System
"""

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
            <p>Hello <strong>{user.first_name}</strong>,</p>

            <div class="warning">
                <strong>URGENT:</strong> The equipment you checked out is now overdue for return.
            </div>

            <div>
                <p><strong>Equipment:</strong> {equipment.name}</p>
                <p><strong>Due Date:</strong> {reservation.end_date.strftime('%Y-%m-%d')}</p>
            </div>

            <p>Please return the equipment as soon as possible to avoid penalties.</p>

            <div class="footer">
                <p>Equipment Reservation System</p>
            </div>
        </div>
    </div>
</body>
</html>
"""

    send_email(subject, [user.email], text_body, html_body)


def send_new_reservation_notification_to_admin(admin, reservation, user, equipment):
    """Send email to admin when new reservation is created"""
    subject = f"New Reservation Request - {equipment.name}"

    text_body = f"""
Hello Admin,

A new reservation request has been submitted and requires approval.

Student: {user.first_name} {user.last_name} ({user.username})
Equipment: {equipment.name}
Requested Period: {reservation.start_date.strftime('%Y-%m-%d')} to {reservation.end_date.strftime('%Y-%m-%d')}
Reason: {reservation.reason}

Please review and approve/reject this request.

Best regards,
Equipment Reservation System
"""

    html_body = f"""
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: #007AFF; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }}
        .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }}
        .details {{ background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }}
        .footer {{ text-align: center; margin-top: 30px; color: #999; font-size: 12px; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>New Reservation Request</h1>
        </div>
        <div class="content">
            <p>Hello <strong>Admin</strong>,</p>
            <p>A new reservation request requires your approval.</p>

            <div class="details">
                <p><strong>Student:</strong> {user.first_name} {user.last_name} ({user.username})</p>
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>Equipment:</strong> {equipment.name}</p>
                <p><strong>Category:</strong> {equipment.category}</p>
                <p><strong>Requested Period:</strong> {reservation.start_date.strftime('%Y-%m-%d')} to {reservation.end_date.strftime('%Y-%m-%d')}</p>
                <p><strong>Reason:</strong> {reservation.reason}</p>
            </div>

            <p>Please review and approve/reject this request in the admin dashboard.</p>

            <div class="footer">
                <p>Equipment Reservation System</p>
            </div>
        </div>
    </div>
</body>
</html>
"""

    send_email(subject, [admin.email], text_body, html_body)


def send_2fa_verification_email(user, code, expiry_minutes=10):
    """Send two-factor authentication verification code email"""
    subject = "Your Verification Code - Equipment Reservation System"

    text_body = f"""
Hello {user.first_name},

You are attempting to sign in to the Equipment Reservation System.

Your verification code is: {code}

This code will expire in {expiry_minutes} minutes.

If you did not attempt to sign in, please ignore this email and contact your administrator immediately.

Best regards,
Equipment Reservation System
"""

    html_body = f"""
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: #007AFF; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }}
        .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }}
        .code-box {{ background: white; padding: 30px; text-align: center; border-radius: 8px; margin: 30px 0; border: 2px solid #007AFF; }}
        .code {{ font-size: 36px; font-weight: bold; color: #007AFF; letter-spacing: 8px; font-family: 'Courier New', monospace; }}
        .expiry {{ color: #666; margin-top: 15px; font-size: 14px; }}
        .warning {{ background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }}
        .footer {{ text-align: center; margin-top: 30px; color: #999; font-size: 12px; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔐 Two-Factor Authentication</h1>
        </div>
        <div class="content">
            <p>Hello <strong>{user.first_name}</strong>,</p>
            <p>You are attempting to sign in to the Equipment Reservation System. Please use the verification code below to complete your login:</p>

            <div class="code-box">
                <div class="code">{code}</div>
                <div class="expiry">This code expires in {expiry_minutes} minutes</div>
            </div>

            <div class="warning">
                <strong>⚠️ Security Notice:</strong> If you did not attempt to sign in, please ignore this email and contact your administrator immediately.
            </div>

            <p>For your security, never share this code with anyone.</p>

            <div class="footer">
                <p>Equipment Reservation System</p>
                <p>This is an automated message, please do not reply.</p>
            </div>
        </div>
    </div>
</body>
</html>
"""

    # ============================================================================
    # 🔐 TWO-FACTOR AUTHENTICATION CODE (for development/testing)
    # ============================================================================
    print("\n" + "=" * 80)
    print("║ " + " " * 76 + " ║")
    print(f"║  🔐 2FA VERIFICATION CODE FOR: {user.username} ({user.email})")
    print("║ " + " " * 76 + " ║")
    print(f"║  CODE: {code}")
    print("║ " + " " * 76 + " ║")
    print(f"║  Expires in: {expiry_minutes} minutes")
    print("║ " + " " * 76 + " ║")
    print("=" * 80 + "\n")
    # ============================================================================

    # Send email synchronously for 2FA (critical for login)
    try:
        email_sent = send_email(
            subject, [user.email], text_body, html_body, synchronous=True)

        if not email_sent:
            print(
                "[2FA] ⚠️  Email delivery failed, but verification code is still valid")
            print("[2FA] ℹ️  User can retrieve code from console logs above")
        else:
            print("[2FA] ✓ 2FA verification email sent successfully")
    except Exception as e:
        print(f"[2FA] ✗ Error sending 2FA email: {str(e)}")
        import traceback
        traceback.print_exc()


def send_password_reset_email(user, code, expiry_minutes=10):
    """Send password reset verification code email"""
    subject = "Password Reset Code - Equipment Reservation System"

    text_body = f"""
Hello {user.first_name},

You have requested to reset your password for the Equipment Reservation System.

Your password reset verification code is: {code}

This code will expire in {expiry_minutes} minutes.

If you did not request a password reset, please ignore this email and contact your administrator immediately to secure your account.

Best regards,
Equipment Reservation System
"""

    html_body = f"""
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: #FF6B35; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }}
        .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }}
        .code-box {{ background: white; padding: 30px; text-align: center; border-radius: 8px; margin: 30px 0; border: 2px solid #FF6B35; }}
        .code {{ font-size: 36px; font-weight: bold; color: #FF6B35; letter-spacing: 8px; font-family: 'Courier New', monospace; }}
        .expiry {{ color: #666; margin-top: 15px; font-size: 14px; }}
        .warning {{ background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }}
        .footer {{ text-align: center; margin-top: 30px; color: #999; font-size: 12px; }}
        .info-box {{ background: #e3f2fd; border-left: 4px solid #2196F3; padding: 15px; margin: 20px 0; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔑 Password Reset Request</h1>
        </div>
        <div class="content">
            <p>Hello <strong>{user.first_name}</strong>,</p>
            <p>We received a request to reset your password for the Equipment Reservation System. Please use the verification code below to proceed:</p>

            <div class="code-box">
                <div class="code">{code}</div>
                <div class="expiry">This code expires in {expiry_minutes} minutes</div>
            </div>

            <div class="info-box">
                <strong>📋 Next Steps:</strong>
                <ol style="margin: 10px 0 0 0; padding-left: 20px;">
                    <li>Enter the verification code on the reset page</li>
                    <li>Create a new secure password</li>
                    <li>Confirm your new password</li>
                </ol>
            </div>

            <div class="warning">
                <strong>⚠️ Security Alert:</strong> If you did not request a password reset, please ignore this email and contact your administrator immediately to secure your account.
            </div>

            <p>For your security, never share this code with anyone.</p>

            <div class="footer">
                <p>Equipment Reservation System</p>
                <p>This is an automated message, please do not reply.</p>
            </div>
        </div>
    </div>
</body>
</html>
"""

    # ============================================================================
    # 🔑 PASSWORD RESET CODE (for development/testing)
    # ============================================================================
    print("\n" + "=" * 80)
    print("║ " + " " * 76 + " ║")
    print(f"║  🔑 PASSWORD RESET CODE FOR: {user.username} ({user.email})")
    print("║ " + " " * 76 + " ║")
    print(f"║  CODE: {code}")
    print("║ " + " " * 76 + " ║")
    print(f"║  Expires in: {expiry_minutes} minutes")
    print("║ " + " " * 76 + " ║")
    print("=" * 80 + "\n")
    # ============================================================================

    # Send email synchronously for password reset (critical operation)
    try:
        email_sent = send_email(
            subject, [user.email], text_body, html_body, synchronous=True)

        if not email_sent:
            print(
                "[PASSWORD RESET] ⚠️  Email delivery failed, but verification code is still valid")
            print("[PASSWORD RESET] ℹ️  User can retrieve code from console logs above")
        else:
            print("[PASSWORD RESET] ✓ Password reset email sent successfully")
    except Exception as e:
        print(
            f"[PASSWORD RESET] ✗ Error sending password reset email: {str(e)}")
        import traceback
        traceback.print_exc()
