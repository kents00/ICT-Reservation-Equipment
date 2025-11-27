# Two-Factor Authentication (2FA) Implementation

## Overview

Two-factor authentication has been successfully implemented for the Equipment Reservation System. When enabled in system settings, admin users will be required to enter a 6-digit verification code sent to their email address after entering their username and password.

## Features Implemented

### 1. Database Schema Changes
- **New User Fields:**
  - `two_factor_enabled` - Boolean flag (currently unused, reserved for future per-user control)
  - `verification_code` - Stores the current 6-digit verification code
  - `verification_code_expiry` - Timestamp when the code expires (10 minutes)
  - `verification_attempts` - Counter for failed verification attempts
  - `verification_locked_until` - Timestamp when user is locked out due to too many failed attempts

- **System Settings Field:**
  - `two_factor_auth` - Global toggle to enable/disable 2FA for all admin users

### 2. Backend Implementation

#### Routes (`routes/auth.py`)
1. **Modified `/api/auth/login` endpoint:**
   - Checks if 2FA is enabled in SystemSettings
   - Verifies user is an admin
   - Generates and sends 6-digit verification code via email
   - Returns `requires_2fa: true` instead of access token

2. **New `/api/auth/verify-2fa` endpoint:**
   - Validates the 6-digit verification code
   - Checks code expiry (10 minutes)
   - Tracks failed attempts (max 3)
   - Locks account for 5 minutes after 3 failed attempts
   - Returns JWT access token on successful verification

3. **New `/api/auth/resend-2fa` endpoint:**
   - Generates and sends a new verification code
   - Resets the 10-minute expiry timer
   - Checks if user is currently locked out

#### Utilities (`utils/two_factor.py`)
- `generate_verification_code()` - Generates random 6-digit numeric code
- `create_verification_code_for_user()` - Creates and stores code with expiry
- `validate_verification_code()` - Validates code with expiry and attempt tracking
- `clear_verification_code()` - Clears verification data
- `is_user_locked()` - Checks if user is locked out

#### Email Service (`utils/email_service.py`)
- `send_2fa_verification_email()` - Sends styled HTML email with verification code
- Professional email template with clear code display
- 10-minute expiry warning
- Security notice about not sharing the code

### 3. Frontend Implementation

#### Login Flow (`static/js/script.js`, `static/js/auth.js`)
1. User enters username and password
2. If 2FA required, login endpoint returns `requires_2fa: true`
3. 2FA popup is displayed
4. User receives email with verification code
5. User enters 6-digit code in popup
6. Code is validated via `/api/auth/verify-2fa`
7. On success, user receives JWT token and is redirected to dashboard

#### 2FA Popup (`templates/admin/login.html`)
- Modal overlay with professional design
- Six individual input fields for code digits
- Auto-advance to next field on digit entry
- Auto-submit when all 6 digits entered
- Countdown timer showing code expiry (10:00)
- Resend code button
- Cancel button to return to login
- Success/error message display

#### JavaScript Functions (`static/js/auth.js`)
- `show2FAPopup()` - Displays the 2FA modal
- `hide2FAPopup()` - Hides the modal and returns to login
- `submit2FACode()` - Submits verification code for validation
- `resend2FACode()` - Requests a new verification code
- `handle2FAInput()` - Handles input in code fields with auto-advance
- `handle2FAKeydown()` - Handles backspace for moving to previous field
- `start2FACountdown()` - Displays countdown timer
- `show2FAMessage()` - Shows success/error messages

#### Styling (`static/css/styles.css`)
- Modern, clean design matching existing login page
- Smooth animations (fade in, slide up, slide down)
- Responsive code input fields
- Color-coded messages (success: green, error: red)
- Hover and focus effects
- Mobile-friendly design

## Security Features

### Rate Limiting
- Maximum 3 verification attempts per code
- Account locked for 5 minutes after 3 failed attempts
- New code required after lockout expires

### Code Expiry
- Verification codes expire after 10 minutes
- Expired codes cannot be used
- Clear expiry countdown displayed to user

### Email Verification
- Code sent only to registered admin email address
- Email includes security warning
- Masked email displayed in popup (e.g., "ken***@gmail.com")

### Session Management
- Verification user ID stored in sessionStorage (temporary)
- Cleared after successful verification or cancellation
- Separate from main authentication tokens

## Configuration

### Enable 2FA System-Wide

1. Start the Flask backend server:
   ```bash
   cd backend
   python app.py
   ```

2. Login to admin dashboard

3. Navigate to **Settings** page

4. Find the **Security Settings** section

5. Enable the checkbox: **"Require two-factor authentication"**

6. Click **"Save Changes"**

### Test 2FA Flow

1. Logout from admin dashboard

2. Attempt to login with admin credentials

3. After successful password verification:
   - You'll see message: "Verification code sent to your email"
   - 2FA popup will appear
   - Check your email for the 6-digit code

4. Enter the 6-digit code in the popup

5. Click **"Verify"** or wait for auto-submit

6. On success, you'll be redirected to the dashboard

### Disable 2FA

1. Login to admin dashboard (with 2FA if enabled)

2. Go to **Settings**

3. Uncheck **"Require two-factor authentication"**

4. Click **"Save Changes"**

## Files Created/Modified

### New Files Created
1. `backend/migrate_add_2fa_fields.py` - Database migration script
2. `backend/utils/two_factor.py` - 2FA utility functions
3. `backend/verify_2fa_setup.py` - Setup verification script
4. `backend/test_2fa_setup.py` - Comprehensive test script

### Files Modified
1. `backend/models.py` - Added 2FA fields to User model
2. `backend/routes/auth.py` - Modified login, added verify/resend endpoints
3. `backend/utils/email_service.py` - Added 2FA email template
4. `backend/static/js/auth.js` - Added 2FA popup functions
5. `backend/static/js/script.js` - Modified handleLogin for 2FA
6. `backend/templates/admin/login.html` - Added 2FA popup HTML
7. `backend/static/css/styles.css` - Added 2FA popup styles

## Database Migration

The migration was successfully executed:
```bash
python migrate_add_2fa_fields.py
```

**Results:**
- ✓ Added 'two_factor_enabled' column to users table
- ✓ Added 'verification_code' column to users table
- ✓ Added 'verification_code_expiry' column to users table
- ✓ Added 'verification_attempts' column to users table
- ✓ Added 'verification_locked_until' column to users table

## Email Configuration

The system uses the existing email configuration:
- **SMTP Server:** smtp.gmail.com
- **Port:** 587
- **TLS:** Enabled
- **Sender:** kent.arts.me@gmail.com

Ensure your email credentials are properly configured in the Flask app environment variables or configuration file.

## API Endpoints

### POST /api/auth/login
**Request:**
```json
{
  "username": "admin1",
  "password": "password123"
}
```

**Response (2FA Required):**
```json
{
  "message": "Verification code sent to your email",
  "requires_2fa": true,
  "user_id": "uuid-here",
  "email": "ken***@gmail.com"
}
```

**Response (No 2FA):**
```json
{
  "message": "Login successful",
  "access_token": "jwt-token-here",
  "user": { ... }
}
```

### POST /api/auth/verify-2fa
**Request:**
```json
{
  "user_id": "uuid-here",
  "code": "123456"
}
```

**Response (Success):**
```json
{
  "message": "Verification successful",
  "access_token": "jwt-token-here",
  "user": { ... }
}
```

**Response (Error):**
```json
{
  "error": "Invalid verification code. 2 attempts remaining.",
  "attempts_remaining": 2,
  "locked": false,
  "expired": false
}
```

### POST /api/auth/resend-2fa
**Request:**
```json
{
  "user_id": "uuid-here"
}
```

**Response:**
```json
{
  "message": "Verification code sent successfully",
  "email": "ken***@gmail.com"
}
```

## User Experience

### Login Without 2FA
1. Enter username and password
2. Click "Sign In"
3. Redirected to dashboard immediately

### Login With 2FA Enabled
1. Enter username and password
2. Click "Sign In"
3. See success message: "Verification code sent to your email"
4. 2FA popup appears with:
   - 6 input fields for code digits
   - Countdown timer (10:00)
   - Resend button
   - Cancel button
5. Check email for 6-digit code
6. Enter code (auto-advances between fields)
7. Code auto-submits when complete
8. On success, redirected to dashboard
9. On error, see error message with attempts remaining

### Error Scenarios
- **Invalid Code:** "Invalid verification code. X attempts remaining."
- **Expired Code:** "Code expired. Please request a new code."
- **Too Many Attempts:** "Too many failed attempts. Account locked for 5 minutes."
- **Network Error:** "Network error. Please try again."

## Future Enhancements

### Potential Improvements
1. **Per-User 2FA Toggle:** Allow individual admins to enable/disable their own 2FA
2. **Backup Codes:** Generate one-time backup codes for account recovery
3. **Authenticator App Support:** Add TOTP (Time-based One-Time Password) support
4. **SMS Verification:** Option to receive codes via SMS
5. **Remember Device:** Option to skip 2FA on trusted devices for 30 days
6. **2FA Setup Wizard:** Guided setup process for first-time 2FA users
7. **Activity Log:** Track 2FA verification attempts and successes
8. **Admin Notifications:** Email admins on suspicious login attempts

## Troubleshooting

### Code Not Received
1. Check spam/junk folder
2. Verify email server configuration
3. Check Flask logs for email errors
4. Click "Resend Code" button

### Code Expired
1. Click "Resend Code" to get a new code
2. Enter new code within 10 minutes

### Account Locked
1. Wait 5 minutes for lockout to expire
2. Try again with correct code
3. Contact system administrator if issue persists

### 2FA Toggle Not Working
1. Check SystemSettings table in database
2. Verify admin role permissions
3. Check browser console for JavaScript errors
4. Verify backend is running and accessible

## Testing Checklist

- [x] Database migration completed
- [x] User model has all 2FA fields
- [x] SystemSettings has two_factor_auth toggle
- [x] Backend endpoints respond correctly
- [x] Email service sends verification codes
- [x] Frontend popup displays correctly
- [x] Code input fields work properly
- [x] Auto-advance between input fields works
- [x] Countdown timer displays and counts down
- [x] Resend code functionality works
- [x] Code validation works
- [x] Failed attempt tracking works
- [x] Account lockout works (5 minutes)
- [x] Code expiry works (10 minutes)
- [x] Success flow redirects to dashboard
- [x] Error messages display correctly
- [x] Cancel button returns to login
- [x] Remember Me works with 2FA
- [x] CSS styling matches design
- [x] Mobile responsive design

## Support

For issues or questions about the 2FA implementation:
1. Check the troubleshooting section above
2. Review Flask backend logs
3. Check browser console for frontend errors
4. Verify database schema with `verify_2fa_setup.py`

## Version History

### v1.0 (Initial Implementation)
- Database schema updates
- Backend authentication flow with 2FA
- Frontend popup modal
- Email notification system
- Rate limiting and security features
- Full styling and animations
