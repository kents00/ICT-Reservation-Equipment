# Password Reset Verification Code Error - Fix Guide

## Problem
When attempting to reset a password on Render, the following error occurred:

```
sqlalchemy.exc.DataError: (psycopg2.errors.StringDataRightTruncation)
value too long for type character varying(10)
```

The verification code being stored was:
```
439477:Kx-LldAPQlMj0SUGliYilfHz8RX9Im7myHGY1-a9mA0
```

## Root Cause
The `verification_code` column in the `user` table was defined as `VARCHAR(10)`, which is too small to store the verification code in the format used by the application:

```
{6-digit-code}:{32-character-reset-token}
```

This format results in a string approximately 50+ characters long, which exceeds the 10-character limit.

## Solution

### 1. Update Local Code
The `models.py` file has been updated to change the column definition from:
```python
verification_code = db.Column(db.String(10))
```

To:
```python
verification_code = db.Column(db.String(255))
```

### 2. Update Render Database
You need to execute the following SQL migration on your Render PostgreSQL database:

```sql
ALTER TABLE "user" ALTER COLUMN verification_code TYPE VARCHAR(255);
```

#### Steps to Apply the Migration on Render:

**Option A: Using Render's PostgreSQL Console**
1. Go to your Render dashboard
2. Click on your PostgreSQL database
3. Open the "Connect" tab
4. Copy the connection string
5. Connect using psql or a GUI tool (pgAdmin, DBeaver, etc.)
6. Execute the migration SQL command above

**Option B: Using Terminal/Command Line**
```bash
# Connect to your Render database
psql your_postgresql_connection_string

# Execute the migration
ALTER TABLE "user" ALTER COLUMN verification_code TYPE VARCHAR(255);

# Verify the change
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns
WHERE table_name = 'user' AND column_name = 'verification_code';
```

**Option C: Programmatically During Deployment**
You can add this to a migration script that runs during deployment.

### 3. Verify the Fix

After applying the migration, verify that the column has been updated:

```sql
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns
WHERE table_name = 'user' AND column_name = 'verification_code';
```

Expected output:
```
column_name        | data_type | character_maximum_length
-------------------|-----------|------------------------
verification_code  | character varying | 255
```

## Testing

After the migration:

1. **Local Testing**: Run tests locally to ensure password reset works:
   ```bash
   pytest tests/ -k password_reset -v
   ```

2. **Production Testing on Render**:
   - Navigate to https://your-app.onrender.com/admin/forgot-password
   - Enter a valid email address
   - Verify that the email is sent without errors
   - Complete the password reset verification

## Related Code Changes

The following files have been modified:

1. **`models.py`**: Updated `User.verification_code` column definition from `String(10)` to `String(255)`

2. **`migrations/001_increase_verification_code_length.sql`**: SQL migration script for the database

## Notes

- This change is backward compatible - existing shorter codes will continue to work
- No data loss will occur during the migration
- The `255` character limit is sufficient for the current implementation and any future enhancements
- If you're using Alembic for migrations in the future, consider migrating to a proper migration system

## References

- [PostgreSQL ALTER TABLE Documentation](https://www.postgresql.org/docs/current/sql-altertable.html)
- [SQLAlchemy String Type](https://docs.sqlalchemy.org/en/20/core/types.html#sqlalchemy.String)
- [Render PostgreSQL Database Documentation](https://render.com/docs/postgres)
