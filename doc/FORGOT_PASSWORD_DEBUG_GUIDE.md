# Forgot Password Debug Logging Guide

## Overview
Comprehensive debug logging has been added to the forgot password flow. When a user clicks "Forgot Password", you will now see detailed logs in the terminal showing every step of the process.

## What to Look For in Terminal Logs

### 1. **Initial Request Received**
```
====================================================================================================
[FORGOT PASSWORD] REQUEST RECEIVED
====================================================================================================
[FORGOT PASSWORD] Request data received
[FORGOT PASSWORD] Looking for user with email: user@example.com
[FORGOT PASSWORD] ✓ User found: username
```

### 2. **Verification Code Generation**
```
[FORGOT PASSWORD] Generating verification code for user: user-id-uuid
[FORGOT PASSWORD] ✓ Verification code generated: 123456
[FORGOT PASSWORD] Code expires at: 2025-12-03 18:05:00.000000
[FORGOT PASSWORD] Reset token generated (length: 43)
[FORGOT PASSWORD] ✓ Verification code stored in database
```

### 3. **Email Preparation and Sending**
```
====================================================================================================
[PASSWORD RESET] SENDING EMAIL
[PASSWORD RESET] To: user@example.com
[PASSWORD RESET] User: username
[PASSWORD RESET] VERIFICATION CODE: 123456
[PASSWORD RESET] Valid for: 10 minutes (until 2025-12-03 18:05:00.000000)
====================================================================================================

════════════════════════════════════════════════════════════════════════════════════════════════════
[EMAIL::PREPARE] PREPARING EMAIL
════════════════════════════════════════════════════════════════════════════════════════════════════
[EMAIL::PREPARE] Subject: Password Reset Code - Equipment Reservation System
[EMAIL::PREPARE] Recipients: ['user@example.com']
[EMAIL::PREPARE] Mode: SYNCHRONOUS (immediate)
[EMAIL::PREPARE] Text body length: 315 chars
[EMAIL::PREPARE] HTML body length: 2847 chars
[EMAIL::PREPARE] ✓ Got Flask app context
[EMAIL::PREPARE] ✓ Message object created
[EMAIL::QUEUE] Sending SYNCHRONOUSLY (waiting for completion)...
```

### 4. **SMTP Connection Details**
```
[EMAIL::SEND_ASYNC] Starting async email send
[EMAIL::SEND_ASYNC] Recipients: ['user@example.com']
[EMAIL::SEND_ASYNC] Subject: Password Reset Code - Equipment Reservation System
[EMAIL::CONFIG] Mail server: smtp.gmail.com
[EMAIL::CONFIG] Mail port: 587
[EMAIL::CONFIG] Mail username: kent.arts.me@gmail.com
[EMAIL::CONFIG] Mail use TLS: True
[EMAIL::CONFIG] Mail suppress send: False
[EMAIL::ATTEMPT] Calling mail.send()...
```

### 5. **Email Sent Successfully**
```
[EMAIL::SUCCESS] ✓ Email sent successfully to: ['user@example.com']
[EMAIL::SUCCESS] Subject: Password Reset Code - Equipment Reservation System

[EMAIL::QUEUE] ✓ Synchronous send completed
[EMAIL::RESULT] ✓ Email prepared and queued successfully
════════════════════════════════════════════════════════════════════════════════════════════════════

[FORGOT PASSWORD] ✓ Email sending completed
[FORGOT PASSWORD] ✓ SUCCESS - Returning response to frontend
════════════════════════════════════════════════════════════════════════════════════════════════════
```

## Possible Issues and Their Debug Signs

### Issue: User Not Found
```
[FORGOT PASSWORD] Looking for user with email: nonexistent@example.com
[FORGOT PASSWORD] ⚠️  User not found with email: nonexistent@example.com (returning generic success for security)
```
**Action**: Check that the email exists in the database

### Issue: Email Not Configured
```
[EMAIL::CONFIG] Mail server: None
[EMAIL::CONFIG] Mail port: None
[EMAIL::CONFIG] Mail username: None
```
**Action**: Check `.env` file has MAIL_SERVER, MAIL_PORT, MAIL_USERNAME, MAIL_PASSWORD

### Issue: Network Error (SMTP Unreachable)
```
[EMAIL::ERROR::NETWORK] ✗ Network error - email not sent: [Errno -2] Name or service not known
[EMAIL::ERROR::NETWORK] ℹ️  Email was intended for: ['user@example.com']
[EMAIL::ERROR::NETWORK] ℹ️  This usually means SMTP server is unreachable
```
**Action**: Check internet connection, verify MAIL_SERVER (smtp.gmail.com) is reachable

### Issue: Authentication Failed
```
[EMAIL::ERROR::EXCEPTION] ✗ Failed to send email: 535 5.7.8 Username and Password not accepted
```
**Action**: Verify MAIL_USERNAME and MAIL_PASSWORD in `.env` file. For Gmail, use app-specific password

### Issue: Email Suppressed
```
[EMAIL::WARNING] ⚠️  MAIL_SUPPRESS_SEND is enabled - email will NOT be sent
```
**Action**: Check if MAIL_SUPPRESS_SEND is accidentally enabled in Flask config

## Frontend vs Backend Timing

The forgot password flow works like this:

1. **User clicks "Forgot Password" button** → Form submitted to `/api/auth/forgot-password`
2. **Backend processes request** → Terminal shows debug logs (Steps 1-5 above)
3. **Email is sent synchronously** → System waits for email to be sent before responding
4. **Frontend receives response** → User sees success message
5. **Frontend shows verification popup** → User can enter code

All of this should happen in **under 5 seconds** if email is working properly.

## Testing the Flow

To test forgot password manually:

1. Keep terminal window visible
2. Open forgot-password page in browser
3. Enter an email address that exists in the database
4. Click "Send Reset Code"
5. **Watch terminal for debug logs** - you should see all 5 sections above
6. **Check inbox** - Email should arrive within a few seconds
7. **Enter code** - Copy code from email (or from terminal log) and enter it in the popup

## Verification Code in Terminal

The verification code is always printed in the terminal for development/testing:

```
[FORGOT PASSWORD] ✓ Verification code generated: 123456
```

You can copy this directly if email is not working.

## Performance Notes

- Password reset emails are sent **SYNCHRONOUSLY** (immediate, not in background)
- Other notification emails are sent **ASYNCHRONOUSLY** (background threads)
- Synchronous mode ensures the code is definitely sent before the frontend continues
- If email takes >5 seconds, check network/SMTP server status

## Troubleshooting Steps

1. **Check terminal logs** - All debug messages are printed
2. **Verify email config** - Run: `python utils/checks/test_password_reset_email.py`
3. **Check database** - Verify user exists: `SELECT * FROM user WHERE email = 'user@example.com';`
4. **Check inbox** - Look in both Inbox and Spam folders
5. **Copy code from terminal** - For testing, use the code from terminal logs

## Debug Log Format

All logs follow this format:
```
[COMPONENT::SECTION] [Status] Message
```

Components:
- `FORGOT PASSWORD` - Main forgot password endpoint
- `PASSWORD RESET` - Password reset email sending
- `EMAIL::PREPARE` - Email preparation
- `EMAIL::QUEUE` - Email queueing
- `EMAIL::SEND_ASYNC` - Async email sending
- `EMAIL::CONFIG` - SMTP configuration
- `EMAIL::SUCCESS` - Successful send
- `EMAIL::ERROR` - Error states

Status symbols:
- `✓` - Success
- `✗` - Error/Failure
- `⚠️` - Warning
- `ℹ️` - Information
