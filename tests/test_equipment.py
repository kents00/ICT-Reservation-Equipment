"""
Unit tests for Equipment Management API endpoints
"""
import pytest
import json
from datetime import datetime
from app import db


class TestEquipmentCreate:
    """Tests for POST /api/equipment"""

    def test_create_equipment_success(self, client, admin_token, admin_user):
        """Test successful equipment creation"""
        response = client.post(
            '/api/equipment',
            headers={'Authorization': f'Bearer {admin_token}'},
            json={
                'name': 'Projector',
                'description': 'HD Projector',
                'category': 'Electronics',
                'quantity': 3,
                'serial_number': 'SN-PROJ-001',
                'location': 'Room 101'
            }
        )

        assert response.status_code == 201
        data = response.get_json()
        assert 'equipment' in data
        assert data['equipment']['name'] == 'Projector'
        assert data['equipment']['quantity'] == 3
        assert data['equipment'].get('serial_number') == 'SN-PROJ-001'
        assert 'qr_code_image' in data

    def test_create_equipment_missing_fields(self, client, admin_token):
        """Test equipment creation with missing required fields"""
        response = client.post(
            '/api/equipment',
            headers={'Authorization': f'Bearer {admin_token}'},
            json={'name': 'Projector'}
        )

        assert response.status_code == 400
        assert 'Missing required fields' in response.get_json()['error']

    def test_create_equipment_student_denied(self, client, student_token):
        """Test that students cannot create equipment"""
        response = client.post(
            '/api/equipment',
            headers={'Authorization': f'Bearer {student_token}'},
            json={
                'name': 'Projector',
                'category': 'Electronics',
                'quantity': 3
            }
        )

        assert response.status_code == 403
        assert 'Admin access required' in response.get_json()['error']

    def test_create_equipment_no_token(self, client):
        """Test equipment creation without token"""
        response = client.post(
            '/api/equipment',
            json={
                'name': 'Projector',
                'category': 'Electronics',
                'quantity': 3
            }
        )

        assert response.status_code == 401


class TestEquipmentGetAll:
    """Tests for GET /api/equipment"""

    def test_get_all_equipment(self, client, test_equipment):
        """Test retrieving all equipment"""
        response = client.get('/api/equipment')

        assert response.status_code == 200
        data = response.get_json()
        assert 'equipment' in data
        assert len(data['equipment']) >= 1
        assert data['total'] >= 1

    def test_get_equipment_pagination(self, client, test_equipment):
        """Test equipment list pagination"""
        response = client.get('/api/equipment?page=1&per_page=10')

        assert response.status_code == 200
        data = response.get_json()
        assert 'pages' in data
        assert 'current_page' in data
        assert data['current_page'] == 1

    def test_get_equipment_filter_by_category(self, client, test_equipment):
        """Test equipment filtering by category"""
        response = client.get('/api/equipment?category=Electronics')

        assert response.status_code == 200
        data = response.get_json()
        if data['total'] > 0:
            assert all(e['category'] ==
                       'Electronics' for e in data['equipment'])

    def test_get_equipment_filter_by_status(self, client, test_equipment):
        """Test equipment filtering by status"""
        response = client.get('/api/equipment?status=available')

        assert response.status_code == 200
        data = response.get_json()
        if len(data['equipment']) > 0:
            assert all(e['status'] == 'available' for e in data['equipment'])


class TestEquipmentGetOne:
    """Tests for GET /api/equipment/<equipment_id>"""

    def test_get_equipment_success(self, client, test_equipment):
        """Test retrieving specific equipment"""
        response = client.get(f'/api/equipment/{test_equipment.id}')

        assert response.status_code == 200
        data = response.get_json()
        assert data['name'] == 'Test Laptop'
        assert 'serial_number' in data
        assert 'active_reservations' in data

    def test_get_equipment_not_found(self, client):
        """Test retrieving non-existent equipment"""
        response = client.get('/api/equipment/nonexistent-id')

        assert response.status_code == 404
        assert 'not found' in response.get_json()['error']


class TestEquipmentUpdate:
    """Tests for PUT /api/equipment/<equipment_id>"""

    def test_update_equipment_success(self, client, admin_token, test_equipment):
        """Test successful equipment update"""
        response = client.put(
            f'/api/equipment/{test_equipment.id}',
            headers={'Authorization': f'Bearer {admin_token}'},
            json={
                'name': 'Updated Laptop',
                'quantity': 10
            }
        )

        assert response.status_code == 200
        data = response.get_json()
        assert data['equipment']['name'] == 'Updated Laptop'
        assert data['equipment']['quantity'] == 10

    def test_update_equipment_not_found(self, client, admin_token):
        """Test updating non-existent equipment"""
        response = client.put(
            '/api/equipment/nonexistent-id',
            headers={'Authorization': f'Bearer {admin_token}'},
            json={'name': 'Updated'}
        )

        assert response.status_code == 404

    def test_update_equipment_student_denied(self, client, student_token, test_equipment):
        """Test that students cannot update equipment"""
        response = client.put(
            f'/api/equipment/{test_equipment.id}',
            headers={'Authorization': f'Bearer {student_token}'},
            json={'name': 'Updated'}
        )

        assert response.status_code == 403


class TestEquipmentDelete:
    """Tests for DELETE /api/equipment/<equipment_id>"""

    def test_delete_equipment_success(self, client, admin_token, test_equipment):
        """Test successful equipment deletion"""
        equipment_id = test_equipment.id

        response = client.delete(
            f'/api/equipment/{equipment_id}',
            headers={'Authorization': f'Bearer {admin_token}'}
        )

        assert response.status_code == 200

    def test_delete_equipment_not_found(self, client, admin_token):
        """Test deleting non-existent equipment"""
        response = client.delete(
            '/api/equipment/nonexistent-id',
            headers={'Authorization': f'Bearer {admin_token}'}
        )

        assert response.status_code == 404

    def test_delete_equipment_student_denied(self, client, student_token, test_equipment):
        """Test that students cannot delete equipment"""
        response = client.delete(
            f'/api/equipment/{test_equipment.id}',
            headers={'Authorization': f'Bearer {student_token}'}
        )

        assert response.status_code == 403


class TestEquipmentQRCode:
    """Tests for GET /api/equipment/<equipment_id>/qr-code"""

    def test_get_qr_code_success(self, client, test_equipment):
        """Test retrieving QR code"""
        response = client.get(f'/api/equipment/{test_equipment.id}/qr-code')

        assert response.status_code == 200
        data = response.get_json()
        assert 'qr_code' in data
        assert 'qr_code_image' in data
        assert data['equipment_id'] == test_equipment.id

    def test_get_qr_code_not_found(self, client):
        """Test retrieving QR code for non-existent equipment"""
        response = client.get('/api/equipment/nonexistent-id/qr-code')

        assert response.status_code == 404


class TestEquipmentSearch:
    """Tests for GET /api/equipment/search"""

    def test_search_equipment_by_name(self, client, test_equipment):
        """Test searching equipment by name"""
        response = client.get('/api/equipment/search?q=Test')

        assert response.status_code == 200
        data = response.get_json()
        assert 'results' in data
        assert 'count' in data

    def test_search_equipment_query_too_short(self, client):
        """Test search with query too short"""
        response = client.get('/api/equipment/search?q=a')

        assert response.status_code == 400
        assert 'too short' in response.get_json()['error']

    def test_search_equipment_no_query(self, client):
        """Test search without query"""
        response = client.get('/api/equipment/search')

        assert response.status_code == 400


class TestEquipmentMaintenance:
    """Tests for POST /api/equipment/<equipment_id>/maintenance"""

    def test_set_maintenance_success(self, client, admin_token, test_equipment):
        """Test marking equipment for maintenance"""
        response = client.post(
            f'/api/equipment/{test_equipment.id}/maintenance',
            headers={'Authorization': f'Bearer {admin_token}'}
        )

        assert response.status_code == 200
        data = response.get_json()
        assert data['equipment']['status'] == 'maintenance'
        assert data['equipment']['last_maintenance'] is not None

    def test_set_maintenance_not_found(self, client, admin_token):
        """Test setting maintenance for non-existent equipment"""
        response = client.post(
            '/api/equipment/nonexistent-id/maintenance',
            headers={'Authorization': f'Bearer {admin_token}'}
        )

        assert response.status_code == 404

    def test_set_maintenance_student_denied(self, client, student_token, test_equipment):
        """Test that students cannot set maintenance"""
        response = client.post(
            f'/api/equipment/{test_equipment.id}/maintenance',
            headers={'Authorization': f'Bearer {student_token}'}
        )

        assert response.status_code == 403
