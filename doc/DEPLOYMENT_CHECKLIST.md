# Equipment Reservation System - Setup Checklist

## Phase 1: Local Setup with PostgreSQL

### Pre-requisites
- [ ] Git installed and repository cloned
- [ ] Python 3.9+ installed
- [ ] pip and virtualenv available

### Step 1: Create Neon Database
- [ ] Go to https://neon.tech
- [ ] Sign up with GitHub (recommended)
- [ ] Create new project: "Equipment-Reservation"
- [ ] Copy the **pooled connection** string
- [ ] Format: `postgresql://[user]:[password]@[host]/[dbname]?sslmode=require`

### Step 2: Local Environment Setup
```bash
# Activate virtual environment
# Windows:
env_new\Scripts\activate
# Linux/Mac:
source env/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file from template
cp .env.example .env
```

- [ ] Add DATABASE_URL from Neon to `.env`
- [ ] Generate and add SECRET_KEY:
  ```bash
  python db_setup.py secrets
  ```
- [ ] Update MAIL_* variables for your email

### Step 3: Test Local PostgreSQL Connection
```bash
python db_setup.py check      # Check dependencies
python db_setup.py test       # Test database connection
python db_setup.py init       # Initialize database
```

- [ ] All checks pass
- [ ] Database connection successful
- [ ] Tables created successfully

### Step 4: Run Application Locally
```bash
python app.py
```

- [ ] Server starts at http://localhost:5000
- [ ] No connection errors in logs
- [ ] Can access endpoints

### Step 5: Run Tests
```bash
pytest
# OR
python run_tests.py
```

- [ ] All tests pass
- [ ] No PostgreSQL-specific issues

---

## Phase 2: Deployment to Render

### Step 1: Prepare for Render
- [ ] All local tests pass
- [ ] `.env.example` updated with PostgreSQL instructions
- [ ] `Procfile` created in root directory
- [ ] `runtime.txt` specifies Python 3.11
- [ ] Committed all changes to git:
  ```bash
  git add -A
  git commit -m "Configure PostgreSQL, Neon, and Render deployment"
  git push origin backend
  ```

### Step 2: Create Render Web Service
1. [ ] Go to https://render.com
2. [ ] Sign in with GitHub
3. [ ] Click **New +** → **Web Service**
4. [ ] Select repository: `ICT-Reservation-Equipment`
5. [ ] Configure:
   - **Name**: `equipment-reservation-api`
   - **Region**: Select closest region
   - **Branch**: `backend`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn -w 4 -b 0.0.0.0:$PORT --timeout 120 app:app`

6. [ ] Select Plan: **Free** (for testing) or **Starter** ($7/month for production)

### Step 3: Add Environment Variables
In Render dashboard → Your Service → Environment

Add all variables:
```
FLASK_APP=app.py
FLASK_ENV=production
SECRET_KEY=<from db_setup.py secrets>
JWT_SECRET_KEY=<from db_setup.py secrets>
DATABASE_URL=postgresql://[user]:[password]@[host]/[dbname]?sslmode=require
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=True
MAIL_USERNAME=<your-email@gmail.com>
MAIL_PASSWORD=<app-password-from-gmail>
MAIL_DEFAULT_SENDER=<your-email@gmail.com>
AUTO_CANCEL_DAYS=3
ADMIN_EMAIL=<admin-email>
ADMIN_NAME=System Administrator
```

- [ ] All variables added
- [ ] DATABASE_URL is correct from Neon
- [ ] Mail credentials are correct
- [ ] SECRET keys are strong and unique

### Step 4: Deploy
- [ ] Click **Create Web Service**
- [ ] Monitor build logs (should take 2-5 minutes)
- [ ] Deployment completes successfully
- [ ] Service URL appears: `https://equipment-reservation-api.onrender.com`

### Step 5: Initialize Remote Database
Option A - Via Render Shell:
```bash
# In Render dashboard → Your Service → Shell
python -c "from app import create_app, db; app = create_app(); app.app_context().push(); db.create_all(); print('✓ Database initialized!')"
```

Option B - Automatic (modify `app.py`):
```python
# At the end of create_app() function, before returning
with app.app_context():
    db.create_all()
```

- [ ] Database initialization successful
- [ ] Check logs for errors

### Step 6: Verify Deployment
```bash
# Test API endpoints
curl https://equipment-reservation-api.onrender.com/health

# Or open in browser and check for responses
https://equipment-reservation-api.onrender.com/api/reservations
```

- [ ] API responds with 200/401 (not 500 errors)
- [ ] No database connection errors
- [ ] CORS is working properly

---

## Phase 3: Post-Deployment Verification

### Database Checks
- [ ] Tables exist in Neon (check https://console.neon.tech)
- [ ] Can query data from Render logs
- [ ] No connection pool warnings

### Application Checks
- [ ] Homepage loads (if applicable)
- [ ] API endpoints respond correctly
- [ ] Authentication works
- [ ] Email notifications send (test with password reset)
- [ ] File uploads work
- [ ] QR code generation works

### Monitoring Setup
- [ ] Monitor Render logs regularly
- [ ] Set up Neon alerts (optional)
- [ ] Monitor error rates

---

## Phase 4: Production Optimization

### Render Optimization
- [ ] Upgrade to Starter tier ($7/month) to prevent sleep
- [ ] Configure auto-deploy on git push
- [ ] Set up health checks
- [ ] Configure custom domain (if needed)

### Neon Optimization
- [ ] Enable automated backups
- [ ] Review connection pool settings
- [ ] Monitor database size

### Security
- [ ] All secrets are strong and unique
- [ ] DATABASE_URL is never in version control
- [ ] HTTPS enforced (automatic with Render)
- [ ] CORS properly configured
- [ ] JWT secrets rotated in production

---

## Troubleshooting Guide

### Build Failures on Render
**Problem**: `pip install` fails
- [ ] Check requirements.txt for syntax errors
- [ ] Verify psycopg2-binary is included
- [ ] View full build logs in Render dashboard

**Problem**: `gunicorn` not found
- [ ] Verify gunicorn is in requirements.txt
- [ ] Check Python version matches `runtime.txt`

### Connection Issues
**Problem**: `could not connect to server`
- [ ] Verify DATABASE_URL format
- [ ] Check Neon project status
- [ ] Verify network connectivity
- [ ] Ensure `?sslmode=require` is in URL

**Problem**: `ProgrammingError: relation "table_name" does not exist`
- [ ] Run database initialization in Render Shell
- [ ] Or add `db.create_all()` to app startup
- [ ] Check tables exist in Neon console

### Email Not Sending
**Problem**: `SMTPAuthenticationError`
- [ ] Use Gmail App Password, not regular password
- [ ] Verify credentials in environment variables
- [ ] Check MAIL_USE_TLS=True

### Service Keeps Restarting
**Problem**: Frequent restarts or crashes
- [ ] Check logs for exceptions
- [ ] Increase timeout: `--timeout 120` in Procfile
- [ ] Verify DATABASE_URL is accessible

### Cold Starts on Free Tier
**Solution**: Upgrade to Starter tier ($7/month)
- [ ] Prevents 15-minute inactivity sleep
- [ ] Always keeps service running

---

## Quick Reference

### Neon Dashboard
https://console.neon.tech

### Render Dashboard
https://dashboard.render.com

### Git Commands
```bash
# Push changes to trigger auto-deploy
git push origin backend

# Check status
git status
```

### Database Commands
```bash
# Test locally
python db_setup.py test

# Initialize locally
python db_setup.py init

# Generate secrets
python db_setup.py secrets
```

### Useful URLs
- **Local**: http://localhost:5000
- **Render**: https://equipment-reservation-api.onrender.com
- **Neon**: https://console.neon.tech
- **Render**: https://dashboard.render.com

---

## Notes
- Estimated setup time: 30-45 minutes
- Free tier: Good for testing and development
- Starter tier: Recommended for production
- Always test locally before deploying
- Keep backups of important data

---

**Last Updated**: December 2, 2025
