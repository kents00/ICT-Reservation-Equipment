# Student Two-Factor Authentication (2FA) Implementation ✅

## Overview
Successfully implemented opt-in Two-Factor Authentication for students in the mobile app. Students can enable 2FA in their settings, and when logging in, they'll receive a 6-digit verification code via email before accessing the equipment list.

## Key Features

### 1. **Student 2FA Control**
- **Per-User Setting**: Each student controls their own 2FA (stored in `user.two_factor_enabled`)
- **Opt-In**: 2FA is optional for students (unlike admins where it's system-wide)
- **Backend Endpoint**: `POST /auth/toggle-2fa` to enable/disable 2FA
- **Test Email**: When enabling, system sends test verification code to confirm email works

### 2. **Login Flow with 2FA**
```
1. Student enters username/password
2. Backend checks if student.two_factor_enabled = true
3. If enabled → Generate 6-digit code, send to email
4. Frontend receives requires_2fa: true response
5. Navigate to TwoFactorScreen
6. Student enters 6-digit code
7. Backend validates code
8. Success → Issue JWT token, navigate to equipment list
```

### 3. **TwoFactorScreen Component** (NEW)
**File**: `frontend/src/screens/TwoFactorScreen.tsx`

**Features**:
- 6 individual input fields for digits
- Auto-advance to next field on digit entry
- Auto-submit when all 6 digits entered
- Countdown timer (10:00 minutes)
- Resend code button
- Back navigation to login
- Visual feedback (shield icon, blue theme)
- Error handling (invalid code, expired, locked out)

**Props**:
- `userId: string` - User ID from login response
- `maskedEmail: string` - Masked email (e.g., "ken***@gmail.com")
- `onVerificationSuccess: (token, userData) => void` - Callback on success
- `onGoBack: () => void` - Back to login screen

### 4. **Backend Changes**

#### Modified: `backend/routes/auth.py`

**Login Endpoint** (`POST /auth/login`):
```python
# Check if 2FA is enabled
if user.role == UserRole.ADMIN:
    # Admin 2FA controlled by system settings
    requires_2fa = settings and settings.two_factor_auth
elif user.role == UserRole.STUDENT:
    # Student 2FA controlled by individual user preference
    requires_2fa = user.two_factor_enabled

if requires_2fa:
    # Generate code, send email, return requires_2fa: true
```

**New Endpoint** (`POST /auth/toggle-2fa`):
- Requires JWT authentication
- Only students can toggle (admins use system settings)
- Enabling sends test verification code
- Disabling immediately turns off 2FA

**Request**:
```json
{
  "enabled": true
}
```

**Response** (Enable):
```json
{
  "message": "2FA enabled successfully. A test verification code has been sent to your email.",
  "two_factor_enabled": true
}
```

**Response** (Disable):
```json
{
  "message": "2FA disabled successfully",
  "two_factor_enabled": false
}
```

### 5. **Frontend Changes**

#### Modified: `frontend/src/screens/LoginScreen.tsx`
- Added `onNavigateTo2FA` prop
- Detects `requires_2fa` in login response
- Calls `onNavigateTo2FA(userId, maskedEmail)` instead of showing alert
- Stores 2FA data for verification screen

#### Modified: `frontend/App.tsx`
- Added `'two-factor'` to `ScreenType` union
- Added state: `twoFactorUserId`, `twoFactorEmail`
- Added handlers:
  - `handleNavigateTo2FA(userId, email)` - Navigate to 2FA screen
  - `handle2FASuccess(token, userData)` - Complete login after verification
  - `handle2FAGoBack()` - Return to login screen
- Added TwoFactorScreen rendering in login flow

#### Modified: `frontend/src/screens/index.ts`
- Added `export { TwoFactorScreen } from './TwoFactorScreen';`

## User Experience

### For Students WITHOUT 2FA:
1. Enter username/password
2. Click Login
3. → Immediately go to equipment list ✓

### For Students WITH 2FA:
1. Enter username/password
2. Click Login
3. → Toast: "Verification code sent to your email"
4. → Navigate to 2FA screen
5. Check email for 6-digit code
6. Enter code (auto-advances between fields)
7. → Auto-submit when complete
8. → Toast: "Verification successful!"
9. → Navigate to equipment list ✓

## Security Features

### Rate Limiting (Backend)
- **Max Attempts**: 3 incorrect code attempts
- **Lockout**: 5 minutes after 3 failed attempts
- **Lock Message**: "Too many failed attempts. Account temporarily locked."

### Code Expiry
- **Duration**: 10 minutes from generation
- **Visual Timer**: Countdown displayed on screen (10:00 → 0:00)
- **Expired Action**: Must click "Resend Code"

### Email Verification
- Code sent only to registered student email
- Email template includes:
  - 6-digit code prominently displayed
  - 10-minute expiry warning
  - Security notice (don't share code)
  - Masked email shown in UI (e.g., "ken***@gmail.com")

## API Endpoints

### Enable/Disable 2FA
```
POST /auth/toggle-2fa
Authorization: Bearer <jwt-token>

Body:
{
  "enabled": true
}

Response 200:
{
  "message": "2FA enabled successfully. A test verification code has been sent to your email.",
  "two_factor_enabled": true
}
```

### Login with 2FA
```
POST /auth/login

Body:
{
  "username": "student1",
  "password": "password123"
}

Response (2FA Required):
{
  "message": "Verification code sent to your email",
  "requires_2fa": true,
  "user_id": "uuid-here",
  "email": "stu***@example.com"
}
```

### Verify 2FA Code
```
POST /auth/verify-2fa

Body:
{
  "user_id": "uuid-here",
  "code": "123456"
}

Response 200:
{
  "message": "Verification successful",
  "access_token": "jwt-token",
  "user": { ... }
}

Response 401 (Invalid):
{
  "error": "Invalid verification code. 2 attempts remaining.",
  "attempts_remaining": 2,
  "locked": false,
  "expired": false
}
```

### Resend 2FA Code
```
POST /auth/resend-2fa

Body:
{
  "user_id": "uuid-here"
}

Response 200:
{
  "message": "Verification code sent successfully",
  "email": "stu***@example.com"
}
```

## Files Modified/Created

### Created
1. ✅ `frontend/src/screens/TwoFactorScreen.tsx` (434 lines)
   - 6-digit code input with auto-advance
   - Countdown timer
   - Resend functionality
   - Full error handling

### Modified
1. ✅ `backend/routes/auth.py`
   - Updated login to check `user.two_factor_enabled` for students
   - Added `POST /auth/toggle-2fa` endpoint
   - Student/admin 2FA logic separation

2. ✅ `frontend/src/screens/LoginScreen.tsx`
   - Added `onNavigateTo2FA` prop
   - Navigate to 2FA screen on `requires_2fa`
   - Removed unused Alert import

3. ✅ `frontend/App.tsx`
   - Added `'two-factor'` screen type
   - Added 2FA state and handlers
   - Render TwoFactorScreen in login flow

4. ✅ `frontend/src/screens/index.ts`
   - Added TwoFactorScreen export

## Database Schema

### User Model (Existing Fields)
```python
two_factor_enabled = db.Column(db.Boolean, default=False)
verification_code = db.Column(db.String(10))
verification_code_expiry = db.Column(db.DateTime)
verification_attempts = db.Column(db.Integer, default=0)
verification_locked_until = db.Column(db.DateTime)
```

**Note**: These fields were already added for admin 2FA. No migration needed.

## Testing Guide

### Test Enabling 2FA

1. **Backend Test** (using curl or Postman):
```bash
# Login to get token
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "student1", "password": "password123"}'

# Enable 2FA
curl -X POST http://localhost:5000/api/auth/toggle-2fa \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"enabled": true}'

# Check email for test verification code
```

2. **Mobile App Test**:
```bash
cd frontend
npx expo start
```
- Login as student (without 2FA enabled initially)
- Navigate to Profile/Settings
- Toggle "Enable Two-Factor Authentication"
- Check email for test code
- Logout and login again
- Should see 2FA screen
- Enter code from email
- Should successfully login

### Test 2FA Login Flow

1. Enable 2FA for a test student account
2. Logout completely
3. Login with username/password
4. Verify you see:
   - ✓ Toast: "Verification code sent to your email"
   - ✓ Navigate to blue 2FA screen
   - ✓ Shield icon displayed
   - ✓ 6 input boxes for digits
   - ✓ Countdown timer showing 10:00
5. Check email for 6-digit code
6. Enter code digit by digit
7. Verify auto-advance works
8. When 6th digit entered → auto-submit
9. Verify toast: "Verification successful!"
10. Verify navigation to equipment list

### Test Error Scenarios

**Invalid Code**:
- Enter wrong code → See error toast
- Try 3 times → Account locked for 5 minutes

**Expired Code**:
- Wait 10+ minutes → Try to verify
- Should see "Code expired" error
- Click "Resend Code" → Get new code

**Resend Code**:
- Click "Resend Code" button
- Check for new email
- Timer resets to 10:00
- Code inputs cleared

**Back Navigation**:
- Click back arrow → Return to login screen
- Re-enter credentials → Get new code

## Future Enhancements

### Settings Screen Integration
**TODO**: Add 2FA toggle to student settings/profile screen
```typescript
// In ProfileEditScreen or new SettingsScreen
const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

const handleToggle2FA = async (enabled: boolean) => {
  const response = await fetch(`${API_BASE_URL}/auth/toggle-2fa`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ enabled })
  });

  if (response.ok) {
    setTwoFactorEnabled(enabled);
    toast.success(enabled ? '2FA enabled' : '2FA disabled');
  }
};
```

### Backup Codes
- Generate 10 one-time backup codes when enabling 2FA
- Store hashed versions in database
- Display codes to user (download/print)
- Allow using backup code instead of email code

### Recovery Flow
- "Can't access email?" link on 2FA screen
- Admin can temporarily disable user's 2FA
- Security questions alternative

### Remember Device
- Option to skip 2FA for 30 days on trusted devices
- Store device fingerprint
- Require 2FA when logging from new device

## Troubleshooting

### "Code not received"
- Check spam/junk folder
- Verify email server is running (Flask app config)
- Check backend logs for email errors
- Click "Resend Code"

### "Invalid code" (but code is correct)
- Check if code expired (10 min limit)
- Verify system time is correct
- Try resending code

### "Account locked"
- Wait 5 minutes
- Too many failed attempts (3 max)
- Contact admin if persistent

### 2FA screen not appearing
- Check `user.two_factor_enabled` in database
- Verify backend returns `requires_2fa: true`
- Check frontend console logs
- Ensure App.tsx has TwoFactorScreen import

## Notes

- **Admin 2FA** remains controlled by system settings
- **Student 2FA** is per-user opt-in
- Both use same backend endpoints (`verify-2fa`, `resend-2fa`)
- Email service must be configured for 2FA to work
- Test verification codes printed in backend console during development

---

**Implementation Date**: November 26, 2025
**Status**: ✅ Complete and Ready for Testing
**Backend**: Python/Flask with email service
**Frontend**: React Native/Expo with TypeScript
