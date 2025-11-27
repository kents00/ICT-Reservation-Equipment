# Unit Tests Quick Reference

## Quick Commands

```bash
# Run all tests
pytest tests/ -v

# Run with coverage
pytest tests/ --cov --cov-report=html

# Run specific test file
pytest tests/test_auth.py -v

# Run specific test
pytest tests/test_auth.py::TestAuthRegister::test_register_success -v

# Run with debugging
pytest tests/ -vv -s --pdb

# Run in parallel
pytest tests/ -n auto
```

## Test Files Summary

| File | Tests | Endpoints | Key Features |
|------|-------|-----------|--------------|
| test_auth.py | 22 | 5 | Register, Login, Profile, Password |
| test_equipment.py | 22 | 8 | CRUD, QR, Search, Maintenance |
| test_reservation.py | 21 | 7 | Create, Cancel, Return, History |
| test_admin.py | 22 | 8 | Approve, Reject, Users, Stats |
| test_qrcode.py | 18 | 4 | Scan, Validate, History, Stats |
| test_reports.py | 25 | 7 | Usage, Peak Hours, Occupancy, Export |
| **TOTAL** | **130+** | **39** | **All API endpoints** |

## Fixtures Available

```python
app              # Test Flask application
client           # Test client
admin_user       # Admin test user
student_user     # Student test user
admin_token      # Admin JWT token
student_token    # Student JWT token
test_equipment   # Sample equipment
test_reservation # Sample reservation
```

## Test Structure

```python
class TestFeature:
    """Tests for a feature"""
    
    def test_success_case(self, client, admin_token):
        """Test successful operation"""
        response = client.get('/api/endpoint',
            headers={'Authorization': f'Bearer {admin_token}'})
        assert response.status_code == 200
    
    def test_error_case(self, client):
        """Test error handling"""
        response = client.get('/api/endpoint')
        assert response.status_code == 401
```

## Common Assertions

```python
# Status codes
assert response.status_code == 200  # Success
assert response.status_code == 201  # Created
assert response.status_code == 400  # Bad request
assert response.status_code == 401  # Unauthorized
assert response.status_code == 403  # Forbidden
assert response.status_code == 404  # Not found
assert response.status_code == 409  # Conflict

# JSON responses
data = response.get_json()
assert 'field_name' in data
assert data['field_name'] == expected_value

# Lists
assert len(data['items']) > 0
assert all(item['status'] == 'active' for item in data['items'])
```

## Authentication Pattern

```python
def test_endpoint(client, admin_token):
    """Test with authentication"""
    response = client.get(
        '/api/endpoint',
        headers={'Authorization': f'Bearer {admin_token}'}
    )
    assert response.status_code == 200

# Without token
response = client.get('/api/endpoint')
assert response.status_code == 401  # Unauthorized
```

## CRUD Pattern

```python
# Create
create_response = client.post('/api/resource', json={...})
assert create_response.status_code == 201
resource_id = create_response.json()['resource']['id']

# Read
read_response = client.get(f'/api/resource/{resource_id}')
assert read_response.status_code == 200

# Update
update_response = client.put(f'/api/resource/{resource_id}', json={...})
assert update_response.status_code == 200

# Delete
delete_response = client.delete(f'/api/resource/{resource_id}')
assert delete_response.status_code == 200
```

## API Endpoint Coverage

### Authentication (5 endpoints)
- ✅ POST /api/auth/register
- ✅ POST /api/auth/login
- ✅ GET /api/auth/profile
- ✅ PUT /api/auth/profile
- ✅ POST /api/auth/change-password

### Equipment (8 endpoints)
- ✅ POST /api/equipment
- ✅ GET /api/equipment
- ✅ GET /api/equipment/<id>
- ✅ PUT /api/equipment/<id>
- ✅ DELETE /api/equipment/<id>
- ✅ GET /api/equipment/<id>/qr-code
- ✅ GET /api/equipment/search
- ✅ POST /api/equipment/<id>/maintenance

### Reservation (7 endpoints)
- ✅ POST /api/reservation
- ✅ GET /api/reservation
- ✅ GET /api/reservation/<id>
- ✅ POST /api/reservation/<id>/cancel
- ✅ GET /api/reservation/upcoming
- ✅ GET /api/reservation/history
- ✅ POST /api/reservation/<id>/return

### Admin (8 endpoints)
- ✅ GET /api/admin/reservations/pending
- ✅ POST /api/admin/reservations/<id>/approve
- ✅ POST /api/admin/reservations/<id>/reject
- ✅ GET /api/admin/reservations/all
- ✅ GET /api/admin/users
- ✅ PUT /api/admin/users/<id>
- ✅ POST /api/admin/auto-cancel-unclaimed
- ✅ GET /api/admin/dashboard/stats

### QR Code (4 endpoints)
- ✅ POST /api/qrcode/scan
- ✅ GET /api/qrcode/scan-history/<id>
- ✅ GET /api/qrcode/equipment/<id>/scan-stats
- ✅ POST /api/qrcode/validate

### Reports (7 endpoints)
- ✅ GET /api/reports/equipment/usage
- ✅ GET /api/reports/peak-hours
- ✅ GET /api/reports/user-activity
- ✅ GET /api/reports/occupancy
- ✅ GET /api/reports/reservation-status-breakdown
- ✅ GET /api/reports/equipment/<id>/history
- ✅ GET /api/reports/export/csv

## Test Execution

```bash
# Install dependencies
pip install -r requirements.txt

# Run all tests with verbose output
pytest tests/ -v

# Run with coverage report
pytest tests/ --cov=. --cov-report=html

# Run single file
pytest tests/test_auth.py -v

# Run single test
pytest tests/test_auth.py::TestAuthRegister::test_register_success -v

# Show print statements
pytest tests/ -s

# Stop on first failure
pytest tests/ -x

# Run failed tests only
pytest tests/ --lf

# Generate HTML coverage report
open htmlcov/index.html
```

## Expected Coverage

- **Statements**: >90%
- **Branches**: >85%
- **Lines**: >90%
- **Functions**: >95%

## Next Steps

1. Run all tests: `pytest tests/ -v`
2. Check coverage: `pytest tests/ --cov --cov-report=html`
3. View coverage report: `open htmlcov/index.html`
4. Add more tests as needed
5. Integrate with CI/CD pipeline

For detailed information, see **TEST_GUIDE.md**
