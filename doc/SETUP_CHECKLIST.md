# Equipment Reservation System - Setup Checklist

## ✅ Pre-Setup Requirements

- [ ] Python 3.8+ installed
- [ ] Node.js 16+ installed
- [ ] Expo CLI installed (`npm install -g expo-cli`)
- [ ] Git installed
- [ ] Text editor/IDE (VS Code recommended)
- [ ] ExpoGo app installed on your phone (for testing)

---

## ✅ Backend Setup Checklist

### Step 1: Create Virtual Environment
- [ ] Navigate to `backend/` directory
- [ ] Run `python -m venv env` (Windows: `python -m venv env`)
- [ ] Activate virtual environment
  - Windows: `env\Scripts\activate`
  - macOS/Linux: `source env/bin/activate`
- [ ] Verify activation (should see `(env)` in terminal)

### Step 2: Install Dependencies
- [ ] Run `pip install -r requirements.txt`
- [ ] Wait for all packages to install
- [ ] Verify with `pip list` (should show Flask, SQLAlchemy, etc.)

### Step 3: Configure Environment
- [ ] Copy `.env.example` to `.env`
- [ ] Open `.env` and update values:
  - [ ] `FLASK_ENV=development`
  - [ ] `JWT_SECRET_KEY=your-secret-key-here`
  - [ ] `DATABASE_URL=sqlite:///equipment_reservation.db`
- [ ] Save `.env` file

### Step 4: Initialize Database
- [ ] Start Python interactive mode: `python`
- [ ] Run these commands:
```python
from app import create_app, db
app = create_app('development')
with app.app_context():
    db.create_all()
exit()
```
- [ ] Verify `equipment_reservation.db` file created
- [ ] Database should now be initialized

### Step 5: Test Backend
- [ ] Run `python app.py`
- [ ] Wait for server to start
- [ ] Check output shows: `Running on http://0.0.0.0:5000`
- [ ] Open browser to `http://localhost:5000/api`
- [ ] Should show Flask welcome page or API info
- [ ] Keep terminal open (server running)

### Step 6: Create Test Users
- [ ] Open another terminal/Postman
- [ ] Create admin user:
```bash
POST http://localhost:5000/api/auth/register
{
  "username": "admin1",
  "email": "admin@example.com",
  "password": "password123",
  "full_name": "Admin User",
  "role": "admin"
}
```
- [ ] Create student user:
```bash
POST http://localhost:5000/api/auth/register
{
  "username": "student1",
  "email": "student@example.com",
  "password": "password123",
  "full_name": "Student User",
  "role": "student"
}
```
- [ ] Verify both users created successfully (201 response)

### Step 7: Create Sample Equipment
- [ ] Login as admin to get JWT token
- [ ] Create equipment:
```bash
POST http://localhost:5000/api/equipment
Authorization: Bearer {admin_token}
{
  "name": "Canon EOS R5",
  "description": "Professional mirrorless camera",
  "category": "Cameras",
  "quantity": 5,
  "location": "Room 301 - Media Lab"
}
```
- [ ] Verify equipment created (201 response)
- [ ] Save equipment ID for testing

---

## ✅ Mobile App Setup Checklist

### Step 1: Navigate to Project
- [ ] Open new terminal window
- [ ] Navigate to `reservation/` directory
- [ ] Verify `package.json` exists

### Step 2: Install Dependencies
- [ ] Run `npm install`
- [ ] Wait for all packages to install
- [ ] Should see `node_modules` folder created

### Step 3: Install Required Packages
- [ ] Run `npm install axios @react-native-async-storage/async-storage`
- [ ] Verify packages added to `package.json`

### Step 4: Configure API URL
- [ ] Create `.env` file in `reservation/` directory
- [ ] Add content:
```env
EXPO_PUBLIC_API_URL=http://localhost:5000/api
```
- [ ] Save file

### Step 5: Update app.json (if needed)
- [ ] Open `app.json`
- [ ] Verify `"name"` and `"slug"` fields
- [ ] Optional: Update `"version"` to `"1.0.0"`

### Step 6: Start Development Server
- [ ] Run `npm start`
- [ ] Wait for Expo development server to start
- [ ] Should see QR code in terminal

### Step 7: Test Mobile App
- [ ] Option 1 - Web Preview:
  - [ ] Press `w` in terminal
  - [ ] Browser should open with app preview
- [ ] Option 2 - ExpoGo:
  - [ ] Open ExpoGo app on your phone
  - [ ] Scan QR code from terminal
  - [ ] App should load on your phone

### Step 8: Test Login
- [ ] Use demo credentials:
  - Username: `student1`
  - Password: `password123`
- [ ] Should successfully log in
- [ ] Dashboard should display

---

## ✅ Integration Testing Checklist

### Frontend-Backend Connection
- [ ] [ ] Mobile app connects to backend API
- [ ] [ ] Login sends correct JWT token
- [ ] [ ] Equipment list loads from backend
- [ ] [ ] Real-time updates work (WebSocket)
- [ ] [ ] Errors display properly

### Student User Flow
- [ ] [ ] Login as student
- [ ] [ ] Browse equipment
- [ ] [ ] Create reservation
- [ ] [ ] View pending reservations
- [ ] [ ] Receive approval notification
- [ ] [ ] Check-in with QR code
- [ ] [ ] View reservation history

### Admin User Flow
- [ ] [ ] Login as admin
- [ ] [ ] View dashboard stats
- [ ] [ ] See pending reservations
- [ ] [ ] Approve reservation
- [ ] [ ] View all reservations
- [ ] [ ] Check equipment details
- [ ] [ ] Access reports

### QR Code Testing
- [ ] [ ] Generate QR codes for equipment
- [ ] [ ] Scan QR code in app
- [ ] [ ] Check-in functionality works
- [ ] [ ] Check-out functionality works
- [ ] [ ] Scan history saved

### Real-time Features
- [ ] [ ] New reservation notification to admin
- [ ] [ ] Approval notification to student
- [ ] [ ] Rejection notification to student
- [ ] [ ] Equipment availability updates in real-time

---

## ✅ Feature Verification Checklist

### Authentication
- [ ] User registration works
- [ ] User login works
- [ ] JWT token generated
- [ ] Token stored locally
- [ ] Profile can be updated
- [ ] Password can be changed
- [ ] Logout clears token

### Equipment Management
- [ ] Admin can create equipment
- [ ] Admin can update equipment
- [ ] Admin can delete equipment
- [ ] QR codes generated correctly
- [ ] Equipment list paginated
- [ ] Search functionality works
- [ ] Category filtering works

### Reservations
- [ ] Student can create reservation
- [ ] Reservations show date range
- [ ] Quantity selection works
- [ ] Admin sees pending reservations
- [ ] Admin can approve reservation
- [ ] Admin can reject reservation
- [ ] Approval/rejection notifications sent
- [ ] Equipment auto-blocks when reserved
- [ ] Student can cancel own reservation

### QR Code System
- [ ] QR codes unique per equipment
- [ ] QR validation works
- [ ] Check-in records location
- [ ] Check-out records location
- [ ] Scan history accessible
- [ ] Status updates correctly

### Real-time System
- [ ] WebSocket connects successfully
- [ ] Notifications arrive in real-time
- [ ] Multiple users see updates
- [ ] Connection stable over time

### Reports
- [ ] Equipment usage report generates
- [ ] Peak hours identified
- [ ] User activity tracked
- [ ] Occupancy rates calculated
- [ ] CSV export works

### Admin Dashboard
- [ ] Stats display correctly
- [ ] Pending count accurate
- [ ] Equipment count accurate
- [ ] User count accurate
- [ ] Quick actions available

---

## ✅ Performance Testing Checklist

### Backend Performance
- [ ] API responses < 500ms
- [ ] Database queries optimized
- [ ] No N+1 query problems
- [ ] Pagination works correctly
- [ ] Search is fast

### Mobile Performance
- [ ] App loads in < 3 seconds
- [ ] Lists scroll smoothly
- [ ] No memory leaks
- [ ] Battery usage reasonable
- [ ] Data usage minimal

### Database Performance
- [ ] Queries use indexes
- [ ] No slow queries
- [ ] Database size reasonable
- [ ] Backups work

---

## ✅ Security Testing Checklist

### Authentication & Authorization
- [ ] JWT tokens validate
- [ ] Expired tokens rejected
- [ ] Admin-only endpoints protected
- [ ] User can't access other user's data
- [ ] Passwords hashed correctly

### Input Validation
- [ ] Invalid data rejected
- [ ] SQL injection prevented
- [ ] XSS prevented
- [ ] CORS properly configured

### Data Protection
- [ ] Sensitive data encrypted
- [ ] Audit trails maintained
- [ ] QR scan locations not exposed
- [ ] User emails protected

---

## ✅ Deployment Preparation Checklist

### Backend Deployment
- [ ] `.env` file configured for production
- [ ] Database switched to PostgreSQL (optional)
- [ ] JWT_SECRET_KEY is strong
- [ ] CORS origins configured
- [ ] Email service configured
- [ ] Logging enabled
- [ ] Error handling comprehensive
- [ ] Rate limiting implemented

### Mobile Deployment
- [ ] App version updated
- [ ] Icons and splash screens ready
- [ ] App tested on device
- [ ] API URL updated for production
- [ ] Sensitive data not hardcoded
- [ ] Build tested and working

### Documentation Deployment
- [ ] README.md complete
- [ ] API documentation up-to-date
- [ ] Setup guide available
- [ ] Troubleshooting guide included

---

## ✅ Post-Launch Checklist

### Monitoring
- [ ] Error logs monitored
- [ ] Performance metrics tracked
- [ ] User activity logged
- [ ] Database backups working

### Maintenance
- [ ] Bug fixes applied promptly
- [ ] Security patches deployed
- [ ] Dependencies updated
- [ ] Database cleaned regularly

### Support
- [ ] Help documentation available
- [ ] User feedback collected
- [ ] Issues tracked
- [ ] Updates communicated

---

## 🚀 Quick Reference Commands

### Backend
```bash
# Activate virtual environment
env\Scripts\activate              # Windows
source env/bin/activate           # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Run development server
python app.py

# Create database
python -c "from app import create_app, db; app = create_app(); app.app_context().push(); db.create_all()"

# Reset database
rm equipment_reservation.db
```

### Mobile
```bash
# Install dependencies
npm install

# Start development server
npm start

# Preview in web browser
npm start
# Then press 'w'

# Build for production
eas build --platform all
```

### Testing
```bash
# Test API endpoint
curl http://localhost:5000/api/equipment

# Get JWT token
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin1","password":"password123"}'
```

---

## ⚠️ Common Issues & Solutions

### Backend Issues

**Port 5000 already in use:**
```bash
# Find and kill process
lsof -i :5000
kill -9 <PID>
```

**Module not found error:**
```bash
pip install -r requirements.txt --force-reinstall
```

**Database errors:**
```bash
rm equipment_reservation.db
python app.py  # Recreates database
```

### Mobile Issues

**Module not found:**
```bash
npm install
npm start -- --clear
```

**Connection refused:**
- Check backend is running on port 5000
- Verify EXPO_PUBLIC_API_URL in .env
- Check firewall settings

**Build errors:**
```bash
rm -rf node_modules package-lock.json
npm install
```

---

## 📞 Getting Help

1. Check `README.md` for documentation
2. Review `IMPLEMENTATION_GUIDE.md` for setup
3. Check terminal error messages
4. Verify all dependencies installed
5. Check internet connection
6. Try clearing cache/reinstalling

---

## ✨ Success Criteria

- [ ] Backend running on `http://localhost:5000`
- [ ] Mobile app displays on phone/browser
- [ ] Can login with demo credentials
- [ ] Can browse equipment
- [ ] Can create reservation
- [ ] Can approve/reject as admin
- [ ] QR codes work
- [ ] Real-time updates visible
- [ ] Reports generate correctly
- [ ] Dashboard shows accurate stats

---

## 🎉 You're Ready!

Once all checkboxes are complete, your Equipment Reservation System is:
- ✅ Fully configured
- ✅ Tested and working
- ✅ Ready for development
- ✅ Ready for deployment

**Congratulations! Your system is live!** 🚀
