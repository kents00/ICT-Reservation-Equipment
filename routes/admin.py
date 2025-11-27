"""
Admin Management Routes
"""
from flask import Blueprint, request, jsonify, render_template, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db, socketio
from models import (User, Equipment, Reservation, ReservationStatus,
                    EquipmentStatus, Notification, UserRole)
from datetime import datetime, timedelta
from werkzeug.utils import secure_filename
import os
from utils.email_service import (
    send_reservation_approved_email,
    send_reservation_rejected_email,
    send_equipment_overdue_email,
    send_new_reservation_notification_to_admin
)

admin_bp = Blueprint('admin', __name__)


def check_admin(user_id):
    """Check if user is admin"""
    user = User.query.get(user_id)
    if not user or user.role != UserRole.ADMIN:
        return None
    return user


def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower(
           ) in current_app.config['ALLOWED_EXTENSIONS']


def save_user_image(file):
    """Save uploaded user profile image and return the URL path"""
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        # Add timestamp to make filename unique
        timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
        unique_filename = f"{timestamp}_{filename}"

        # Ensure upload directory exists
        upload_folder = os.path.join(
            current_app.root_path, 'static', 'uploads', 'users')
        os.makedirs(upload_folder, exist_ok=True)

        # Save file
        filepath = os.path.join(upload_folder, unique_filename)
        file.save(filepath)

        # Return relative URL path
        return f"/static/uploads/users/{unique_filename}"
    return None


def delete_user_image(image_url):
    """Delete user profile image file from filesystem"""
    if image_url and image_url.startswith('/static/uploads/users/'):
        try:
            filename = image_url.split('/')[-1]
            filepath = os.path.join(
                current_app.root_path, 'static', 'uploads', 'users', filename)
            if os.path.exists(filepath):
                os.remove(filepath)
        except Exception as e:
            print(f"Error deleting user image: {e}")


@admin_bp.route('/reservations/pending', methods=['GET'])
@jwt_required()
def get_pending_reservations():
    """Get all pending reservation requests (Admin only)"""
    user_id = get_jwt_identity()

    if not check_admin(user_id):
        return jsonify({'error': 'Admin access required'}), 403

    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)

    query = Reservation.query.filter_by(status=ReservationStatus.PENDING).order_by(
        Reservation.created_at.desc()
    )

    paginated = query.paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        'pending_reservations': [
            item.to_dict(include_user=True, include_equipment=True)
            for item in paginated.items
        ],
        'total': paginated.total,
        'pages': paginated.pages,
        'current_page': page
    }), 200


@admin_bp.route('/reservations/<reservation_id>/approve', methods=['POST'])
@jwt_required()
def approve_reservation(reservation_id):
    """Approve a reservation request"""
    user_id = get_jwt_identity()

    if not check_admin(user_id):
        return jsonify({'error': 'Admin access required'}), 403

    reservation = Reservation.query.get(reservation_id)

    if not reservation:
        return jsonify({'error': 'Reservation not found'}), 404

    if reservation.status != ReservationStatus.PENDING:
        return jsonify({'error': f'Cannot approve reservation with status: {reservation.status}'}), 409

    data = request.get_json() or {}

    try:
        reservation.status = ReservationStatus.APPROVED
        reservation.approved_at = datetime.utcnow()
        reservation.admin_notes = data.get('notes', '')
        reservation.updated_at = datetime.utcnow()

        # Update equipment status
        equipment = reservation.equipment
        equipment.status = EquipmentStatus.RESERVED
        equipment.quantity_available -= reservation.quantity_requested

        # Create notification for user
        notification = Notification(
            user_id=reservation.user_id,
            reservation_id=reservation_id,
            title='Reservation Approved',
            message=f'Your reservation for {equipment.name} has been approved. Pick up starts on {reservation.start_date.strftime("%Y-%m-%d")}',
            notification_type='approval'
        )

        db.session.add(notification)
        db.session.commit()

        # Send email notification to user
        send_reservation_approved_email(
            user=reservation.user,
            reservation=reservation,
            equipment=equipment
        )

        # Emit real-time notification
        socketio.emit('reservation_approved', {
            'reservation_id': reservation_id,
            'user_id': reservation.user_id,
            'equipment_id': equipment.id
        }, room='users')

        return jsonify({
            'message': 'Reservation approved successfully',
            'reservation': reservation.to_dict(include_user=True, include_equipment=True)
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@admin_bp.route('/reservations/<reservation_id>/reject', methods=['POST'])
@jwt_required()
def reject_reservation(reservation_id):
    """Reject a reservation request"""
    user_id = get_jwt_identity()

    if not check_admin(user_id):
        return jsonify({'error': 'Admin access required'}), 403

    reservation = Reservation.query.get(reservation_id)

    if not reservation:
        return jsonify({'error': 'Reservation not found'}), 404

    if reservation.status != ReservationStatus.PENDING:
        return jsonify({'error': f'Cannot reject reservation with status: {reservation.status}'}), 409

    data = request.get_json()

    if not data or not data.get('reason'):
        return jsonify({'error': 'Rejection reason is required'}), 400

    try:
        reservation.status = ReservationStatus.REJECTED
        reservation.rejected_at = datetime.utcnow()
        reservation.rejection_reason = data['reason']
        reservation.updated_at = datetime.utcnow()

        # Create notification for user
        notification = Notification(
            user_id=reservation.user_id,
            reservation_id=reservation_id,
            title='Reservation Rejected',
            message=f'Your reservation has been rejected. Reason: {data["reason"]}',
            notification_type='rejection'
        )

        db.session.add(notification)
        db.session.commit()

        # Send email notification to user
        send_reservation_rejected_email(
            user=reservation.user,
            reservation=reservation,
            equipment=reservation.equipment,
            reason=data['reason']
        )

        # Emit real-time notification
        socketio.emit('reservation_rejected', {
            'reservation_id': reservation_id,
            'user_id': reservation.user_id,
        }, room='users')

        return jsonify({
            'message': 'Reservation rejected successfully',
            'reservation': reservation.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@admin_bp.route('/reservations/all', methods=['GET'])
@jwt_required()
def get_all_reservations():
    """Get all reservations (Admin only)"""
    user_id = get_jwt_identity()

    if not check_admin(user_id):
        return jsonify({'error': 'Admin access required'}), 403

    status = request.args.get('status')
    equipment_id = request.args.get('equipment_id')
    user_filter = request.args.get('user_id')
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)

    query = Reservation.query

    if status:
        query = query.filter_by(status=status)
    if equipment_id:
        query = query.filter_by(equipment_id=equipment_id)
    if user_filter:
        query = query.filter_by(user_id=user_filter)

    paginated = query.order_by(Reservation.created_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )

    return jsonify({
        'reservations': [
            item.to_dict(include_user=True, include_equipment=True)
            for item in paginated.items
        ],
        'total': paginated.total,
        'pages': paginated.pages,
        'current_page': page
    }), 200


@admin_bp.route('/users', methods=['GET'])
@jwt_required()
def get_all_users():
    """Get all users (Admin only)"""
    user_id = get_jwt_identity()

    if not check_admin(user_id):
        return jsonify({'error': 'Admin access required'}), 403

    role = request.args.get('role')
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)

    query = User.query

    if role:
        query = query.filter_by(role=role)

    paginated = query.paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        'users': [item.to_dict() for item in paginated.items],
        'total': paginated.total,
        'pages': paginated.pages,
        'current_page': page
    }), 200


@admin_bp.route('/users/<user_id>', methods=['GET'])
@jwt_required()
def get_user(user_id):
    """Get a single user (Admin only)"""
    admin_id = get_jwt_identity()

    if not check_admin(admin_id):
        return jsonify({'error': 'Admin access required'}), 403

    user = User.query.get(user_id)

    if not user:
        return jsonify({'error': 'User not found'}), 404

    return jsonify({
        'user': user.to_dict()
    }), 200


@admin_bp.route('/users/<user_id>', methods=['PUT'])
@jwt_required()
def update_user(user_id):
    """Update user status (Admin only)"""
    admin_id = get_jwt_identity()

    if not check_admin(admin_id):
        return jsonify({'error': 'Admin access required'}), 403

    user = User.query.get(user_id)

    if not user:
        return jsonify({'error': 'User not found'}), 404

    # Check for profile image upload
    profile_image = request.files.get('profile_image')
    if profile_image:
        # Delete old image if exists
        if user.image_url:
            delete_user_image(user.image_url)
        # Save new image
        user.image_url = save_user_image(profile_image)

    # Check if request has form data or JSON
    if request.form:
        data = request.form.to_dict()
    elif request.is_json:
        data = request.get_json()
    else:
        return jsonify({'error': 'Invalid request format'}), 400

    try:
        # Update username if provided and check for uniqueness
        if 'username' in data and data['username'] != user.username:
            # Check if username is already taken
            existing_user = User.query.filter_by(
                username=data['username']).first()
            if existing_user and existing_user.id != user_id:
                return jsonify({'error': 'Username already taken'}), 409
            user.username = data['username']

        # Update individual name fields
        if 'first_name' in data:
            user.first_name = data['first_name']
        if 'middle_name' in data:
            user.middle_name = data['middle_name']
        if 'last_name' in data:
            user.last_name = data['last_name']
        if 'student_id' in data:
            user.student_id = data['student_id']
        if 'email' in data:
            user.email = data['email']
        if 'phone' in data:
            user.phone = data['phone']
        if 'department' in data:
            user.department = data['department']
        if 'is_active' in data:
            # Handle both boolean and string values
            user.is_active = data['is_active'] in [
                True, 'true', 'True', '1', 1]
        if 'role' in data:
            user.role = data['role']

        user.updated_at = datetime.utcnow()
        db.session.commit()

        return jsonify({
            'message': 'User updated successfully',
            'user': user.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@admin_bp.route('/users/<user_id>', methods=['DELETE'])
@jwt_required()
def delete_user(user_id):
    """Delete a user (Admin only)"""
    admin_id = get_jwt_identity()

    if not check_admin(admin_id):
        return jsonify({'error': 'Admin access required'}), 403

    user = User.query.get(user_id)

    if not user:
        return jsonify({'error': 'User not found'}), 404

    # Prevent admin from deleting themselves
    if user_id == admin_id:
        return jsonify({'error': 'Cannot delete your own account'}), 400

    try:
        db.session.delete(user)
        db.session.commit()

        return jsonify({
            'message': 'User deleted successfully'
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@admin_bp.route('/auto-cancel-unclaimed', methods=['POST'])
@jwt_required()
def auto_cancel_unclaimed():
    """Auto-cancel unclaimed reservations after expiry date"""
    user_id = get_jwt_identity()

    if not check_admin(user_id):
        return jsonify({'error': 'Admin access required'}), 403

    try:
        now = datetime.utcnow()

        # Find reservations past auto-cancel date that are still pending
        unclaimed = Reservation.query.filter(
            Reservation.status == ReservationStatus.PENDING,
            Reservation.auto_cancel_date < now
        ).all()

        cancelled_count = 0

        for reservation in unclaimed:
            reservation.status = ReservationStatus.CANCELLED
            reservation.updated_at = datetime.utcnow()

            # Create notification
            notification = Notification(
                user_id=reservation.user_id,
                reservation_id=reservation.id,
                title='Reservation Expired',
                message=f'Your reservation for {reservation.equipment.name} has been automatically cancelled due to expiry',
                notification_type='expiry'
            )

            db.session.add(notification)
            cancelled_count += 1

        db.session.commit()

        return jsonify({
            'message': f'Auto-cancelled {cancelled_count} expired reservations',
            'cancelled_count': cancelled_count
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@admin_bp.route('/dashboard/stats', methods=['GET'])
@jwt_required()
def get_dashboard_stats():
    """Get admin dashboard statistics"""
    user_id = get_jwt_identity()

    if not check_admin(user_id):
        return jsonify({'error': 'Admin access required'}), 403

    try:
        total_equipment = Equipment.query.count()
        available_equipment = Equipment.query.filter_by(
            status=EquipmentStatus.AVAILABLE).count()
        reserved_equipment = Equipment.query.filter_by(
            status=EquipmentStatus.RESERVED).count()

        total_users = User.query.count()
        student_users = User.query.filter_by(role=UserRole.STUDENT).count()

        pending_reservations = Reservation.query.filter_by(
            status=ReservationStatus.PENDING).count()
        approved_reservations = Reservation.query.filter_by(
            status=ReservationStatus.APPROVED).count()
        checked_out = Reservation.query.filter_by(
            status=ReservationStatus.CHECKED_OUT).count()

        return jsonify({
            'equipment': {
                'total': total_equipment,
                'available': available_equipment,
                'reserved': reserved_equipment,
                'in_maintenance': Equipment.query.filter_by(status=EquipmentStatus.MAINTENANCE).count()
            },
            'users': {
                'total': total_users,
                'students': student_users,
                'admins': total_users - student_users
            },
            'reservations': {
                'pending': pending_reservations,
                'approved': approved_reservations,
                'checked_out': checked_out,
                'total': Reservation.query.count()
            }
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@admin_bp.route('/view-reservation/<reservation_id>', methods=['GET'])
@jwt_required()
def view_reservation(reservation_id):
    """Admin view for reservation details"""
    user_id = get_jwt_identity()
    if not check_admin(user_id):
        return jsonify({'error': 'Admin access required'}), 403
    reservation = Reservation.query.get(reservation_id)
    if not reservation:
        return render_template('admin/view-reservation.html', reservation=None)
    # Ensure user and equipment are loaded
    user = reservation.user
    equipment = reservation.equipment
    return render_template('admin/view-reservation.html', reservation=reservation)


@admin_bp.route('/search/comprehensive', methods=['GET'])
@jwt_required()
def comprehensive_search():
    """Search across all categories: Equipment, Reservations, Users, Approvals"""
    user_id = get_jwt_identity()

    if not check_admin(user_id):
        return jsonify({'error': 'Admin access required'}), 403

    query = request.args.get('q', '').strip().lower()
    limit = request.args.get('limit', 5, type=int)

    if not query or len(query) < 2:
        return jsonify({'error': 'Search query too short (min 2 characters)'}), 400

    try:
        # Search Equipment
        equipment_results = Equipment.query.filter(
            (Equipment.name.ilike(f'%{query}%')) |
            (Equipment.category.ilike(f'%{query}%')) |
            (Equipment.description.ilike(f'%{query}%'))
        ).limit(limit).all()

        equipment_data = [
            {
                'id': item.id,
                'title': item.name,
                'description': f'{item.category} - {item.description or ""}',
                'status': item.status,
                'link': f'/admin/equipment/{item.id}/view'
            }
            for item in equipment_results
        ]

        # Search Reservations
        reservations_results = Reservation.query.filter(
            (Reservation.id.ilike(f'%{query}%')) |
            (Reservation.reason.ilike(f'%{query}%'))
        ).limit(limit).all()

        reservations_data = [
            {
                'id': item.id,
                'title': f'Reservation #{item.id[:8]}',
                'description': f'{item.user.username if item.user else "Unknown"} - {item.equipment.name if item.equipment else "Unknown"}',
                'status': item.status,
                'link': f'/admin/view-reservation.html?id={item.id}'
            }
            for item in reservations_results
        ]

        # Search Users
        users_results = User.query.filter(
            (User.username.ilike(f'%{query}%')) |
            (User.email.ilike(f'%{query}%')) |
            (User.first_name.ilike(f'%{query}%')) |
            (User.last_name.ilike(f'%{query}%'))
        ).limit(limit).all()

        users_data = [
            {
                'id': item.id,
                'title': f'{item.first_name} {item.last_name}',
                'description': f'ID: {item.username} - {item.email}',
                'status': item.role.upper() if item.role else 'USER',
                'link': f'/admin/edit-user.html?id={item.id}'
            }
            for item in users_results
        ]

        # Search Approvals (pending reservations)
        approvals_results = Reservation.query.filter(
            Reservation.status == ReservationStatus.PENDING,
            (Reservation.id.ilike(f'%{query}%')) |
            (Reservation.reason.ilike(f'%{query}%'))
        ).limit(limit).all()

        approvals_data = [
            {
                'id': item.id,
                'title': f'Approval #{item.id[:8]}',
                'description': f'{item.user.username if item.user else "Unknown"} - {item.equipment.name if item.equipment else "Unknown"} - {item.reason or "No reason provided"}',
                'status': 'Pending',
                'link': '/admin/dashboard?section=approvals'
            }
            for item in approvals_results
        ]

        # Settings (static search results)
        settings_data = []
        if 'system' in query or 'configuration' in query or 'settings' in query:
            settings_data.append({
                'id': 'SET001',
                'title': 'System Configuration',
                'description': 'Configure system preferences, notification settings, and maintenance intervals',
                'status': 'Accessible',
                'link': '/admin/dashboard?section=settings'
            })
        if 'account' in query or 'admin' in query or 'profile' in query:
            settings_data.append({
                'id': 'SET002',
                'title': 'Admin Account Settings',
                'description': 'Manage admin profiles, passwords, and access permissions',
                'status': 'Accessible',
                'link': '/admin/dashboard?section=settings'
            })
        if 'reservation' in query or 'rules' in query or 'policy' in query:
            settings_data.append({
                'id': 'SET003',
                'title': 'Reservation Rules',
                'description': 'Configure reservation policies and approval workflows',
                'status': 'Accessible',
                'link': '/admin/dashboard?section=settings'
            })

        return jsonify({
            'query': query,
            'equipment': equipment_data,
            'reservations': reservations_data,
            'users': users_data,
            'approvals': approvals_data,
            'reports': [],
            'settings': settings_data
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@admin_bp.route('/notifications', methods=['GET'])
@jwt_required()
def get_admin_notifications():
    """Get all notifications for the admin user based on recent activity"""
    user_id = get_jwt_identity()
    admin = check_admin(user_id)
    if not admin:
        return jsonify({'error': 'Admin access required'}), 403

    notifications_list = []

    # Get recent equipment additions (last 7 days)
    recent_equipment = Equipment.query.filter(
        Equipment.created_at >= datetime.utcnow() - timedelta(days=7)
    ).order_by(Equipment.created_at.desc()).limit(10).all()

    for eq in recent_equipment:
        notifications_list.append({
            'id': f'eq_{eq.id}',
            'title': 'New Equipment Added',
            'message': f'{eq.name} has been added to the system',
            'date': eq.created_at.strftime('%Y-%m-%d %H:%M'),
            'read': False,
            'muted': False
        })

    # Get recent approved reservations
    recent_approved = Reservation.query.filter(
        Reservation.status == ReservationStatus.APPROVED,
        Reservation.approved_at >= datetime.utcnow() - timedelta(days=7)
    ).order_by(Reservation.approved_at.desc()).limit(10).all()

    for res in recent_approved:
        notifications_list.append({
            'id': f'res_approved_{res.id}',
            'title': 'Reservation Approved',
            'message': f'{res.user.username} reservation for {res.equipment.name} has been approved',
            'date': res.approved_at.strftime('%Y-%m-%d %H:%M') if res.approved_at else res.updated_at.strftime('%Y-%m-%d %H:%M'),
            'read': False,
            'muted': False
        })

    # Get recent returned equipment
    recent_returned = Reservation.query.filter(
        Reservation.status == ReservationStatus.RETURNED,
        Reservation.returned_at >= datetime.utcnow() - timedelta(days=7)
    ).order_by(Reservation.returned_at.desc()).limit(10).all()

    for res in recent_returned:
        notifications_list.append({
            'id': f'res_returned_{res.id}',
            'title': 'Equipment Returned',
            'message': f'{res.user.username} returned {res.equipment.name}',
            'date': res.returned_at.strftime('%Y-%m-%d %H:%M') if res.returned_at else res.updated_at.strftime('%Y-%m-%d %H:%M'),
            'read': False,
            'muted': False
        })

    # Get overdue reservations
    overdue = Reservation.query.filter(
        Reservation.status == ReservationStatus.CHECKED_OUT,
        Reservation.end_date < datetime.utcnow()
    ).order_by(Reservation.end_date.desc()).limit(10).all()

    for res in overdue:
        notifications_list.append({
            'id': f'res_overdue_{res.id}',
            'title': 'Equipment Overdue',
            'message': f'{res.equipment.name} is overdue for return. Student: {res.user.username}',
            'date': res.end_date.strftime('%Y-%m-%d %H:%M'),
            'read': False,
            'muted': False
        })

    # Get pending approval requests
    pending = Reservation.query.filter(
        Reservation.status == ReservationStatus.PENDING
    ).order_by(Reservation.created_at.desc()).limit(10).all()

    for res in pending:
        notifications_list.append({
            'id': f'res_pending_{res.id}',
            'title': 'New Approval Request',
            'message': f'{res.user.username} requested approval for {res.equipment.name}',
            'date': res.created_at.strftime('%Y-%m-%d %H:%M'),
            'read': False,
            'muted': False
        })

    # Get equipment in maintenance
    maintenance_equipment = Equipment.query.filter(
        Equipment.status == EquipmentStatus.MAINTENANCE
    ).order_by(Equipment.updated_at.desc()).limit(10).all()

    for eq in maintenance_equipment:
        notifications_list.append({
            'id': f'eq_maintenance_{eq.id}',
            'title': 'Maintenance Scheduled',
            'message': f'{eq.name} has been scheduled for maintenance',
            'date': eq.updated_at.strftime('%Y-%m-%d %H:%M'),
            'read': False,
            'muted': False
        })

    # Sort all notifications by date (most recent first)
    notifications_list.sort(key=lambda x: x['date'], reverse=True)

    # Limit to 50 most recent
    notifications_list = notifications_list[:50]

    return jsonify({
        'notifications': notifications_list
    }), 200


@admin_bp.route('/notifications/<notification_id>/dismiss', methods=['POST'])
@jwt_required()
def dismiss_notification(notification_id):
    """Dismiss a notification (mark as dismissed)"""
    user_id = get_jwt_identity()
    admin = check_admin(user_id)
    if not admin:
        return jsonify({'error': 'Admin access required'}), 403

    notification = Notification.query.get(notification_id)
    if not notification:
        return jsonify({'error': 'Notification not found'}), 404

    notification.is_dismissed = True
    notification.updated_at = datetime.utcnow()
    db.session.commit()

    # Count remaining unread notifications
    unread_count = Notification.query.filter_by(
        user_id=user_id, is_read=False, is_dismissed=False
    ).count()

    return jsonify({
        'message': 'Notification dismissed successfully',
        'unread_count': unread_count
    }), 200


@admin_bp.route('/notifications/unread-count', methods=['GET'])
@jwt_required()
def get_unread_count():
    """Get count of unread and not dismissed notifications"""
    user_id = get_jwt_identity()
    admin = check_admin(user_id)
    if not admin:
        return jsonify({'error': 'Admin access required'}), 403

    unread_count = Notification.query.filter_by(
        user_id=user_id, is_read=False, is_dismissed=False
    ).count()

    return jsonify({
        'unread_count': unread_count
    }), 200
