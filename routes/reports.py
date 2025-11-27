"""
Reports and Analytics Routes
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from models import (Equipment, Reservation, QRCodeScan, UsageReport,
                    User, UserRole, ReservationStatus)
from datetime import datetime, timedelta
from sqlalchemy import func, and_, case

reports_bp = Blueprint('reports', __name__)


@reports_bp.route('/equipment/usage', methods=['GET'])
@jwt_required()
def get_equipment_usage_report():
    """Get equipment usage report (Admin only)"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if not user or user.role != UserRole.ADMIN:
        return jsonify({'error': 'Admin access required'}), 403

    days = request.args.get('days', 30, type=int)
    start_date = datetime.utcnow() - timedelta(days=days)

    # Get most borrowed equipment
    most_borrowed = db.session.query(
        Equipment.id,
        Equipment.name,
        func.count(Reservation.id).label('reservation_count')
    ).outerjoin(
        Reservation,
        and_(
            Reservation.equipment_id == Equipment.id,
            Reservation.created_at >= start_date,
            Reservation.status.in_([
                ReservationStatus.CHECKED_OUT,
                ReservationStatus.RETURNED
            ])
        )
    ).group_by(Equipment.id).order_by(
        func.count(Reservation.id).desc()
    ).limit(10).all()

    equipment_usage = []
    for eq_id, eq_name, count in most_borrowed:
        equipment_usage.append({
            'equipment_id': eq_id,
            'equipment_name': eq_name,
            'reservation_count': count
        })

    return jsonify({
        'period_days': days,
        'start_date': start_date.isoformat(),
        'end_date': datetime.utcnow().isoformat(),
        'most_borrowed': equipment_usage
    }), 200


@reports_bp.route('/peak-hours', methods=['GET'])
@jwt_required()
def get_peak_hours():
    """Get peak usage hours"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if not user or user.role != UserRole.ADMIN:
        return jsonify({'error': 'Admin access required'}), 403

    days = request.args.get('days', 30, type=int)
    start_date = datetime.utcnow() - timedelta(days=days)

    # Get reservations by hour
    reservations = Reservation.query.filter(
        Reservation.created_at >= start_date
    ).all()

    hour_distribution = {}
    for res in reservations:
        hour = res.created_at.hour
        hour_distribution[hour] = hour_distribution.get(hour, 0) + 1

    # Sort by hour
    peak_hours = sorted(hour_distribution.items())

    return jsonify({
        'period_days': days,
        'peak_hours': [{'hour': h, 'reservations': count} for h, count in peak_hours]
    }), 200


@reports_bp.route('/user-activity', methods=['GET'])
@jwt_required()
def get_user_activity():
    """Get user activity report (Admin only)"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if not user or user.role != UserRole.ADMIN:
        return jsonify({'error': 'Admin access required'}), 403

    days = request.args.get('days', 30, type=int)
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)

    start_date = datetime.utcnow() - timedelta(days=days)

    # Get users with most reservations
    user_activity = db.session.query(
        User.id,
        User.username,
        User.email,
        func.count(Reservation.id).label('total_reservations'),
        func.sum(case((Reservation.status == ReservationStatus.RETURNED,
                 1), else_=0)).label('completed'),
        func.sum(case((Reservation.status ==
                 ReservationStatus.CANCELLED, 1), else_=0)).label('cancelled')
    ).outerjoin(
        Reservation,
        and_(
            Reservation.user_id == User.id,
            Reservation.created_at >= start_date
        )
    ).group_by(User.id).order_by(
        func.count(Reservation.id).desc()
    ).paginate(page=page, per_page=per_page, error_out=False)

    activity_list = []
    for u_id, username, email, total, completed, cancelled in user_activity.items:
        activity_list.append({
            'user_id': u_id,
            'username': username,
            'email': email,
            'total_reservations': total or 0,
            'completed': completed or 0,
            'cancelled': cancelled or 0
        })

    return jsonify({
        'period_days': days,
        'user_activity': activity_list,
        'total': user_activity.total,
        'pages': user_activity.pages,
        'current_page': page
    }), 200


@reports_bp.route('/occupancy', methods=['GET'])
@jwt_required()
def get_occupancy_report():
    """Get equipment occupancy rate"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if not user or user.role != UserRole.ADMIN:
        return jsonify({'error': 'Admin access required'}), 403

    days = request.args.get('days', 30, type=int)
    start_date = datetime.utcnow() - timedelta(days=days)

    # Get all equipment
    equipment_list = Equipment.query.all()

    occupancy_data = []

    for equipment in equipment_list:
        # Get active reservations
        active_reservations = Reservation.query.filter(
            Reservation.equipment_id == equipment.id,
            Reservation.created_at >= start_date,
            Reservation.status.in_([
                ReservationStatus.APPROVED,
                ReservationStatus.CHECKED_OUT,
                ReservationStatus.RETURNED
            ])
        ).count()

        occupancy_rate = (active_reservations /
                          equipment.quantity) if equipment.quantity > 0 else 0

        occupancy_data.append({
            'equipment_id': equipment.id,
            'equipment_name': equipment.name,
            'quantity': equipment.quantity,
            'active_reservations': active_reservations,
            'occupancy_rate': min(occupancy_rate, 1.0)  # Cap at 100%
        })

    return jsonify({
        'period_days': days,
        'occupancy_data': occupancy_data
    }), 200


@reports_bp.route('/reservation-status-breakdown', methods=['GET'])
@jwt_required()
def get_reservation_status_breakdown():
    """Get breakdown of reservation statuses"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if not user or user.role != UserRole.ADMIN:
        return jsonify({'error': 'Admin access required'}), 403

    days = request.args.get('days', 30, type=int)
    start_date = datetime.utcnow() - timedelta(days=days)

    # Count reservations by status
    status_breakdown = db.session.query(
        Reservation.status,
        func.count(Reservation.id).label('count')
    ).filter(
        Reservation.created_at >= start_date
    ).group_by(Reservation.status).all()

    breakdown = {}
    for status, count in status_breakdown:
        breakdown[status] = count

    return jsonify({
        'period_days': days,
        'status_breakdown': breakdown
    }), 200


@reports_bp.route('/equipment/<equipment_id>/history', methods=['GET'])
@jwt_required()
def get_equipment_history(equipment_id):
    """Get complete history of an equipment"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if not user or user.role != UserRole.ADMIN:
        return jsonify({'error': 'Admin access required'}), 403

    equipment = Equipment.query.get(equipment_id)

    if not equipment:
        return jsonify({'error': 'Equipment not found'}), 404

    # Get all reservations
    reservations = Reservation.query.filter_by(
        equipment_id=equipment_id
    ).order_by(Reservation.created_at.desc()).all()

    # Get all QR scans
    qr_scans = QRCodeScan.query.filter_by(
        equipment_id=equipment_id
    ).order_by(QRCodeScan.scanned_at.desc()).all()

    return jsonify({
        'equipment': equipment.to_dict(),
        'reservations': [res.to_dict(include_user=True) for res in reservations],
        'qr_scans': [scan.to_dict() for scan in qr_scans]
    }), 200


@reports_bp.route('/export/csv', methods=['GET'])
@jwt_required()
def export_report_csv():
    """Export report as CSV"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if not user or user.role != UserRole.ADMIN:
        return jsonify({'error': 'Admin access required'}), 403

    report_type = request.args.get('type', 'reservations')

    try:
        import csv
        from io import StringIO

        if report_type == 'reservations':
            reservations = Reservation.query.all()

            output = StringIO()
            writer = csv.writer(output)
            writer.writerow(['Reservation ID', 'User', 'Equipment',
                            'Status', 'Reserved At', 'Start Date', 'End Date'])

            for res in reservations:
                writer.writerow([
                    res.id,
                    res.user.username,
                    res.equipment.name,
                    res.status,
                    res.created_at.isoformat(),
                    res.start_date.isoformat(),
                    res.end_date.isoformat()
                ])

            return output.getvalue(), 200, {
                'Content-Disposition': 'attachment; filename="reservations.csv"',
                'Content-Type': 'text/csv'
            }

        elif report_type == 'equipment':
            equipment_list = Equipment.query.all()

            output = StringIO()
            writer = csv.writer(output)
            writer.writerow(['Equipment ID', 'Name', 'Category',
                            'Quantity', 'Available', 'Status', 'Location'])

            for eq in equipment_list:
                writer.writerow([
                    eq.id,
                    eq.name,
                    eq.category,
                    eq.quantity,
                    eq.quantity_available,
                    eq.status,
                    eq.location
                ])

            return output.getvalue(), 200, {
                'Content-Disposition': 'attachment; filename="equipment.csv"',
                'Content-Type': 'text/csv'
            }

        return jsonify({'error': 'Invalid report type'}), 400

    except Exception as e:
        return jsonify({'error': str(e)}), 500
