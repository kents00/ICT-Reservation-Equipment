"""
Unit tests for Authentication API endpoints
"""
import pytest
from datetime import datetime
from app import db


class TestAuthRegister:
    """Tests for POST /api/auth/register"""

    def test_register_success(self, client, app):
        """Test successful user registration"""
        response = client.post('/api/auth/register', json={
            'username': 'newuser',
            'email': 'newuser@test.com',
            'password': 'password123',
            'full_name': 'New User'
        })

        assert response.status_code == 201
        data = response.get_json()
        assert 'user' in data
        assert data['user']['username'] == 'newuser'
        assert data['user']['email'] == 'newuser@test.com'
        assert 'password_hash' not in data['user']

    def test_register_missing_fields(self, client):
        """Test registration with missing required fields"""
        response = client.post('/api/auth/register', json={
            'username': 'newuser'
            # missing email and password
        })

        assert response.status_code == 400
        assert 'error' in response.get_json()

    def test_register_duplicate_username(self, client, admin_user):
        """Test registration with duplicate username"""
        response = client.post('/api/auth/register', json={
            'username': 'admin1',  # admin_user.username
            'email': 'different@test.com',
            'password': 'password123'
        })

        assert response.status_code == 409
        assert 'already exists' in response.get_json()['error']

    def test_register_duplicate_email(self, client, admin_user):
        """Test registration with duplicate email"""
        response = client.post('/api/auth/register', json={
            'username': 'differentuser',
            'email': 'admin@test.com',  # admin_user.email
            'password': 'password123'
        })

        assert response.status_code == 409
        assert 'already exists' in response.get_json()['error']

    def test_register_default_role(self, client):
        """Test that new users get STUDENT role by default"""
        response = client.post('/api/auth/register', json={
            'username': 'newstudent',
            'email': 'student@test.com',
            'password': 'password123'
        })

        assert response.status_code == 201
        assert response.get_json()['user']['role'] == 'student'

    def test_register_custom_role(self, client):
        """Test registering with custom role"""
        response = client.post('/api/auth/register', json={
            'username': 'newadmin',
            'email': 'newadmin@test.com',
            'password': 'password123',
            'role': 'admin'
        })

        assert response.status_code == 201
        assert response.get_json()['user']['role'] == 'admin'


class TestAuthLogin:
    """Tests for POST /api/auth/login"""

    def test_login_success(self, client, admin_user):
        """Test successful login"""
        response = client.post('/api/auth/login', json={
            'username': 'admin1',
            'password': 'testpass123'
        })

        assert response.status_code == 200
        data = response.get_json()
        assert 'access_token' in data
        assert 'user' in data
        assert data['user']['username'] == 'admin1'

    def test_login_invalid_username(self, client):
        """Test login with non-existent username"""
        response = client.post('/api/auth/login', json={
            'username': 'nonexistent',
            'password': 'password123'
        })

        assert response.status_code == 401
        assert 'Invalid credentials' in response.get_json()['error']

    def test_login_invalid_password(self, client, admin_user):
        """Test login with wrong password"""
        response = client.post('/api/auth/login', json={
            'username': 'admin1',
            'password': 'wrongpassword'
        })

        assert response.status_code == 401
        assert 'Invalid credentials' in response.get_json()['error']

    def test_login_missing_credentials(self, client):
        """Test login with missing credentials"""
        response = client.post('/api/auth/login', json={
            'username': 'admin1'
            # missing password
        })

        assert response.status_code == 400
        assert 'Missing username or password' in response.get_json()['error']

    def test_login_inactive_user(self, client, app):
        """Test login with inactive user account"""
        with app.app_context():
            from models import User
            from werkzeug.security import generate_password_hash

            inactive_user = User(
                username='inactive',
                email='inactive@test.com',
                password_hash=generate_password_hash('password123'),
                full_name='Inactive User',
                is_active=False
            )
            db.session.add(inactive_user)
            db.session.commit()

        response = client.post('/api/auth/login', json={
            'username': 'inactive',
            'password': 'password123'
        })

        assert response.status_code == 403
        assert 'inactive' in response.get_json()['error']


class TestAuthGetProfile:
    """Tests for GET /api/auth/profile"""

    def test_get_profile_success(self, client, admin_token, admin_user):
        """Test successful profile retrieval"""
        response = client.get(
            '/api/auth/profile',
            headers={'Authorization': f'Bearer {admin_token}'}
        )

        assert response.status_code == 200
        data = response.get_json()
        assert data['username'] == 'admin1'
        assert data['email'] == 'admin@test.com'
        assert data['role'] == 'admin'

    def test_get_profile_no_token(self, client):
        """Test profile retrieval without token"""
        response = client.get('/api/auth/profile')

        assert response.status_code == 401

    def test_get_profile_invalid_token(self, client):
        """Test profile retrieval with invalid token"""
        response = client.get(
            '/api/auth/profile',
            headers={'Authorization': 'Bearer invalid-token'}
        )

        assert response.status_code == 422


class TestAuthUpdateProfile:
    """Tests for PUT /api/auth/profile"""

    def test_update_profile_success(self, client, admin_token, admin_user):
        """Test successful profile update"""
        response = client.put(
            '/api/auth/profile',
            headers={'Authorization': f'Bearer {admin_token}'},
            json={
                'full_name': 'Updated Admin',
                'phone': '1234567890'
            }
        )

        assert response.status_code == 200
        data = response.get_json()
        assert data['user']['full_name'] == 'Updated Admin'
        assert data['user']['phone'] == '1234567890'

    def test_update_email_success(self, client, admin_token, admin_user):
        """Test successful email update"""
        response = client.put(
            '/api/auth/profile',
            headers={'Authorization': f'Bearer {admin_token}'},
            json={'email': 'newemail@test.com'}
        )

        assert response.status_code == 200
        assert response.get_json()['user']['email'] == 'newemail@test.com'

    def test_update_email_duplicate(self, client, admin_token, student_user):
        """Test email update with duplicate email"""
        response = client.put(
            '/api/auth/profile',
            headers={'Authorization': f'Bearer {admin_token}'},
            json={'email': 'student@test.com'}  # student_user.email
        )

        assert response.status_code == 409
        assert 'already in use' in response.get_json()['error']

    def test_update_profile_no_token(self, client):
        """Test profile update without token"""
        response = client.put(
            '/api/auth/profile',
            json={'full_name': 'Updated'}
        )

        assert response.status_code == 401


class TestAuthChangePassword:
    """Tests for POST /api/auth/change-password"""

    def test_change_password_success(self, client, admin_token, admin_user):
        """Test successful password change"""
        response = client.post(
            '/api/auth/change-password',
            headers={'Authorization': f'Bearer {admin_token}'},
            json={
                'old_password': 'testpass123',
                'new_password': 'newpassword123'
            }
        )

        assert response.status_code == 200
        assert 'Password changed successfully' in response.get_json()[
            'message']

    def test_change_password_wrong_old(self, client, admin_token):
        """Test password change with wrong old password"""
        response = client.post(
            '/api/auth/change-password',
            headers={'Authorization': f'Bearer {admin_token}'},
            json={
                'old_password': 'wrongpassword',
                'new_password': 'newpassword123'
            }
        )

        assert response.status_code == 401
        assert 'Invalid old password' in response.get_json()['error']

    def test_change_password_missing_fields(self, client, admin_token):
        """Test password change with missing fields"""
        response = client.post(
            '/api/auth/change-password',
            headers={'Authorization': f'Bearer {admin_token}'},
            json={'old_password': 'password123'}
        )

        assert response.status_code == 400
        assert 'Missing' in response.get_json()['error']

    def test_change_password_no_token(self, client):
        """Test password change without token"""
        response = client.post(
            '/api/auth/change-password',
            json={
                'old_password': 'password123',
                'new_password': 'newpassword123'
            }
        )

        assert response.status_code == 401
