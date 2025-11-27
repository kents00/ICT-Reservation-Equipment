# Testing Return Verification Workflow

## Setup Complete ✅

The backend server has been restarted with all the new code. Return verification requests now appear in the **Approvals page** alongside pending reservations.

## Step-by-Step Testing Guide

### 1. Student App - Submit Return Request

1. **Open the React Native app** (student side)
2. **Go to "My Reservations"** tab
3. **Find a reservation** with status "Checked Out"
4. **Tap on the reservation** to open details
5. **Tap "Request Return Verification"** button
6. **Confirm the dialog**

**Expected Results:**
- Success message: "Return request submitted!"
- Alert: "Your return request has been submitted. An admin will verify the equipment and update your reservation status."
- Reservation status should change to "Return Pending" (orange badge)
- Orange info box appears: "⏳ Return Pending Verification - Your return request has been submitted..."

### 2. Admin Dashboard - View Return Request in Approvals Page

1. **Open admin dashboard** in browser: `http://localhost:5000/admin/approvals`
2. **Login as admin** if needed
3. **Look for the return verification request**

**Expected Results:**
- Page title: "Approvals & Return Verifications"
- Reservation appears in the table with:
  - Status badge: "Return Verification" (orange)
  - Two buttons:
    - "Accept Return" (green)
    - "Reject Return" (yellow/warning)

### 3. Admin Dashboard - Accept Return

1. **Click "Accept Return"** button
2. **Confirm** the dialog: "Accept this equipment return? Verify that the equipment is in good condition."

**Expected Results:**
- Success message: "Return accepted successfully. Student has been notified."
- Item disappears from approvals list (no longer pending)
- Equipment quantity_available increases
- Student receives notification

### 4. Student App - Check Notification

1. **Go back to the student app**
2. **Pull to refresh** the reservations list
3. **Check the reservation status**

**Expected Results:**
- Status changed to "Returned" (purple badge)
- Info box: "✓ Returned - Equipment returned on [date]"
- "Request Return Verification" button no longer appears

## Alternative Path: Reject Return

### 3b. Admin Dashboard - Reject Return (Instead of Accept)

1. **Click "Reject Return"** button
2. **Enter a reason** in the prompt (e.g., "Equipment has visible damage on the screen")
3. **Click OK**

**Expected Results:**
- Success message: "Return rejected. Student has been notified."
- Item disappears from approvals list
- Reservation status stays as "Checked Out"
- Student can see the rejection reason in notifications

### 4b. Student App - Check Rejection

1. **Pull to refresh** in the app
2. **Status should still be "Checked Out"**
3. **Student can try submitting return request again** after fixing the issue

## Key Changes Made

### Approvals Page Updates
- ✅ Page title changed to "Approvals & Return Verifications"
- ✅ Shows both `pending` (new reservations) and `return_pending` (return requests)
- ✅ Status column added to differentiate between types
- ✅ Different action buttons based on status:
  - Pending: "Approve" / "Reject"
  - Return Pending: "Accept Return" / "Reject Return"
- ✅ `acceptReturn()` function calls `/api/reservation/{id}/verify-return` with `approved: true`
- ✅ `rejectReturn()` function calls `/api/reservation/{id}/verify-return` with `approved: false`

### Backend
- ✅ `/api/reservation/{id}/return` creates return request with `return_pending` status
- ✅ `/api/reservation/{id}/verify-return` handles admin accept/reject
- ✅ Notifications sent to both admin (on request) and student (on verification)

### Frontend
- ✅ "Request Return Verification" button on ReservationDetailScreen
- ✅ Orange "Return Pending" badge displayed
- ✅ Status updates when admin accepts/rejects

## Database Verification (Optional)

Check the database to verify changes:

```python
cd backend
python

from app import create_app
from extensions import db
from models import Reservation, Notification

app = create_app()
with app.app_context():
    # Find return pending requests
    returns = Reservation.query.filter_by(status='return_pending').all()
    for r in returns:
        print(f"Return Request: {r.id}, User: {r.user.full_name}, Equipment: {r.equipment.name}")

    # Check notifications
    notifications = Notification.query.filter_by(type='return_request').all()
    for n in notifications:
        print(f"Notification: {n.message}")
```

## Troubleshooting

### Issue: Return requests don't appear in Approvals page

**Solutions:**
1. **Hard refresh** browser (Ctrl+Shift+R or Ctrl+F5)
2. **Check browser console** (F12) for JavaScript errors
3. **Verify filter** is including `return_pending`: Look for `.filter(r => r.status === 'pending' || r.status === 'return_pending')`

### Issue: Status badge not showing correct color

**Solutions:**
1. **Check CSS** in `styles.css` for `.status-badge.return_pending`
2. **Clear browser cache**
3. **Verify** the status value is exactly `return_pending` (lowercase with underscore)

### Issue: Accept/Reject buttons don't work

**Solutions:**
1. **Check Console Logs**: Open browser DevTools (F12) → Console tab
2. **Verify API endpoint**: Should POST to `/api/reservation/{id}/verify-return`
3. **Check token**: Admin must be logged in with valid JWT token
4. **Backend logs**: Check Flask terminal for error messages

## API Endpoints Reference

### Student: Submit Return Request
```
POST /api/reservation/{reservation_id}/return
Headers: Authorization: Bearer {token}
Response: {
  "message": "Return request submitted. Please wait for admin verification.",
  "reservation": {...}
}
```

### Admin: Verify Return (Accept)
```
POST /api/reservation/{reservation_id}/verify-return
Headers: Authorization: Bearer {token}
Body: {
  "approved": true,
  "notes": "Equipment verified and accepted"
}
Response: {
  "message": "Equipment return verified and accepted",
  "reservation": {...}
}
```

### Admin: Verify Return (Reject)
```
POST /api/reservation/{reservation_id}/verify-return
Headers: Authorization: Bearer {token}
Body: {
  "approved": false,
  "notes": "Equipment damaged - screen cracked"
}
Response: {
  "message": "Equipment return rejected",
  "reservation": {...}
}
```

## Current Server Status

✅ Flask server running on: `http://localhost:5000`
✅ All changes applied and loaded
✅ Return workflow endpoints active
✅ **Approvals page** now shows return verification requests
✅ Accept/Reject return functions added

## Next Steps

1. **Test the complete workflow**:
   - Student submits return request from app
   - Admin goes to **Approvals page** (not Reservations)
   - Admin accepts or rejects the return
   - Student sees updated status

2. **Check the Approvals page shows**:
   - "Approvals & Return Verifications" title
   - Both pending reservations AND return requests
   - Status column showing "Pending Approval" or "Return Verification"
   - Correct buttons for each type

3. **Report back with**:
   - Screenshot of approvals page with return request
   - What happened when you clicked Accept/Reject
   - Any error messages in console