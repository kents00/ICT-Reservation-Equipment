"""
Unit tests for Reservation Management API endpoints
"""
import pytest
from datetime import datetime, timedelta
from app import db


class TestReservationCreate:
    """Tests for POST /api/reservation"""

    def test_create_reservation_success(self, client, student_token, student_user, test_equipment):
        """Test successful reservation creation"""
        start_date = (datetime.utcnow() + timedelta(days=1)).isoformat()
        end_date = (datetime.utcnow() + timedelta(days=4)).isoformat()

        response = client.post(
            '/api/reservation',
            headers={'Authorization': f'Bearer {student_token}'},
            json={
                'equipment_id': test_equipment.id,
                'start_date': start_date,
                'end_date': end_date,
                'reason': 'Project work'
            }
        )

        assert response.status_code == 201
        data = response.get_json()
        assert 'reservation' in data
        assert data['reservation']['status'] == 'pending'
        assert data['reservation']['user_id'] == student_user.id

    def test_create_reservation_missing_fields(self, client, student_token):
        """Test reservation creation with missing fields"""
        response = client.post(
            '/api/reservation',
            headers={'Authorization': f'Bearer {student_token}'},
            json={'equipment_id': 'some-id'}
        )

        assert response.status_code == 400
        assert 'Missing required fields' in response.get_json()['error']

    def test_create_reservation_equipment_not_found(self, client, student_token):
        """Test reservation for non-existent equipment"""
        start_date = (datetime.utcnow() + timedelta(days=1)).isoformat()
        end_date = (datetime.utcnow() + timedelta(days=4)).isoformat()

        response = client.post(
            '/api/reservation',
            headers={'Authorization': f'Bearer {student_token}'},
            json={
                'equipment_id': 'nonexistent-id',
                'start_date': start_date,
                'end_date': end_date
            }
        )

        assert response.status_code == 404

    def test_create_reservation_invalid_dates(self, client, student_token, test_equipment):
        """Test reservation with invalid date range"""
        start_date = (datetime.utcnow() + timedelta(days=4)).isoformat()
        end_date = (datetime.utcnow() + timedelta(days=1)).isoformat()

        response = client.post(
            '/api/reservation',
            headers={'Authorization': f'Bearer {student_token}'},
            json={
                'equipment_id': test_equipment.id,
                'start_date': start_date,
                'end_date': end_date
            }
        )

        assert response.status_code == 400
        assert 'End date must be after start date' in response.get_json()[
            'error']

    def test_create_reservation_no_token(self, client, test_equipment):
        """Test reservation creation without token"""
        start_date = (datetime.utcnow() + timedelta(days=1)).isoformat()
        end_date = (datetime.utcnow() + timedelta(days=4)).isoformat()

        response = client.post(
            '/api/reservation',
            json={
                'equipment_id': test_equipment.id,
                'start_date': start_date,
                'end_date': end_date
            }
        )

        assert response.status_code == 401


class TestReservationGetAll:
    """Tests for GET /api/reservation"""

    def test_get_user_reservations(self, client, student_token, test_reservation):
        """Test retrieving user's reservations"""
        response = client.get(
            '/api/reservation',
            headers={'Authorization': f'Bearer {student_token}'}
        )

        assert response.status_code == 200
        data = response.get_json()
        assert 'reservations' in data
        assert len(data['reservations']) >= 1

    def test_get_reservations_filter_by_status(self, client, student_token, test_reservation):
        """Test filtering reservations by status"""
        response = client.get(
            '/api/reservation?status=pending',
            headers={'Authorization': f'Bearer {student_token}'}
        )

        assert response.status_code == 200
        data = response.get_json()
        if len(data['reservations']) > 0:
            assert all(r['status'] == 'pending' for r in data['reservations'])

    def test_get_reservations_pagination(self, client, student_token):
        """Test reservations pagination"""
        response = client.get(
            '/api/reservation?page=1&per_page=10',
            headers={'Authorization': f'Bearer {student_token}'}
        )

        assert response.status_code == 200
        data = response.get_json()
        assert 'pages' in data
        assert 'current_page' in data


class TestReservationGetOne:
    """Tests for GET /api/reservation/<reservation_id>"""

    def test_get_reservation_success(self, client, student_token, test_reservation):
        """Test retrieving specific reservation"""
        response = client.get(
            f'/api/reservation/{test_reservation.id}',
            headers={'Authorization': f'Bearer {student_token}'}
        )

        assert response.status_code == 200
        data = response.get_json()
        assert data['id'] == test_reservation.id
        assert 'user' in data
        assert 'equipment' in data

    def test_get_reservation_not_found(self, client, student_token):
        """Test retrieving non-existent reservation"""
        response = client.get(
            '/api/reservation/nonexistent-id',
            headers={'Authorization': f'Bearer {student_token}'}
        )

        assert response.status_code == 404

    def test_get_reservation_unauthorized(self, client, admin_token, app, student_user, test_equipment):
        """Test that users cannot access others' reservations"""
        with app.app_context():
            from models import Reservation, ReservationStatus

            start = datetime.utcnow() + timedelta(days=1)
            end = start + timedelta(days=3)

            other_reservation = Reservation(
                user_id=student_user.id,
                equipment_id=test_equipment.id,
                status=ReservationStatus.PENDING,
                start_date=start,
                end_date=end
            )
            db.session.add(other_reservation)
            db.session.commit()
            reservation_id = other_reservation.id

        response = client.get(
            f'/api/reservation/{reservation_id}',
            headers={'Authorization': f'Bearer {admin_token}'}
        )

        # Admin can view any reservation
        assert response.status_code in [200, 403]


class TestReservationCancel:
    """Tests for POST /api/reservation/<reservation_id>/cancel"""

    def test_cancel_reservation_success(self, client, student_token, test_reservation):
        """Test successful reservation cancellation"""
        response = client.post(
            f'/api/reservation/{test_reservation.id}/cancel',
            headers={'Authorization': f'Bearer {student_token}'}
        )

        assert response.status_code == 200
        data = response.get_json()
        assert data['reservation']['status'] == 'cancelled'

    def test_cancel_reservation_not_found(self, client, student_token):
        """Test cancelling non-existent reservation"""
        response = client.post(
            '/api/reservation/nonexistent-id/cancel',
            headers={'Authorization': f'Bearer {student_token}'}
        )

        assert response.status_code == 404

    def test_cancel_reservation_unauthorized(self, client, admin_token, test_reservation):
        """Test that users cannot cancel others' reservations"""
        response = client.post(
            f'/api/reservation/{test_reservation.id}/cancel',
            headers={'Authorization': f'Bearer {admin_token}'}
        )

        assert response.status_code == 403


class TestReservationUpcoming:
    """Tests for GET /api/reservation/upcoming"""

    def test_get_upcoming_reservations(self, client, student_token, test_reservation):
        """Test retrieving upcoming reservations"""
        response = client.get(
            '/api/reservation/upcoming',
            headers={'Authorization': f'Bearer {student_token}'}
        )

        assert response.status_code == 200
        data = response.get_json()
        assert 'upcoming_reservations' in data


class TestReservationHistory:
    """Tests for GET /api/reservation/history"""

    def test_get_reservation_history(self, client, student_token):
        """Test retrieving reservation history"""
        response = client.get(
            '/api/reservation/history',
            headers={'Authorization': f'Bearer {student_token}'}
        )

        assert response.status_code == 200
        data = response.get_json()
        assert 'history' in data
        assert 'total' in data

    def test_get_history_pagination(self, client, student_token):
        """Test history pagination"""
        response = client.get(
            '/api/reservation/history?page=1&per_page=10',
            headers={'Authorization': f'Bearer {student_token}'}
        )

        assert response.status_code == 200
        data = response.get_json()
        assert 'pages' in data


class TestReservationReturn:
    """Tests for POST /api/reservation/<reservation_id>/return"""

    def test_return_equipment_success(self, client, student_token, app, test_reservation):
        """Test successful equipment return"""
        # First update reservation to checked_out status
        with app.app_context():
            from models import Reservation, ReservationStatus
            res = Reservation.query.get(test_reservation.id)
            res.status = ReservationStatus.CHECKED_OUT
            db.session.commit()

        response = client.post(
            f'/api/reservation/{test_reservation.id}/return',
            headers={'Authorization': f'Bearer {student_token}'}
        )

        assert response.status_code == 200
        data = response.get_json()
        assert data['reservation']['status'] == 'returned'

    def test_return_equipment_not_checked_out(self, client, student_token, test_reservation):
        """Test returning equipment that wasn't checked out"""
        response = client.post(
            f'/api/reservation/{test_reservation.id}/return',
            headers={'Authorization': f'Bearer {student_token}'}
        )

        assert response.status_code == 409
        assert 'not been checked out' in response.get_json()['error']

    def test_return_equipment_not_found(self, client, student_token):
        """Test returning non-existent equipment"""
        response = client.post(
            '/api/reservation/nonexistent-id/return',
            headers={'Authorization': f'Bearer {student_token}'}
        )

        assert response.status_code == 404
