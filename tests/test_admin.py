"""
Unit tests for Admin Management API endpoints
"""
import pytest
from datetime import datetime, timedelta
from app import db


class TestAdminGetPendingReservations:
    """Tests for GET /api/admin/reservations/pending"""

    def test_get_pending_reservations_success(self, client, admin_token):
        """Test retrieving pending reservations"""
        response = client.get(
            '/api/admin/reservations/pending',
            headers={'Authorization': f'Bearer {admin_token}'}
        )

        assert response.status_code == 200
        data = response.get_json()
        assert 'pending_reservations' in data
        assert 'total' in data

    def test_get_pending_reservations_pagination(self, client, admin_token):
        """Test pending reservations pagination"""
        response = client.get(
            '/api/admin/reservations/pending?page=1&per_page=10',
            headers={'Authorization': f'Bearer {admin_token}'}
        )

        assert response.status_code == 200
        data = response.get_json()
        assert 'pages' in data

    def test_get_pending_reservations_student_denied(self, client, student_token):
        """Test that students cannot access pending reservations"""
        response = client.get(
            '/api/admin/reservations/pending',
            headers={'Authorization': f'Bearer {student_token}'}
        )

        assert response.status_code == 403


class TestAdminApproveReservation:
    """Tests for POST /api/admin/reservations/<reservation_id>/approve"""

    def test_approve_reservation_success(self, client, admin_token, test_reservation):
        """Test successful reservation approval"""
        response = client.post(
            f'/api/admin/reservations/{test_reservation.id}/approve',
            headers={'Authorization': f'Bearer {admin_token}'},
            json={'notes': 'Approved for project'}
        )

        assert response.status_code == 200
        data = response.get_json()
        assert data['reservation']['status'] == 'approved'
        assert data['reservation']['admin_notes'] == 'Approved for project'

    def test_approve_reservation_not_found(self, client, admin_token):
        """Test approving non-existent reservation"""
        response = client.post(
            '/api/admin/reservations/nonexistent-id/approve',
            headers={'Authorization': f'Bearer {admin_token}'}
        )

        assert response.status_code == 404

    def test_approve_non_pending_reservation(self, client, admin_token, app, test_reservation):
        """Test approving non-pending reservation"""
        with app.app_context():
            from models import Reservation, ReservationStatus
            res = Reservation.query.get(test_reservation.id)
            res.status = ReservationStatus.APPROVED
            db.session.commit()

        response = client.post(
            f'/api/admin/reservations/{test_reservation.id}/approve',
            headers={'Authorization': f'Bearer {admin_token}'}
        )

        assert response.status_code == 409

    def test_approve_reservation_student_denied(self, client, student_token, test_reservation):
        """Test that students cannot approve reservations"""
        response = client.post(
            f'/api/admin/reservations/{test_reservation.id}/approve',
            headers={'Authorization': f'Bearer {student_token}'}
        )

        assert response.status_code == 403


class TestAdminRejectReservation:
    """Tests for POST /api/admin/reservations/<reservation_id>/reject"""

    def test_reject_reservation_success(self, client, admin_token, test_reservation):
        """Test successful reservation rejection"""
        response = client.post(
            f'/api/admin/reservations/{test_reservation.id}/reject',
            headers={'Authorization': f'Bearer {admin_token}'},
            json={'reason': 'Equipment not available'}
        )

        assert response.status_code == 200
        data = response.get_json()
        assert data['reservation']['status'] == 'rejected'
        assert data['reservation']['rejection_reason'] == 'Equipment not available'

    def test_reject_reservation_missing_reason(self, client, admin_token, test_reservation):
        """Test rejection without reason"""
        response = client.post(
            f'/api/admin/reservations/{test_reservation.id}/reject',
            headers={'Authorization': f'Bearer {admin_token}'},
            json={}
        )

        assert response.status_code == 400
        assert 'reason is required' in response.get_json()['error']

    def test_reject_reservation_not_found(self, client, admin_token):
        """Test rejecting non-existent reservation"""
        response = client.post(
            '/api/admin/reservations/nonexistent-id/reject',
            headers={'Authorization': f'Bearer {admin_token}'},
            json={'reason': 'Not found'}
        )

        assert response.status_code == 404

    def test_reject_reservation_student_denied(self, client, student_token, test_reservation):
        """Test that students cannot reject reservations"""
        response = client.post(
            f'/api/admin/reservations/{test_reservation.id}/reject',
            headers={'Authorization': f'Bearer {student_token}'},
            json={'reason': 'Test'}
        )

        assert response.status_code == 403


class TestAdminGetAllReservations:
    """Tests for GET /api/admin/reservations/all"""

    def test_get_all_reservations(self, client, admin_token):
        """Test retrieving all reservations"""
        response = client.get(
            '/api/admin/reservations/all',
            headers={'Authorization': f'Bearer {admin_token}'}
        )

        assert response.status_code == 200
        data = response.get_json()
        assert 'reservations' in data

    def test_get_all_reservations_filter_by_status(self, client, admin_token):
        """Test filtering all reservations by status"""
        response = client.get(
            '/api/admin/reservations/all?status=pending',
            headers={'Authorization': f'Bearer {admin_token}'}
        )

        assert response.status_code == 200

    def test_get_all_reservations_pagination(self, client, admin_token):
        """Test all reservations pagination"""
        response = client.get(
            '/api/admin/reservations/all?page=1&per_page=10',
            headers={'Authorization': f'Bearer {admin_token}'}
        )

        assert response.status_code == 200
        data = response.get_json()
        assert 'pages' in data


class TestAdminGetAllUsers:
    """Tests for GET /api/admin/users"""

    def test_get_all_users(self, client, admin_token):
        """Test retrieving all users"""
        response = client.get(
            '/api/admin/users',
            headers={'Authorization': f'Bearer {admin_token}'}
        )

        assert response.status_code == 200
        data = response.get_json()
        assert 'users' in data
        assert 'total' in data

    def test_get_all_users_filter_by_role(self, client, admin_token):
        """Test filtering users by role"""
        response = client.get(
            '/api/admin/users?role=student',
            headers={'Authorization': f'Bearer {admin_token}'}
        )

        assert response.status_code == 200

    def test_get_all_users_pagination(self, client, admin_token):
        """Test users pagination"""
        response = client.get(
            '/api/admin/users?page=1&per_page=10',
            headers={'Authorization': f'Bearer {admin_token}'}
        )

        assert response.status_code == 200
        data = response.get_json()
        assert 'pages' in data

    def test_get_all_users_student_denied(self, client, student_token):
        """Test that students cannot access all users"""
        response = client.get(
            '/api/admin/users',
            headers={'Authorization': f'Bearer {student_token}'}
        )

        assert response.status_code == 403


class TestAdminUpdateUser:
    """Tests for PUT /api/admin/users/<user_id>"""

    def test_update_user_success(self, client, admin_token, student_user):
        """Test successful user update"""
        response = client.put(
            f'/api/admin/users/{student_user.id}',
            headers={'Authorization': f'Bearer {admin_token}'},
            json={'is_active': False}
        )

        assert response.status_code == 200
        data = response.get_json()
        assert data['user']['is_active'] == False

    def test_update_user_role(self, client, admin_token, student_user):
        """Test updating user role"""
        response = client.put(
            f'/api/admin/users/{student_user.id}',
            headers={'Authorization': f'Bearer {admin_token}'},
            json={'role': 'admin'}
        )

        assert response.status_code == 200
        data = response.get_json()
        assert data['user']['role'] == 'admin'

    def test_update_user_not_found(self, client, admin_token):
        """Test updating non-existent user"""
        response = client.put(
            '/api/admin/users/nonexistent-id',
            headers={'Authorization': f'Bearer {admin_token}'},
            json={'is_active': False}
        )

        assert response.status_code == 404

    def test_update_user_student_denied(self, client, student_token, admin_user):
        """Test that students cannot update users"""
        response = client.put(
            f'/api/admin/users/{admin_user.id}',
            headers={'Authorization': f'Bearer {student_token}'},
            json={'is_active': False}
        )

        assert response.status_code == 403


class TestAdminAutoCancelUnclaimed:
    """Tests for POST /api/admin/auto-cancel-unclaimed"""

    def test_auto_cancel_unclaimed_success(self, client, admin_token):
        """Test auto-cancelling unclaimed reservations"""
        response = client.post(
            '/api/admin/auto-cancel-unclaimed',
            headers={'Authorization': f'Bearer {admin_token}'}
        )

        assert response.status_code == 200
        data = response.get_json()
        assert 'cancelled_count' in data

    def test_auto_cancel_unclaimed_student_denied(self, client, student_token):
        """Test that students cannot auto-cancel"""
        response = client.post(
            '/api/admin/auto-cancel-unclaimed',
            headers={'Authorization': f'Bearer {student_token}'}
        )

        assert response.status_code == 403


class TestAdminDashboardStats:
    """Tests for GET /api/admin/dashboard/stats"""

    def test_get_dashboard_stats_success(self, client, admin_token):
        """Test retrieving dashboard statistics"""
        response = client.get(
            '/api/admin/dashboard/stats',
            headers={'Authorization': f'Bearer {admin_token}'}
        )

        assert response.status_code == 200
        data = response.get_json()
        assert 'equipment' in data
        assert 'users' in data
        assert 'reservations' in data
        assert data['equipment']['total'] is not None
        assert data['users']['total'] is not None
        assert data['reservations']['total'] is not None

    def test_get_dashboard_stats_student_denied(self, client, student_token):
        """Test that students cannot access dashboard stats"""
        response = client.get(
            '/api/admin/dashboard/stats',
            headers={'Authorization': f'Bearer {student_token}'}
        )

        assert response.status_code == 403
