from app import create_app, db
from models import Equipment

app = create_app('development')

with app.app_context():
    print('Checking equipment with QR codes...')
    equipments = Equipment.query.filter(Equipment.qr_code.isnot(None)).all()
    print(f'Found {len(equipments)} equipment(s) with QR codes')
    for eq in equipments[:5]:
        print(f'ID: {eq.id}, Name: {eq.name}, QR: {eq.qr_code}')
