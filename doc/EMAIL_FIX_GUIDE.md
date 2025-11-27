# Email Authentication Error - Fix Guide

## Current Issue
Gmail is rejecting the credentials with error:
```
535-5.7.8 Username and Password not accepted
```

## What This Means
Your email configuration is correct, but Gmail is not accepting the password. This happens when:
1. Using regular Gmail password instead of App Password
2. App Password is incorrect or expired
3. 2-Factor Authentication not properly enabled

## How to Fix

### Step 1: Enable 2-Factor Authentication
1. Go to https://myaccount.google.com/security
2. Click on "2-Step Verification"
3. Follow the prompts to enable it (if not already enabled)

### Step 2: Generate New App Password
1. Go to https://myaccount.google.com/apppasswords
2. If you don't see this option, make sure 2FA is enabled first
3. Select:
   - **App**: Mail
   - **Device**: Windows Computer (or Other)
4. Click "Generate"
5. **Copy the 16-character password** (it will be shown without spaces)

### Step 3: Update .env File
Open your `.env` file and update the password:

```env
MAIL_USERNAME=kentedoloverio23@gmail.com
MAIL_PASSWORD=xxxx xxxx xxxx xxxx   # Replace with the 16-char App Password
MAIL_DEFAULT_SENDER=kentedoloverio23@gmail.com
```

**Important**:
- Use the 16-character App Password (may have spaces, that's okay)
- Do NOT use your regular Gmail password
- The App Password will look like: `abcd efgh ijkl mnop`

### Step 4: Test Again
Run the test script again:
```bash
python test_email_notifications.py
```

## Alternative: Use Another Email Service

If you don't want to use Gmail, you can use other services:

### Outlook/Hotmail
```env
MAIL_SERVER=smtp-mail.outlook.com
MAIL_PORT=587
MAIL_USE_TLS=True
MAIL_USERNAME=your-email@outlook.com
MAIL_PASSWORD=your-outlook-password
```

### Yahoo Mail
```env
MAIL_SERVER=smtp.mail.yahoo.com
MAIL_PORT=587
MAIL_USE_TLS=True
MAIL_USERNAME=your-email@yahoo.com
MAIL_PASSWORD=your-app-password  # Also requires App Password
```

### Custom SMTP (if available)
```env
MAIL_SERVER=mail.yourdomain.com
MAIL_PORT=587
MAIL_USE_TLS=True
MAIL_USERNAME=noreply@yourdomain.com
MAIL_PASSWORD=your-smtp-password
```

## Testing Connection

Once you update the password, the test script will:
1. Send 4 different email templates to your email
2. Show success/failure for each
3. All emails will be sent to: kentedoloverio23@gmail.com

Check your inbox (and spam folder) for:
- ✓ Reservation Approved Email
- ✗ Reservation Rejected Email
- ⚠️ Equipment Overdue Email
- 📋 New Reservation Request (Admin)

## Next Steps After Fixing

Once emails work:
1. The system will automatically send emails when:
   - Admin approves a reservation → User gets approval email
   - Admin rejects a reservation → User gets rejection email
2. You can add more email triggers as needed
3. All emails use professional HTML templates

## Need Help?

Common issues:
- **"App Passwords" option not showing**: Enable 2FA first
- **Still not working**: Try regenerating the App Password
- **Emails going to spam**: Add your email to contacts first
- **Daily limit reached**: Gmail free accounts limited to ~500 emails/day
