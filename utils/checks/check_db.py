from app import create_app, db
from models import Equipment, EquipmentStatus, Reservation, ReservationStatus

app = create_app()
app.app_context().push()

print('Equipment with RESERVED status:', Equipment.query.filter_by(
    status=EquipmentStatus.RESERVED).count())
print('Approved reservations:', Reservation.query.filter_by(
    status=ReservationStatus.APPROVED).count())
print('\nAll equipment:')
for e in Equipment.query.all():
    print(f'  {e.name}: {e.status}')

print('\nAll reservations:')
for r in Reservation.query.all():
    equipment_name = r.equipment.name if r.equipment else 'None'
    user_name = f"{r.user.first_name} {r.user.last_name}" if r.user else 'None'
    print(
        f'  Status: {r.status}, Equipment: {equipment_name}, User: {user_name}')
