# Testing Admin Return Verification Display

## Issue
Student successfully requests return verification, but admin dashboard doesn't show the return pending request in the approvals table.

## Solution Implemented
Added comprehensive console logging to the admin approvals.js to debug the data flow.

## Testing Steps

### Step 1: Create Return Request (Student Side - React Native App)

1. **Start the frontend app** (if not running):
   ```bash
   cd frontend
   npm start
   ```

2. **Login as student** and navigate to a checked-out reservation

3. **Click "Request Return Verification"** button

4. **Check browser console logs** - you should see:
   ```
   === RETURN BUTTON PRESSED ===
   Reservation ID: 6903d923-b2a2-4b94-86ac-cc814346f821
   Reservation Status: checked_out
   Equipment ID: 66e3eaf2-9122-423a-b961-f086449fc985
   API Base URL: http://localhost:5000/api
   Full URL: http://localhost:5000/api/reservation/.../return
   === RESPONSE RECEIVED ===
   Response status: 200
   === SUCCESS ===
   ```

5. **Verify the alert** shows "Success" message

### Step 2: Check Backend Logs

Check the Flask terminal output for:
```
=== RETURN ENDPOINT CALLED ===
Reservation ID: 6903d923-b2a2-4b94-86ac-cc814346f821
User ID from token: xyz-789
Reservation found: True
Reservation status: checked_out
=== UPDATING STATUS TO RETURN_PENDING ===
=== STATUS UPDATED SUCCESSFULLY ===
=== NOTIFICATION CREATED ===
=== RETURNING SUCCESS RESPONSE ===
```

### Step 3: Verify Database Update

**Option A: Check database directly**
```sql
SELECT id, status, user_id, equipment_id
FROM reservation
WHERE id = '6903d923-b2a2-4b94-86ac-cc814346f821';
```
Expected: `status = 'return_pending'`

**Option B: Check via API**
```bash
curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
     http://localhost:5000/api/reservation/all
```

Look for the reservation with `"status": "return_pending"`

### Step 4: View in Admin Dashboard (Web)

1. **Open admin dashboard** in a web browser:
   ```
   http://localhost:5000/admin/login.html
   ```

2. **Login with admin credentials**

3. **Navigate to Approvals page** (click "Approvals" in sidebar)

4. **Open browser console** (F12) and check for logs:
   ```
   === LOADING APPROVALS ===
   Token exists: true
   Response status: 200
   Received data: {reservations: Array(X), total: X, ...}
   Total reservations: X
   Filtered approvals: Y
   Approvals by status: {pending: 0, return_pending: 1}
   === RENDERING APPROVALS TABLE ===
   Number of approvals to render: 1
   Rendering approval: {id: "...", status: "return_pending", user: "...", equipment: "..."}
   === TABLE RENDERED ===
   ```

5. **Verify the table** shows:
   - Reservation ID: `6903d923-b2a2-4b94-86ac-cc814346f821`
   - User name
   - Equipment name
   - Start date and end date
   - Status badge: **"Return Verification"** (orange/yellow badge)
   - Action buttons: **"Accept Return"** (green) and **"Reject Return"** (yellow/warning)

### Step 5: Test Accept Return

1. **Click "Accept Return"** button

2. **Confirm the alert**

3. **Check console logs**:
   ```
   Sending accept return request...
   Return accepted successfully
   ```

4. **Verify**:
   - Item disappears from approvals table
   - Equipment quantity is restored
   - Student receives notification

### Step 6: Test Reject Return (Alternative)

1. **Click "Reject Return"** button

2. **Enter rejection reason** in the prompt:
   ```
   Equipment has visible damage on the screen
   ```

3. **Confirm**

4. **Verify**:
   - Item disappears from approvals table
   - Equipment quantity is NOT restored
   - Student receives rejection notification with reason

## Troubleshooting

### Issue: No data showing in table

**Check Console Logs:**

1. **If "Filtered approvals: 0"**:
   - Check "Total reservations" count
   - Verify reservation status is exactly `return_pending` (not `returnPending` or other variants)
   - Check the filter isn't excluding your data

2. **If "Response status: 401" or "403"**:
   - Admin token might be expired
   - Logout and login again
   - Check localStorage has `access_token`

3. **If "Response status: 404" or "500"**:
   - Backend server might not be running
   - Check Flask terminal for errors
   - Verify endpoint exists: `/api/reservation/all`

4. **If "Number of approvals to render: 0"**:
   - Check search filter is empty
   - Check equipment filter is set to "All Equipment"
   - Clear filters and reload page

### Issue: Status badge not displaying correctly

**Check CSS:**
```css
.status-badge.return_pending {
    background-color: #ff9800;
    color: white;
}
```

Should be defined in `backend/static/css/styles.css`

### Issue: Action buttons not working

**Check function definitions:**
- `acceptReturn(reservationId)` should exist in approvals.js
- `rejectReturn(reservationId)` should exist in approvals.js
- Check browser console for JavaScript errors

## Expected Console Output Flow

### Frontend (React Native - Student)
```
=== RETURN BUTTON PRESSED ===
Reservation ID: 6903d923-b2a2-4b94-86ac-cc814346f821
Making POST request to: http://localhost:5000/api/reservation/.../return
=== RESPONSE RECEIVED ===
Response status: 200
=== SUCCESS ===
```

### Backend (Flask Terminal)
```
=== RETURN ENDPOINT CALLED ===
Reservation found: True
=== UPDATING STATUS TO RETURN_PENDING ===
=== NOTIFICATION CREATED ===
=== RETURNING SUCCESS RESPONSE ===
```

### Admin Dashboard (Web - Browser Console)
```
=== LOADING APPROVALS ===
Total reservations: 5
Filtered approvals: 1
Approvals by status: {pending: 0, return_pending: 1}
=== RENDERING APPROVALS TABLE ===
Rendering approval: {id: "6903d923...", status: "return_pending"}
=== TABLE RENDERED ===
```

## API Endpoints Used

### Student Request Return
```
POST /api/reservation/{id}/return
Authorization: Bearer {student_token}
```

### Admin Get All Reservations
```
GET /api/reservation/all
Authorization: Bearer {admin_token}

Response:
[
  {
    "id": "6903d923-b2a2-4b94-86ac-cc814346f821",
    "status": "return_pending",
    "user": {
      "first_name": "John",
      "last_name": "Doe",
      "full_name": "John Doe"
    },
    "equipment": {
      "name": "MacBook Pro"
    },
    ...
  }
]
```

### Admin Accept Return
```
POST /api/reservation/{id}/verify-return
Authorization: Bearer {admin_token}
Body: { "approved": true, "notes": "Equipment in good condition" }
```

### Admin Reject Return
```
POST /api/reservation/{id}/verify-return
Authorization: Bearer {admin_token}
Body: { "approved": false, "notes": "Equipment damaged" }
```

## Success Criteria

✅ Student can request return verification
✅ Backend updates status to `return_pending`
✅ Backend creates admin notification
✅ Admin dashboard loads all reservations
✅ Admin dashboard filters and shows `return_pending` items
✅ Return pending items show correct badge and buttons
✅ Admin can accept return (restores equipment quantity)
✅ Admin can reject return (keeps status as checked_out)
✅ Student receives notification of acceptance/rejection

## Next Steps After Testing

1. **If data loads correctly**: Remove or reduce console.log statements for production
2. **If data doesn't load**: Check each console log output to identify where the data flow breaks
3. **If buttons don't work**: Verify the backend endpoints are being called correctly

## Quick Debug Checklist

- [ ] Backend server is running on port 5000
- [ ] Frontend app is connected to correct backend URL
- [ ] Student can login and see reservations
- [ ] Student has at least one checked-out reservation
- [ ] Student can click "Request Return Verification" button
- [ ] Backend console shows return endpoint was called
- [ ] Database shows status updated to `return_pending`
- [ ] Admin can login to web dashboard
- [ ] Admin has valid token in localStorage
- [ ] Approvals page loads without errors
- [ ] Browser console shows approval loading logs
- [ ] Table renders with return pending item
- [ ] Status badge displays as "Return Verification"
- [ ] Accept/Reject buttons are visible and clickable

---

**Last Updated**: November 25, 2025
**Purpose**: Debug admin dashboard display of return verification requests
