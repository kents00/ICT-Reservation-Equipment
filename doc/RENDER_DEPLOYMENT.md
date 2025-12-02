# Render.com Deployment Configuration Guide

## Quick Setup for Render

### Option 1: Manual Setup via Render Dashboard (Recommended)

1. **Go to Render Dashboard**: https://dashboard.render.com

2. **Create New Web Service**:
   - Click **New +** → **Web Service**
   - Select repository: `ICT-Reservation-Equipment`
   - Select branch: `backend`

3. **Configure Service**:
   - **Name**: `equipment-reservation-api`
   - **Environment**: `Python 3`
   - **Region**: `US East (Ohio)` or closest to you
   - **Plan**: `Free` (for testing) or `Starter` ($7/month for production)

4. **Build & Start Commands**:
   ```
   Build Command:  pip install --no-cache-dir --prefer-binary -r requirements-prod.txt
   Start Command:  gunicorn -w 4 -b 0.0.0.0:$PORT --timeout 120 app:app
   ```

5. **Add Environment Variables** (click **Advanced** → **Add Environment Variables**):
   ```
   FLASK_APP=app.py
   FLASK_ENV=production
   PYTHON_VERSION=3.11
   PIP_NO_CACHE_DIR=1
   PIP_DEFAULT_TIMEOUT=1000
   DATABASE_URL=postgresql://user:password@host.neon.tech/dbname?sslmode=require
   SECRET_KEY=<your-secret-key>
   JWT_SECRET_KEY=<your-jwt-secret-key>
   MAIL_SERVER=smtp.gmail.com
   MAIL_PORT=587
   MAIL_USE_TLS=True
   MAIL_USERNAME=<your-email@gmail.com>
   MAIL_PASSWORD=<gmail-app-password>
   MAIL_DEFAULT_SENDER=<your-email@gmail.com>
   AUTO_CANCEL_DAYS=3
   ADMIN_EMAIL=admin@example.com
   ADMIN_NAME=System Administrator
   ```

6. **Deploy**:
   - Click **Create Web Service**
   - Wait for build to complete (2-5 minutes)
   - Service URL: `https://equipment-reservation-api.onrender.com`

### Option 2: Using render.yaml

You can use the included `render.yaml` file for Infrastructure as Code:

```bash
# Render reads render.yaml for configuration
# The file is already created with proper settings
# Just push and deploy!
git add render.yaml
git commit -m "Add Render deployment configuration"
git push origin backend
```

## Important: Use requirements-prod.txt

**Critical**: Use `requirements-prod.txt` for Render builds, not `requirements.txt`:

- ✅ **requirements-prod.txt** - Optimized for Render (no dev dependencies, binary wheels only)
- ⚠️ **requirements.txt** - For local development (includes dev tools)

### Update Build Command

In Render dashboard, set your Build Command to:

```
pip install --no-cache-dir --prefer-binary -r requirements-prod.txt
```

## Troubleshooting Build Errors

### Error: "Read-only file system" or "failed to write cache"

**Solution**: The build command above fixes this by:
- Using `--no-cache-dir` - Disables pip cache (Render filesystem is read-only)
- Using `--prefer-binary` - Forces binary wheels instead of compiling from source
- Using `requirements-prod.txt` - Ensures only packages with binary wheels

### Error: "Metadata generation failed"

**Solution**:
1. Use `requirements-prod.txt` instead of `requirements.txt`
2. Check that all pinned versions have Python 3.13 binary wheels available
3. Use `--prefer-binary` flag

### Error: "Build timed out"

**Solution**:
1. Increase PIP_DEFAULT_TIMEOUT to 1000 seconds
2. Use `--no-cache-dir` to speed up downloads
3. Consider upgrading to Starter plan (faster builds)

## File Structure

```
backend/
├── requirements.txt         ← Local development (with dev tools)
├── requirements-prod.txt    ← Production/Render (optimized)
├── render.yaml              ← Render configuration (optional)
├── Procfile                 ← Gunicorn startup
├── runtime.txt              ← Python version
└── app.py, models.py, etc.
```

## Local Testing Before Deploy

Test your production build locally:

```bash
# Create a test environment
python -m venv test_env
test_env\Scripts\activate

# Install production requirements
pip install --no-cache-dir --prefer-binary -r requirements-prod.txt

# Test the app
python app.py

# Test with gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 --timeout 120 app:app
```

## Deploy Steps

1. **Commit changes**:
   ```bash
   git add requirements-prod.txt render.yaml
   git commit -m "Configure Render deployment"
   git push origin backend
   ```

2. **On Render Dashboard**:
   - Go to your service
   - Click **Manual Deploy**
   - Select branch: `backend`
   - Click **Deploy**

3. **Monitor the build**:
   - Watch the **Logs** tab
   - Build should complete in 2-5 minutes
   - API will be available at deployed URL

## Verify Deployment

Once deployed, test your API:

```bash
# Test basic endpoint
curl https://equipment-reservation-api.onrender.com/

# Test health check (if implemented)
curl https://equipment-reservation-api.onrender.com/health

# Check logs on Render
# https://dashboard.render.com → Your Service → Logs
```

## After First Deploy

1. **Initialize Database** (if not auto-initialized):
   ```bash
   # In Render dashboard → Your Service → Shell:
   python -c "from app import create_app, db; app = create_app(); app.app_context().push(); db.create_all(); print('✓ Database initialized!')"
   ```

2. **Test Features**:
   - Create a user
   - Create equipment
   - Make a reservation
   - Test email notifications

3. **Monitor Performance**:
   - Check Render dashboard metrics
   - Monitor database connections in Neon console
   - Review logs regularly

## Performance Tuning

### Worker Processes
Current: `4 workers`
- Free tier: Use 1-2 workers
- Starter tier: Can use 4+ workers

### Timeout
Current: `120 seconds`
- Increase if long-running requests exist
- Decrease if you want faster error detection

### Startup Command (if needed)
```bash
gunicorn -w 2 -b 0.0.0.0:$PORT --timeout 60 --workers-class=sync --threads 2 app:app
```

## Upgrading from Free to Starter

When you need always-on production:

1. Render dashboard → Your Service → Settings
2. Click **Change Plan**
3. Select **Starter** ($7/month)
4. Benefits:
   - Always running (no 15-min sleep)
   - Dedicated resources
   - Better performance

## Support

- **Render Docs**: https://render.com/docs
- **Neon Docs**: https://neon.tech/docs
- **Flask Docs**: https://flask.palletsprojects.com
- **PostgreSQL**: https://www.postgresql.org/docs

---

**Last Updated**: December 2, 2025
