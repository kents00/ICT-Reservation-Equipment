"""
QR Code Check-in/Check-out Routes
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from models import QRCodeScan, Reservation, Equipment, ReservationStatus, EquipmentStatus
from datetime import datetime

qrcode_bp = Blueprint('qrcode', __name__)


@qrcode_bp.route('/scan', methods=['POST'])
@jwt_required()
def scan_qr_code():
    """Scan QR code for check-in/check-out"""
    user_id = get_jwt_identity()
    data = request.get_json()

    if not data.get('qr_code') or not data.get('scan_type'):
        return jsonify({'error': 'Missing QR code or scan type'}), 400

    if data['scan_type'] not in ['check_in', 'check_out']:
        return jsonify({'error': 'Invalid scan type. Must be check_in or check_out'}), 400

    try:
        # Find equipment by QR code
        equipment = Equipment.query.filter_by(qr_code=data['qr_code']).first()

        if not equipment:
            return jsonify({'error': 'Equipment not found'}), 404

        # Find active reservation for this user and equipment
        reservation = Reservation.query.filter(
            Reservation.equipment_id == equipment.id,
            Reservation.user_id == user_id,
            Reservation.status.in_(
                [ReservationStatus.APPROVED, ReservationStatus.CHECKED_OUT])
        ).first()

        if not reservation:
            return jsonify({'error': 'No active reservation found for this equipment'}), 404

        if data['scan_type'] == 'check_in':
            # Validate check-in timing
            now = datetime.utcnow()
            if now < reservation.start_date:
                return jsonify({
                    'error': f'Cannot check in yet. Available from {reservation.start_date.isoformat()}'
                }), 400

            # Mark as checked out
            reservation.status = ReservationStatus.CHECKED_OUT
            reservation.checked_out_at = now

            # Update equipment status
            equipment.status = EquipmentStatus.CHECKED_OUT
            equipment.quantity_available = max(
                0, equipment.quantity_available - 1)

        elif data['scan_type'] == 'check_out':
            # Validate check-out timing
            if reservation.status != ReservationStatus.CHECKED_OUT:
                return jsonify({'error': 'Equipment must be checked in first'}), 409

            # Mark as returned
            reservation.status = ReservationStatus.RETURNED
            reservation.returned_at = datetime.utcnow()

            # Update equipment status - check if all copies are available
            active_reservations = Reservation.query.filter(
                Reservation.equipment_id == equipment.id,
                Reservation.status == ReservationStatus.CHECKED_OUT
            ).count()

            if active_reservations == 0:
                equipment.status = EquipmentStatus.AVAILABLE
                equipment.quantity_available = equipment.quantity

        # Record QR scan
        qr_scan = QRCodeScan(
            equipment_id=equipment.id,
            reservation_id=reservation.id,
            scan_type=data['scan_type'],
            scanned_by=user_id,
            latitude=data.get('latitude'),
            longitude=data.get('longitude'),
            notes=data.get('notes', '')
        )

        equipment.updated_at = datetime.utcnow()
        reservation.updated_at = datetime.utcnow()

        db.session.add(qr_scan)
        db.session.commit()

        return jsonify({
            'message': f'{data["scan_type"]} successful',
            'qr_scan': qr_scan.to_dict(),
            'reservation': reservation.to_dict(),
            'equipment': equipment.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@qrcode_bp.route('/scan-history/<reservation_id>', methods=['GET'])
@jwt_required()
def get_scan_history(reservation_id):
    """Get QR scan history for a reservation"""
    user_id = get_jwt_identity()

    reservation = Reservation.query.get(reservation_id)

    if not reservation:
        return jsonify({'error': 'Reservation not found'}), 404

    # Verify user owns reservation or is admin
    from models import User, UserRole
    user = User.query.get(user_id)
    if reservation.user_id != user_id and user.role != UserRole.ADMIN:
        return jsonify({'error': 'Unauthorized'}), 403

    scans = QRCodeScan.query.filter_by(reservation_id=reservation_id).order_by(
        QRCodeScan.scanned_at.desc()
    ).all()

    return jsonify({
        'reservation_id': reservation_id,
        'scan_history': [scan.to_dict() for scan in scans]
    }), 200


@qrcode_bp.route('/equipment/<equipment_id>/scan-stats', methods=['GET'])
@jwt_required()
def get_equipment_scan_stats(equipment_id):
    """Get scan statistics for equipment"""
    user_id = get_jwt_identity()

    from models import User, UserRole
    user = User.query.get(user_id)

    if user.role != UserRole.ADMIN:
        return jsonify({'error': 'Admin access required'}), 403

    equipment = Equipment.query.get(equipment_id)

    if not equipment:
        return jsonify({'error': 'Equipment not found'}), 404

    # Get scan statistics
    total_scans = QRCodeScan.query.filter_by(equipment_id=equipment_id).count()
    check_in_scans = QRCodeScan.query.filter_by(
        equipment_id=equipment_id,
        scan_type='check_in'
    ).count()
    check_out_scans = QRCodeScan.query.filter_by(
        equipment_id=equipment_id,
        scan_type='check_out'
    ).count()

    # Get recent scans
    recent_scans = QRCodeScan.query.filter_by(equipment_id=equipment_id).order_by(
        QRCodeScan.scanned_at.desc()
    ).limit(10).all()

    return jsonify({
        'equipment_id': equipment_id,
        'total_scans': total_scans,
        'check_in_scans': check_in_scans,
        'check_out_scans': check_out_scans,
        'recent_scans': [scan.to_dict() for scan in recent_scans]
    }), 200


@qrcode_bp.route('/validate', methods=['POST'])
def validate_qr_code():
    """Validate QR code without authentication"""
    data = request.get_json()

    if not data.get('qr_code'):
        return jsonify({'error': 'QR code is required'}), 400

    equipment = Equipment.query.filter_by(qr_code=data['qr_code']).first()

    if not equipment:
        return jsonify({'error': 'Invalid QR code'}), 404

    return jsonify({
        'valid': True,
        'equipment': equipment.to_dict()
    }), 200
