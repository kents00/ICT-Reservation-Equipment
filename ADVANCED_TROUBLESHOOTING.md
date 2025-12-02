# PostgreSQL Neon Render - Advanced Troubleshooting & Reference

## Connection String Formats

### Neon Format (Production)
```
postgresql://user:password@ep-XXXX-YYYY.region.aws.neon.tech/dbname?sslmode=require
```

### Local PostgreSQL Format
```
postgresql://username:password@localhost:5432/dbname
```

### Connection String Variables
- `user` - Database user (default: `neondb_owner`)
- `password` - Database password
- `host` - Server address (ends with .neon.tech for Neon)
- `dbname` - Database name (default: `neondb`)
- `sslmode=require` - Always use with Neon

---

## Neon Console Features

### Viewing Data
1. Log in at https://console.neon.tech
2. Select your project
3. Click **Tables** to browse data
4. Click **Queries** to write SQL directly
5. Click **Monitoring** to see connection stats

### Connection Management
- **Pooled Connection**: Use for web apps (recommended)
- **Direct Connection**: Use for backups/admin tasks
- **Connection limit**: Adjust based on app needs

### Backups
1. Go to **Backups** in your project
2. Create manual backup before deployments
3. Automatic daily backups available on paid plan

---

## Render Service Management

### Viewing Logs
1. Render dashboard → Your service
2. Click **Logs** tab
3. Recent logs show in real-time
4. Use filters to find errors

### Environment Variables
1. Click **Environment** tab
2. Add or edit variables
3. Changes trigger a new deployment
4. Secrets are encrypted automatically

### Redeploy
1. Click **Manual Deploy** button
2. Select branch
3. Service rebuilds and redeploys
4. Useful after environment variable changes

### Service Health
1. Click **Health** tab to see status
2. Response time metrics
3. Uptime tracking
4. Auto-restart if crashes

---

## Common Issues & Solutions

### Issue: "ProgrammingError: relation 'user' does not exist"

**Cause**: Database tables not created

**Solutions**:

Option 1 - Initialize in Render Shell:
```bash
# Render dashboard → Your service → Shell
python -c "from app import create_app, db; app = create_app(); app.app_context().push(); db.create_all()"
```

Option 2 - Add auto-initialization to `app.py`:
```python
from app import create_app, db

app = create_app()

# Initialize database on startup
with app.app_context():
    db.create_all()

if __name__ == '__main__':
    app.run()
```

Option 3 - Check Neon console:
- Visit https://console.neon.tc
- Select your project → Tables
- Verify tables exist

---

### Issue: "could not connect to server"

**Cause**: Connection string is incorrect or database is unreachable

**Verification Steps**:

1. Check connection string format:
   ```bash
   # Should look like:
   postgresql://user:pass@host.neon.tech/db?sslmode=require
   ```

2. Test locally:
   ```bash
   python db_setup.py test
   ```

3. Check environment variable:
   ```bash
   # In Render dashboard → Environment
   # Verify DATABASE_URL is exactly correct
   ```

4. Verify Neon status:
   - Go to https://console.neon.tech
   - Check if project is active (not paused)
   - Check usage limits not exceeded

5. Test connection string with psql:
   ```bash
   # Install postgres client tools
   # Windows: https://www.postgresql.org/download/windows/

   # Test connection
   psql "postgresql://user:pass@host.neon.tech/db?sslmode=require"
   ```

---

### Issue: "MAIL_USERNAME/MAIL_PASSWORD: Invalid username or password"

**Cause**: Gmail app password not used, or credentials are wrong

**Solution**:

1. If using Gmail:
   - Go to https://myaccount.google.com
   - Security → App passwords
   - Generate password for "Mail" and "Windows"
   - Copy the 16-character password
   - Use this in MAIL_PASSWORD (not your regular password)

2. Verify in `.env`:
   ```bash
   MAIL_USERNAME=your-email@gmail.com
   MAIL_PASSWORD=xxxx xxxx xxxx xxxx  # 16-char app password
   MAIL_SERVER=smtp.gmail.com
   MAIL_PORT=587
   MAIL_USE_TLS=True
   ```

3. Test email locally:
   ```bash
   python -c "
   from app import create_app, db
   from flask_mail import Message

   app = create_app()
   with app.app_context():
       msg = Message('Test', recipients=['test@example.com'], body='Test')
       from extensions import mail
       mail.send(msg)
       print('Email sent!')
   "
   ```

---

### Issue: "Service keeps crashing or restarting"

**Cause**: Application errors, timeout, or resource limits

**Solutions**:

1. Check logs:
   ```
   Render dashboard → Logs tab
   Look for Python exceptions or errors
   ```

2. Increase timeout in `Procfile`:
   ```
   web: gunicorn -w 4 -b 0.0.0.0:$PORT --timeout 120 app:app
   ```

3. Reduce worker processes for free tier:
   ```
   web: gunicorn -w 1 -b 0.0.0.0:$PORT --timeout 120 app:app
   ```

4. Check database connection pool:
   ```python
   # In app.py, adjust pool settings:
   app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
       'pool_size': 5,  # Reduce for free tier
       'pool_recycle': 300,
       'pool_pre_ping': True,
   }
   ```

5. Upgrade from Free to Starter tier
   - Free tier: Shared resources, may crash under load
   - Starter: $7/month, dedicated resources

---

### Issue: "Free tier service goes to sleep"

**Cause**: Render free tier services sleep after 15 minutes of inactivity

**Solutions**:

Option 1 - Upgrade to Starter ($7/month):
1. Render dashboard → Your service
2. Click **Settings** → **Instance Type**
3. Select **Starter** (pay-as-you-go)
4. Service stays on 24/7

Option 2 - Keep-alive ping (temporary):
```python
# Add to your app
@app.route('/keep-alive')
def keep_alive():
    return {'status': 'ok'}, 200

# Set up external service to ping every 10 minutes
# Services: https://betterstack.com, https://cronjob.xyz
```

---

### Issue: Database size limits

**Neon Limits**:
- Free tier: 3 concurrent connections, 5GB storage
- Paid tier: More connections and unlimited storage

**Check database size**:
```bash
# In Render Shell
python -c "
from app import create_app, db
from sqlalchemy import text

app = create_app()
with app.app_context():
    result = db.session.execute(text('''
        SELECT pg_database.datname,
               pg_size_pretty(pg_database_size(pg_database.datname)) AS size
        FROM pg_database
        WHERE datname = current_database()
    '''))
    for row in result:
        print(f'{row[0]}: {row[1]}')
"
```

**Optimize**:
- Delete old/test data
- Archive unused records
- Consider paid Neon plan

---

## Database Migration Guide

### From SQLite to PostgreSQL

**Step 1: Export SQLite Data**
```bash
# Create JSON dump
python -c "
import json
from app import create_app, db
from models import User, Equipment, Reservation

app = create_app()
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///equipment_reservation.db'

with app.app_context():
    data = {
        'users': [u.to_dict() for u in User.query.all()],
        'equipment': [e.to_dict() for e in Equipment.query.all()],
        'reservations': [r.to_dict() for r in Reservation.query.all()],
    }

with open('backup.json', 'w') as f:
    json.dump(data, f, indent=2, default=str)

print('Data exported to backup.json')
"
```

**Step 2: Switch Database URL**
```bash
# In .env
DATABASE_URL=postgresql://user:pass@host.neon.tech/db?sslmode=require
```

**Step 3: Initialize PostgreSQL**
```bash
python db_setup.py init
```

**Step 4: Restore Data** (if needed)
```bash
python -c "
import json
from app import create_app, db
from models import User, Equipment, Reservation

app = create_app()

with open('backup.json', 'r') as f:
    data = json.load(f)

with app.app_context():
    # Restore users, equipment, reservations
    # Use appropriate model constructors
    print('Data restored!')
"
```

---

## Performance Optimization

### Database Optimization
```python
# In app.py, optimize connection pool:
app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
    'pool_size': 10,           # Number of connections to maintain
    'pool_recycle': 300,       # Recycle connections every 5 minutes
    'pool_pre_ping': True,     # Test connection before use
    'max_overflow': 20,        # Max additional connections
}
```

### Query Optimization
```python
# Bad: N+1 query problem
reservations = Reservation.query.all()
for r in reservations:
    print(r.equipment.name)  # Extra query per iteration

# Good: Use joinedload
from sqlalchemy.orm import joinedload
reservations = Reservation.query.options(joinedload('equipment')).all()
for r in reservations:
    print(r.equipment.name)  # No extra queries
```

### Caching
```python
from flask_caching import Cache

cache = Cache(app, config={'CACHE_TYPE': 'simple'})

@app.route('/api/equipment')
@cache.cached(timeout=300)
def get_equipment():
    return Equipment.query.all()
```

---

## Monitoring & Alerts

### Neon Monitoring
1. Visit https://console.neon.tech
2. Click **Monitoring**
3. View metrics:
   - Active connections
   - CPU usage
   - Database size
   - Transaction performance

### Render Monitoring
1. Render dashboard → Your service
2. **Metrics** tab shows:
   - CPU usage
   - Memory usage
   - Response times
   - Error rates

### Set Up Alerts
- **Neon**: Project → Alerts (paid plans)
- **Render**: Settings → Notifications (email alerts)

---

## SSL/TLS Verification

### Why `?sslmode=require`?
- Encrypts data in transit
- Verifies server certificate
- Prevents man-in-the-middle attacks
- Required by Neon

### Testing SSL Connection
```bash
# Test with openssl
openssl s_client -connect ep-XXXX.aws.neon.tech:5432

# Should show certificate information
```

---

## Backup & Recovery

### Manual Backups in Neon
1. Neon console → Your project
2. **Backups** tab
3. Click **Create backup**
4. Backups stored for 7 days (free) or 30 days (paid)

### Restore from Backup
1. **Backups** tab
2. Click **Restore** on backup
3. Choose target time
4. Confirmation required

### Export Data Regularly
```bash
# Automatic PostgreSQL dump
pg_dump "postgresql://user:pass@host.neon.tech/db?sslmode=require" > backup.sql

# Restore later
psql "postgresql://new_user:pass@new_host/new_db" < backup.sql
```

---

## Reference URLs

| Service | URL |
|---------|-----|
| Neon Console | https://console.neon.tech |
| Neon Documentation | https://neon.tech/docs |
| Render Dashboard | https://dashboard.render.com |
| Render Docs | https://render.com/docs |
| PostgreSQL Docs | https://www.postgresql.org/docs |
| Flask-SQLAlchemy | https://flask-sqlalchemy.palletsprojects.com |
| SQLAlchemy ORM | https://docs.sqlalchemy.org |

---

## Useful Commands

### Database Inspection
```bash
# Connect to PostgreSQL
psql "postgresql://user:pass@host/db?sslmode=require"

# List tables
\dt

# Describe table
\d table_name

# View connections
SELECT * FROM pg_stat_activity;

# Check database size
SELECT pg_size_pretty(pg_database_size(current_database()));
```

### Flask CLI
```bash
# Set Flask app
export FLASK_APP=app.py

# Run migrations (if using Alembic)
flask db migrate
flask db upgrade

# Create admin user
flask create-admin --email admin@example.com
```

### Testing
```bash
# Run all tests
pytest

# Run specific test file
pytest tests/test_models.py

# Run with coverage
pytest --cov=.

# View HTML coverage report
pytest --cov=. --cov-report=html
open htmlcov/index.html
```

---

## Support Resources

| Issue | Resource |
|-------|----------|
| Neon problems | https://neon.tech/docs + support@neon.tech |
| Render problems | https://render.com/docs + support@render.com |
| PostgreSQL | https://www.postgresql.org/docs |
| SQLAlchemy | https://docs.sqlalchemy.org |
| Flask | https://flask.palletsprojects.com |

---

**Last Updated**: December 2, 2025
