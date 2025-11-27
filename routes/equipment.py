"""
Equipment Management Routes (Admin & Student)
"""
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from models import Equipment, User, UserRole, EquipmentStatus, Reservation
from datetime import datetime
from werkzeug.utils import secure_filename
import qrcode
import io
import base64
import uuid
import os

equipment_bp = Blueprint('equipment', __name__)


def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower(
           ) in current_app.config['ALLOWED_EXTENSIONS']


def save_equipment_image(file):
    """Save uploaded equipment image and return the URL path"""
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        # Add timestamp to make filename unique
        timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
        unique_filename = f"{timestamp}_{filename}"

        # Ensure upload directory exists
        upload_folder = current_app.config['UPLOAD_FOLDER']
        os.makedirs(upload_folder, exist_ok=True)

        # Save file
        filepath = os.path.join(upload_folder, unique_filename)
        file.save(filepath)

        # Return relative URL path
        return f"/static/uploads/equipment/{unique_filename}"
    return None


def delete_equipment_image(image_url):
    """Delete equipment image file from filesystem"""
    if image_url and image_url.startswith('/static/uploads/equipment/'):
        try:
            filename = image_url.split('/')[-1]
            filepath = os.path.join(
                current_app.config['UPLOAD_FOLDER'], filename)
            if os.path.exists(filepath):
                os.remove(filepath)
        except Exception as e:
            print(f"Error deleting image: {e}")


def generate_qr_code(data):
    """Generate QR code and return as base64"""
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(data)
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white")
    buf = io.BytesIO()
    img.save(buf, format='PNG')
    buf.seek(0)
    return base64.b64encode(buf.getvalue()).decode()


@equipment_bp.route('', methods=['POST'])
@jwt_required()
def create_equipment():
    """Create new equipment (Admin only)"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if not user or user.role != UserRole.ADMIN:
        return jsonify({'error': 'Admin access required'}), 403

    # Check if request has multipart/form-data (for file upload)
    if request.content_type and 'multipart/form-data' in request.content_type:
        data = request.form.to_dict()
        image_file = request.files.get('image')
    else:
        data = request.get_json()
        image_file = None

    print('\n=== CREATE EQUIPMENT DEBUG ===')
    print('Received data:', data)
    print('Has image file:', image_file is not None)
    print('QR code from request (qrcode):', data.get('qrcode'))
    print('QR code from request (qr_code):', data.get('qr_code'))

    # Validation
    required_fields = ['name', 'category', 'quantity']
    if not all(field in data for field in required_fields):
        return jsonify({'error': f'Missing required fields: {required_fields}'}), 400

    try:
        # Handle image upload
        image_url = None
        if image_file:
            image_url = save_equipment_image(image_file)
            print('Image saved at:', image_url)

        # Use provided QR code or generate unique QR code
        qr_code_id = data.get('qrcode') or data.get(
            'qr_code') or str(uuid.uuid4())
        print('Final QR code value to be saved:', qr_code_id)
        print('=== END CREATE DEBUG ===\n')

        # Parse last_maintenance date if provided
        last_maintenance = None
        if data.get('last_maintenance'):
            try:
                last_maintenance = datetime.fromisoformat(
                    data['last_maintenance'].replace('Z', '+00:00'))
            except (ValueError, AttributeError):
                last_maintenance = None

        equipment = Equipment(
            name=data['name'],
            description=data.get('description', ''),
            category=data['category'],
            serial_number=data.get('serial_number'),
            quantity=int(data['quantity']),
            quantity_available=int(data['quantity']),
            location=data.get('location', ''),
            qr_code=qr_code_id,
            image_url=image_url,
            created_by=user_id,
            status=EquipmentStatus.AVAILABLE,
            last_maintenance=last_maintenance,
            maintenance_interval_days=int(
                data.get('maintenance_interval_days', 90))
        )

        db.session.add(equipment)
        db.session.commit()

        return jsonify({
            'message': 'Equipment created successfully',
            'equipment': equipment.to_dict(include_creator=True),
            'qr_code_image': generate_qr_code(qr_code_id)
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@equipment_bp.route('', methods=['GET'])
def get_all_equipment():
    """Get all available equipment (with real-time status)"""
    category = request.args.get('category')
    status = request.args.get('status')
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)

    query = Equipment.query

    if category:
        query = query.filter_by(category=category)
    if status:
        query = query.filter_by(status=status)

    # Pagination
    paginated = query.paginate(page=page, per_page=per_page, error_out=False)

    equipment_list = [item.to_dict() for item in paginated.items]

    return jsonify({
        'equipment': equipment_list,
        'total': paginated.total,
        'pages': paginated.pages,
        'current_page': page
    }), 200


@equipment_bp.route('/<equipment_id>', methods=['GET'])
def get_equipment(equipment_id):
    """Get specific equipment details"""
    equipment = Equipment.query.get(equipment_id)

    if not equipment:
        return jsonify({'error': 'Equipment not found'}), 404

    # Get active reservations count
    active_reservations = Reservation.query.filter(
        Reservation.equipment_id == equipment_id,
        Reservation.status.in_(['approved', 'checked_out'])
    ).count()

    equipment_data = equipment.to_dict(include_creator=True)
    equipment_data['active_reservations'] = active_reservations

    return jsonify(equipment_data), 200


@equipment_bp.route('/qr/<qr_code>', methods=['GET'])
def get_equipment_by_qr(qr_code):
    """Get equipment by QR code (for QR scanner)"""
    equipment = Equipment.query.filter_by(qr_code=qr_code).first()

    if not equipment:
        return jsonify({'error': 'Equipment not found with this QR code'}), 404

    # Get active reservations count
    active_reservations = Reservation.query.filter(
        Reservation.equipment_id == equipment.id,
        Reservation.status.in_(['approved', 'checked_out'])
    ).count()

    equipment_data = equipment.to_dict(include_creator=True)
    equipment_data['active_reservations'] = active_reservations

    return jsonify(equipment_data), 200


@equipment_bp.route('/<equipment_id>', methods=['PUT'])
@jwt_required()
def update_equipment(equipment_id):
    """Update equipment (Admin only)"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if not user or user.role != UserRole.ADMIN:
        return jsonify({'error': 'Admin access required'}), 403

    equipment = Equipment.query.get(equipment_id)

    if not equipment:
        return jsonify({'error': 'Equipment not found'}), 404

    # Check if request has multipart/form-data (for file upload)
    if request.content_type and 'multipart/form-data' in request.content_type:
        data = request.form.to_dict()
        image_file = request.files.get('image')
    else:
        data = request.get_json()
        image_file = None

    print('\n=== UPDATE EQUIPMENT DEBUG ===')
    print('Equipment ID:', equipment_id)
    print('Received data:', data)
    print('Has image file:', image_file is not None)
    print('QR code from request (qrcode):', data.get('qrcode'))
    print('QR code from request (qr_code):', data.get('qr_code'))

    try:
        # Handle image upload
        if image_file:
            # Delete old image if exists
            if equipment.image_url:
                delete_equipment_image(equipment.image_url)
            # Save new image
            equipment.image_url = save_equipment_image(image_file)
            print('New image saved at:', equipment.image_url)
        elif 'remove_image' in data and data['remove_image'] == 'true':
            # Remove image if requested
            if equipment.image_url:
                delete_equipment_image(equipment.image_url)
                equipment.image_url = None
                print('Image removed')

        if 'name' in data:
            equipment.name = data['name']
        if 'description' in data:
            equipment.description = data['description']
        if 'category' in data:
            equipment.category = data['category']
        if 'serial_number' in data:
            equipment.serial_number = data['serial_number']
        if 'quantity' in data:
            equipment.quantity = int(data['quantity'])
        if 'location' in data:
            equipment.location = data['location']
        if 'status' in data:
            equipment.status = data['status']
        if 'maintenance_interval_days' in data:
            equipment.maintenance_interval_days = int(
                data['maintenance_interval_days'])
        if 'last_maintenance' in data:
            if data['last_maintenance']:
                try:
                    equipment.last_maintenance = datetime.fromisoformat(
                        data['last_maintenance'].replace('Z', '+00:00'))
                except (ValueError, AttributeError):
                    equipment.last_maintenance = None
            else:
                equipment.last_maintenance = None
        if 'qrcode' in data or 'qr_code' in data:
            qr_code_value = data.get('qrcode') or data.get('qr_code')
            print('Updating QR code to:', qr_code_value)
            equipment.qr_code = qr_code_value
        if 'quantity_available' in data:
            equipment.quantity_available = int(data['quantity_available'])

        equipment.updated_at = datetime.utcnow()
        db.session.commit()
        print('Equipment updated successfully')
        print('Final QR code value in DB:', equipment.qr_code)
        print('=== END UPDATE DEBUG ===\n')

        return jsonify({
            'message': 'Equipment updated successfully',
            'equipment': equipment.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@equipment_bp.route('/<equipment_id>', methods=['DELETE'])
@jwt_required()
def delete_equipment(equipment_id):
    """Delete equipment (Admin only)"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if not user or user.role != UserRole.ADMIN:
        return jsonify({'error': 'Admin access required'}), 403

    equipment = Equipment.query.get(equipment_id)

    if not equipment:
        return jsonify({'error': 'Equipment not found'}), 404

    try:
        # Delete associated image if exists
        if equipment.image_url:
            delete_equipment_image(equipment.image_url)

        db.session.delete(equipment)
        db.session.commit()

        return jsonify({'message': 'Equipment deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@equipment_bp.route('/<equipment_id>/qr-code', methods=['GET'])
def get_qr_code(equipment_id):
    """Get QR code for equipment"""
    equipment = Equipment.query.get(equipment_id)

    if not equipment:
        return jsonify({'error': 'Equipment not found'}), 404

    return jsonify({
        'equipment_id': equipment_id,
        'qr_code': equipment.qr_code,
        'qr_code_image': generate_qr_code(equipment.qr_code)
    }), 200


@equipment_bp.route('/search', methods=['GET'])
def search_equipment():
    """Search equipment by name or category"""
    query = request.args.get('q', '')

    if not query or len(query) < 2:
        return jsonify({'error': 'Search query too short (min 2 characters)'}), 400

    results = Equipment.query.filter(
        (Equipment.name.ilike(f'%{query}%')) |
        (Equipment.category.ilike(f'%{query}%')) |
        (Equipment.description.ilike(f'%{query}%'))
    ).all()

    return jsonify({
        'query': query,
        'results': [item.to_dict() for item in results],
        'count': len(results)
    }), 200


@equipment_bp.route('/<equipment_id>/maintenance', methods=['POST'])
@jwt_required()
def set_maintenance(equipment_id):
    """Mark equipment for maintenance (Admin only)"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if not user or user.role != UserRole.ADMIN:
        return jsonify({'error': 'Admin access required'}), 403

    equipment = Equipment.query.get(equipment_id)

    if not equipment:
        return jsonify({'error': 'Equipment not found'}), 404

    try:
        equipment.status = EquipmentStatus.MAINTENANCE
        equipment.last_maintenance = datetime.utcnow()
        equipment.updated_at = datetime.utcnow()
        db.session.commit()

        return jsonify({
            'message': 'Equipment marked for maintenance',
            'equipment': equipment.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
