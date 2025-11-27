#!/usr/bin/env python
"""Verify the Notification model has the required fields"""
from models import Notification

print('Notification model loaded successfully')
fields = [col.name for col in Notification.__table__.columns]
print('Fields:', fields)
print('\nRequired fields check:')
print('- is_dismissed:', 'is_dismissed' in fields)
print('- updated_at:', 'updated_at' in fields)
print('\nAll fields:')
for field in fields:
    print(f'  - {field}')
