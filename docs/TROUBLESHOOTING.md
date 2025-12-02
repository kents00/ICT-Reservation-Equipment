# Login Authentication Troubleshooting Guide

## Issue: Login Working Without Backend Validation

The issue you're experiencing is likely due to **React Native's networking limitations** with `localhost`.

## Root Cause

When running a React Native/Expo app:
- **Web platform**: `localhost` works fine
- **Android Emulator**: `localhost` does NOT work - needs `10.0.2.2`
- **iOS Simulator**: `localhost` works
- **Physical Device**: Needs your computer's actual IP address (e.g., `192.168.1.100`)

## Solution Implemented

### 1. Platform-Aware API Configuration

Created `src/config/api.ts` that automatically detects the platform and uses the correct URL:
- Web: `http://localhost:5000/api`
- Android: `http://10.0.2.2:5000/api`
- iOS: `http://localhost:5000/api`

### 2. Updated Screens

Both `LoginScreen.tsx` and `EquipmentListScreen.tsx` now import `API_BASE_URL` from the config.

### 3. Added Health Check Endpoint

Backend now has `/api/health` endpoint to test connectivity.

## Testing Steps

### Step 1: Test Backend is Running

```powershell
# Check if Flask is running on port 5000
netstat -ano | findstr :5000

# Test the health endpoint
Invoke-WebRequest -Uri http://localhost:5000/api/health | Select-Object -ExpandProperty Content
```

Should return: `{"status":"ok","message":"API is running"}`

### Step 2: Test Login Endpoint

```powershell
# Test with invalid credentials (should fail)
Invoke-WebRequest -Uri http://localhost:5000/api/auth/login -Method POST -ContentType "application/json" -Body '{"username":"test","password":"wrong"}'
```

Should return error: `{"error":"Invalid credentials"}`

### Step 3: For Physical Devices Only

If testing on a physical device:

1. Find your computer's IP address:
   ```powershell
   ipconfig
   ```
   Look for "IPv4 Address" under your active network adapter (usually starts with 192.168.x.x)

2. Update `src/config/api.ts`:
   ```typescript
   // Add this for physical devices
   if (Platform.OS === 'android' || Platform.OS === 'ios') {
     return 'http://YOUR_IP_HERE:5000/api';  // e.g., http://192.168.1.100:5000/api
   }
   ```

3. Make sure your computer's firewall allows incoming connections on port 5000

### Step 4: Run the App

```bash
# For Android emulator
npx expo start --android

# For iOS simulator
npx expo start --ios

# For web
npx expo start --web
```

### Step 5: Check Console Logs

The login screen now has detailed logging. Watch for:
- "Attempting login with: [username]"
- "API URL: [url]"
- "Response status: [code]"
- "Response data: [data]"

## Common Issues

### Issue 1: "Network Error" or "Connection Error"
**Cause**: Backend not reachable
**Solutions**:
- Ensure Flask backend is running: `python app.py`
- Check you're using correct IP for your platform
- Check firewall settings
- Try accessing `http://10.0.2.2:5000/api/health` from Android emulator browser

### Issue 2: Login succeeds with wrong credentials
**Cause**: API call is failing silently, not actually reaching backend
**Solutions**:
- Check the console logs - you should see "Connection Error" alert
- Verify the API_BASE_URL is correct for your platform
- Test backend directly with PowerShell commands above

### Issue 3: CORS errors
**Cause**: Backend not configured to allow requests from your IP
**Solutions**:
- Check backend has CORS enabled
- Verify CORS allows requests from all origins in development

## Debugging Commands

```powershell
# Check if Flask is running
netstat -ano | findstr :5000

# Test health endpoint
curl http://localhost:5000/api/health

# For Android emulator
curl http://10.0.2.2:5000/api/health

# Test login with valid credentials
Invoke-WebRequest -Uri http://localhost:5000/api/auth/login -Method POST -ContentType "application/json" -Body '{"username":"admin","password":"admin123"}'
```

## Expected Behavior

1. User enters credentials
2. App logs: "Attempting login with: [username]"
3. App makes fetch request to backend
4. Backend validates credentials against database
5. If valid: Returns JWT token, app stores it, navigates to equipment list
6. If invalid: Returns 401 error, app shows "Invalid credentials" alert
7. If network error: Shows "Connection Error" with troubleshooting tips

## Quick Fix for Android Emulator

If you're using Android emulator and getting connection errors:

1. Open Android emulator
2. Open browser in emulator
3. Navigate to `http://10.0.2.2:5000/api/health`
4. You should see: `{"status":"ok","message":"API is running"}`
5. If this works but login doesn't, check the app console logs

## Create Test User

```powershell
# In backend directory
cd "c:\Users\kente\Programs\Equipment Reservation\backend"

# Open Python shell
python

# Create test user
from app import create_app
from extensions import db
from models import User, UserRole

app = create_app()
with app.app_context():
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

Then test login with:
- Username: `testuser`
- Password: `testpass123`
