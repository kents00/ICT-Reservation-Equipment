# PostgreSQL + Neon + Render: Quick Start (5-Minute Setup)

## 🚀 TL;DR - Fast Path

### 1. Create Neon Database (2 minutes)
```
1. Visit https://neon.tech
2. Sign up with GitHub
3. Create Project → Copy connection string
4. Format: postgresql://user:password@host.neon.tech/dbname?sslmode=require
```

### 2. Update Local `.env` (1 minute)
```bash
# Replace this line in .env:
DATABASE_URL=postgresql://user:password@host.neon.tech/dbname?sslmode=require
```

### 3. Test Locally (1 minute)
```bash
# Activate env
env_new\Scripts\activate

# Test connection
python db_setup.py check
python db_setup.py test
python db_setup.py init
```

### 4. Deploy to Render (1 minute setup, 2-5 min build)
```
1. Visit https://render.com
2. New Web Service → Select your GitHub repo
3. Name: equipment-reservation-api
4. Build: pip install -r requirements.txt
5. Start: gunicorn -w 4 -b 0.0.0.0:$PORT app:app
6. Add Environment Variables (copy from .env)
7. Click Create → Wait for deployment
```

---

## 📋 Step-by-Step

### A. Neon Database Setup

**Visit**: https://neon.tech

```
1. Click "Sign Up"
2. Use GitHub login (faster)
3. Create New Project
   - Name: Equipment-Reservation
   - Region: Pick closest to you
4. Go to "Connection String" section
5. Select "Pooled Connection"
6. Copy full string
```

**Result**: You should have something like:
```
postgresql://neondb_owner:password123@ep-cool-morning-a5v3x.us-east-1.aws.neon.tech/neondb?sslmode=require
```

### B. Update Your `.env` File

**File**: `c:\Users\kente\Programs\Equipment Reservation\backend\.env`

**Add/Update**:
```bash
DATABASE_URL=postgresql://neondb_owner:password123@ep-cool-morning-a5v3x.us-east-1.aws.neon.tech/neondb?sslmode=require
```

**Also generate secrets**:
```bash
python db_setup.py secrets
```

Add the generated keys to `.env`:
```bash
SECRET_KEY=<copy from output>
JWT_SECRET_KEY=<copy from output>
```

### C. Test Locally

**Run**:
```bash
# Activate environment
env_new\Scripts\activate

# Check dependencies
python db_setup.py check

# Test database connection
python db_setup.py test

# Initialize tables
python db_setup.py init

# Run the app
python app.py
```

**Should see**:
```
✓ Database connection successful!
✓ Database tables created successfully!
Running on http://localhost:5000
```

### D. Push to GitHub

```bash
git add .
git commit -m "Setup PostgreSQL with Neon and Render deployment"
git push origin backend
```

### E. Deploy to Render

**Visit**: https://render.com

**Steps**:
1. Click **New +** → **Web Service**
2. Select repository: `ICT-Reservation-Equipment`
3. Fill in:
   - **Name**: `equipment-reservation-api`
   - **Region**: Closest to your users
   - **Branch**: `backend`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**:
     ```
     gunicorn -w 4 -b 0.0.0.0:$PORT --timeout 120 app:app
     ```

4. Select **Free** plan (for testing)

5. Click **Create Web Service**

6. **While building**, add Environment Variables:
   - Go to **Environment** tab
   - Add these variables:
     ```
     FLASK_APP=app.py
     FLASK_ENV=production
     SECRET_KEY=<from db_setup.py secrets>
     JWT_SECRET_KEY=<from db_setup.py secrets>
     DATABASE_URL=<your Neon connection string>
     MAIL_SERVER=smtp.gmail.com
     MAIL_PORT=587
     MAIL_USE_TLS=True
     MAIL_USERNAME=<your-email@gmail.com>
     MAIL_PASSWORD=<app-password>
     MAIL_DEFAULT_SENDER=<your-email@gmail.com>
     AUTO_CANCEL_DAYS=3
     ADMIN_EMAIL=admin@example.com
     ADMIN_NAME=System Administrator
     ```

7. **Deployment starts automatically**

8. **Wait 2-5 minutes**

9. **Once deployed**, you'll see:
   ```
   https://equipment-reservation-api.onrender.com
   ```

### F. Initialize Database on Render

**Option 1 - Via Shell**:
1. In Render dashboard → Your service
2. Click **Shell**
3. Run:
   ```bash
   python -c "from app import create_app, db; app = create_app(); app.app_context().push(); db.create_all(); print('✓ Done!')"
   ```

**Option 2 - Auto-Init** (add to `app.py`):
```python
# After creating app and configuring extensions
with app.app_context():
    db.create_all()
```

### G. Test Deployed API

**Visit**:
```
https://equipment-reservation-api.onrender.com/
```

Should see your API or homepage load.

---

## ✅ Verification Checklist

- [ ] Neon database created
- [ ] Connection string copied to `.env`
- [ ] `python db_setup.py test` passes
- [ ] `python db_setup.py init` succeeds
- [ ] Local `python app.py` works
- [ ] Changes pushed to GitHub
- [ ] Render Web Service created
- [ ] Environment variables added
- [ ] Deployment completed (monitor logs)
- [ ] Database initialized on Render
- [ ] API responds at Render URL

---

## 🔧 Troubleshooting

| Problem | Solution |
|---------|----------|
| `could not connect to server` | Check DATABASE_URL, ensure `?sslmode=require` |
| `relation "user" does not exist` | Run initialization: `python db_setup.py init` |
| Build fails on Render | Check requirements.txt, verify psycopg2-binary present |
| Service crashes repeatedly | Check logs: Render → Logs tab |
| Email not sending | Use Gmail App Password, not regular password |
| Service sleeps after inactivity | Upgrade to Starter tier ($7/month) |

---

## 📚 Full Documentation

For more details, see:
- `POSTGRESQL_NEON_RENDER_SETUP.md` - Complete guide
- `DEPLOYMENT_CHECKLIST.md` - Step-by-step checklist
- `db_setup.py` - Automated helper script

---

## 🎯 Key Points

1. **Neon** = Managed PostgreSQL database
2. **Render** = Your hosting platform
3. **PostgreSQL** = Your database engine
4. Connection string format: `postgresql://user:pass@host/db?sslmode=require`
5. Always use `?sslmode=require` with Neon

---

## 💾 Costs

- **Neon**: Free tier available (5GB storage)
- **Render**: Free tier (15-min sleep), Starter ($7/mo for always-on)
- **Total**: ~$7/month for production (optional, free for testing)

---

## 🆘 Need Help?

1. Check logs:
   - Local: Terminal output
   - Render: Dashboard → Logs
   - Neon: https://console.neon.tech

2. Verify connection: `python db_setup.py test`

3. Review full guide: `POSTGRESQL_NEON_RENDER_SETUP.md`

---

**Estimated time: 15-20 minutes total**

Good luck! 🚀
