from app import create_app, db
from models import Equipment, EquipmentStatus, Reservation, ReservationStatus

app = create_app()
app.app_context().push()

# Find all approved reservations
approved_reservations = Reservation.query.filter_by(
    status=ReservationStatus.APPROVED).all()

print(f"Found {len(approved_reservations)} approved reservations")

for reservation in approved_reservations:
    equipment = reservation.equipment
    print(f"\nFixing: {equipment.name}")
    print(f"  Current status: {equipment.status}")
    print(f"  Setting to: RESERVED")

    equipment.status = EquipmentStatus.RESERVED
    if equipment.quantity_available > 0 and reservation.quantity_requested > 0:
        equipment.quantity_available -= reservation.quantity_requested
        print(
            f"  Reduced quantity_available by {reservation.quantity_requested}")

db.session.commit()
print("\n✅ All approved reservations fixed!")

print("\n=== Current Status ===")
print(
    f"Reserved equipment: {Equipment.query.filter_by(status=EquipmentStatus.RESERVED).count()}")
print(
    f"Approved reservations: {Reservation.query.filter_by(status=ReservationStatus.APPROVED).count()}")
