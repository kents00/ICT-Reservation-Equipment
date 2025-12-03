#!/usr/bin/env python3
"""Quick test of database connection"""

import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

DATABASE_URL = os.getenv('DATABASE_URL')

if not DATABASE_URL:
    print("✗ DATABASE_URL not set in .env file")
    sys.exit(1)

print(f"Testing connection to: {DATABASE_URL[:50]}...")

try:
    import psycopg2
    print("✓ psycopg2 module imported successfully")
except ImportError as e:
    print(f"✗ psycopg2 import failed: {e}")
    sys.exit(1)

try:
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()
    cur.execute("SELECT 1")
    result = cur.fetchone()
    print(f"✓ Database connection successful!")
    print(f"✓ Test query returned: {result}")
    cur.close()
    conn.close()
except Exception as e:
    print(f"✗ Connection failed: {e}")
    sys.exit(1)
