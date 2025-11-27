# Equipment Reservation System - Implementation Guide

## Quick Start Guide

### For Backend Developers

#### Step 1: Setup Virtual Environment
```bash
cd backend
python -m venv env
env\Scripts\activate  # Windows
source env/bin/activate  # macOS/Linux
```

#### Step 2: Install Dependencies
```bash
pip install -r requirements.txt
```

#### Step 3: Configure Environment
```bash
cp .env.example .env
# Edit .env with your settings
```

#### Step 4: Initialize Database
```bash
python
>>> from app import create_app, db
>>> app = create_app('development')
>>> with app.app_context():
>>>     db.create_all()
>>> exit()
```

#### Step 5: Run Development Server
```bash
python app.py
```

Visit `http://localhost:5000/api` to verify the server is running.

---

### For Mobile Developers

#### Step 1: Install Dependencies
```bash
cd reservation
npm install
```

#### Step 2: Configure API URL
Create `.env` file:
```env
EXPO_PUBLIC_API_URL=http://localhost:5000/api
```

#### Step 3: Start Development Server
```bash
npm start
```

#### Step 4: Preview App
- Press `w` for web
- Press `s` to open ExpoGo QR code
- Scan with ExpoGo app on your phone

---

## Feature Implementation Checklist

### Phase 1: Authentication ✅
- [x] User registration (student/admin roles)
- [x] JWT-based login
- [x] Token storage (AsyncStorage)
- [x] Profile management
- [x] Password management

### Phase 2: Equipment Management ✅
- [x] Create equipment (admin only)
- [x] Read/List equipment
- [x] Update equipment details
- [x] Delete equipment
- [x] QR code generation
- [x] Equipment categories
- [x] Maintenance scheduling
- [x] Real-time availability updates

### Phase 3: Reservation System ✅
- [x] Student creates reservation request
- [x] Admin views pending requests
- [x] Admin approve/reject with notes
- [x] Auto-cancel unclaimed reservations
- [x] Conflict detection (no double-booking)
- [x] Reservation history
- [x] Quantity tracking

### Phase 4: QR Code System ✅
- [x] QR code generation for equipment
- [x] Scan validation endpoint
- [x] Check-in functionality
- [x] Check-out functionality
- [x] Location tracking (GPS coordinates)
- [x] Scan history

### Phase 5: Real-time Features ✅
- [x] WebSocket notifications
- [x] Reservation status updates
- [x] Equipment availability updates
- [x] Admin notifications for pending requests
- [x] Rejection notifications

### Phase 6: Analytics & Reports ✅
- [x] Equipment usage report
- [x] Peak hours analysis
- [x] User activity tracking
- [x] Equipment occupancy rates
- [x] Reservation status breakdown
- [x] Equipment history
- [x] CSV export functionality

### Phase 7: Admin Dashboard ✅
- [x] Dashboard stats overview
- [x] Pending reservations list
- [x] User management
- [x] Equipment management
- [x] Auto-cancel functionality
- [x] Quick actions panel

### Phase 8: Mobile UI ✅
- [x] Login screen
- [x] Student home screen
- [x] Browse equipment screen
- [x] QR code scanner screen
- [x] Admin dashboard screen
- [x] Dark mode support
- [x] Responsive design

---

## API Endpoint Reference

### Authentication (6 endpoints)
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update profile
- `POST /api/auth/change-password` - Change password

### Equipment (7 endpoints)
- `GET /api/equipment` - List all equipment
- `POST /api/equipment` - Create equipment (admin)
- `GET /api/equipment/{id}` - Get equipment details
- `PUT /api/equipment/{id}` - Update equipment (admin)
- `DELETE /api/equipment/{id}` - Delete equipment (admin)
- `GET /api/equipment/{id}/qr-code` - Get QR code
- `GET /api/equipment/search` - Search equipment

### Reservations (7 endpoints)
- `POST /api/reservation` - Create reservation
- `GET /api/reservation` - Get user reservations
- `GET /api/reservation/{id}` - Get reservation details
- `POST /api/reservation/{id}/cancel` - Cancel reservation
- `GET /api/reservation/upcoming` - Get upcoming
- `GET /api/reservation/history` - Get past reservations
- `POST /api/reservation/{id}/return` - Mark as returned

### Admin (6 endpoints)
- `GET /api/admin/reservations/pending` - Pending requests
- `POST /api/admin/reservations/{id}/approve` - Approve
- `POST /api/admin/reservations/{id}/reject` - Reject
- `GET /api/admin/reservations/all` - All reservations
- `GET /api/admin/users` - List all users
- `PUT /api/admin/users/{id}` - Update user
- `POST /api/admin/auto-cancel-unclaimed` - Auto-cancel
- `GET /api/admin/dashboard/stats` - Dashboard stats

### QR Code (4 endpoints)
- `POST /api/qrcode/scan` - Scan QR code
- `POST /api/qrcode/validate` - Validate QR code
- `GET /api/qrcode/scan-history/{id}` - Scan history
- `GET /api/qrcode/equipment/{id}/scan-stats` - Scan stats

### Reports (6 endpoints)
- `GET /api/reports/equipment/usage` - Usage report
- `GET /api/reports/peak-hours` - Peak hours
- `GET /api/reports/user-activity` - User activity
- `GET /api/reports/occupancy` - Occupancy rates
- `GET /api/reports/reservation-status-breakdown` - Status breakdown
- `GET /api/reports/equipment/{id}/history` - Equipment history
- `GET /api/reports/export/csv` - Export as CSV

**Total: 39 API Endpoints**

---

## Database Schema

```
Users
├── id (PK)
├── username (UNIQUE)
├── email (UNIQUE)
├── password_hash
├── role (admin/student)
├── full_name
├── phone
├── is_active
└── timestamps

Equipment
├── id (PK)
├── name
├── description
├── category
├── quantity
├── quantity_available
├── location
├── status
├── qr_code (UNIQUE)
├── created_by (FK→Users)
├── last_maintenance
└── timestamps

Reservations
├── id (PK)
├── user_id (FK→Users)
├── equipment_id (FK→Equipment)
├── status
├── quantity_requested
├── reason
├── start_date
├── end_date
├── checked_out_at
├── returned_at
├── auto_cancel_date
└── timestamps

QRCodeScans
├── id (PK)
├── equipment_id (FK→Equipment)
├── reservation_id (FK→Reservations)
├── scan_type (check_in/check_out)
├── scanned_by (FK→Users)
├── latitude
├── longitude
└── timestamps

Notifications
├── id (PK)
├── user_id (FK→Users)
├── reservation_id (FK→Reservations)
├── title
├── message
├── notification_type
├── is_read
└── timestamps

UsageReports
├── id (PK)
├── equipment_id (FK→Equipment)
├── date
├── total_reservations
├── completed_reservations
├── cancelled_reservations
├── peak_hour
└── timestamps
```

---

## WebSocket Events

### Server → Client

```javascript
// Reservation approved
'reservation_approved': {
  reservation_id: 'uuid',
  user_id: 'uuid',
  equipment_id: 'uuid'
}

// Reservation rejected
'reservation_rejected': {
  reservation_id: 'uuid',
  user_id: 'uuid'
}

// New reservation (to admins)
'new_reservation': {
  reservation_id: 'uuid',
  equipment_id: 'uuid',
  user_id: 'uuid',
  timestamp: 'ISO string'
}

// Reservation cancelled
'reservation_cancelled': {
  reservation_id: 'uuid',
  user_id: 'uuid'
}
```

---

## Key Configuration Files

### Backend (.env)
```env
FLASK_ENV=development|production
FLASK_DEBUG=True|False
JWT_SECRET_KEY=your-secret-key
DATABASE_URL=sqlite:///equipment_reservation.db
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
```

### Mobile (.env)
```env
EXPO_PUBLIC_API_URL=http://localhost:5000/api
```

---

## Common Development Tasks

### Add a New Endpoint

1. Create function in appropriate `routes/*.py` file
2. Add route decorator: `@blueprint.route('/endpoint', methods=['GET/POST'])`
3. Add JWT protection if needed: `@jwt_required()`
4. Import blueprint in `app.py`
5. Test with Postman or curl

### Add a New Database Model

1. Create model class in `models.py`
2. Add relationships to related models
3. Add `to_dict()` method for serialization
4. Run database migration:
```bash
python
>>> from app import create_app, db
>>> app = create_app()
>>> with app.app_context():
>>>     db.create_all()
```

### Add a New Mobile Screen

1. Create new file in `reservation/app/screens/`
2. Import necessary components
3. Add to navigation in `_layout.tsx`
4. Connect to API using useAuth context

---

## Performance Optimization

### Backend
- Use database indexes for frequently queried fields
- Implement pagination for large lists
- Cache equipment availability
- Use query optimization with SQLAlchemy

### Mobile
- Lazy load equipment lists
- Cache API responses with AsyncStorage
- Use FlatList for large lists
- Implement image caching

---

## Error Handling

### Backend Responses
```json
{
  "error": "Descriptive error message",
  "status": 400
}
```

### Mobile Error Handling
```typescript
try {
  const response = await api.call();
} catch (error) {
  Alert.alert('Error', error.response?.data?.error || 'Unknown error');
}
```

---

## Testing

### Backend Unit Tests
```bash
pytest tests/
pytest --cov=app tests/  # With coverage
```

### Backend Integration Tests
```bash
# Test endpoints with real database
pytest tests/integration/
```

### Mobile Testing
```bash
# Run on web
npm start
# Press 'w' to open in browser

# Run on device/emulator
npm start
# Press 'a' for Android
# Press 'i' for iOS
```

---

## Deployment Checklist

- [ ] Set production environment variables
- [ ] Update database to PostgreSQL (recommended for production)
- [ ] Set strong JWT_SECRET_KEY
- [ ] Configure CORS properly
- [ ] Set up HTTPS/SSL
- [ ] Implement rate limiting
- [ ] Set up logging and monitoring
- [ ] Backup database regularly
- [ ] Configure email service
- [ ] Test all API endpoints
- [ ] Security audit
- [ ] Load testing
- [ ] Prepare deployment documentation

---

## File Size & Complexity

| Component | Files | Endpoints | Functions |
|-----------|-------|-----------|-----------|
| Backend   | 7     | 39        | ~150      |
| Mobile    | 5     | -         | ~200      |
| Database  | 1     | 6 tables  | -         |
| **Total** | **13**| **45**    | **~350**  |

---

## Next Steps

1. **Install dependencies** for both backend and mobile
2. **Configure environment variables**
3. **Initialize database**
4. **Run backend server**
5. **Start mobile development server**
6. **Test features** with provided demo credentials
7. **Deploy** to production servers

---

For detailed API documentation, see `README.md`
