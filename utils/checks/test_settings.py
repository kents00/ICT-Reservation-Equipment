"""
Quick test script to verify settings functionality
"""
import requests
import json

BASE_URL = "http://127.0.0.1:5000"

# First, login as admin to get token
print("1. Logging in as admin...")
login_response = requests.post(
    f"{BASE_URL}/api/auth/login",
    json={
        "username": "admin1",
        "password": "password123"
    }
)

if login_response.status_code == 200:
    token = login_response.json().get('access_token')
    print(f"✓ Login successful! Token: {token[:20]}...")
else:
    print(f"✗ Login failed: {login_response.text}")
    exit(1)

# Test GET settings
print("\n2. Fetching current settings...")
headers = {"Authorization": f"Bearer {token}"}
get_response = requests.get(f"{BASE_URL}/api/admin/settings", headers=headers)

if get_response.status_code == 200:
    settings = get_response.json()
    print("✓ Settings fetched successfully!")
    print(json.dumps(settings, indent=2))
else:
    print(f"✗ Failed to fetch settings: {get_response.text}")
    exit(1)

# Test UPDATE settings
print("\n3. Updating settings...")
update_data = {
    "system_name": "Updated Equipment System",
    "description": "Testing the settings update functionality",
    "max_reservation_duration": 45,
    "require_approval": False,
    "email_notifications": True
}

update_response = requests.put(
    f"{BASE_URL}/api/admin/settings",
    headers={**headers, "Content-Type": "application/json"},
    json=update_data
)

if update_response.status_code == 200:
    result = update_response.json()
    print("✓ Settings updated successfully!")
    print(json.dumps(result, indent=2))
else:
    print(f"✗ Failed to update settings: {update_response.text}")
    exit(1)

# Verify the update
print("\n4. Verifying updated settings...")
verify_response = requests.get(
    f"{BASE_URL}/api/admin/settings", headers=headers)

if verify_response.status_code == 200:
    updated_settings = verify_response.json()
    print("✓ Verification successful!")
    print(f"   System Name: {updated_settings.get('system_name')}")
    print(f"   Description: {updated_settings.get('description')}")
    print(
        f"   Max Duration: {updated_settings.get('max_reservation_duration')} days")
    print(f"   Require Approval: {updated_settings.get('require_approval')}")
    print(
        f"   Email Notifications: {updated_settings.get('email_notifications')}")
else:
    print(f"✗ Failed to verify: {verify_response.text}")

print("\n" + "="*50)
print("All tests passed! ✓")
print("="*50)
print("\nYou can now visit:")
print(f"  - Settings Page: {BASE_URL}/admin/settings")
print(f"  - Dashboard: {BASE_URL}/admin/dashboard")
