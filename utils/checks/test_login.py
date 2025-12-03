"""
Test admin1 login locally
"""
from app import app
from models import User

with app.app_context():
    user = User.query.filter_by(username='admin1').first()

    if user:
        print(f"✓ User found: {user.username}")
        print(f"✓ Role: {user.role}")
        print(f"✓ Is active: {user.is_active}")
        print(f"✓ Password check: {user.check_password('password123')}")
    else:
        print("✗ User not found")
