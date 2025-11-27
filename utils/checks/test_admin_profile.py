"""
Test script to verify admin profile endpoints in settings
"""
import requests
import json

BASE_URL = "http://127.0.0.1:5000"

# Login as admin
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
    print(f"✓ Login successful!")
else:
    print(f"✗ Login failed: {login_response.text}")
    exit(1)

headers = {"Authorization": f"Bearer {token}"}

# Test GET admin profile
print("\n2. Fetching admin profile...")
get_response = requests.get(
    f"{BASE_URL}/api/admin/settings/admin-profile", headers=headers)

if get_response.status_code == 200:
    admin = get_response.json()
    print("✓ Admin profile fetched successfully!")
    print(json.dumps(admin, indent=2))
else:
    print(f"✗ Failed to fetch admin profile: {get_response.text}")
    exit(1)

# Test UPDATE admin profile
print("\n3. Updating admin profile...")
update_data = {
    "username": "admin1",
    "email": "admin1@university.edu",
    "first_name": "Jane",
    "middle_name": "Marie",
    "last_name": "Administrator",
    "phone": "555-1234"
}

update_response = requests.put(
    f"{BASE_URL}/api/admin/settings/admin-profile",
    headers={**headers, "Content-Type": "application/json"},
    json=update_data
)

if update_response.status_code == 200:
    result = update_response.json()
    print("✓ Admin profile updated successfully!")
    print(json.dumps(result, indent=2))
else:
    print(f"✗ Failed to update admin profile: {update_response.text}")
    exit(1)

# Test password change
print("\n4. Testing password change...")
password_data = {
    "password": "newpassword123",
    "confirm_password": "newpassword123"
}

password_response = requests.put(
    f"{BASE_URL}/api/admin/settings/admin-profile",
    headers={**headers, "Content-Type": "application/json"},
    json=password_data
)

if password_response.status_code == 200:
    print("✓ Password updated successfully!")

    # Try logging in with new password
    print("\n5. Verifying new password...")
    new_login = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={
            "username": "admin1",
            "password": "newpassword123"
        }
    )

    if new_login.status_code == 200:
        print("✓ Login with new password successful!")

        # Reset password back to original
        print("\n6. Resetting password back to original...")
        new_token = new_login.json().get('access_token')
        reset_response = requests.put(
            f"{BASE_URL}/api/admin/settings/admin-profile",
            headers={"Authorization": f"Bearer {new_token}",
                     "Content-Type": "application/json"},
            json={"password": "password123", "confirm_password": "password123"}
        )

        if reset_response.status_code == 200:
            print("✓ Password reset to original!")
        else:
            print(f"✗ Failed to reset password: {reset_response.text}")
    else:
        print(f"✗ Login with new password failed: {new_login.text}")
else:
    print(f"✗ Failed to update password: {password_response.text}")

print("\n" + "="*50)
print("All admin profile tests completed! ✓")
print("="*50)
print(f"\nYou can now visit: {BASE_URL}/admin/settings")
print("- Admin information should be pre-populated")
print("- You can edit username, email, name, phone")
print("- You can change password (with confirmation)")
print("- All changes persist to the database")
