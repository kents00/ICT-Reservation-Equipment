"""
Reservation Management Routes
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db, socketio
from models import (Reservation, Equipment, User, ReservationStatus,
                    EquipmentStatus, Notification)
from models import UserRole
from datetime import datetime, timedelta, timezone
from sqlalchemy import and_, or_

reservation_bp = Blueprint('reservation', __name__)


@reservation_bp.route('', methods=['POST'])
@jwt_required()
def create_reservation():
    """Create a new reservation request"""
    user_id = get_jwt_identity()
    data = request.get_json()

    # Validation
    if not data.get('equipment_id') or not data.get('start_date') or not data.get('end_date'):
        return jsonify({'error': 'Missing required fields'}), 400

    equipment = Equipment.query.get(data['equipment_id'])
    if not equipment:
        return jsonify({'error': 'Equipment not found'}), 404

    try:
        start_date = datetime.fromisoformat(
            data['start_date'].replace('Z', '+00:00'))
        end_date = datetime.fromisoformat(
            data['end_date'].replace('Z', '+00:00'))
    except:
        return jsonify({'error': 'Invalid date format'}), 400

    if start_date >= end_date:
        return jsonify({'error': 'End date must be after start date'}), 400

    quantity_requested = data.get('quantity_requested', 1)

    # Check if equipment is available for reservation (only allow 'available' status)
    if equipment.status.lower() != EquipmentStatus.AVAILABLE.value.lower():
        return jsonify({'error': f'Equipment is currently {equipment.status} and cannot be reserved'}), 409

    # Check if requested quantity is available
    if quantity_requested > equipment.quantity_available:
        return jsonify({'error': f'Only {equipment.quantity_available} units available'}), 409

    # Validate reason is provided
    reason = data.get('reason', '').strip()
    if not reason:
        return jsonify({'error': 'Reason for reservation is required'}), 400

    # Check for conflicting reservations - calculate available quantity for the requested period
    overlapping_reservations = Reservation.query.filter(
        Reservation.equipment_id == data['equipment_id'],
        Reservation.status.in_(['approved', 'checked_out']),
        Reservation.start_date < end_date,
        Reservation.end_date > start_date
    ).all()

    # Calculate total quantity already reserved for this period
    total_reserved_quantity = sum(
        r.quantity_requested for r in overlapping_reservations)
    available_for_period = equipment.quantity - total_reserved_quantity

    if quantity_requested > available_for_period:
        return jsonify({
            'error': f'Only {available_for_period} unit(s) available for this period. {total_reserved_quantity} already reserved.'
        }), 409

    try:
        # Create reservation
        reservation = Reservation(
            user_id=user_id,
            equipment_id=data['equipment_id'],
            quantity_requested=quantity_requested,
            reason=reason,
            start_date=start_date,
            end_date=end_date,
            status=ReservationStatus.PENDING,
            # Auto-cancel after 3 days if not approved
            auto_cancel_date=datetime.now(timezone.utc) + timedelta(days=3)
        )

        db.session.add(reservation)
        db.session.commit()

        # Emit socket notification to admins
        socketio.emit('new_reservation', {
            'reservation_id': reservation.id,
            'equipment_id': data['equipment_id'],
            'user_id': user_id,
            'timestamp': datetime.now(timezone.utc).isoformat()
        }, room='admin')

        return jsonify({
            'message': 'Reservation request created successfully',
            'reservation': reservation.to_dict(include_equipment=True)
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@reservation_bp.route('', methods=['GET'])
@jwt_required()
def get_user_reservations():
    """Get user's reservations"""
    user_id = get_jwt_identity()
    status = request.args.get('status')
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)

    query = Reservation.query.filter_by(user_id=user_id)

    if status:
        query = query.filter_by(status=status)

    paginated = query.order_by(Reservation.created_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )

    return jsonify({
        'reservations': [item.to_dict(include_equipment=True) for item in paginated.items],
        'total': paginated.total,
        'pages': paginated.pages,
        'current_page': page
    }), 200


@reservation_bp.route('/<reservation_id>', methods=['GET'])
@jwt_required()
def get_reservation(reservation_id):
    """Get reservation details"""
    user_id = get_jwt_identity()
    reservation = Reservation.query.get(reservation_id)

    if not reservation:
        return jsonify({'error': 'Reservation not found'}), 404

    # Check authorization
    if reservation.user_id != user_id and User.query.get(user_id).role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403

    return jsonify(reservation.to_dict(include_user=True, include_equipment=True)), 200


@reservation_bp.route('/<reservation_id>/cancel', methods=['POST'])
@jwt_required()
def cancel_reservation(reservation_id):
    """Cancel a reservation"""
    user_id = get_jwt_identity()
    reservation = Reservation.query.get(reservation_id)

    if not reservation:
        return jsonify({'error': 'Reservation not found'}), 404

    if reservation.user_id != user_id:
        return jsonify({'error': 'Unauthorized'}), 403

    if reservation.status not in [ReservationStatus.PENDING, ReservationStatus.APPROVED]:
        return jsonify({'error': f'Cannot cancel reservation with status: {reservation.status}'}), 409

    try:
        reservation.status = ReservationStatus.CANCELLED
        reservation.updated_at = datetime.now(timezone.utc)

        # Create notification
        notification = Notification(
            user_id=user_id,
            reservation_id=reservation_id,
            title='Reservation Cancelled',
            message=f'Your reservation for {reservation.equipment.name} has been cancelled',
            notification_type='cancellation'
        )

        db.session.add(notification)
        db.session.commit()

        # Emit socket notification
        socketio.emit('reservation_cancelled', {
            'reservation_id': reservation_id,
            'user_id': user_id
        }, room='admin')

        return jsonify({
            'message': 'Reservation cancelled successfully',
            'reservation': reservation.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@reservation_bp.route('/upcoming', methods=['GET'])
@jwt_required()
def get_upcoming_reservations():
    """Get upcoming reservations for current user"""
    user_id = get_jwt_identity()
    now = datetime.now(timezone.utc)

    reservations = Reservation.query.filter(
        Reservation.user_id == user_id,
        Reservation.start_date > now,
        Reservation.status.in_(['approved', 'checked_out'])
    ).order_by(Reservation.start_date).all()

    return jsonify({
        'upcoming_reservations': [item.to_dict(include_equipment=True) for item in reservations]
    }), 200


@reservation_bp.route('/history', methods=['GET'])
@jwt_required()
def get_reservation_history():
    """Get past reservations for current user"""
    user_id = get_jwt_identity()
    now = datetime.now(timezone.utc)
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)

    query = Reservation.query.filter(
        Reservation.user_id == user_id,
        Reservation.end_date < now,
        Reservation.status.in_(['returned', 'cancelled'])
    ).order_by(Reservation.end_date.desc())

    paginated = query.paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        'history': [item.to_dict(include_equipment=True) for item in paginated.items],
        'total': paginated.total,
        'pages': paginated.pages,
        'current_page': page
    }), 200

# --- Admin-only endpoint to get all reservations ---


@reservation_bp.route('/all', methods=['GET'])
@jwt_required()
def get_all_reservations():
    """Get all reservations (admin only)"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user or user.role != UserRole.ADMIN:
        return jsonify({'msg': 'Admins only'}), 403
    reservations = Reservation.query.order_by(
        Reservation.created_at.desc()).all()
    result = []
    for r in reservations:
        res_dict = r.to_dict(include_user=True, include_equipment=True)
        result.append(res_dict)
    return jsonify(result), 200


@reservation_bp.route('/<reservation_id>/approve', methods=['POST'])
@jwt_required()
def approve_reservation(reservation_id):
    """Approve a reservation (admin only)"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if not user or user.role != UserRole.ADMIN:
        return jsonify({'error': 'Admins only'}), 403

    reservation = Reservation.query.get(reservation_id)

    if not reservation:
        return jsonify({'error': 'Reservation not found'}), 404

    if reservation.status != ReservationStatus.PENDING:
        return jsonify({'error': f'Cannot approve reservation with status: {reservation.status}'}), 409

    try:
        reservation.status = ReservationStatus.APPROVED
        reservation.approved_at = datetime.now(timezone.utc)
        reservation.updated_at = datetime.now(timezone.utc)

        # Don't change equipment status or quantity on approval
        # Quantity is only reduced when equipment is actually checked out
        equipment = reservation.equipment

        # Create notification for the user
        notification = Notification(
            user_id=reservation.user_id,
            reservation_id=reservation_id,
            title='Reservation Approved',
            message=f'Your reservation for {equipment.name} has been approved. Pick up starts on {reservation.start_date.strftime("%Y-%m-%d")}',
            notification_type='approval'
        )

        db.session.add(notification)
        db.session.commit()

        # Emit socket notification
        socketio.emit('reservation_approved', {
            'reservation_id': reservation_id,
            'user_id': reservation.user_id,
            'equipment_id': equipment.id
        }, room=str(reservation.user_id))

        return jsonify({
            'message': 'Reservation approved successfully',
            'reservation': reservation.to_dict(include_user=True, include_equipment=True)
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@reservation_bp.route('/<reservation_id>/reject', methods=['POST'])
@jwt_required()
def reject_reservation(reservation_id):
    """Reject a reservation (admin only)"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if not user or user.role != UserRole.ADMIN:
        return jsonify({'error': 'Admins only'}), 403

    reservation = Reservation.query.get(reservation_id)

    if not reservation:
        return jsonify({'error': 'Reservation not found'}), 404

    if reservation.status != ReservationStatus.PENDING:
        return jsonify({'error': f'Cannot reject reservation with status: {reservation.status}'}), 409

    data = request.get_json()
    rejection_reason = data.get('rejection_reason', '').strip()

    if not rejection_reason:
        return jsonify({'error': 'Rejection reason is required'}), 400

    try:
        reservation.status = ReservationStatus.REJECTED
        reservation.rejection_reason = rejection_reason
        reservation.rejected_at = datetime.now(timezone.utc)
        reservation.updated_at = datetime.now(timezone.utc)

        # Create notification for the user
        notification = Notification(
            user_id=reservation.user_id,
            reservation_id=reservation_id,
            title='Reservation Rejected',
            message=f'Your reservation for {reservation.equipment.name} was rejected. Reason: {rejection_reason}',
            notification_type='rejection'
        )

        db.session.add(notification)
        db.session.commit()

        # Emit socket notification
        socketio.emit('reservation_rejected', {
            'reservation_id': reservation_id,
            'user_id': reservation.user_id,
            'rejection_reason': rejection_reason
        }, room=str(reservation.user_id))

        return jsonify({
            'message': 'Reservation rejected successfully',
            'reservation': reservation.to_dict(include_user=True, include_equipment=True)
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@reservation_bp.route('/<reservation_id>/checkout', methods=['POST'])
@jwt_required()
def checkout_reservation(reservation_id):
    """Checkout a reservation (admin only)"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if not user or user.role != UserRole.ADMIN:
        return jsonify({'error': 'Admins only'}), 403

    reservation = Reservation.query.get(reservation_id)

    if not reservation:
        return jsonify({'error': 'Reservation not found'}), 404

    if reservation.status != ReservationStatus.APPROVED:
        return jsonify({'error': f'Cannot checkout reservation with status: {reservation.status}'}), 409

    try:
        reservation.status = ReservationStatus.CHECKED_OUT
        reservation.checked_out_at = datetime.now(timezone.utc)
        reservation.updated_at = datetime.now(timezone.utc)

        # Update equipment quantity
        equipment = reservation.equipment
        equipment.quantity_available -= reservation.quantity_requested

        # Update equipment status based on availability
        if equipment.quantity_available <= 0:
            equipment.status = EquipmentStatus.CHECKED_OUT
        else:
            equipment.status = EquipmentStatus.AVAILABLE

        # Create notification for the user
        notification = Notification(
            user_id=reservation.user_id,
            reservation_id=reservation_id,
            title='Equipment Checked Out',
            message=f'{reservation.equipment.name} has been checked out',
            notification_type='checkout'
        )

        db.session.add(notification)
        db.session.commit()

        # Emit socket notification
        socketio.emit('reservation_checked_out', {
            'reservation_id': reservation_id,
            'user_id': reservation.user_id
        }, room=str(reservation.user_id))

        return jsonify({
            'message': 'Reservation checked out successfully',
            'reservation': reservation.to_dict(include_user=True, include_equipment=True)
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@reservation_bp.route('/<reservation_id>/return', methods=['POST'])
@jwt_required()
def return_equipment(reservation_id):
    """Request to return equipment (student) - creates return request for admin verification"""
    print("=== RETURN ENDPOINT CALLED ===")
    print(f"Reservation ID: {reservation_id}")

    user_id = get_jwt_identity()
    print(f"User ID from token: {user_id}")

    user = User.query.get(user_id)
    print(f"User found: {user is not None}")
    if user:
        print(f"User name: {user.first_name} {user.last_name}")

    reservation = Reservation.query.get(reservation_id)
    print(f"Reservation found: {reservation is not None}")

    if not reservation:
        print("=== ERROR: Reservation not found ===")
        return jsonify({'error': 'Reservation not found'}), 404

    print(f"Reservation status: {reservation.status}")
    print(f"Reservation user_id: {reservation.user_id}")
    print(
        f"Equipment: {reservation.equipment.name if reservation.equipment else 'None'}")

    # Check if user is admin
    is_admin = user.role == UserRole.ADMIN if user else False
    print(f"User is admin: {is_admin}")

    # Only the reservation owner OR an admin can request return
    if reservation.user_id != user_id and not is_admin:
        print(
            f"=== ERROR: Unauthorized - user {user_id} != reservation owner {reservation.user_id} and not admin ===")
        return jsonify({'error': 'Unauthorized - only the reservation owner or an admin can request return'}), 403

    if reservation.status != ReservationStatus.CHECKED_OUT:
        print(
            f"=== ERROR: Status is {reservation.status}, not CHECKED_OUT ===")
        return jsonify({'error': 'Equipment has not been checked out'}), 409

    try:
        print("=== UPDATING STATUS TO RETURN_PENDING ===")
        # Change status to RETURN_PENDING - awaiting admin verification
        reservation.status = ReservationStatus.RETURN_PENDING
        reservation.updated_at = datetime.now(timezone.utc)

        db.session.commit()
        print("=== STATUS UPDATED SUCCESSFULLY ===")

        # Create notification for admin
        print("=== CREATING ADMIN NOTIFICATION ===")
        notification = Notification(
            user_id=reservation.equipment.created_by,  # Notify admin who created equipment
            reservation_id=reservation.id,
            title='Return Request',
            message=f"{user.first_name} {user.last_name} has requested to return {reservation.equipment.name}. Please verify the equipment condition.",
            notification_type='return_request'
        )
        db.session.add(notification)
        db.session.commit()
        print("=== NOTIFICATION CREATED ===")

        print("=== RETURNING SUCCESS RESPONSE ===")
        return jsonify({
            'message': 'Return request submitted. Please wait for admin verification.',
            'reservation': reservation.to_dict(include_user=True, include_equipment=True)
        }), 200
    except Exception as e:
        print(f"=== EXCEPTION: {str(e)} ===")
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@reservation_bp.route('/<reservation_id>/verify-return', methods=['POST'])
@jwt_required()
def verify_return(reservation_id):
    """Admin verifies equipment return and marks as received"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    # Only admins can verify returns
    if user.role != UserRole.ADMIN:
        return jsonify({'error': 'Unauthorized - Admin access required'}), 403

    reservation = Reservation.query.get(reservation_id)

    if not reservation:
        return jsonify({'error': 'Reservation not found'}), 404

    if reservation.status != ReservationStatus.RETURN_PENDING:
        return jsonify({'error': 'Reservation is not pending return verification'}), 409

    data = request.get_json()
    approved = data.get('approved', False)
    admin_notes = data.get('notes', '')

    try:
        if approved:
            # Admin confirmed equipment was received in good condition
            reservation.status = ReservationStatus.RETURNED
            reservation.returned_at = datetime.now(timezone.utc)
            reservation.updated_at = datetime.now(timezone.utc)

            # Restore equipment quantity
            equipment = reservation.equipment
            equipment.quantity_available += reservation.quantity_requested

            # Ensure quantity_available doesn't exceed total quantity
            if equipment.quantity_available > equipment.quantity:
                equipment.quantity_available = equipment.quantity

            # Update equipment status to available if units are now available
            if equipment.quantity_available > 0:
                equipment.status = EquipmentStatus.AVAILABLE

            # Notify student that return was accepted
            notification = Notification(
                user_id=reservation.user_id,
                reservation_id=reservation.id,
                title='Return Accepted',
                message=f"Your return of {equipment.name} has been verified and accepted. Thank you!",
                notification_type='return_accepted'
            )
            db.session.add(notification)

            message = 'Equipment return verified and accepted'
        else:
            # Admin rejected the return (equipment damaged, missing, etc.)
            reservation.status = ReservationStatus.CHECKED_OUT  # Keep as checked out
            reservation.updated_at = datetime.now(timezone.utc)

            # Notify student that return was rejected
            notification = Notification(
                user_id=reservation.user_id,
                reservation_id=reservation.id,
                title='Return Rejected',
                message=f"Your return request for {reservation.equipment.name} was not accepted. Reason: {admin_notes}. Please contact admin.",
                notification_type='return_rejected'
            )
            db.session.add(notification)

            message = 'Equipment return rejected'

        db.session.commit()

        return jsonify({
            'message': message,
            'reservation': reservation.to_dict(include_user=True, include_equipment=True)
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
