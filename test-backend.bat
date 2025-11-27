@echo off
REM Quick Backend Health Check Script

echo ============================================
echo    Equipment Reservation Backend Test
echo ============================================
echo.

echo [1/3] Checking if Flask is running on port 5000...
netstat -ano | findstr :5000 >nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ Port 5000 is active
) else (
    echo ✗ Port 5000 is NOT active
    echo.
    echo Starting Flask backend...
    cd "%~dp0backend"
    start cmd /k "python app.py"
    timeout /t 5 /nobreak >nul
)

echo.
echo [2/3] Testing health endpoint...
powershell -Command "try { $response = Invoke-WebRequest -Uri http://localhost:5000/api/health; Write-Host '✓ Health check passed:' $response.Content } catch { Write-Host '✗ Health check failed:' $_.Exception.Message }"

echo.
echo [3/3] Testing login endpoint (with invalid credentials)...
powershell -Command "try { Invoke-WebRequest -Uri http://localhost:5000/api/auth/login -Method POST -ContentType 'application/json' -Body '{\"username\":\"test\",\"password\":\"wrong\"}' } catch { if ($_.Exception.Response.StatusCode -eq 401) { Write-Host '✓ Backend correctly rejected invalid credentials' } else { Write-Host '✗ Unexpected error:' $_.Exception.Message } }"

echo.
echo ============================================
echo             Test Complete!
echo ============================================
echo.
echo Backend Status:
echo - If all checks passed, backend is working correctly
echo - Login should now require valid database credentials
echo - Use 'Test Backend Connection' button in the app
echo.
echo To create a test user, run:
echo   cd backend
echo   python
echo   ^> from app import create_app
echo   ^> from extensions import db
echo   ^> from models import User, UserRole
echo   ^> app = create_app()
echo   ^> with app.app_context():
echo   ^>     user = User(username='testuser', email='test@example.com',
echo   ^>                 first_name='Test', last_name='User', role=UserRole.USER)
echo   ^>     user.set_password('testpass123')
echo   ^>     db.session.add(user)
echo   ^>     db.session.commit()
echo.
pause
