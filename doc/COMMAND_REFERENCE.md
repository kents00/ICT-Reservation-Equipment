# PostgreSQL + Neon + Render - Command Reference

Quick reference for all commands and URLs you'll need.

## 🔧 Setup Commands

### 1. Generate Security Keys
```bash
python db_setup.py secrets
```
**Output**: Two 64-character hex strings
**Use for**: SECRET_KEY and JWT_SECRET_KEY in .env

### 2. Check Dependencies
```bash
python db_setup.py check
```
**Output**: List of installed/missing packages
**Ensures**: All required packages are installed

### 3. Test Database Connection
```bash
python db_setup.py test
```
**Output**: "✓ Database connection successful!" or error
**Use before**: Initializing database
**Troubleshoot**: Connection string or database status

### 4. Initialize Database
```bash
python db_setup.py init
```
**Output**: List of created tables
**Creates**: All SQLAlchemy models as database tables
**Run after**: Testing connection successfully

### 5. Display Neon Setup Instructions
```bash
python db_setup.py neon
```
**Output**: Step-by-step Neon account and project setup
**Use**: When creating Neon account for first time

### 6. Display Render Setup Instructions
```bash
python db_setup.py render
```
**Output**: Step-by-step Render deployment instructions
**Use**: When deploying to Render

---

## 📁 File Configuration

### Update .env File
```bash
# Edit with your text editor or command line
nano .env
# OR
notepad .env  # Windows
```

**Required Variables**:
```bash
# Database
DATABASE_URL=postgresql://user:password@host.neon.tech/dbname?sslmode=require

# Security (Generate with: python db_setup.py secrets)
SECRET_KEY=<64-char hex string>
JWT_SECRET_KEY=<64-char hex string>

# Email
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=<app-password from Gmail>
```

### Create .env from Example
```bash
# Copy example to .env
cp .env.example .env

# Edit with your values
nano .env
```

---

## 🌐 Connection Strings

### Neon Connection String
```
postgresql://user:password@ep-XXXX-YYYY.us-east-1.aws.neon.tech/dbname?sslmode=require
```

**Get it**:
1. https://console.neon.tech
2. Your Project → Connection String
3. Select "Pooled connection"
4. Copy full string

### Local PostgreSQL
```
postgresql://username:password@localhost:5432/dbname
```

### Test Connection
```bash
# Install postgres client (if needed)
# Windows: https://www.postgresql.org/download/windows/

# Test connection
psql "postgresql://user:password@host.neon.tech/dbname?sslmode=require"

# Should connect to database shell
```

---

## 🚀 Deployment Commands

### Push to GitHub
```bash
git add .
git commit -m "Setup PostgreSQL with Neon and Render"
git push origin backend
```

**Triggers**: Automatic deployment on Render (if configured)

### Manual Redeploy on Render
1. Go to https://dashboard.render.com
2. Select your service
3. Click **Manual Deploy** button
4. Service rebuilds and redeploys

### View Deployment Logs
1. https://dashboard.render.com
2. Your Service
3. **Logs** tab
4. Real-time output shown

---

## 🗄️ Database Commands

### Local PostgreSQL Tests
```bash
# Test connection only
python db_setup.py test

# Initialize tables
python db_setup.py init

# Connect to database shell
psql "postgresql://user:pass@host/db?sslmode=require"
```

### In Database Shell (psql)
```sql
-- List all tables
\dt

-- Describe table structure
\d table_name

-- List users
SELECT * FROM user;

-- Count records
SELECT COUNT(*) FROM reservation;

-- View database size
SELECT pg_size_pretty(pg_database_size(current_database()));

-- Check active connections
SELECT * FROM pg_stat_activity;

-- Exit
\q
```

### Render Shell Commands
```bash
# Access in Render dashboard → Your Service → Shell

# Test database
python -c "from app import create_app, db; app = create_app(); app.app_context().push(); from sqlalchemy import text; print(db.session.execute(text('SELECT 1')).fetchone())"

# Initialize database
python -c "from app import create_app, db; app = create_app(); app.app_context().push(); db.create_all(); print('✓ Database initialized!')"

# Check database size
python -c "from app import create_app, db; app = create_app(); app.app_context().push(); from sqlalchemy import text; print(db.session.execute(text(\"SELECT pg_size_pretty(pg_database_size(current_database()))\")).fetchone()[0])"

# View environment variable
echo $DATABASE_URL
```

---

## 🐛 Debugging Commands

### Test Local App
```bash
# Run development server
python app.py

# Should show:
# * Running on http://127.0.0.1:5000

# Test API
curl http://localhost:5000/
curl http://localhost:5000/api/reservations
```

### Run Tests
```bash
# Run all tests
pytest

# Run specific test file
pytest tests/test_auth.py

# Run with verbose output
pytest -v

# Run with coverage report
pytest --cov=. --cov-report=html
```

### Check Requirements
```bash
# Install all dependencies
pip install -r requirements.txt

# List installed packages
pip list

# Check specific package
pip show psycopg2-binary
```

### Environmental Variables
```bash
# View all variables (PowerShell on Windows)
Get-Content .env

# View specific variable (Linux/Mac)
echo $DATABASE_URL

# Check if variable is set
python -c "import os; print(os.getenv('DATABASE_URL'))"
```

---

## 🌍 Important URLs

| Service | URL | Purpose |
|---------|-----|---------|
| **Neon Console** | https://console.neon.tech | Manage database |
| **Neon Dashboard** | https://console.neon.tech/projects | View all projects |
| **Render Dashboard** | https://dashboard.render.com | Manage deployment |
| **Your Service** | https://equipment-reservation-api.onrender.com | Live API |
| **Postgres Docs** | https://www.postgresql.org/docs | Database reference |
| **Flask Docs** | https://flask.palletsprojects.com | Framework reference |
| **SQLAlchemy Docs** | https://docs.sqlalchemy.org | ORM reference |

---

## 📋 Environment Variables Quick Reference

```bash
# Flask Configuration
FLASK_APP=app.py
FLASK_ENV=production          # or 'development'
FLASK_DEBUG=False             # or True for local

# Security Keys (generate with: python db_setup.py secrets)
SECRET_KEY=<64-char random string>
JWT_SECRET_KEY=<64-char random string>

# Database
DATABASE_URL=postgresql://user:pass@host.neon.tech/db?sslmode=require

# Email (Gmail example)
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=True
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=<app-password from Gmail settings>
MAIL_DEFAULT_SENDER=your-email@gmail.com

# Application
AUTO_CANCEL_DAYS=3
ADMIN_EMAIL=admin@example.com
ADMIN_NAME=System Administrator
```

---

## 🔐 Gmail App Password Setup

### Get Gmail App Password
1. Go to https://myaccount.google.com
2. Click **Security** in left sidebar
3. Scroll to **App passwords**
4. Select "Mail" and "Windows"
5. Google generates 16-character password
6. Copy the password
7. Use in MAIL_PASSWORD (not your regular Gmail password)

### Test Email Locally
```bash
# Test email sending
python -c "
from app import create_app
from extensions import mail
from flask_mail import Message

app = create_app()

with app.app_context():
    msg = Message(
        'Test Email',
        recipients=['test@example.com'],
        body='This is a test message'
    )
    mail.send(msg)
    print('✓ Email sent successfully!')
"
```

---

## 📊 Monitoring Commands

### Check Service Status
```bash
# Visit in browser:
https://equipment-reservation-api.onrender.com/

# View logs:
https://dashboard.render.com → Your Service → Logs

# Check metrics:
https://dashboard.render.com → Your Service → Metrics
```

### Database Monitoring
```bash
# View Neon metrics:
https://console.neon.tech → Your Project → Monitoring

# Check database size:
# In Render Shell:
python -c "
from app import create_app, db
from sqlalchemy import text

app = create_app()
with app.app_context():
    size = db.session.execute(text(
        'SELECT pg_size_pretty(pg_database_size(current_database()))'
    )).fetchone()[0]
    print(f'Database size: {size}')
"
```

---

## ⚙️ Configuration Examples

### Local Development .env
```bash
FLASK_ENV=development
FLASK_DEBUG=True
DATABASE_URL=sqlite:///equipment_reservation.db
# OR
DATABASE_URL=postgresql://user:pass@localhost:5432/equipment_dev
```

### Production .env (Render)
```bash
FLASK_ENV=production
FLASK_DEBUG=False
DATABASE_URL=postgresql://user:pass@ep-XXXX.aws.neon.tech/dbname?sslmode=require
SECRET_KEY=<generated 64-char string>
JWT_SECRET_KEY=<generated 64-char string>
```

---

## 🐳 Docker Commands (Optional)

If you want to run PostgreSQL locally with Docker:

```bash
# Pull PostgreSQL image
docker pull postgres:15

# Run PostgreSQL container
docker run --name equipment-db \
  -e POSTGRES_USER=equipment_user \
  -e POSTGRES_PASSWORD=password123 \
  -e POSTGRES_DB=equipment_reservation \
  -p 5432:5432 \
  postgres:15

# Connection string for local Docker
DATABASE_URL=postgresql://equipment_user:password123@localhost:5432/equipment_reservation

# View logs
docker logs equipment-db

# Stop container
docker stop equipment-db

# Start container again
docker start equipment-db
```

---

## 🆘 Troubleshooting Commands

### Connection Issues
```bash
# Test connection string
python db_setup.py test

# Test with psql
psql "your-connection-string-here"

# Check environment variable
python -c "import os; print(os.getenv('DATABASE_URL'))"
```

### Database Not Found
```bash
# Initialize database
python db_setup.py init

# Check tables exist
python -c "
from app import create_app
from sqlalchemy import inspect

app = create_app()
with app.app_context():
    inspector = inspect(db.engine)
    tables = inspector.get_table_names()
    print('Tables:', tables)
"
```

### Render Deployment Issues
```bash
# Check logs
https://dashboard.render.com → Your Service → Logs

# Redeploy
https://dashboard.render.com → Your Service → Manual Deploy

# Check environment variables
https://dashboard.render.com → Your Service → Environment
```

---

## 📚 File Locations

| File | Location | Purpose |
|------|----------|---------|
| Environment | `.env` | Local configuration |
| Example Env | `.env.example` | Template for .env |
| App Config | `app.py` | Flask application |
| Database Models | `models.py` | Database structure |
| Setup Helper | `db_setup.py` | Automated setup |
| Deployment Config | `Procfile` | Render startup command |
| Python Version | `runtime.txt` | Specified Python version |
| Dependencies | `requirements.txt` | Pip packages |
| Setup Guide | `README_POSTGRESQL_SETUP.md` | This setup overview |
| Quick Start | `QUICK_START_POSTGRESQL.md` | 5-minute guide |
| Full Guide | `POSTGRESQL_NEON_RENDER_SETUP.md` | Complete guide |
| Checklist | `DEPLOYMENT_CHECKLIST.md` | Tracking checklist |
| Troubleshooting | `ADVANCED_TROUBLESHOOTING.md` | Reference guide |

---

## ✅ Verification Checklist

```bash
# Run these in order to verify setup

# 1. Check dependencies
python db_setup.py check

# 2. Test database connection
python db_setup.py test

# 3. Initialize database
python db_setup.py init

# 4. Run application
python app.py

# 5. Test API (in another terminal)
curl http://localhost:5000/

# 6. Run tests
pytest
```

---

## 🎯 Common Workflows

### Setup New Local Environment
```bash
cd c:\Users\kente\Programs\Equipment Reservation\backend
env_new\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
nano .env  # Add DATABASE_URL
python db_setup.py test
python db_setup.py init
python app.py
```

### Deploy to Render
```bash
git add -A
git commit -m "Update for deployment"
git push origin backend
# Render automatically deploys
# Monitor at: https://dashboard.render.com
```

### Troubleshoot Connection
```bash
python db_setup.py test    # Test connection
python db_setup.py init    # Initialize database
python db_setup.py check   # Check dependencies
# View full guide: ADVANCED_TROUBLESHOOTING.md
```

---

**Last Updated**: December 2, 2025
**Quick Reference Version**: 1.0
