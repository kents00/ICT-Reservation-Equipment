# Expo Frontend - Flask Backend Integration Guide

This guide explains how to set up and run the Equipment Reservation system with Expo frontend and Flask backend.

## Architecture Overview

```
┌─────────────────────┐
│   Expo Go App       │  (React Native - TypeScript)
│  (Frontend)         │
│                     │
│  - Login/Signup     │
│  - Browse Equipment │
│  - Make Reservations│
│  - Admin Dashboard  │
│  - QR Scanning      │
└──────────┬──────────┘
           │
           │ HTTP/HTTPS
           │ (Axios)
           ↓
┌─────────────────────┐
│  Flask Backend      │  (Python)
│  API Server         │
│  (/api/*)           │
│                     │
│  - Authentication   │
│  - Equipment Mgmt   │
│  - Reservations     │
│  - QR Code Scanning │
│  - Reports/Admin    │
└──────────┬──────────┘
           │
           ↓
┌─────────────────────┐
│    SQLite DB        │  (Can upgrade to PostgreSQL)
│   (Models.py)       │  (Users, Equipment, Reservations,
│                     │   QRCodeScans, Notifications, etc)
└─────────────────────┘
```

## Prerequisites

- **Python 3.9+** (for Flask backend)
- **Node.js 16+** (for Expo frontend)
- **Expo CLI** (`npm install -g expo-cli` or use `npx expo`)
- **Git** (for version control)
- Flask dependencies installed (`pip install -r requirements.txt`)

## Part 1: Backend Setup (Flask)

### Step 1: Activate Python Virtual Environment

```cmd
# Windows (PowerShell)
.\backend\env_new\Scripts\Activate.ps1

# Windows (Command Prompt)
.\backend\env_new\Scripts\activate.bat

# macOS/Linux
source backend/env/bin/activate
```

**Expected Output:**
```
(env_new) C:\Users\kente\Programs\Equipment Reservation>
```

### Step 2: Verify Dependencies

```cmd
pip list
```

Ensure these are installed (from `requirements.txt`):
- Flask==2.3.2
- Flask-CORS==4.0.0
- Flask-SQLAlchemy==3.0.5
- Flask-JWT-Extended==4.4.4
- Flask-SocketIO==5.3.4
- python-dotenv==1.0.0

If missing any, run:
```cmd
pip install -r requirements.txt
```

### Step 3: Initialize Database (First Time Only)

```cmd
cd backend
python seed_db.py
```

This creates:
- SQLite database (`equipment_reservation.db`)
- Database tables (from `models.py`)
- Sample data (admin user, equipment, etc.)

### Step 4: Start Flask Backend

```cmd
cd backend
python app.py
```

**Expected Output:**
```
 * Running on http://0.0.0.0:5000
 * Environment: development
 * Debug mode: on
```

The Flask server is now running and listening on **http://localhost:5000**

### Step 5: Verify Backend is Working

In a new terminal:
```cmd
curl http://localhost:5000/api/equipment
```

You should get a JSON response with available equipment.

**Note:** The Flask backend must be running for the Expo app to connect.

---

## Part 2: Frontend Setup (Expo)

### Step 1: Install Frontend Dependencies

```cmd
cd reservation
npm install
```

This installs Expo and React Native dependencies from `package.json`.

### Step 2: Verify Environment Configuration

Check `reservation\.env.local` is set up correctly:

```env
EXPO_PUBLIC_API_URL=http://localhost:5000/api
EXPO_PUBLIC_ENVIRONMENT=development
EXPO_PUBLIC_DEBUG=true
```

**Important for Different Scenarios:**

1. **Local Development (Expo Go on Same Machine)**
   ```
   EXPO_PUBLIC_API_URL=http://localhost:5000/api
   ```

2. **Expo Go on Physical Device (Different Machine)**
   ```
   # Find your PC's local IP: ipconfig (Windows) or ifconfig (Mac/Linux)
   EXPO_PUBLIC_API_URL=http://192.168.X.X:5000/api
   ```

3. **Production/Deployed Backend**
   ```
   EXPO_PUBLIC_API_URL=https://your-backend-domain.com/api
   ```

### Step 3: Start Expo Development Server

```cmd
cd reservation
npm start
```

**Expected Output:**
```
› Using Expo Go
› Starting the dev server
› Starting Metro Bundler
› Waiting for connection from Dev Client
```

This starts the Expo development server on a local port.

### Step 4: Open in Expo Go

**Option A: On Desktop (Web Preview)**
- Press `w` in the terminal to open web preview
- Will open at `http://localhost:19006` (or similar)

**Option B: On Physical Device**
- Download **Expo Go** app (iOS App Store or Google Play)
- Scan QR code shown in terminal or on web preview
- App will load on your device

**Option C: Emulator**
- Android: Press `a` to open Android emulator
- iOS: Press `i` to open iOS simulator (macOS only)

---

## Part 3: Testing the Integration

### Test 1: Login Screen Connectivity

1. Open the app (Expo Go on device/emulator)
2. You should see the **Login Screen**
3. Try logging in with demo credentials (from `seed_db.py`):
   - **Username:** `admin_user`
   - **Password:** `password123`

**If Login Works:**
- ✅ Frontend → Backend connectivity is successful
- ✅ JWT authentication is working
- ✅ API `POST /api/auth/login` is responding

**If Login Fails:**
- Check Flask backend is running (`http://localhost:5000`)
- Check `EXPO_PUBLIC_API_URL` in `.env.local`
- Check CORS settings in `backend/app.py`
- Check browser console for errors (if using web preview)

### Test 2: Browse Equipment

1. After successful login
2. Navigate to **Browse Equipment** or **Student Home** screen
3. You should see equipment list from the database

**If Equipment Loads:**
- ✅ Database connection is working
- ✅ API `GET /api/equipment` is responding

### Test 3: Make a Reservation

1. Click on equipment
2. Fill in dates and quantity
3. Submit reservation request

**If Reservation is Created:**
- ✅ Database write operations are working
- ✅ Full frontend-backend integration is successful

### Test 4: Admin Features (If Testing Admin Account)

1. Login with admin credentials
2. Navigate to **Admin Dashboard**
3. View pending reservations, approve/reject, view reports

---

## Part 4: Running Tests

The project includes comprehensive unit tests for both frontend and backend.

### Backend Unit Tests

```cmd
cd backend
python -m pytest tests/ -v
```

Or run with coverage report:
```cmd
cd backend
python -m pytest tests/ --cov=routes --cov=models --cov-report=html
```

This generates an HTML coverage report in `backend/htmlcov/index.html`

### Frontend Testing (if configured)

```cmd
cd reservation
npm test
```

---

## Part 5: Building for Production

### Backend Deployment

1. **Update `.env` for production:**
   ```env
   FLASK_ENV=production
   JWT_SECRET_KEY=your-secure-secret-key
   DATABASE_URL=postgresql://user:password@host/db
   CORS_ORIGINS=https://your-frontend-domain.com
   ```

2. **Run with Gunicorn:**
   ```cmd
   gunicorn -w 4 -b 0.0.0.0:5000 app:create_app('production')
   ```

3. **Or use Docker:**
   See `backend/Dockerfile` for containerized deployment

### Frontend Deployment

1. **Update `reservation/.env.production`:**
   ```env
   EXPO_PUBLIC_API_URL=https://your-backend-domain.com/api
   EXPO_PUBLIC_ENVIRONMENT=production
   ```

2. **Build Expo App:**
   ```cmd
   eas build --platform all
   ```

   This creates a standalone iOS and Android app.

3. **Submit to App Stores:**
   ```cmd
   eas submit --platform all
   ```

---

## Troubleshooting

### Issue: "Cannot connect to backend"

**Cause:** Flask server not running or wrong URL

**Solution:**
1. Verify Flask is running: `http://localhost:5000`
2. Check `EXPO_PUBLIC_API_URL` in `.env.local`
3. If using physical device, use machine IP instead of `localhost`

### Issue: "Network Error" on Login

**Cause:** CORS issue or API mismatch

**Solution:**
1. Check `CORS_ORIGINS` in `backend/app.py`
2. Verify request headers (should include `Authorization: Bearer <token>`)
3. Check browser console (web preview) for detailed error

### Issue: "Invalid credentials"

**Cause:** Wrong username/password or database not initialized

**Solution:**
1. Run `python seed_db.py` to create sample users
2. Use credentials from the seed output
3. Check database exists: `equipment_reservation.db`

### Issue: "Equipment list is empty"

**Cause:** Database not seeded or equipment not created

**Solution:**
1. Run `python seed_db.py`
2. Check `equipment_reservation.db` exists
3. Verify Flask API returns data: `curl http://localhost:5000/api/equipment`

### Issue: CORS Error in Console

**Cause:** Frontend domain not allowed by backend

**Solution:**
1. In `backend/app.py`, update:
   ```python
   CORS(app, resources={r"/api/*": {"origins": ["http://localhost:19006", "http://YOUR_IP:19006"]}})
   ```
2. Or allow all during development (already configured)

---

## Environment Variables Summary

### Frontend (`reservation/.env.local`)
| Variable | Purpose | Example |
|----------|---------|---------|
| `EXPO_PUBLIC_API_URL` | Backend API base URL | `http://localhost:5000/api` |
| `EXPO_PUBLIC_ENVIRONMENT` | App environment | `development` or `production` |
| `EXPO_PUBLIC_DEBUG` | Enable debug logging | `true` or `false` |

### Backend (`backend/.env`)
| Variable | Purpose | Example |
|----------|---------|---------|
| `FLASK_ENV` | Flask environment | `development`, `testing`, `production` |
| `FLASK_DEBUG` | Enable debug mode | `True` or `False` |
| `DATABASE_URL` | Database connection string | `sqlite:///equipment_reservation.db` |
| `JWT_SECRET_KEY` | JWT signing key | `your-secret-key` |
| `CORS_ORIGINS` | Allowed frontend origins | `*` or specific domains |
| `PORT` | Server port | `5000` |
| `HOST` | Server host | `0.0.0.0` (all interfaces) |

---

## Architecture Details

### Authentication Flow

```
1. User enters credentials → Login Screen
2. Frontend calls: POST /api/auth/login
3. Backend validates username/password against Users table
4. Backend generates JWT token
5. Frontend stores token in AsyncStorage
6. Subsequent requests include: Authorization: Bearer <token>
7. Backend verifies token via JWT middleware
```

### Reservation Flow

```
1. User selects equipment → Browse Equipment Screen
2. Frontend calls: POST /api/reservation
3. Backend creates reservation record (status: pending)
4. Admin notified via SocketIO websocket
5. Admin views pending → Admin Dashboard
6. Admin approves/rejects → Backend updates status
7. Frontend polls for status updates
8. User picks up equipment → QR scan
9. QR scan creates check_out record
10. Equipment status updates to checked_out
11. User returns equipment → QR scan again
12. Reservation marked as returned
```

### Real-Time Updates

Flask SocketIO enables real-time notifications:
- Admin gets notified of new reservation requests
- Users get notified of approval/rejection
- Live equipment status updates

---

## Quick Reference Commands

```cmd
# Backend
cd backend
.\env_new\Scripts\activate.ps1
pip install -r requirements.txt
python seed_db.py
python app.py

# Frontend (new terminal)
cd reservation
npm install
npm start

# Run tests
cd backend
python -m pytest tests/ -v

# Run with coverage
cd backend
python -m pytest tests/ --cov=routes --cov=models --cov-report=html
```

---

## Next Steps

1. ✅ Set up environment files (done)
2. ✅ Start Flask backend
3. ✅ Start Expo frontend
4. ✅ Test login/authentication
5. ✅ Test equipment browsing
6. ✅ Test reservation creation
7. Deploy to production when ready

## Additional Resources

- **Flask Documentation:** https://flask.palletsprojects.com
- **Expo Documentation:** https://docs.expo.dev
- **React Native Documentation:** https://reactnative.dev
- **SQLAlchemy (ORM):** https://docs.sqlalchemy.org
- **Flask-JWT-Extended:** https://flask-jwt-extended.readthedocs.io

---

**For questions or issues, check the logs and error messages carefully. Most integration issues are due to:**
1. Flask backend not running
2. Wrong API URL in `.env.local`
3. CORS misconfiguration
4. Database not seeded
