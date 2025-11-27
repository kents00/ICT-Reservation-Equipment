# Email Notifications Setup Guide

This guide explains how to configure email notifications for the Equipment Reservation System.

## Overview

The system sends automated email notifications for:
- **Reservation Approved** - When admin approves a reservation request
- **Reservation Rejected** - When admin rejects a reservation request
- **Equipment Overdue** - When borrowed equipment is not returned by due date
- **New Reservation** - Notifies admins of new reservation requests

## Configuration

### Environment Variables

Add the following to your `.env` file or set as environment variables:

```env
# Email Configuration
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=True
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_DEFAULT_SENDER=your-email@gmail.com
```

### Using Gmail

1. **Enable 2-Factor Authentication**
   - Go to your Google Account settings
   - Navigate to Security
   - Enable 2-Step Verification

2. **Generate App Password**
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" and "Windows Computer" (or Other)
   - Copy the 16-character password
   - Use this as `MAIL_PASSWORD` (not your regular password)

### Using Other Email Providers

#### Outlook/Office 365
```env
MAIL_SERVER=smtp.office365.com
MAIL_PORT=587
MAIL_USE_TLS=True
MAIL_USERNAME=your-email@outlook.com
MAIL_PASSWORD=your-password
```

#### Custom SMTP Server
```env
MAIL_SERVER=mail.yourdomain.com
MAIL_PORT=587
MAIL_USE_TLS=True
MAIL_USERNAME=noreply@yourdomain.com
MAIL_PASSWORD=your-smtp-password
```

## Testing Email Configuration

### Test with Python

Create a test script `test_email.py`:

```python
from flask import Flask
from flask_mail import Mail, Message
from dotenv import load_dotenv
import os

load_dotenv()

app = Flask(__name__)
app.config['MAIL_SERVER'] = os.getenv('MAIL_SERVER', 'smtp.gmail.com')
app.config['MAIL_PORT'] = int(os.getenv('MAIL_PORT', 587))
app.config['MAIL_USE_TLS'] = os.getenv('MAIL_USE_TLS', 'True') == 'True'
app.config['MAIL_USERNAME'] = os.getenv('MAIL_USERNAME')
app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASSWORD')
app.config['MAIL_DEFAULT_SENDER'] = os.getenv('MAIL_DEFAULT_SENDER')

mail = Mail(app)

with app.app_context():
    msg = Message(
        subject='Test Email - Equipment Reservation System',
        recipients=['test@example.com'],  # Replace with your email
        body='If you receive this, email configuration is working!'
    )
    try:
        mail.send(msg)
        print('✓ Email sent successfully!')
    except Exception as e:
        print(f'✗ Error sending email: {str(e)}')
```

Run: `python test_email.py`

## Email Templates

All email templates are defined in `utils/email_service.py` with:
- Inline CSS styling for compatibility
- Responsive design
- Professional branding

### Customizing Templates

Edit the HTML templates in `utils/email_service.py`:

```python
def send_reservation_approved_email(...):
    html_body = '''
    <!-- Customize HTML here -->
    '''
```

## Troubleshooting

### Common Issues

**1. Authentication Failed**
- Verify username/password are correct
- For Gmail, use App Password (not regular password)
- Check 2FA is enabled for Gmail

**2. Connection Refused**
- Verify MAIL_SERVER and MAIL_PORT
- Check firewall/antivirus settings
- Try port 465 with `MAIL_USE_SSL=True` instead

**3. Emails Not Arriving**
- Check spam/junk folders
- Verify MAIL_DEFAULT_SENDER is valid
- Check email provider sending limits

**4. SSL/TLS Errors**
```python
# For development/testing only:
app.config['MAIL_USE_SSL'] = False
app.config['MAIL_USE_TLS'] = False
```

### Debug Mode

Enable debug logging in `app.py`:

```python
app.config['MAIL_DEBUG'] = True  # Add this line
```

## Production Considerations

### Security
- Never commit `.env` file with credentials
- Use environment variables on production server
- Rotate passwords regularly
- Use dedicated email account for system notifications

### Rate Limiting
- Gmail: ~500 emails/day for free accounts
- Consider using SendGrid, Mailgun, or AWS SES for high volume

### Monitoring
- Log all email send attempts
- Track delivery failures
- Set up alerts for email service downtime

## Email Service Functions

Available in `utils/email_service.py`:

```python
# Send approval email
send_reservation_approved_email(
    reservation_id, user_email, user_name,
    equipment_name, start_date, end_date, admin_notes
)

# Send rejection email
send_reservation_rejected_email(
    reservation_id, user_email, user_name,
    equipment_name, rejection_reason
)

# Send overdue notice
send_equipment_overdue_email(
    reservation_id, user_email, user_name,
    equipment_name, due_date, days_overdue
)

# Notify admin of new reservation
send_new_reservation_notification_to_admin(
    reservation_id, admin_email, user_name,
    equipment_name, start_date, end_date
)
```

## Current Implementation

Email notifications are currently sent at:
- `routes/admin.py:approve_reservation()` - After approval
- `routes/admin.py:reject_reservation()` - After rejection

To add more email triggers, import from `utils/email_service` and call the appropriate function after `db.session.commit()`.

## Next Steps

Optional enhancements:
1. Add admin notification for new reservations
2. Schedule daily task for overdue equipment emails
3. Add email preferences to user profile
4. Implement email templates from files instead of inline
5. Add unsubscribe functionality
