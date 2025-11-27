# Equipment Reservation System - Backend

A Flask-based REST API backend for managing equipment reservations, user authentication, and administrative functions.

## Features

- **User Authentication** - JWT-based authentication with two-factor authentication support
- **User Management** - Student and admin role management
- **Equipment Management** - CRUD operations for equipment inventory
- **Reservation System** - Equipment booking and approval workflow
- **Email Notifications** - Automated email alerts for reservations and approvals
- **QR Code Integration** - QR code generation and scanning for equipment tracking
- **Admin Dashboard** - Web-based administration interface
- **Reporting** - Usage reports and analytics
- **Image Upload** - Profile pictures and equipment images

## Tech Stack

- **Framework:** Flask 3.0+
- **Database:** SQLite (development) / PostgreSQL (production)
- **Authentication:** Flask-JWT-Extended
- **ORM:** SQLAlchemy
- **Real-time:** Flask-SocketIO
- **Email:** Flask-Mail
- **Testing:** Pytest

## Prerequisites

- Python 3.8+
- pip
- Virtual environment (recommended)

## Installation

1. **Clone the repository:**
   ```bash
   cd backend
   ```

2. **Create and activate virtual environment:**
   ```bash
   # Windows
   python -m venv env
   env\Scripts\activate

   # Linux/Mac
   python3 -m venv env
   source env/bin/activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables:**
   ```bash
   # Copy the example environment file
   cp .env.example .env
   ```

   Edit `.env` and configure:
   - `SECRET_KEY` - Flask secret key
   - `JWT_SECRET_KEY` - JWT token secret
   - `MAIL_USERNAME` - Email address for notifications
   - `MAIL_PASSWORD` - Email password/app password
   - `DATABASE_URL` - Database connection string

5. **Initialize the database:**
   ```bash
   python
   >>> from app import create_app
   >>> from extensions import db
   >>> app = create_app()
   >>> with app.app_context():
   ...     db.create_all()
   >>> exit()
   ```

6. **Seed database (optional):**
   ```bash
   python seed_db.py
   ```

## Running the Application

### Development Server

```bash
python app.py
```

The server will start at `http://localhost:5000`

### Production Server

```bash
gunicorn --worker-class eventlet -w 1 app:app --bind 0.0.0.0:5000
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/verify-2fa` - Verify 2FA code
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Equipment
- `GET /api/equipment` - List all equipment
- `GET /api/equipment/<id>` - Get equipment details
- `POST /api/equipment` - Create equipment (Admin)
- `PUT /api/equipment/<id>` - Update equipment (Admin)
- `DELETE /api/equipment/<id>` - Delete equipment (Admin)

### Reservations
- `GET /api/reservation/my-reservations` - Get user's reservations
- `POST /api/reservation/request` - Create reservation request
- `DELETE /api/reservation/<id>` - Cancel reservation
- `POST /api/reservation/<id>/return` - Request equipment return

### Admin
- `GET /api/admin/users` - List all users
- `GET /api/admin/users/<id>` - Get user details
- `PUT /api/admin/users/<id>` - Update user
- `DELETE /api/admin/users/<id>` - Delete user
- `GET /api/admin/reservations/all` - List all reservations
- `GET /api/admin/reservations/pending` - List pending approvals
- `POST /api/admin/reservations/<id>/approve` - Approve reservation
- `POST /api/admin/reservations/<id>/reject` - Reject reservation
- `GET /api/admin/dashboard/stats` - Dashboard statistics
- `GET /api/admin/notifications` - Get admin notifications

### QR Code
- `POST /api/qrcode/scan` - Scan QR code for equipment

### Reports
- `GET /api/reports/equipment-usage` - Equipment usage report
- `GET /api/reports/user-activity` - User activity report
- `GET /api/reports/overdue` - Overdue equipment report

## Admin Dashboard

Access the web-based admin dashboard at: `http://localhost:5000/admin/login`

Default credentials (after seeding):
- **Email:** admin@equipment.com
- **Password:** admin123

## Testing

Run the test suite:

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=. --cov-report=html

# Run specific test file
pytest tests/test_admin.py
```

View coverage report:
```bash
# Windows
start htmlcov/index.html

# Linux/Mac
open htmlcov/index.html
```

## Project Structure

```
backend/
├── routes/              # API route handlers
│   ├── auth.py         # Authentication routes
│   ├── equipment.py    # Equipment routes
│   ├── reservation.py  # Reservation routes
│   ├── admin.py        # Admin routes
│   ├── qrcode.py       # QR code routes
│   ├── reports.py      # Reporting routes
│   └── settings.py     # Settings routes
├── templates/          # HTML templates
│   └── admin/         # Admin dashboard templates
├── static/            # Static files (CSS, JS, images)
├── utils/             # Utility functions
│   ├── email_service.py
│   └── two_factor.py
├── tests/             # Test suite
├── models.py          # Database models
├── extensions.py      # Flask extensions
├── app.py            # Application entry point
└── requirements.txt   # Python dependencies
```

## Database Models

- **User** - User accounts (students and admins)
- **Equipment** - Equipment inventory
- **Reservation** - Equipment reservations
- **QRCodeScan** - QR code scan history
- **Notification** - User notifications
- **SystemSettings** - System configuration
- **UsageReport** - Usage statistics

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `FLASK_ENV` | Environment mode | development |
| `SECRET_KEY` | Flask secret key | - |
| `JWT_SECRET_KEY` | JWT secret key | - |
| `DATABASE_URL` | Database connection | sqlite:///equipment_reservation.db |
| `MAIL_SERVER` | SMTP server | smtp.gmail.com |
| `MAIL_PORT` | SMTP port | 587 |
| `MAIL_USERNAME` | Email username | - |
| `MAIL_PASSWORD` | Email password | - |
| `HOST` | Server host | 0.0.0.0 |
| `PORT` | Server port | 5000 |

## Deployment

### Render.com

1. Push code to GitHub/GitLab
2. Create new Web Service on Render
3. Configure:
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `gunicorn --worker-class eventlet -w 1 app:app`
4. Add environment variables
5. Deploy

### Docker (Optional)

```dockerfile
FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["gunicorn", "--worker-class", "eventlet", "-w", "1", "app:app", "--bind", "0.0.0.0:5000"]
```

## Security

- JWT-based authentication
- Password hashing (Werkzeug)
- Two-factor authentication support
- CORS configuration
- Input validation
- SQL injection protection (SQLAlchemy ORM)
- Secure file uploads

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write/update tests
5. Submit a pull request

## License

Apache-2.0 License - see LICENSE file for details

## Support

For issues and questions:
- Open an issue on GitHub
- Check documentation in `/doc` folder

## Authors

Equipment Reservation System Development Team
