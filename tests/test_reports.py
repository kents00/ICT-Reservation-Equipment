"""
Unit tests for Reports and Analytics API endpoints
"""
import pytest
from datetime import datetime, timedelta
from app import db


class TestEquipmentUsageReport:
    """Tests for GET /api/reports/equipment/usage"""

    def test_get_equipment_usage_report(self, client, admin_token):
        """Test retrieving equipment usage report"""
        response = client.get(
            '/api/reports/equipment/usage',
            headers={'Authorization': f'Bearer {admin_token}'}
        )

        assert response.status_code == 200
        data = response.get_json()
        assert 'period_days' in data
        assert 'start_date' in data
        assert 'end_date' in data
        assert 'most_borrowed' in data

    def test_get_equipment_usage_report_custom_period(self, client, admin_token):
        """Test equipment usage report with custom period"""
        response = client.get(
            '/api/reports/equipment/usage?days=60',
            headers={'Authorization': f'Bearer {admin_token}'}
        )

        assert response.status_code == 200
        data = response.get_json()
        assert data['period_days'] == 60

    def test_get_equipment_usage_report_student_denied(self, client, student_token):
        """Test that students cannot access usage reports"""
        response = client.get(
            '/api/reports/equipment/usage',
            headers={'Authorization': f'Bearer {student_token}'}
        )

        assert response.status_code == 403


class TestPeakHoursReport:
    """Tests for GET /api/reports/peak-hours"""

    def test_get_peak_hours_report(self, client, admin_token):
        """Test retrieving peak hours report"""
        response = client.get(
            '/api/reports/peak-hours',
            headers={'Authorization': f'Bearer {admin_token}'}
        )

        assert response.status_code == 200
        data = response.get_json()
        assert 'period_days' in data
        assert 'peak_hours' in data
        assert isinstance(data['peak_hours'], list)

    def test_get_peak_hours_custom_period(self, client, admin_token):
        """Test peak hours report with custom period"""
        response = client.get(
            '/api/reports/peak-hours?days=7',
            headers={'Authorization': f'Bearer {admin_token}'}
        )

        assert response.status_code == 200
        data = response.get_json()
        assert data['period_days'] == 7

    def test_get_peak_hours_student_denied(self, client, student_token):
        """Test that students cannot access peak hours"""
        response = client.get(
            '/api/reports/peak-hours',
            headers={'Authorization': f'Bearer {student_token}'}
        )

        assert response.status_code == 403


class TestUserActivityReport:
    """Tests for GET /api/reports/user-activity"""

    def test_get_user_activity_report(self, client, admin_token):
        """Test retrieving user activity report"""
        response = client.get(
            '/api/reports/user-activity',
            headers={'Authorization': f'Bearer {admin_token}'}
        )

        assert response.status_code == 200
        data = response.get_json()
        assert 'period_days' in data
        assert 'user_activity' in data
        assert 'total' in data

    def test_get_user_activity_pagination(self, client, admin_token):
        """Test user activity pagination"""
        response = client.get(
            '/api/reports/user-activity?page=1&per_page=10',
            headers={'Authorization': f'Bearer {admin_token}'}
        )

        assert response.status_code == 200
        data = response.get_json()
        assert 'pages' in data

    def test_get_user_activity_custom_period(self, client, admin_token):
        """Test user activity with custom period"""
        response = client.get(
            '/api/reports/user-activity?days=14',
            headers={'Authorization': f'Bearer {admin_token}'}
        )

        assert response.status_code == 200
        data = response.get_json()
        assert data['period_days'] == 14

    def test_get_user_activity_student_denied(self, client, student_token):
        """Test that students cannot access user activity"""
        response = client.get(
            '/api/reports/user-activity',
            headers={'Authorization': f'Bearer {student_token}'}
        )

        assert response.status_code == 403


class TestOccupancyReport:
    """Tests for GET /api/reports/occupancy"""

    def test_get_occupancy_report(self, client, admin_token):
        """Test retrieving occupancy report"""
        response = client.get(
            '/api/reports/occupancy',
            headers={'Authorization': f'Bearer {admin_token}'}
        )

        assert response.status_code == 200
        data = response.get_json()
        assert 'period_days' in data
        assert 'occupancy_data' in data
        assert isinstance(data['occupancy_data'], list)

    def test_get_occupancy_report_custom_period(self, client, admin_token):
        """Test occupancy report with custom period"""
        response = client.get(
            '/api/reports/occupancy?days=90',
            headers={'Authorization': f'Bearer {admin_token}'}
        )

        assert response.status_code == 200
        data = response.get_json()
        assert data['period_days'] == 90

    def test_get_occupancy_report_data_structure(self, client, admin_token, test_equipment):
        """Test occupancy report data structure"""
        response = client.get(
            '/api/reports/occupancy',
            headers={'Authorization': f'Bearer {admin_token}'}
        )

        assert response.status_code == 200
        data = response.get_json()
        if len(data['occupancy_data']) > 0:
            occupancy = data['occupancy_data'][0]
            assert 'equipment_id' in occupancy
            assert 'equipment_name' in occupancy
            assert 'quantity' in occupancy
            assert 'active_reservations' in occupancy
            assert 'occupancy_rate' in occupancy

    def test_get_occupancy_student_denied(self, client, student_token):
        """Test that students cannot access occupancy reports"""
        response = client.get(
            '/api/reports/occupancy',
            headers={'Authorization': f'Bearer {student_token}'}
        )

        assert response.status_code == 403


class TestReservationStatusBreakdown:
    """Tests for GET /api/reports/reservation-status-breakdown"""

    def test_get_reservation_status_breakdown(self, client, admin_token):
        """Test retrieving reservation status breakdown"""
        response = client.get(
            '/api/reports/reservation-status-breakdown',
            headers={'Authorization': f'Bearer {admin_token}'}
        )

        assert response.status_code == 200
        data = response.get_json()
        assert 'period_days' in data
        assert 'status_breakdown' in data
        assert isinstance(data['status_breakdown'], dict)

    def test_get_status_breakdown_custom_period(self, client, admin_token):
        """Test status breakdown with custom period"""
        response = client.get(
            '/api/reports/reservation-status-breakdown?days=45',
            headers={'Authorization': f'Bearer {admin_token}'}
        )

        assert response.status_code == 200
        data = response.get_json()
        assert data['period_days'] == 45

    def test_get_status_breakdown_student_denied(self, client, student_token):
        """Test that students cannot access status breakdown"""
        response = client.get(
            '/api/reports/reservation-status-breakdown',
            headers={'Authorization': f'Bearer {student_token}'}
        )

        assert response.status_code == 403


class TestEquipmentHistory:
    """Tests for GET /api/reports/equipment/<equipment_id>/history"""

    def test_get_equipment_history_success(self, client, admin_token, test_equipment):
        """Test retrieving equipment history"""
        response = client.get(
            f'/api/reports/equipment/{test_equipment.id}/history',
            headers={'Authorization': f'Bearer {admin_token}'}
        )

        assert response.status_code == 200
        data = response.get_json()
        assert 'equipment' in data
        assert 'reservations' in data
        assert 'qr_scans' in data
        assert isinstance(data['reservations'], list)
        assert isinstance(data['qr_scans'], list)

    def test_get_equipment_history_not_found(self, client, admin_token):
        """Test retrieving history for non-existent equipment"""
        response = client.get(
            '/api/reports/equipment/nonexistent-id/history',
            headers={'Authorization': f'Bearer {admin_token}'}
        )

        assert response.status_code == 404

    def test_get_equipment_history_student_denied(self, client, student_token, test_equipment):
        """Test that students cannot access equipment history"""
        response = client.get(
            f'/api/reports/equipment/{test_equipment.id}/history',
            headers={'Authorization': f'Bearer {student_token}'}
        )

        assert response.status_code == 403


class TestExportReportCSV:
    """Tests for GET /api/reports/export/csv"""

    def test_export_reservations_csv(self, client, admin_token):
        """Test exporting reservations as CSV"""
        response = client.get(
            '/api/reports/export/csv?type=reservations',
            headers={'Authorization': f'Bearer {admin_token}'}
        )

        assert response.status_code == 200
        assert 'text/csv' in response.content_type or 'csv' in response.headers.get(
            'Content-Disposition', '')

    def test_export_equipment_csv(self, client, admin_token):
        """Test exporting equipment as CSV"""
        response = client.get(
            '/api/reports/export/csv?type=equipment',
            headers={'Authorization': f'Bearer {admin_token}'}
        )

        assert response.status_code == 200
        assert 'text/csv' in response.content_type or 'csv' in response.headers.get(
            'Content-Disposition', '')

    def test_export_invalid_type(self, client, admin_token):
        """Test export with invalid report type"""
        response = client.get(
            '/api/reports/export/csv?type=invalid',
            headers={'Authorization': f'Bearer {admin_token}'}
        )

        assert response.status_code == 400
        assert 'Invalid report type' in response.get_json()['error']

    def test_export_csv_student_denied(self, client, student_token):
        """Test that students cannot export reports"""
        response = client.get(
            '/api/reports/export/csv?type=reservations',
            headers={'Authorization': f'Bearer {student_token}'}
        )

        assert response.status_code == 403

    def test_export_csv_default_type(self, client, admin_token):
        """Test export with default report type"""
        response = client.get(
            '/api/reports/export/csv',
            headers={'Authorization': f'Bearer {admin_token}'}
        )

        assert response.status_code == 200
