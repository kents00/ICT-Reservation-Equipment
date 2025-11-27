# Return Verification Workflow Implementation

## Overview
Implemented a new workflow where students request equipment returns, and admins must verify the equipment condition before marking it as returned.

## Workflow Steps

### 1. Student Requests Return
- Student presses "Request Return Verification" button on ReservationDetailScreen
- Reservation status changes from `checked_out` → `return_pending`
- Admin receives notification to verify the equipment

### 2. Admin Verifies Return
- Admin views reservations with `return_pending` status
- Admin can either:
  - **Accept Return**: Equipment verified in good condition
    - Status changes to `returned`
    - Equipment quantity_available increases
    - Student receives acceptance notification
  - **Reject Return**: Equipment damaged/missing/issues
    - Status stays as `checked_out`
    - Student receives rejection notification with reason

### 3. Student Receives Notification
- If accepted: "Your return of [equipment] has been verified and accepted. Thank you!"
- If rejected: "Your return request for [equipment] was not accepted. Reason: [admin notes]. Please contact admin."

## Files Modified

### Backend

#### 1. `models.py`
- Added new status: `RETURN_PENDING = "return_pending"` to `ReservationStatus` enum

#### 2. `routes/reservation.py`
- **Modified `/reservation/<id>/return` endpoint**:
  - Changed from immediate return to creating return request
  - Sets status to `RETURN_PENDING`
  - Creates notification for admin

- **Added `/reservation/<id>/verify-return` endpoint** (Admin only):
  - Accepts `approved` (boolean) and `notes` (string) parameters
  - If approved: Marks as returned, restores quantity, notifies student
  - If rejected: Keeps as checked_out, notifies student with reason

#### 3. `static/js/reservations.js` (Admin Dashboard)
- Added handling for `return_pending` status in table
- Added "Accept Return" and "Reject Return" buttons
- Added `acceptReturn()` function
- Added `rejectReturn()` function with reason prompt

#### 4. `static/css/styles.css`
- Added styling for `.status-badge.return_pending`:
  - Background: #FFF3E0 (light orange)
  - Color: #E65100 (dark orange)
  - Border: #FFB74D

### Frontend (React Native)

#### 1. `ReservationDetailScreen.tsx`
- Updated `getStatusColor()` to handle `return_pending` (orange #FF9500)
- Updated `getStatusLabel()` to display "Return Pending"
- Modified `handleReturnEquipment()`:
  - Changed dialog title to "Request Return"
  - Updated message to explain admin verification
  - Changed button text to "Submit Request"
- Added info section for `return_pending` status with waiting message
- Changed button text from "Return Equipment" to "Request Return Verification"

#### 2. `EquipmentListScreen.tsx`
- Updated `getReservationStatusColor()` to handle `return_pending` (orange #FF9500)
- Updated `getStatusLabel()` to display "Return Pending"

## API Endpoints

### POST `/api/reservation/<reservation_id>/return`
**Authorization**: JWT (Student - reservation owner only)
**Description**: Student requests to return equipment
**Response**:
```json
{
  "message": "Return request submitted. Please wait for admin verification.",
  "reservation": { ... }
}
```

### POST `/api/reservation/<reservation_id>/verify-return`
**Authorization**: JWT (Admin only)
**Description**: Admin verifies equipment return
**Body**:
```json
{
  "approved": true,
  "notes": "Equipment in good condition"
}
```
**Response**:
```json
{
  "message": "Equipment return verified and accepted",
  "reservation": { ... }
}
```

## Status Flow

```
CHECKED_OUT
    ↓ (Student requests return)
RETURN_PENDING
    ↓ (Admin verifies)
    ├─ Accept → RETURNED (quantity restored)
    └─ Reject → CHECKED_OUT (quantity unchanged)
```

## Testing Checklist

- [ ] Student can request return when status is `checked_out`
- [ ] Button changes to "Request Return Verification"
- [ ] Status changes to `return_pending` after request
- [ ] Admin sees "Return Pending" badge in reservations list
- [ ] Admin sees "Accept Return" and "Reject Return" buttons
- [ ] Accept return changes status to `returned` and restores quantity
- [ ] Reject return keeps status as `checked_out`
- [ ] Student receives notification in both cases
- [ ] Frontend displays "Return Pending" status with orange badge
- [ ] Info section shows waiting message for `return_pending` status

## Notifications

### For Admin (when student requests return):
```
[Student Name] has requested to return [Equipment Name].
Please verify the equipment condition.
```
Type: `return_request`

### For Student (when admin accepts):
```
Your return of [Equipment Name] has been verified and accepted.
Thank you!
```
Type: `return_accepted`

### For Student (when admin rejects):
```
Your return request for [Equipment Name] was not accepted.
Reason: [admin notes]. Please contact admin.
```
Type: `return_rejected`

## Benefits

1. **Equipment Protection**: Admin verifies physical condition before accepting returns
2. **Accountability**: Clear record of who approved/rejected returns
3. **Communication**: Students know when returns are verified
4. **Inventory Management**: Quantities only restored when equipment confirmed received
5. **Damage Tracking**: Rejected returns indicate equipment issues

## Future Enhancements

- Add photos for return verification
- Damage assessment form with severity levels
- Automatic email notifications
- Return history and statistics
- Penalty system for damaged/late returns
