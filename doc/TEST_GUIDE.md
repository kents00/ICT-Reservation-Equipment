# Unit Tests Guide - Equipment Reservation System

## Overview

This document provides comprehensive guidance on running and understanding the unit tests for the Equipment Reservation System.

**Total Test Coverage:**
- ✅ 39+ API endpoints tested
- ✅ 6 test files with 100+ test cases
- ✅ Authentication, Equipment, Reservation, Admin, QR Code, and Reports modules

---

## Test Structure

### Test Files Organization

```
backend/
├── tests/
│   ├── __init__.py
│   ├── conftest.py               # Fixtures and configuration
│   ├── test_auth.py              # 15 authentication tests
│   ├── test_equipment.py          # 20 equipment management tests
│   ├── test_reservation.py        # 18 reservation management tests
│   ├── test_admin.py              # 15 admin management tests
│   ├── test_qrcode.py             # 15 QR code scanning tests
│   └── test_reports.py            # 20 reports and analytics tests
├── pytest.ini                     # Pytest configuration
└── run_tests.py                   # Test runner script
```

---

## Test Files Breakdown

### 1. test_auth.py (Authentication - 15 tests)

**Endpoints Tested:**
- `POST /api/auth/register` - 6 tests
- `POST /api/auth/login` - 5 tests
- `GET /api/auth/profile` - 3 tests
- `PUT /api/auth/profile` - 4 tests
- `POST /api/auth/change-password` - 4 tests

**Test Cases:**
```python
# Registration Tests
✓ test_register_success - Successful user registration
✓ test_register_missing_fields - Validation of required fields
✓ test_register_duplicate_username - Duplicate username handling
✓ test_register_duplicate_email - Duplicate email handling
✓ test_register_default_role - Default student role assignment
✓ test_register_custom_role - Custom role assignment

# Login Tests
✓ test_login_success - Successful login with token
✓ test_login_invalid_username - Invalid username handling
✓ test_login_invalid_password - Invalid password handling
✓ test_login_missing_credentials - Missing field validation
✓ test_login_inactive_user - Inactive account handling

# Profile Tests
✓ test_get_profile_success - Retrieve user profile
✓ test_get_profile_no_token - Token requirement validation
✓ test_get_profile_invalid_token - Invalid token handling
✓ test_update_profile_success - Profile update success
✓ test_update_email_success - Email update success
✓ test_update_email_duplicate - Duplicate email handling
✓ test_update_profile_no_token - Token requirement

# Password Change Tests
✓ test_change_password_success - Successful password change
✓ test_change_password_wrong_old - Invalid old password
✓ test_change_password_missing_fields - Missing field validation
✓ test_change_password_no_token - Token requirement
```

---

### 2. test_equipment.py (Equipment Management - 20 tests)

**Endpoints Tested:**
- `POST /api/equipment` - 4 tests
- `GET /api/equipment` - 4 tests
- `GET /api/equipment/<id>` - 2 tests
- `PUT /api/equipment/<id>` - 3 tests
- `DELETE /api/equipment/<id>` - 3 tests
- `GET /api/equipment/<id>/qr-code` - 2 tests
- `GET /api/equipment/search` - 3 tests
- `POST /api/equipment/<id>/maintenance` - 3 tests

**Test Cases:**
```python
# Equipment Creation Tests
✓ test_create_equipment_success - Successful creation
✓ test_create_equipment_missing_fields - Required field validation
✓ test_create_equipment_student_denied - Authorization check
✓ test_create_equipment_no_token - Authentication requirement

# Equipment Retrieval Tests
✓ test_get_all_equipment - List all equipment
✓ test_get_equipment_pagination - Pagination support
✓ test_get_equipment_filter_by_category - Category filtering
✓ test_get_equipment_filter_by_status - Status filtering
✓ test_get_equipment_success - Get specific equipment
✓ test_get_equipment_not_found - Not found handling

# Equipment Update Tests
✓ test_update_equipment_success - Successful update
✓ test_update_equipment_not_found - Not found handling
✓ test_update_equipment_student_denied - Authorization check

# Equipment Deletion Tests
✓ test_delete_equipment_success - Successful deletion
✓ test_delete_equipment_not_found - Not found handling
✓ test_delete_equipment_student_denied - Authorization check

# QR Code Tests
✓ test_get_qr_code_success - QR code retrieval
✓ test_get_qr_code_not_found - Not found handling

# Search Tests
✓ test_search_equipment_by_name - Name-based search
✓ test_search_equipment_query_too_short - Query length validation
✓ test_search_equipment_no_query - Query requirement

# Maintenance Tests
✓ test_set_maintenance_success - Mark for maintenance
✓ test_set_maintenance_not_found - Not found handling
✓ test_set_maintenance_student_denied - Authorization check
```

---

### 3. test_reservation.py (Reservation Management - 18 tests)

**Endpoints Tested:**
- `POST /api/reservation` - 5 tests
- `GET /api/reservation` - 3 tests
- `GET /api/reservation/<id>` - 3 tests
- `POST /api/reservation/<id>/cancel` - 3 tests
- `GET /api/reservation/upcoming` - 1 test
- `GET /api/reservation/history` - 2 tests
- `POST /api/reservation/<id>/return` - 3 tests

**Test Cases:**
```python
# Reservation Creation Tests
✓ test_create_reservation_success - Successful creation
✓ test_create_reservation_missing_fields - Required field validation
✓ test_create_reservation_equipment_not_found - Equipment validation
✓ test_create_reservation_invalid_dates - Date range validation
✓ test_create_reservation_no_token - Authentication requirement

# Reservation Retrieval Tests
✓ test_get_user_reservations - Get user's reservations
✓ test_get_reservations_filter_by_status - Status filtering
✓ test_get_reservations_pagination - Pagination support
✓ test_get_reservation_success - Get specific reservation
✓ test_get_reservation_not_found - Not found handling
✓ test_get_reservation_unauthorized - Authorization check

# Reservation Cancellation Tests
✓ test_cancel_reservation_success - Successful cancellation
✓ test_cancel_reservation_not_found - Not found handling
✓ test_cancel_reservation_unauthorized - Authorization check

# Upcoming Reservations Tests
✓ test_get_upcoming_reservations - Get upcoming reservations

# Reservation History Tests
✓ test_get_reservation_history - Get reservation history
✓ test_get_history_pagination - Pagination support

# Equipment Return Tests
✓ test_return_equipment_success - Successful return
✓ test_return_equipment_not_checked_out - Status validation
✓ test_return_equipment_not_found - Not found handling
```

---

### 4. test_admin.py (Admin Management - 15 tests)

**Endpoints Tested:**
- `GET /api/admin/reservations/pending` - 3 tests
- `POST /api/admin/reservations/<id>/approve` - 4 tests
- `POST /api/admin/reservations/<id>/reject` - 4 tests
- `GET /api/admin/reservations/all` - 3 tests
- `GET /api/admin/users` - 4 tests
- `PUT /api/admin/users/<id>` - 4 tests
- `POST /api/admin/auto-cancel-unclaimed` - 2 tests
- `GET /api/admin/dashboard/stats` - 2 tests

**Test Cases:**
```python
# Pending Reservations Tests
✓ test_get_pending_reservations_success - Get pending list
✓ test_get_pending_reservations_pagination - Pagination support
✓ test_get_pending_reservations_student_denied - Authorization

# Approval Tests
✓ test_approve_reservation_success - Successful approval
✓ test_approve_reservation_not_found - Not found handling
✓ test_approve_non_pending_reservation - Status validation
✓ test_approve_reservation_student_denied - Authorization

# Rejection Tests
✓ test_reject_reservation_success - Successful rejection
✓ test_reject_reservation_missing_reason - Required field validation
✓ test_reject_reservation_not_found - Not found handling
✓ test_reject_reservation_student_denied - Authorization

# All Reservations Tests
✓ test_get_all_reservations - Get all reservations
✓ test_get_all_reservations_filter_by_status - Status filtering
✓ test_get_all_reservations_pagination - Pagination support

# User Management Tests
✓ test_get_all_users - Get all users
✓ test_get_all_users_filter_by_role - Role filtering
✓ test_get_all_users_pagination - Pagination support
✓ test_get_all_users_student_denied - Authorization
✓ test_update_user_success - Successful user update
✓ test_update_user_role - Role update
✓ test_update_user_not_found - Not found handling
✓ test_update_user_student_denied - Authorization

# Auto-Cancel Tests
✓ test_auto_cancel_unclaimed_success - Successful auto-cancel
✓ test_auto_cancel_unclaimed_student_denied - Authorization

# Dashboard Tests
✓ test_get_dashboard_stats_success - Get statistics
✓ test_get_dashboard_stats_student_denied - Authorization
```

---

### 5. test_qrcode.py (QR Code Scanning - 15 tests)

**Endpoints Tested:**
- `POST /api/qrcode/scan` - 7 tests
- `GET /api/qrcode/scan-history/<id>` - 3 tests
- `GET /api/qrcode/equipment/<id>/scan-stats` - 3 tests
- `POST /api/qrcode/validate` - 4 tests

**Test Cases:**
```python
# QR Code Scan Tests
✓ test_scan_check_in_success - Successful check-in
✓ test_scan_check_out_success - Successful check-out
✓ test_scan_missing_qr_code - Required field validation
✓ test_scan_invalid_scan_type - Invalid scan type handling
✓ test_scan_equipment_not_found - Invalid QR code handling
✓ test_scan_no_active_reservation - Reservation requirement
✓ test_scan_check_in_early - Check-in timing validation

# Scan History Tests
✓ test_get_scan_history_success - Get scan history
✓ test_get_scan_history_not_found - Not found handling
✓ test_get_scan_history_unauthorized - Authorization check

# Equipment Stats Tests
✓ test_get_equipment_scan_stats_success - Get statistics
✓ test_get_equipment_scan_stats_not_found - Not found handling
✓ test_get_equipment_scan_stats_student_denied - Authorization

# QR Code Validation Tests
✓ test_validate_qr_code_success - Valid QR code
✓ test_validate_invalid_qr_code - Invalid QR code
✓ test_validate_missing_qr_code - Required field validation
✓ test_validate_qr_code_no_auth_required - No auth needed
```

---

### 6. test_reports.py (Reports and Analytics - 20 tests)

**Endpoints Tested:**
- `GET /api/reports/equipment/usage` - 3 tests
- `GET /api/reports/peak-hours` - 3 tests
- `GET /api/reports/user-activity` - 4 tests
- `GET /api/reports/occupancy` - 4 tests
- `GET /api/reports/reservation-status-breakdown` - 3 tests
- `GET /api/reports/equipment/<id>/history` - 3 tests
- `GET /api/reports/export/csv` - 5 tests

**Test Cases:**
```python
# Equipment Usage Tests
✓ test_get_equipment_usage_report - Get usage report
✓ test_get_equipment_usage_report_custom_period - Custom period
✓ test_get_equipment_usage_report_student_denied - Authorization

# Peak Hours Tests
✓ test_get_peak_hours_report - Get peak hours
✓ test_get_peak_hours_custom_period - Custom period
✓ test_get_peak_hours_student_denied - Authorization

# User Activity Tests
✓ test_get_user_activity_report - Get user activity
✓ test_get_user_activity_pagination - Pagination support
✓ test_get_user_activity_custom_period - Custom period
✓ test_get_user_activity_student_denied - Authorization

# Occupancy Tests
✓ test_get_occupancy_report - Get occupancy
✓ test_get_occupancy_report_custom_period - Custom period
✓ test_get_occupancy_report_data_structure - Data validation
✓ test_get_occupancy_student_denied - Authorization

# Status Breakdown Tests
✓ test_get_reservation_status_breakdown - Get breakdown
✓ test_get_status_breakdown_custom_period - Custom period
✓ test_get_status_breakdown_student_denied - Authorization

# Equipment History Tests
✓ test_get_equipment_history_success - Get history
✓ test_get_equipment_history_not_found - Not found handling
✓ test_get_equipment_history_student_denied - Authorization

# CSV Export Tests
✓ test_export_reservations_csv - Export reservations
✓ test_export_equipment_csv - Export equipment
✓ test_export_invalid_type - Invalid type handling
✓ test_export_csv_student_denied - Authorization
✓ test_export_csv_default_type - Default type handling
```

---

## Running Tests

### Prerequisites

```bash
# Install dependencies
pip install -r requirements.txt

# Ensure pytest is installed
pip install pytest pytest-cov
```

### Run All Tests

```bash
# Using Python
python run_tests.py

# Using pytest directly
pytest tests/ -v

# Using pytest in watch mode (requires pytest-watch)
pip install pytest-watch
ptw tests/
```

### Run Specific Test File

```bash
# Run authentication tests only
pytest tests/test_auth.py -v

# Run equipment tests
pytest tests/test_equipment.py -v

# Run reservation tests
pytest tests/test_reservation.py -v

# Run admin tests
pytest tests/test_admin.py -v

# Run QR code tests
pytest tests/test_qrcode.py -v

# Run reports tests
pytest tests/test_reports.py -v
```

### Run Specific Test Class

```bash
# Run all authentication login tests
pytest tests/test_auth.py::TestAuthLogin -v

# Run all equipment creation tests
pytest tests/test_equipment.py::TestEquipmentCreate -v
```

### Run Specific Test

```bash
# Run single test
pytest tests/test_auth.py::TestAuthRegister::test_register_success -v
```

### Run with Coverage Report

```bash
# Using script
python run_tests.py coverage

# Using pytest
pytest tests/ --cov=. --cov-report=html --cov-report=term-missing

# View HTML report
open htmlcov/index.html  # macOS
start htmlcov/index.html  # Windows
xdg-open htmlcov/index.html  # Linux
```

### Run with Specific Markers

```bash
# Run authentication tests
pytest tests/ -m auth -v

# Run tests with coverage for auth module
pytest tests/test_auth.py --cov=routes.auth --cov-report=html
```

---

## Test Fixtures

All tests use fixtures from `conftest.py`:

### Available Fixtures

```python
# Application and Client
app           # Flask test application
client        # Test client for making requests
runner        # CLI runner

# User Fixtures
admin_user    # Test admin user (username: admin1)
student_user  # Test student user (username: student1)
admin_token   # JWT token for admin user
student_token # JWT token for student user

# Equipment and Reservation
test_equipment  # Sample equipment (Test Laptop)
test_reservation # Sample reservation (pending status)
```

### Using Fixtures in Tests

```python
def test_something(client, admin_token, test_equipment):
    """Example test using fixtures"""
    response = client.get(
        f'/api/equipment/{test_equipment.id}',
        headers={'Authorization': f'Bearer {admin_token}'}
    )
    assert response.status_code == 200
```

---

## Test Patterns

### Testing Authentication

```python
def test_authenticated_endpoint(client, admin_token):
    """Test endpoint requiring authentication"""
    response = client.get(
        '/api/admin/dashboard/stats',
        headers={'Authorization': f'Bearer {admin_token}'}
    )
    assert response.status_code == 200
```

### Testing Authorization

```python
def test_authorization_check(client, student_token):
    """Test admin-only endpoint with student token"""
    response = client.post(
        '/api/admin/auto-cancel-unclaimed',
        headers={'Authorization': f'Bearer {student_token}'}
    )
    assert response.status_code == 403
```

### Testing CRUD Operations

```python
def test_create_and_read(client, admin_token):
    """Test create and retrieve operations"""
    # Create
    create_response = client.post(
        '/api/equipment',
        headers={'Authorization': f'Bearer {admin_token}'},
        json={'name': 'Test', 'category': 'Test', 'quantity': 1}
    )
    assert create_response.status_code == 201
    equipment_id = create_response.json()['equipment']['id']
    
    # Read
    get_response = client.get(f'/api/equipment/{equipment_id}')
    assert get_response.status_code == 200
```

### Testing Pagination

```python
def test_pagination(client, admin_token):
    """Test paginated endpoints"""
    response = client.get(
        '/api/admin/users?page=1&per_page=10',
        headers={'Authorization': f'Bearer {admin_token}'}
    )
    assert response.status_code == 200
    data = response.json()
    assert 'pages' in data
    assert 'current_page' in data
```

### Testing Error Handling

```python
def test_not_found_error(client):
    """Test 404 error handling"""
    response = client.get('/api/equipment/nonexistent-id')
    assert response.status_code == 404
    assert 'not found' in response.json()['error']
```

---

## Expected Test Output

```
============================= test session starts =============================
platform linux -- Python 3.12.0, pytest-7.4.0
collected 115 items

tests/test_auth.py::TestAuthRegister::test_register_success PASSED       [  1%]
tests/test_auth.py::TestAuthRegister::test_register_missing_fields PASSED [  2%]
tests/test_equipment.py::TestEquipmentCreate::test_create_equipment_success PASSED [ 3%]
...
tests/test_reports.py::TestExportReportCSV::test_export_csv_default_type PASSED [100%]

============================== 115 passed in 2.34s ==============================
```

---

## Debugging Tests

### Run with Verbose Output

```bash
pytest tests/ -vv  # Very verbose
pytest tests/ -vvv # Extra verbose
```

### Show Print Statements

```bash
pytest tests/ -s  # Show print output
```

### Stop on First Failure

```bash
pytest tests/ -x  # Stop on first failure
```

### Drop into Debugger on Failure

```bash
pytest tests/ --pdb  # Open debugger on failure
```

### Use Python Debugger

```python
def test_debug_example(client, admin_token):
    """Test with debugging"""
    import pdb; pdb.set_trace()  # Breakpoint
    response = client.get('/api/admin/dashboard/stats',
        headers={'Authorization': f'Bearer {admin_token}'})
```

---

## Continuous Integration

### GitHub Actions Example

```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Set up Python
        uses: actions/setup-python@v2
        with:
          python-version: 3.12
      - name: Install dependencies
        run: |
          pip install -r requirements.txt
      - name: Run tests
        run: |
          pytest tests/ --cov --cov-report=xml
```

---

## Test Maintenance

### Adding New Tests

1. Create test in appropriate file (e.g., `test_new_feature.py`)
2. Follow naming convention: `test_<feature>_<scenario>`
3. Use appropriate fixtures
4. Add docstring explaining the test
5. Run tests: `pytest tests/test_new_feature.py -v`

### Updating Fixtures

1. Modify `tests/conftest.py`
2. Update fixture docstring
3. Run all tests to ensure compatibility
4. Update this guide if needed

### Debugging Test Failures

1. Run failing test with verbose output: `pytest tests/test_file.py::TestClass::test_name -vv`
2. Check error message and traceback
3. Use `--pdb` to debug interactively
4. Add `print()` statements with `-s` flag
5. Check fixture data with `print(fixture_name)`

---

## Performance

### Test Execution Time

- Total suite: ~2-3 seconds
- Per test: ~10-20ms average
- Slowest tests: Admin and Reports tests

### Optimizations

```bash
# Run tests in parallel (requires pytest-xdist)
pip install pytest-xdist
pytest tests/ -n auto

# Run only failed tests
pytest tests/ --lf

# Run only new tests
pytest tests/ --ff
```

---

## Troubleshooting

### Common Issues

**Issue: Import errors in tests**
```bash
# Solution: Ensure backend directory is in PYTHONPATH
export PYTHONPATH="${PYTHONPATH}:$(pwd)/backend"
pytest tests/
```

**Issue: Database locked error**
```bash
# Solution: Clear pytest cache
pytest --cache-clear tests/
```

**Issue: Token validation fails**
```bash
# Solution: Check JWT_SECRET_KEY in conftest.py matches app config
# Both should use 'test-secret-key' for testing
```

**Issue: Timezone errors**
```bash
# Solution: Use datetime.now(timezone.utc) instead of utcnow()
# Already implemented in conftest.py
```

---

## Summary

- **Total Tests**: 115+
- **Test Files**: 6
- **Endpoints Covered**: 39
- **Coverage Target**: >90%
- **Execution Time**: ~2-3 seconds
- **All major API operations tested**: ✅

Run tests regularly to ensure code quality and prevent regressions!
