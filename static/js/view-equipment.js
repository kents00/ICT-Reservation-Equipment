// view-equipment.js
// Handles loading and displaying equipment details for view-equipment.html

document.addEventListener('DOMContentLoaded', function () {
    // Assume equipmentId is available via query params or global variable
    const equipmentId = getEquipmentIdFromUrl();
    if (equipmentId) {
        fetchEquipmentDetails(equipmentId);
    } else {
        console.error('No equipment ID found in URL');
        alert('Equipment ID is missing. Please scan the QR code again.');
    }

    // Back button handler
    window.goBackToEquipment = function () {
        window.location.href = '/admin/equipment';
    };
});

function getEquipmentIdFromUrl() {
    // Example: /admin/equipment/view?id=123
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
}

function fetchEquipmentDetails(equipmentId) {
    const token = localStorage.getItem('access_token');
    fetch(`/api/equipment/${equipmentId}`, {
        headers: {
            ...(token ? { 'Authorization': 'Bearer ' + token } : {})
        }
    })
        .then(response => {
            if (!response.ok) throw new Error('Failed to fetch equipment');
            return response.json();
        })
        .then(data => populateEquipmentDetails(data))
        .catch((error) => {
            console.error('Error fetching equipment:', error);
            alert('Failed to load equipment details.');
        });
}

function populateEquipmentDetails(equipment) {
    // Handle equipment image
    if (equipment.image_url) {
        document.getElementById('viewEquipmentImage').src = equipment.image_url;
        document.getElementById('imageSection').style.display = 'block';
    } else {
        document.getElementById('imageSection').style.display = 'none';
    }

    document.getElementById('viewEquipmentName').textContent = equipment.name || '';
    document.getElementById('viewEquipmentCategory').textContent = equipment.category || '';
    document.getElementById('viewEquipmentLocation').textContent = equipment.location || '';
    document.getElementById('viewEquipmentDescription').textContent = equipment.description || '';
    document.getElementById('viewEquipmentQuantity').textContent = equipment.quantity || '';
    document.getElementById('viewEquipmentAvailable').textContent = equipment.quantity_available || '';
    document.getElementById('viewEquipmentStatus').textContent = equipment.status || '';
    // Handle last_maintenance as ISO string or null
    let lastMaintenanceText = '';
    if (equipment.last_maintenance) {
        // Try to format as date if possible
        try {
            const date = new Date(equipment.last_maintenance);
            lastMaintenanceText = isNaN(date.getTime()) ? equipment.last_maintenance : date.toLocaleDateString();
        } catch {
            lastMaintenanceText = equipment.last_maintenance;
        }
    }
    document.getElementById('viewLastMaintenance').textContent = lastMaintenanceText;
    document.getElementById('viewMaintenanceInterval').textContent = equipment.maintenance_interval_days || equipment.maintenance_interval || '';

    // QR code rendering
    const qrCodeValue = equipment.qrcode || equipment.qr_code || '';
    const qrDisplay = document.getElementById('viewQrcodeDisplay');
    qrDisplay.innerHTML = '';
    if (qrCodeValue) {
        // Create a container for QR code
        const qrContainer = document.createElement('div');
        qrContainer.id = 'qrCodeContainer';
        qrDisplay.appendChild(qrContainer);
        new QRCode(qrContainer, {
            text: qrCodeValue,
            width: 200,
            height: 200,
            colorDark: "#000000",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
        });
    } else {
        qrDisplay.innerHTML = '<p class="text-muted">No QR code available.</p>';
    }

    // Handle created_by as object or string
    let createdByText = '';
    if (typeof equipment.created_by === 'object' && equipment.created_by !== null) {
        createdByText = equipment.created_by.username || equipment.created_by.email || JSON.stringify(equipment.created_by);
    } else {
        createdByText = equipment.created_by || '';
    }
    document.getElementById('viewCreatedBy').textContent = createdByText;
    document.getElementById('viewCreatedAt').textContent = formatDateTime(equipment.created_at);
    document.getElementById('viewUpdatedAt').textContent = formatDateTime(equipment.updated_at);
    document.getElementById('viewStatusMeta').textContent = 'Automatically updated on save';
}

function formatDateTime(dt) {
    if (!dt) return '';
    const date = new Date(dt);
    return date.toLocaleString();
}
