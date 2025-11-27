# Equipment Reservation System - Complete Documentation

## Overview

A comprehensive equipment reservation system built with **Flask** backend and **ExpoGo (React Native)** mobile frontend. The system supports real-time booking, QR code verification, and detailed analytics for two user types: Students and Admins.

## Features

### Core Features
- ✅ **Real-time Equipment Booking** - Instant availability updates across all users
- ✅ **Auto-blocking of Booked Equipment** - Equipment is immediately marked unavailable when reserved
- ✅ **QR Code Check-in/Check-out** - Verify equipment usage with QR code scanning
- ✅ **Automatic Cancellation** - Unclaimed reservations auto-cancel after set period
- ✅ **Push Notifications** - Real-time approval/rejection updates via WebSocket
- ✅ **Admin Dashboard** - Comprehensive admin panel with statistics and controls
- ✅ **Equipment Usage Reports** - Peak hours, frequently borrowed items, occupancy rates
- ✅ **User Role Management** - Admin and Student roles with different permissions

### Advanced Features
- 🔐 JWT-based authentication
- 📊 Real-time WebSocket notifications
- 📍 Location tracking for QR scans
- 📈 Analytics and trend reports
- 🔄 Maintenance scheduling
- 📱 Responsive mobile UI
- 🌙 Dark mode support

---

## Project Structure

```
Equipment Reservation/
├── backend/
│   ├── app.py                 # Flask application factory
│   ├── models.py              # Database models
│   ├── requirements.txt        # Python dependencies
│   ├── .env.example           # Environment variables template
│   └── routes/
│       ├── auth.py            # Authentication endpoints
│       ├── equipment.py        # Equipment CRUD operations
│       ├── reservation.py      # Reservation management
│       ├── admin.py           # Admin-only operations
│       ├── qrcode.py          # QR code scanning
│       └── reports.py         # Analytics and reports
│
└── reservation/ (ExpoGo)
    ├── app/
    │   ├── screens/
    │   │   ├── LoginScreen.tsx
    │   │   ├── StudentHomeScreen.tsx
    │   │   ├── BrowseEquipmentScreen.tsx
    │   │   ├── QRCodeScannerScreen.tsx
    │   │   └── AdminDashboardScreen.tsx
    │   └── _layout.tsx
    ├── context/
    │   └── AuthContext.tsx
    ├── package.json
    ├── app.json
    └── tsconfig.json
```

---

## Backend Setup

### 1. **Installation**

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv env

# Activate virtual environment
# On Windows:
env\Scripts\activate
# On macOS/Linux:
source env/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 2. **Environment Configuration**

Create a `.env` file in the backend directory:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
FLASK_ENV=development
JWT_SECRET_KEY=your-super-secret-jwt-key-here
DATABASE_URL=sqlite:///equipment_reservation.db
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
```

### 3. **Initialize Database**

```bash
python
>>> from app import create_app, db
>>> app = create_app('development')
>>> with app.app_context():
>>>     db.create_all()
>>> exit()
```

### 4. **Run Development Server**

```bash
python app.py
```

The server will run at `http://localhost:5000`

---

## API Documentation

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "student1",
  "email": "student@example.com",
  "password": "securepassword",
  "full_name": "John Doe",
  "role": "student"  # 'student' or 'admin'
}

Response: 201 Created
{
  "message": "User created successfully",
  "user": { ... }
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "student1",
  "password": "securepassword"
}

Response: 200 OK
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {
    "id": "user-uuid",
    "username": "student1",
    "email": "student@example.com",
    "role": "student",
    "full_name": "John Doe"
  }
}
```

### Equipment Endpoints

#### Get All Equipment
```http
GET /api/equipment?category=Cameras&status=available&page=1&per_page=20
Authorization: Bearer {token}

Response: 200 OK
{
  "equipment": [ { ... }, { ... } ],
  "total": 45,
  "pages": 3,
  "current_page": 1
}
```

#### Create Equipment (Admin Only)
```http
POST /api/equipment
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "name": "Canon EOS R5",
  "description": "Professional mirrorless camera",
  "category": "Cameras",
  "quantity": 3,
  "location": "Room 301 - Media Lab"
}

Response: 201 Created
{
  "message": "Equipment created successfully",
  "equipment": { ... },
  "qr_code_image": "data:image/png;base64,..."
}
```

#### Update Equipment (Admin Only)
```http
PUT /api/equipment/{equipment_id}
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "name": "Updated Name",
  "quantity": 5,
  "status": "maintenance"
}
```

#### Delete Equipment (Admin Only)
```http
DELETE /api/equipment/{equipment_id}
Authorization: Bearer {admin_token}

Response: 200 OK
{
  "message": "Equipment deleted successfully"
}
```

### Reservation Endpoints

#### Create Reservation
```http
POST /api/reservation
Authorization: Bearer {student_token}
Content-Type: application/json

{
  "equipment_id": "equipment-uuid",
  "start_date": "2024-12-20T10:00:00",
  "end_date": "2024-12-21T10:00:00",
  "quantity_requested": 1,
  "reason": "Course project filming"
}

Response: 201 Created
{
  "message": "Reservation request created successfully",
  "reservation": { ... }
}
```

#### Get My Reservations
```http
GET /api/reservation?status=pending&page=1
Authorization: Bearer {student_token}

Response: 200 OK
{
  "reservations": [ { ... }, { ... } ],
  "total": 5,
  "pages": 1,
  "current_page": 1
}
```

#### Cancel Reservation
```http
POST /api/reservation/{reservation_id}/cancel
Authorization: Bearer {student_token}

Response: 200 OK
{
  "message": "Reservation cancelled successfully",
  "reservation": { ... }
}
```

### Admin Endpoints

#### Get Pending Reservations
```http
GET /api/admin/reservations/pending?page=1
Authorization: Bearer {admin_token}

Response: 200 OK
{
  "pending_reservations": [ { ... } ],
  "total": 8,
  "pages": 1
}
```

#### Approve Reservation
```http
POST /api/admin/reservations/{reservation_id}/approve
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "notes": "Approved - equipment available"
}

Response: 200 OK
{
  "message": "Reservation approved successfully",
  "reservation": { ... }
}
```

#### Reject Reservation
```http
POST /api/admin/reservations/{reservation_id}/reject
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "reason": "Equipment unavailable for requested period"
}

Response: 200 OK
{
  "message": "Reservation rejected successfully"
}
```

#### Get Dashboard Stats
```http
GET /api/admin/dashboard/stats
Authorization: Bearer {admin_token}

Response: 200 OK
{
  "equipment": {
    "total": 25,
    "available": 18,
    "reserved": 5,
    "in_maintenance": 2
  },
  "users": {
    "total": 150,
    "students": 145,
    "admins": 5
  },
  "reservations": {
    "pending": 12,
    "approved": 45,
    "checked_out": 8,
    "total": 120
  }
}
```

### QR Code Endpoints

#### Scan QR Code
```http
POST /api/qrcode/scan
Authorization: Bearer {token}
Content-Type: application/json

{
  "qr_code": "equipment-uuid-from-qr",
  "scan_type": "check_in",  # or "check_out"
  "latitude": 40.7128,
  "longitude": -74.0060,
  "notes": "Equipment in good condition"
}

Response: 200 OK
{
  "message": "check_in successful",
  "qr_scan": { ... },
  "reservation": { ... },
  "equipment": { ... }
}
```

#### Validate QR Code
```http
POST /api/qrcode/validate
Content-Type: application/json

{
  "qr_code": "equipment-uuid"
}

Response: 200 OK
{
  "valid": true,
  "equipment": { ... }
}
```

### Reports Endpoints

#### Equipment Usage Report
```http
GET /api/reports/equipment/usage?days=30
Authorization: Bearer {admin_token}

Response: 200 OK
{
  "period_days": 30,
  "most_borrowed": [
    {
      "equipment_id": "...",
      "equipment_name": "Canon EOS R5",
      "reservation_count": 45
    }
  ]
}
```

#### Peak Hours Report
```http
GET /api/reports/peak-hours?days=30
Authorization: Bearer {admin_token}

Response: 200 OK
{
  "period_days": 30,
  "peak_hours": [
    { "hour": 9, "reservations": 12 },
    { "hour": 10, "reservations": 18 },
    { "hour": 14, "reservations": 15 }
  ]
}
```

---

## Mobile App Setup

### 1. **Prerequisites**

- Node.js 16 or higher
- Expo CLI: `npm install -g expo-cli`
- ExpoGo app on your phone (for live preview)

### 2. **Installation**

```bash
# Navigate to mobile app directory
cd reservation

# Install dependencies
npm install

# Install required packages
npm install axios @react-native-async-storage/async-storage
```

### 3. **Configuration**

Create `.env` file in the `reservation` directory:

```env
EXPO_PUBLIC_API_URL=http://your-backend-ip:5000/api
```

### 4. **Run Development Server**

```bash
# Start Expo development server
npm start

# In the terminal, press:
# 'w' for web preview
# 'a' for Android (requires Android emulator)
# 'i' for iOS (requires macOS with Xcode)
# 's' to send to ExpoGo app via QR code
```

---

## Mobile App Screens

### 1. **Login Screen**
- Username/Password input
- Demo credentials display
- Sign up link
- Error validation

### 2. **Student Home Screen**
- Welcome greeting
- Active reservations count
- Pending approvals
- Featured equipment carousel
- Quick action buttons

### 3. **Browse Equipment Screen**
- Search functionality
- Category filtering
- Equipment cards with availability
- Reserve button with quantity selector

### 4. **QR Code Scanner Screen**
- Camera integration for scanning
- Manual QR code entry
- Equipment details display
- Check-in/Check-out buttons
- Usage history

### 5. **Admin Dashboard**
- Statistics overview (equipment, users, reservations)
- Pending reservations list
- Approve/Reject functionality
- Quick action buttons
- Equipment management

---

## Database Models

### User Model
```python
- id (UUID, Primary Key)
- username (String, Unique)
- email (String, Unique)
- password_hash (String)
- role (Enum: admin, student)
- full_name (String)
- phone (String, Optional)
- is_active (Boolean)
- created_at (DateTime)
- updated_at (DateTime)
```

### Equipment Model
```python
- id (UUID, Primary Key)
- name (String)
- description (Text)
- category (String)
- quantity (Integer)
- quantity_available (Integer)
- location (String)
- status (Enum: available, reserved, checked_out, maintenance)
- qr_code (String, Unique)
- created_by (FK to User)
- created_at (DateTime)
- updated_at (DateTime)
- last_maintenance (DateTime)
- maintenance_interval_days (Integer)
```

### Reservation Model
```python
- id (UUID, Primary Key)
- user_id (FK to User)
- equipment_id (FK to Equipment)
- status (Enum: pending, approved, rejected, checked_out, returned, cancelled)
- quantity_requested (Integer)
- reason (Text)
- start_date (DateTime)
- end_date (DateTime)
- checked_out_at (DateTime, Optional)
- returned_at (DateTime, Optional)
- approved_at (DateTime, Optional)
- rejected_at (DateTime, Optional)
- auto_cancel_date (DateTime)
```

### QRCodeScan Model
```python
- id (UUID, Primary Key)
- equipment_id (FK to Equipment)
- reservation_id (FK to Reservation)
- scan_type (String: check_in, check_out)
- scanned_at (DateTime)
- scanned_by (FK to User)
- latitude (Float, Optional)
- longitude (Float, Optional)
- notes (Text)
```

### Notification Model
```python
- id (UUID, Primary Key)
- user_id (FK to User)
- reservation_id (FK to Reservation, Optional)
- title (String)
- message (Text)
- notification_type (String: approval, rejection, cancellation, expiry)
- is_read (Boolean)
- created_at (DateTime)
```

---

## Real-time Features with WebSocket

The system uses Flask-SocketIO for real-time updates:

### Events

**Admin Room Events:**
```javascript
// New reservation request
socket.on('new_reservation', {
  reservation_id: 'uuid',
  equipment_id: 'uuid',
  user_id: 'uuid',
  timestamp: '2024-12-20T10:00:00'
})

// Reservation cancelled
socket.on('reservation_cancelled', {
  reservation_id: 'uuid',
  user_id: 'uuid'
})
```

**User Room Events:**
```javascript
// Reservation approved
socket.on('reservation_approved', {
  reservation_id: 'uuid',
  user_id: 'uuid',
  equipment_id: 'uuid'
})

// Reservation rejected
socket.on('reservation_rejected', {
  reservation_id: 'uuid',
  user_id: 'uuid'
})
```

---

## Testing & Demo

### Create Demo Users

```bash
# Admin user
POST /api/auth/register
{
  "username": "admin1",
  "email": "admin@example.com",
  "password": "password123",
  "full_name": "Admin User",
  "role": "admin"
}

# Student user
POST /api/auth/register
{
  "username": "student1",
  "email": "student@example.com",
  "password": "password123",
  "full_name": "Student User",
  "role": "student"
}
```

### Create Demo Equipment

```bash
POST /api/equipment
Authorization: Bearer {admin_token}

{
  "name": "Canon EOS R5",
  "description": "Professional mirrorless camera with 45MP sensor",
  "category": "Cameras",
  "quantity": 5,
  "location": "Room 301 - Media Lab"
}
```

---

## Deployment

### Backend Deployment (Heroku, AWS, DigitalOcean)

```bash
# Create Procfile
echo "web: gunicorn app:app" > Procfile

# Set environment variables on hosting platform
FLASK_ENV=production
JWT_SECRET_KEY=your-production-secret
DATABASE_URL=postgresql://...

# Deploy
git push heroku main
```

### Mobile App Deployment

```bash
# Build APK for Android
eas build --platform android --type apk

# Build IPA for iOS
eas build --platform ios

# Or submit to stores directly
eas submit --platform ios
eas submit --platform android
```

---

## Security Best Practices

1. ✅ Use strong JWT secret keys
2. ✅ Enable HTTPS in production
3. ✅ Validate all user inputs on backend
4. ✅ Use environment variables for sensitive data
5. ✅ Implement rate limiting for APIs
6. ✅ Use CORS properly to restrict origins
7. ✅ Hash passwords with werkzeug.security
8. ✅ Regularly update dependencies
9. ✅ Log all admin actions
10. ✅ Implement audit trails for equipment

---

## Troubleshooting

### Backend Issues

**Port 5000 already in use:**
```bash
lsof -i :5000  # Find process
kill -9 <PID>  # Kill process
```

**Database errors:**
```bash
# Reset database
rm equipment_reservation.db
python app.py  # Recreates database
```

**JWT Token errors:**
- Check JWT_SECRET_KEY is set in .env
- Ensure Authorization header format: `Bearer {token}`

### Mobile App Issues

**Module not found errors:**
```bash
npm install
npm start -- --clear
```

**Connection to backend:**
- Update EXPO_PUBLIC_API_URL in .env
- Check backend is running
- Verify firewall rules

---

## Future Enhancements

- 📧 Email notifications
- 🔔 Push notifications
- 📊 Advanced analytics dashboard
- 🗺️ Equipment location mapping
- 💳 Payment integration
- 🔄 Equipment maintenance tracking
- 👥 Team reservations
- ⭐ Rating and reviews
- 🔐 Two-factor authentication
- 📱 iOS/Android native apps

---

## Support & Contact

For issues or questions:
- Create an issue in the repository
- Contact: support@equipmentreservation.com
- Documentation: https://docs.equipmentreservation.com

---

## License

MIT License - See LICENSE file for details
