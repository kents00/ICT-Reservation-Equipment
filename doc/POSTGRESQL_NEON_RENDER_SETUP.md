# PostgreSQL + Neon + Render Deployment Guide

This guide walks you through migrating your Equipment Reservation System to PostgreSQL using Neon (managed PostgreSQL database) and deploying to Render.

## Table of Contents
1. [Step 1: Set Up Neon Database](#step-1-set-up-neon-database)
2. [Step 2: Update Local Environment](#step-2-update-local-environment)
3. [Step 3: Migrate Data (If Applicable)](#step-3-migrate-data-if-applicable)
4. [Step 4: Test PostgreSQL Locally](#step-4-test-postgresql-locally)
5. [Step 5: Deploy to Render](#step-5-deploy-to-render)
6. [Step 6: Configure Render Environment](#step-6-configure-render-environment)
7. [Troubleshooting](#troubleshooting)

---

## Step 1: Set Up Neon Database

### 1.1 Create Neon Account
1. Go to [https://neon.tech](https://neon.tech)
2. Click **Sign Up** and create an account (use GitHub for quick setup)
3. Complete email verification

### 1.2 Create a New Project
1. In the Neon dashboard, click **New Project**
2. Enter project name: `Equipment-Reservation`
3. Select PostgreSQL version (latest recommended)
4. Region: Choose closest to your deployment region
5. Click **Create Project**

### 1.3 Get Connection String
1. In your Neon project, go to the **Connection string** section
2. Select **Pooled connection** (recommended for web apps)
3. Copy the connection string
4. Format: `postgresql://user:password@host/dbname`

**Keep this connection string safe!** You'll need it for environment variables.

---

## Step 2: Update Local Environment

### 2.1 Update `.env` File
Replace your local `.env` file with:

```bash
# Flask Configuration
FLASK_APP=app.py
FLASK_ENV=development
FLASK_DEBUG=True
SECRET_KEY=your-secret-key-change-this-in-production
JWT_SECRET_KEY=your-jwt-secret-key-change-this-in-production

# Database Configuration - PostgreSQL with Neon
DATABASE_URL=postgresql://username:password@host.neon.tech/dbname?sslmode=require

# Email Configuration (Required for email notifications)
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=True
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-gmail-app-password
MAIL_DEFAULT_SENDER=your-email@gmail.com

# Optional Email Debug
MAIL_DEBUG=False

# Auto-cancel Configuration
AUTO_CANCEL_DAYS=3

# Admin Configuration
ADMIN_EMAIL=admin@example.com
ADMIN_NAME=System Administrator
```

### 2.2 Verify Requirements
Ensure your `requirements.txt` includes PostgreSQL driver:
```
psycopg2-binary==2.9.11
```

Your `requirements.txt` should already have this. If not, run:
```bash
pip install psycopg2-binary
```

---

## Step 3: Migrate Data (If Applicable)

### 3.1 Export Data from SQLite (Optional)
If you have existing data in SQLite:

```bash
# Create a migration script
python seed_db.py  # Or your data initialization script
```

### 3.2 Initialize PostgreSQL Database
```bash
# Activate your virtual environment
# Windows
env_new\Scripts\activate
# OR Linux/Mac
source env/bin/activate

# Create tables in PostgreSQL
python -c "from app import create_app, db; app = create_app(); app.app_context().push(); db.create_all(); print('Database initialized!')"
```

---

## Step 4: Test PostgreSQL Locally

### 4.1 Run Tests
```bash
# Run your test suite to verify everything works
pytest

# Or use the provided test script
python run_tests.py
```

### 4.2 Verify Connection
```bash
# Test the database connection
python -c "
from app import create_app
app = create_app()
with app.app_context():
    from sqlalchemy import text
    result = db.session.execute(text('SELECT 1'))
    print('✓ PostgreSQL connection successful!')
"
```

### 4.3 Run Development Server
```bash
# Start the Flask development server
python app.py

# Server should start at http://localhost:5000
```

---

## Step 5: Deploy to Render

### 5.1 Create Render Account
1. Go to [https://render.com](https://render.com)
2. Sign up with GitHub for easier deployment
3. Connect your GitHub repository

### 5.2 Create New Web Service
1. In Render dashboard, click **New +** → **Web Service**
2. Connect your GitHub repository:
   - Select your repository: `ICT-Reservation-Equipment`
   - Select branch: `backend` (or your main branch with backend code)

### 5.3 Configure Web Service

**Basic Settings:**
- **Name**: `equipment-reservation-api`
- **Environment**: `Python 3`
- **Region**: Select closest to your users
- **Branch**: `backend`
- **Build Command**:
  ```bash
  pip install -r requirements.txt
  ```
- **Start Command**:
  ```bash
  gunicorn -w 4 -b 0.0.0.0:$PORT app:app
  ```

**Plan**: Start with Free tier (for testing)

### 5.4 Set Environment Variables
1. In the Render dashboard for your service, go to **Environment**
2. Add the following environment variables:

```
FLASK_APP=app.py
FLASK_ENV=production
SECRET_KEY=<generate-a-strong-secret>
JWT_SECRET_KEY=<generate-a-strong-secret>
DATABASE_URL=postgresql://user:password@host.neon.tech/dbname?sslmode=require
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=True
MAIL_USERNAME=<your-email>
MAIL_PASSWORD=<your-app-password>
MAIL_DEFAULT_SENDER=<your-email>
AUTO_CANCEL_DAYS=3
ADMIN_EMAIL=<admin-email>
ADMIN_NAME=System Administrator
```

**Important**: Use strong, unique values for `SECRET_KEY` and `JWT_SECRET_KEY`.

### 5.5 Deploy
1. Click **Create Web Service**
2. Render will automatically:
   - Build your application
   - Install dependencies
   - Deploy to their servers
3. Monitor the deployment logs
4. Once deployed, you'll get a URL: `https://equipment-reservation-api.onrender.com`

---

## Step 6: Configure Render Environment

### 6.1 Verify Deployment
```bash
# Test your deployed API
curl https://equipment-reservation-api.onrender.com/health

# Or visit in browser
https://equipment-reservation-api.onrender.com
```

### 6.2 Initialize Database on Render
Option A - Via Render Shell:
1. In Render dashboard, go to your service
2. Click **Shell** tab
3. Run:
   ```bash
   python -c "from app import create_app, db; app = create_app(); app.app_context().push(); db.create_all(); print('Database initialized!')"
   ```

Option B - Auto-initialize with startup hook:
Add this to your `app.py` before running routes:
```python
with app.app_context():
    db.create_all()
```

### 6.3 View Logs
1. In Render dashboard, click **Logs** tab
2. Monitor for errors and debug issues

---

## Environment Variable Generation

### Generate Strong Secret Keys
Use this Python script to generate secure keys:

```python
import secrets

# Generate SECRET_KEY
secret_key = secrets.token_hex(32)
print(f"SECRET_KEY={secret_key}")

# Generate JWT_SECRET_KEY
jwt_key = secrets.token_hex(32)
print(f"JWT_SECRET_KEY={jwt_key}")
```

Run in Python:
```bash
python -c "import secrets; print('SECRET_KEY=' + secrets.token_hex(32)); print('JWT_SECRET_KEY=' + secrets.token_hex(32))"
```

---

## Troubleshooting

### Connection Issues
**Error**: `psycopg2.OperationalError: could not connect to server`

**Solution**:
- Verify DATABASE_URL format
- Check Neon connection settings
- Ensure SSL mode is set correctly: `?sslmode=require`
- Test connection locally first

### Database Not Initializing
**Error**: `ProgrammingError: relation "user" does not exist`

**Solution**:
1. Run initialization command in Render Shell:
   ```bash
   python -c "from app import create_app, db; app = create_app(); app.app_context().push(); db.create_all()"
   ```
2. Or add to `app.py` startup:
   ```python
   with app.app_context():
       db.create_all()
   ```

### Cold Starts on Free Tier
Free tier services sleep after 15 minutes of inactivity.

**Solution**: Upgrade to Starter tier ($7/month) for production

### Email Not Sending
**Error**: `SMTPAuthenticationError: Invalid username or password`

**Solution**:
- For Gmail: Use [App Password](https://support.google.com/accounts/answer/185833), not regular password
- Verify MAIL_USERNAME and MAIL_PASSWORD in environment variables
- Ensure MAIL_USE_TLS=True

### SSL Certificate Issues
**Error**: `SSL: CERTIFICATE_VERIFY_FAILED`

**Solution**: Already handled by `?sslmode=require` in DATABASE_URL

---

## Architecture Overview

```
┌─────────────────────┐
│  Your Application   │
│  (Flask Backend)    │
└──────────┬──────────┘
           │
           ├─────────────────────────────┐
           │                             │
    ┌──────▼──────┐            ┌────────▼────────┐
    │   Render    │            │  Neon Database  │
    │  (Hosting)  │────────────│ (PostgreSQL)    │
    └─────────────┘            └─────────────────┘
           │
           └─────────────────────────────┐
                                         │
                              ┌──────────▼──────────┐
                              │   Email Service     │
                              │   (Gmail SMTP)      │
                              └─────────────────────┘
```

---

## Quick Reference Commands

```bash
# Local development
source env/bin/activate  # or env_new\Scripts\activate on Windows
pip install -r requirements.txt

# Test locally
pytest
python app.py

# Deploy
git push  # Render auto-deploys on push to your branch

# Check Render logs
# Visit: https://dashboard.render.com → Your Service → Logs

# Check Neon database
# Visit: https://console.neon.tech → Your Project → Tables
```

---

## Next Steps

1. ✅ Complete all steps above
2. ✅ Test API endpoints thoroughly
3. ✅ Monitor logs in Render and Neon dashboards
4. ✅ Set up automated backups in Neon
5. ✅ Configure custom domain (if needed)
6. ✅ Upgrade to Starter tier for production (prevents cold starts)

---

## Support Resources

- **Neon Docs**: https://neon.tech/docs
- **Render Docs**: https://render.com/docs
- **Flask SQLAlchemy**: https://flask-sqlalchemy.palletsprojects.com/
- **PostgreSQL**: https://www.postgresql.org/docs/

---

**Last Updated**: December 2, 2025
