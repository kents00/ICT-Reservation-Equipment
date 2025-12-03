"""
Equipment Reservation System - Flask Backend
Main application entry point
"""
from flask import Flask, render_template, send_from_directory, request
from flask_cors import CORS
from datetime import timedelta
import os
from dotenv import load_dotenv
from extensions import db, jwt, socketio

# Load environment variables
load_dotenv()


def create_app(config_name='development'):
    """Create and configure Flask application"""
    app = Flask(__name__)

    # Get database URL and handle postgres:// to postgresql:// conversion
    database_url = os.getenv(
        'DATABASE_URL', 'sqlite:///equipment_reservation.db')
    if database_url.startswith('postgres://'):
        database_url = database_url.replace('postgres://', 'postgresql://', 1)

    # Configuration
    if config_name == 'development':
        app.config['SQLALCHEMY_DATABASE_URI'] = database_url
        app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

        # Database-specific engine options
        if database_url.startswith('sqlite'):
            # SQLite configuration for WSL compatibility
            app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
                'connect_args': {
                    'timeout': 30,
                    'check_same_thread': False
                }
            }
        else:
            # PostgreSQL/other databases configuration
            app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
                'pool_pre_ping': True,
                'pool_recycle': 300,
            }
        app.config['JWT_SECRET_KEY'] = os.getenv(
            'JWT_SECRET_KEY', 'dev-secret-key')
        app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=30)

        # File upload configuration
        app.config['UPLOAD_FOLDER'] = os.path.join(
            app.root_path, 'static', 'uploads', 'equipment')
        app.config['MAX_CONTENT_LENGTH'] = 5 * 1024 * 1024  # 5MB max file size
        app.config['ALLOWED_EXTENSIONS'] = {
            'png', 'jpg', 'jpeg', 'gif', 'webp'}

        # Email configuration
        app.config['MAIL_SERVER'] = os.getenv('MAIL_SERVER', 'smtp.gmail.com')
        app.config['MAIL_PORT'] = int(os.getenv('MAIL_PORT', 587))
        app.config['MAIL_USE_TLS'] = os.getenv(
            'MAIL_USE_TLS', 'true').lower() == 'true'
        app.config['MAIL_USERNAME'] = os.getenv('MAIL_USERNAME')
        app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASSWORD')
        app.config['MAIL_DEFAULT_SENDER'] = os.getenv(
            'MAIL_DEFAULT_SENDER', 'noreply@equipment-reservation.com')

    elif config_name == 'testing':
        app.config['TESTING'] = True
        app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
        app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
        app.config['JWT_SECRET_KEY'] = 'test-secret-key'
        app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=1)
        app.config['MAIL_SUPPRESS_SEND'] = True

    elif config_name == 'production':
        app.config['SQLALCHEMY_DATABASE_URI'] = database_url
        app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

        # Database-specific engine options for production
        if database_url.startswith('sqlite'):
            app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
                'connect_args': {
                    'timeout': 30,
                    'check_same_thread': False
                }
            }
        else:
            # PostgreSQL/other databases configuration
            app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
                'pool_pre_ping': True,
                'pool_recycle': 300,
                'pool_size': 10,
                'max_overflow': 20
            }

        app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY')
        app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=7)

        # File upload configuration for production
        app.config['UPLOAD_FOLDER'] = os.path.join(
            app.root_path, 'static', 'uploads', 'equipment')
        app.config['MAX_CONTENT_LENGTH'] = 5 * 1024 * 1024  # 5MB max file size
        app.config['ALLOWED_EXTENSIONS'] = {
            'png', 'jpg', 'jpeg', 'gif', 'webp'}

        # Email configuration for production
        app.config['MAIL_SERVER'] = os.getenv('MAIL_SERVER')
        app.config['MAIL_PORT'] = int(os.getenv('MAIL_PORT', 587))
        app.config['MAIL_USE_TLS'] = os.getenv(
            'MAIL_USE_TLS', 'true').lower() == 'true'
        app.config['MAIL_USERNAME'] = os.getenv('MAIL_USERNAME')
        app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASSWORD')
        app.config['MAIL_DEFAULT_SENDER'] = os.getenv('MAIL_DEFAULT_SENDER')

    # Enable CORS with proper configuration for web clients
    CORS(app, resources={
        r"/api/*": {
            "origins": ["http://localhost:8081", "http://localhost:19006", "http://localhost:19000", "*"],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"],
            "expose_headers": ["Content-Type", "Authorization"],
            "supports_credentials": True,
            "max_age": 3600
        }
    })

    # Initialize extensions
    db.init_app(app)
    jwt.init_app(app)
    socketio.init_app(app, cors_allowed_origins="*")

    # Configure SQLite for better WSL compatibility (only for SQLite databases)
    if config_name == 'development' and database_url.startswith('sqlite'):
        @app.before_request
        def configure_sqlite():
            """Configure SQLite for WSL compatibility"""
            from sqlalchemy import event
            from sqlalchemy.engine import Engine

            @event.listens_for(Engine, "connect", once=True)
            def set_sqlite_pragma(dbapi_conn, connection_record):
                cursor = dbapi_conn.cursor()
                cursor.execute("PRAGMA journal_mode=WAL")
                cursor.execute("PRAGMA synchronous=NORMAL")
                cursor.execute("PRAGMA busy_timeout=30000")
                cursor.close()

    # Initialize Flask-Mail
    from utils.email_service import mail
    mail.init_app(app)

    # Register blueprints
    from routes.auth import auth_bp
    from routes.equipment import equipment_bp
    from routes.reservation import reservation_bp
    from routes.admin import admin_bp
    from routes.qrcode import qrcode_bp
    from routes.reports import reports_bp
    from routes.settings import settings_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(equipment_bp, url_prefix='/api/equipment')
    app.register_blueprint(reservation_bp, url_prefix='/api/reservation')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    app.register_blueprint(qrcode_bp, url_prefix='/api/qrcode')
    app.register_blueprint(reports_bp, url_prefix='/api/reports')
    app.register_blueprint(settings_bp, url_prefix='/api/admin/settings')

    # Health check endpoint for API connectivity testing
    @app.route('/api/health', methods=['GET'])
    def health_check():
        """Health check endpoint to verify API is running"""
        return {'status': 'ok', 'message': 'API is running'}, 200

    # Default route - redirect to admin login
    @app.route('/')
    def index():
        """Redirect to admin login by default"""
        from flask import redirect
        return redirect('/admin/login')

    # Admin dashboard routes using templates
    @app.route('/admin/login')
    def admin_login():
        """Serve admin login page"""
        return render_template('admin/login.html')

    @app.route('/admin/forgot-password')
    def admin_forgot_password():
        """Serve forgot password page"""
        return render_template('admin/forgot-password.html')

    @app.route('/admin/reset-password')
    def admin_reset_password():
        """Serve reset password page"""
        return render_template('admin/reset-password.html')

    @app.route('/admin/')
    @app.route('/admin/dashboard')
    def admin_dashboard():
        """Serve admin dashboard page"""
        from models import Equipment, EquipmentStatus, Reservation, ReservationStatus, User, UserRole

        # Get real-time stats from database
        try:
            total_equipment = Equipment.query.count()
            available_equipment = Equipment.query.filter_by(
                status=EquipmentStatus.AVAILABLE).count()
            reserved_equipment = Equipment.query.filter_by(
                status=EquipmentStatus.RESERVED).count()
            maintenance_equipment = Equipment.query.filter_by(
                status=EquipmentStatus.MAINTENANCE).count()

            # Get recent reservations for activity feed
            recent_reservations = Reservation.query.order_by(
                Reservation.created_at.desc()
            ).limit(5).all()

            recent_activities = []
            for res in recent_reservations:
                activity_type = 'new'
                title = 'New Reservation'
                description = f'{res.equipment.name} reserved by {res.user.username}'

                if res.status == ReservationStatus.APPROVED:
                    activity_type = 'approval'
                    title = 'Reservation Approved'
                    description = f'{res.equipment.name} - approved for {res.user.username}'
                elif res.status == ReservationStatus.RETURNED:
                    activity_type = 'returned'
                    title = 'Equipment Returned'
                    description = f'{res.equipment.name} returned by {res.user.username}'

                recent_activities.append({
                    'type': activity_type,
                    'title': title,
                    'description': description,
                    'time': res.created_at.strftime('%B %d, %Y at %I:%M %p')
                })

        except Exception as e:
            print(f"Error fetching dashboard data: {e}")
            total_equipment = 0
            available_equipment = 0
            reserved_equipment = 0
            maintenance_equipment = 0
            recent_activities = []

        return render_template(
            'admin/dashboard.html',
            active_section='dashboard',
            total_equipment=total_equipment,
            available_equipment=available_equipment,
            reserved_equipment=reserved_equipment,
            maintenance_equipment=maintenance_equipment,
            recent_activities=recent_activities
        )

    @app.route('/admin/equipment')
    def admin_equipment():
        """Serve equipment management page"""
        return render_template('admin/equipment.html', active_section='equipment')

    @app.route('/admin/equipment/add')
    def admin_add_equipment():
        """Serve add equipment page"""
        return render_template('admin/add-equipment.html', active_section='equipment')

    @app.route('/admin/equipment/<equipment_id>/edit')
    def admin_edit_equipment(equipment_id):
        """Serve edit equipment page"""
        return render_template('admin/edit-equipment.html', equipment_id=equipment_id, active_section='equipment')

    @app.route('/admin/edit-equipment.html')
    def admin_edit_equipment_alt():
        """Serve edit equipment page (alternative URL with query param)"""
        equipment_id = request.args.get('equipment_id')
        return render_template('admin/edit-equipment.html', equipment_id=equipment_id, active_section='equipment')

    @app.route('/admin/users')
    def admin_users():
        """Serve users management page"""
        return render_template('admin/users.html', active_section='users')

    @app.route('/admin/users/add')
    def admin_add_student():
        """Serve add student page"""
        return render_template('admin/add-student.html', active_section='users')

    @app.route('/admin/users/<user_id>/edit')
    def admin_edit_user(user_id):
        """Serve edit user page"""
        return render_template('admin/edit-user.html', user_id=user_id, active_section='users')

    @app.route('/admin/edit-user.html')
    def admin_edit_user_alt():
        """Serve edit user page (alternative URL with query param)"""
        user_id = request.args.get('user_id')
        return render_template('admin/edit-user.html', user_id=user_id, active_section='users')

    @app.route('/admin/view-user.html')
    def admin_view_user_alt():
        """Serve view user page (with query param)"""
        user_id = request.args.get('user_id')
        return render_template('admin/view-user.html', user_id=user_id, active_section='users')

    @app.route('/admin/profile')
    def edit_admin_profile():
        """Serve admin profile edit page"""
        return render_template('admin/edit-admin.html', active_section='settings')

    @app.route('/admin/reservations')
    def admin_reservations():
        """Serve reservations management page"""
        return render_template('admin/reservations.html', active_section='reservations')

    @app.route('/admin/approvals')
    def admin_approvals():
        """Serve approvals page"""
        return render_template('admin/approvals.html', active_section='approvals')

    @app.route('/admin/reports')
    def admin_reports():
        """Serve reports page"""
        return render_template('admin/reports.html', active_section='reports')

    @app.route('/admin/settings')
    def admin_settings():
        """Serve settings page"""
        from models import SystemSettings, User, UserRole

        # Get settings from database or use defaults
        settings = SystemSettings.query.first()
        if not settings:
            # Return template with default values if no settings exist yet
            settings = SystemSettings(
                system_name='Equipment Reservation System',
                description='',
                max_reservation_duration=30,
                max_advance_booking=90,
                require_approval=True,
                email_notifications=False,
                sms_notifications=False,
                session_timeout=30,
                two_factor_auth=False
            )

        # Get first admin user for display
        admin = User.query.filter_by(role=UserRole.ADMIN).first()

        return render_template('admin/settings.html', active_section='settings', settings=settings, admin=admin)

    @app.route('/admin/qr-scanner')
    def admin_qr_scanner():
        """Serve QR scanner page"""
        return render_template('admin/qr-scanner.html', active_section='equipment')

    # Static file routes for admin dashboard assets
    @app.route('/admin/static/<path:filename>')
    def admin_static(filename):
        """Serve admin dashboard static files"""
        return send_from_directory('admin_dashboard', filename)

    # --- View Equipment Page Route ---
    @app.route('/admin/view-equipment.html')
    def admin_view_equipment():
        """Serve view equipment page (with query param)"""
        equipment_id = request.args.get('id')
        return render_template('admin/view-equipment.html', equipment_id=equipment_id, active_section='equipment')

    @app.route('/admin/equipment/<equipment_id>/view')
    def admin_view_equipment_direct(equipment_id):
        """Serve view equipment page (direct URL)"""
        return render_template('admin/view-equipment.html', equipment_id=equipment_id, active_section='equipment')

    @app.route('/admin/notifications')
    def admin_notifications():
        """Serve admin notifications page"""
        return render_template('admin/notifications.html')

    # Create tables
    with app.app_context():
        db.create_all()

    return app


# Create app instance for gunicorn and direct execution
# Use production config on Render, development locally
config_mode = os.getenv('FLASK_ENV', 'development')
if config_mode == 'production' or os.getenv('RENDER'):
    app = create_app('production')
else:
    app = create_app('development')

if __name__ == '__main__':
    socketio.run(app, debug=True, host='0.0.0.0', port=5000)
