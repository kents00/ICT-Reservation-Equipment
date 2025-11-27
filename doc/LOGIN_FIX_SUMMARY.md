# Login Authentication Fix - Summary

## Problem Identified

Your React Native app was appearing to login with any credentials because the API calls were **failing silently**. The issue is that `localhost` doesn't work the same way in React Native as it does in web browsers.

### Platform-Specific Networking

| Platform | localhost Behavior | Solution |
|----------|-------------------|----------|
| **Web** | Works normally | `http://localhost:5000` |
| **Android Emulator** | Does NOT work | Use `http://10.0.2.2:5000` |
| **iOS Simulator** | Works normally | `http://localhost:5000` |
| **Physical Device** | Does NOT work | Use computer's actual IP (e.g., `http://192.168.1.100:5000`) |

## Changes Made

### 1. Created Platform-Aware API Configuration
**File**: `frontend/src/config/api.ts`
- Automatically detects the platform (Android/iOS/Web)
- Returns the correct API URL for each platform
- Includes a health check function to test connectivity

### 2. Updated Login Screen
**File**: `frontend/src/screens/LoginScreen.tsx`
- Now imports `API_BASE_URL` from config (instead of hardcoded localhost)
- Added detailed console logging for debugging
- Added better error messages with troubleshooting tips
- Added "Test Backend Connection" button to verify API reachability

### 3. Updated Equipment List Screen
**File**: `frontend/src/screens/EquipmentListScreen.tsx`
- Now imports `API_BASE_URL` from config
- Will use correct URL based on platform

### 4. Added Backend Health Check
**File**: `backend/app.py`
- Added `/api/health` endpoint for connectivity testing
- Returns `{"status": "ok", "message": "API is running"}`

### 5. Created Test Utilities
**File**: `frontend/src/utils/apiTest.ts`
- `testApiConnection()`: Tests if backend is reachable
- `testLoginEndpoint()`: Tests login with credentials
- `runAllTests()`: Comprehensive test suite

### 6. Created Documentation
**File**: `frontend/TROUBLESHOOTING.md`
- Complete troubleshooting guide
- Platform-specific instructions
- Debugging commands
- Common issues and solutions

## How to Use

### Testing the Fix

#### Step 1: Ensure Backend is Running
```powershell
cd "c:\Users\kente\Programs\Equipment Reservation\backend"
python app.py
```

Backend should show:
```
* Running on http://127.0.0.1:5000
```

#### Step 2: Verify Backend Health
```powershell
# Test health endpoint
Invoke-WebRequest -Uri http://localhost:5000/api/health | Select-Object -ExpandProperty Content
```

Should return:
```json
{"status":"ok","message":"API is running"}
```

#### Step 3: Run the Frontend

**For Android Emulator:**
```bash
cd "c:\Users\kente\Programs\Equipment Reservation\frontend"
npx expo start --android
```

**For Web (for quick testing):**
```bash
npx expo start --web
```

#### Step 4: Test Connection in the App
1. Open the login screen
2. Click the new **"🔍 Test Backend Connection"** button
3. You should see a success message with API status

#### Step 5: Try Logging In

**With Invalid Credentials:**
- Username: `test`
- Password: `wrong`
- Should see: "Invalid credentials" error from backend

**With Valid Credentials:**
- Create a test user first (see below)
- Should successfully login and navigate to equipment list

## Creating a Test User

```powershell
cd "c:\Users\kente\Programs\Equipment Reservation\backend"
python
```

```python
from app import create_app
from extensions import db
from models import User, UserRole

app = create_app()
with app.app_context():
    # Check if user exists
    existing = User.query.filter_by(username='testuser').first()
    if existing:
        print("User already exists!")
    else:
        user = User(
            username='testuser',
            email='test@example.com',
            first_name='Test',
            last_name='User',
            role=UserRole.USER
        )
        user.set_password('testpass123')
        db.session.add(user)
        db.session.commit()
        print(f"Created user: {user.username}")
```

Then login with:
- **Username**: `testuser`
- **Password**: `testpass123`

## For Physical Devices

If testing on a physical phone/tablet:

### 1. Find Your Computer's IP Address
```powershell
ipconfig
```

Look for "IPv4 Address" (usually something like `192.168.1.100`)

### 2. Update API Configuration

Edit `frontend/src/config/api.ts`:

```typescript
const getApiBaseUrl = (): string => {
  // For web platform, use localhost
  if (Platform.OS === 'web') {
    return 'http://localhost:5000/api';
  }

  // For mobile platforms with physical devices
  // REPLACE THIS WITH YOUR COMPUTER'S IP ADDRESS
  const YOUR_COMPUTER_IP = '192.168.1.100';  // <-- Change this!

  if (Platform.OS === 'android' || Platform.OS === 'ios') {
    return `http://${YOUR_COMPUTER_IP}:5000/api`;
  }

  return 'http://localhost:5000/api';
};
```

### 3. Allow Firewall Access

Make sure Windows Firewall allows connections on port 5000.

## Verification Checklist

- [ ] Backend running on port 5000
- [ ] Health endpoint returns success: `http://localhost:5000/api/health`
- [ ] Frontend using correct API URL for platform
- [ ] "Test Backend Connection" button shows success
- [ ] Login with invalid credentials shows error
- [ ] Login with valid credentials succeeds and navigates
- [ ] Token stored in AsyncStorage
- [ ] Equipment list fetches data from backend

## Common Issues

### Issue: "Connection Error" Alert
**Cause**: Backend not reachable from app
**Solution**:
- Verify backend is running
- Check correct IP/URL for your platform
- Test with "Test Backend Connection" button

### Issue: Login succeeds with wrong password
**Cause**: API call is failing, not reaching backend
**Solution**:
- Check console logs for errors
- Use "Test Backend Connection" button
- Verify `API_BASE_URL` is correct

### Issue: CORS errors
**Cause**: Backend rejecting requests from your IP
**Solution**:
- Backend already has CORS enabled for all origins in development
- If still getting errors, check backend CORS configuration

## Console Logs to Watch For

When you click login, you should see:
```
Attempting login with: testuser
API URL: http://10.0.2.2:5000/api/auth/login
Response status: 200
Response ok: true
Response data: {access_token: "...", user: {...}}
Login successful: {user: "testuser", role: "user"}
```

If you see network errors, the backend isn't reachable.

## Next Steps

1. Start the backend server
2. Run the app in Android emulator or web
3. Click "Test Backend Connection" button
4. If successful, try logging in with test credentials
5. Monitor console logs for any errors

The login will now ONLY succeed if:
- Backend is running
- Credentials are valid in the database
- JWT token is successfully returned

No more mock logins! 🎉
