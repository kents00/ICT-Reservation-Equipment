"""
Unit tests for QR Code Check-in/Check-out API endpoints
"""
import pytest
from datetime import datetime, timedelta
from app import db


class TestQRCodeScan:
    """Tests for POST /api/qrcode/scan"""

    def test_scan_check_in_success(self, client, student_token, app, test_reservation, test_equipment):
        """Test successful check-in scan"""
        # First approve the reservation and set dates to current
        with app.app_context():
            from models import Reservation, ReservationStatus
            from datetime import datetime, timedelta, timezone
            res = Reservation.query.get(test_reservation.id)
            res.status = ReservationStatus.APPROVED
            res.start_date = datetime.now(timezone.utc) - timedelta(hours=1)
            res.end_date = datetime.now(timezone.utc) + timedelta(days=1)
            db.session.commit()

        response = client.post(
            '/api/qrcode/scan',
            headers={'Authorization': f'Bearer {student_token}'},
            json={
                'qr_code': test_equipment.qr_code,
                'scan_type': 'check_in',
                'latitude': 40.7128,
                'longitude': -74.0060
            }
        )

        if response.status_code != 200:
            print(f"Error: {response.get_json()}")
        assert response.status_code == 200
        data = response.get_json()
        assert 'qr_scan' in data
        assert data['qr_scan']['scan_type'] == 'check_in'
        assert data['reservation']['status'] == 'checked_out'

    def test_scan_check_out_success(self, client, student_token, app, test_reservation, test_equipment):
        """Test successful check-out scan"""
        # First mark as checked in
        with app.app_context():
            from models import Reservation, ReservationStatus
            res = Reservation.query.get(test_reservation.id)
            res.status = ReservationStatus.CHECKED_OUT
            db.session.commit()

        response = client.post(
            '/api/qrcode/scan',
            headers={'Authorization': f'Bearer {student_token}'},
            json={
                'qr_code': test_equipment.qr_code,
                'scan_type': 'check_out'
            }
        )

        assert response.status_code == 200
        data = response.get_json()
        assert data['qr_scan']['scan_type'] == 'check_out'
        assert data['reservation']['status'] == 'returned'

    def test_scan_missing_qr_code(self, client, student_token):
        """Test scan without QR code"""
        response = client.post(
            '/api/qrcode/scan',
            headers={'Authorization': f'Bearer {student_token}'},
            json={'scan_type': 'check_in'}
        )

        assert response.status_code == 400
        assert 'Missing QR code or scan type' in response.get_json()['error']

    def test_scan_invalid_scan_type(self, client, student_token, test_equipment):
        """Test scan with invalid scan type"""
        response = client.post(
            '/api/qrcode/scan',
            headers={'Authorization': f'Bearer {student_token}'},
            json={
                'qr_code': test_equipment.qr_code,
                'scan_type': 'invalid'
            }
        )

        assert response.status_code == 400
        assert 'Invalid scan type' in response.get_json()['error']

    def test_scan_equipment_not_found(self, client, student_token):
        """Test scan with invalid QR code"""
        response = client.post(
            '/api/qrcode/scan',
            headers={'Authorization': f'Bearer {student_token}'},
            json={
                'qr_code': 'nonexistent-qr',
                'scan_type': 'check_in'
            }
        )

        assert response.status_code == 404

    def test_scan_no_active_reservation(self, client, student_token, test_equipment):
        """Test scan without active reservation"""
        response = client.post(
            '/api/qrcode/scan',
            headers={'Authorization': f'Bearer {student_token}'},
            json={
                'qr_code': test_equipment.qr_code,
                'scan_type': 'check_in'
            }
        )

        assert response.status_code == 404

    def test_scan_check_in_early(self, client, student_token, app, test_reservation, test_equipment):
        """Test check-in before start date"""
        # Create reservation with future start date
        with app.app_context():
            from models import Reservation, ReservationStatus
            from datetime import datetime, timedelta, timezone
            res = Reservation.query.get(test_reservation.id)
            res.status = ReservationStatus.APPROVED
            res.start_date = datetime.now(timezone.utc) + timedelta(days=5)
            db.session.commit()

        response = client.post(
            '/api/qrcode/scan',
            headers={'Authorization': f'Bearer {student_token}'},
            json={
                'qr_code': test_equipment.qr_code,
                'scan_type': 'check_in'
            }
        )

        assert response.status_code == 400
        assert 'Cannot check in yet' in response.get_json()['error']


class TestQRCodeScanHistory:
    """Tests for GET /api/qrcode/scan-history/<reservation_id>"""

    def test_get_scan_history_success(self, client, student_token, test_reservation):
        """Test retrieving scan history"""
        response = client.get(
            f'/api/qrcode/scan-history/{test_reservation.id}',
            headers={'Authorization': f'Bearer {student_token}'}
        )

        assert response.status_code == 200
        data = response.get_json()
        assert 'reservation_id' in data
        assert 'scan_history' in data

    def test_get_scan_history_not_found(self, client, student_token):
        """Test retrieving scan history for non-existent reservation"""
        response = client.get(
            '/api/qrcode/scan-history/nonexistent-id',
            headers={'Authorization': f'Bearer {student_token}'}
        )

        assert response.status_code == 404

    def test_get_scan_history_unauthorized(self, client, admin_token, test_reservation):
        """Test that different users cannot access scan history"""
        response = client.get(
            f'/api/qrcode/scan-history/{test_reservation.id}',
            headers={'Authorization': f'Bearer {admin_token}'}
        )

        # Admin can access, but others cannot
        assert response.status_code in [200, 403]


class TestQRCodeEquipmentStats:
    """Tests for GET /api/qrcode/equipment/<equipment_id>/scan-stats"""

    def test_get_equipment_scan_stats_success(self, client, admin_token, test_equipment):
        """Test retrieving equipment scan statistics"""
        response = client.get(
            f'/api/qrcode/equipment/{test_equipment.id}/scan-stats',
            headers={'Authorization': f'Bearer {admin_token}'}
        )

        assert response.status_code == 200
        data = response.get_json()
        assert 'equipment_id' in data
        assert 'total_scans' in data
        assert 'check_in_scans' in data
        assert 'check_out_scans' in data
        assert 'recent_scans' in data

    def test_get_equipment_scan_stats_not_found(self, client, admin_token):
        """Test retrieving stats for non-existent equipment"""
        response = client.get(
            '/api/qrcode/equipment/nonexistent-id/scan-stats',
            headers={'Authorization': f'Bearer {admin_token}'}
        )

        assert response.status_code == 404

    def test_get_equipment_scan_stats_student_denied(self, client, student_token, test_equipment):
        """Test that students cannot access scan stats"""
        response = client.get(
            f'/api/qrcode/equipment/{test_equipment.id}/scan-stats',
            headers={'Authorization': f'Bearer {student_token}'}
        )

        assert response.status_code == 403


class TestQRCodeValidate:
    """Tests for POST /api/qrcode/validate"""

    def test_validate_qr_code_success(self, client, test_equipment):
        """Test successful QR code validation"""
        response = client.post(
            '/api/qrcode/validate',
            json={'qr_code': test_equipment.qr_code}
        )

        assert response.status_code == 200
        data = response.get_json()
        assert data['valid'] == True
        assert 'equipment' in data
        assert data['equipment']['id'] == test_equipment.id

    def test_validate_invalid_qr_code(self, client):
        """Test validation with invalid QR code"""
        response = client.post(
            '/api/qrcode/validate',
            json={'qr_code': 'nonexistent-qr'}
        )

        assert response.status_code == 404
        assert 'Invalid QR code' in response.get_json()['error']

    def test_validate_missing_qr_code(self, client):
        """Test validation without QR code"""
        response = client.post(
            '/api/qrcode/validate',
            json={}
        )

        assert response.status_code == 400
        assert 'QR code is required' in response.get_json()['error']

    def test_validate_qr_code_no_auth_required(self, client, test_equipment):
        """Test that QR validation doesn't require authentication"""
        response = client.post(
            '/api/qrcode/validate',
            json={'qr_code': test_equipment.qr_code}
        )

        assert response.status_code == 200
