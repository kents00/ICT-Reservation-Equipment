// Initialize the page
document.addEventListener('DOMContentLoaded', function () {
    initializeEditEquipmentPage();
});

function initializeEditEquipmentPage() {
    const equipmentId = getEquipmentIdFromURL();

    if (equipmentId) {
        loadEquipmentData(equipmentId);
    } else {
        // Pre-fill timestamps for new equipment
        setCurrentDateTime();
    }

    // Set up form submission
    const form = document.getElementById('editEquipmentForm');
    if (form) {
        form.addEventListener('submit', handleEquipmentSubmit);
    }

    // Initialize sidebar navigation
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', function (e) {
            if (!this.href.includes('?')) {
                e.preventDefault();
            }
        });
    });
}

function getEquipmentIdFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('equipment_id') || urlParams.get('id');
}

async function loadEquipmentData(equipmentId) {
    try {
        const response = await fetch(`/api/equipment/${equipmentId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to load equipment data');
        }

        const equipment = await response.json();
        populateEquipmentForm(equipment);
    } catch (error) {
        console.error('Error loading equipment:', error);
        alert('Failed to load equipment data. Please try again.');
    }
}

function loadEquipmentDataOld(equipmentId) {
    // Mock equipment data - in production, fetch from API
    const mockEquipment = {
        'EQ001': {
            name: 'Dell XPS 13 Laptop',
            category: 'Computing',
            location: 'Lab Building A, Room 101',
            description: 'High-performance laptop for development and design work',
            quantity: 5,
            quantity_available: 3,
            status: 'Available',
            last_maintenance: '2024-10-15',
            maintenance_interval: 90,
            created_by: 'John Admin',
            created_at: '2024-01-10T09:30:00',
            updated_at: '2024-11-15T14:20:00',
            qrcode: 'EQ001_QR_CODE'
        },
        'EQ002': {
            name: 'Microscope Olympus',
            category: 'Laboratory',
            location: 'Science Building B, Lab 205',
            description: 'Optical microscope for biology and material science research',
            quantity: 3,
            quantity_available: 1,
            status: 'Reserved',
            last_maintenance: '2024-09-20',
            maintenance_interval: 120,
            created_by: 'Sarah Admin',
            created_at: '2024-02-15T10:00:00',
            updated_at: '2024-11-10T11:45:00',
            qrcode: 'EQ002_QR_CODE'
        },
        'EQ003': {
            name: 'Camera Canon EOS',
            category: 'Photography',
            location: 'Media Center, Storage Room 3',
            description: 'Professional DSLR camera for photography projects',
            quantity: 4,
            quantity_available: 0,
            status: 'Maintenance',
            last_maintenance: '2024-11-01',
            maintenance_interval: 180,
            created_by: 'Mike Admin',
            created_at: '2024-03-05T15:20:00',
            updated_at: '2024-11-12T09:15:00',
            qrcode: 'EQ003_QR_CODE'
        }
    };

    const equipment = mockEquipment[equipmentId];
    if (equipment) {
        populateEquipmentForm(equipment);
        document.getElementById('equipmentSubtitle').textContent = `Editing: ${equipment.name}`;
    }
}

function populateEquipmentForm(equipment) {
    // Populate form fields to match edit-equipment.html
    if (document.getElementById('equipmentName')) document.getElementById('equipmentName').value = equipment.name || '';
    if (document.getElementById('equipmentCategory')) document.getElementById('equipmentCategory').value = equipment.category || '';
    if (document.getElementById('equipmentLocation')) document.getElementById('equipmentLocation').value = equipment.location || '';
    if (document.getElementById('equipmentDescription')) document.getElementById('equipmentDescription').value = equipment.description || '';
    if (document.getElementById('equipmentQuantity')) document.getElementById('equipmentQuantity').value = equipment.quantity || 1;
    if (document.getElementById('equipmentAvailable')) document.getElementById('equipmentAvailable').value = equipment.quantity_available ?? '';
    if (document.getElementById('equipmentSerial')) document.getElementById('equipmentSerial').value = equipment.serial_number || '';
    if (document.getElementById('equipmentStatus')) document.getElementById('equipmentStatus').value = equipment.status || '';

    // Display current image if available
    if (equipment.image_url) {
        const currentImageContainer = document.getElementById('currentImageContainer');
        const currentImage = document.getElementById('currentImage');
        if (currentImage && currentImageContainer) {
            currentImage.src = equipment.image_url;
            currentImageContainer.style.display = 'block';
        }
    }

    // Set last maintenance date (convert ISO or string to yyyy-MM-dd for input)
    if (document.getElementById('lastMaintenance')) {
        let lastMaint = '';
        if (equipment.last_maintenance) {
            try {
                const date = new Date(equipment.last_maintenance);
                lastMaint = !Number.isNaN(date.getTime()) ? date.toISOString().slice(0, 10) : equipment.last_maintenance;
            } catch {
                lastMaint = equipment.last_maintenance;
            }
        }
        document.getElementById('lastMaintenance').value = lastMaint;
    }
    if (document.getElementById('maintenanceInterval')) document.getElementById('maintenanceInterval').value = equipment.maintenance_interval_days || equipment.maintenance_interval || '';

    // Handle both qrcode and qr_code field names
    const qrCodeValue = equipment.qrcode || equipment.qr_code || '';
    if (document.getElementById('equipmentQRCode')) {
        document.getElementById('equipmentQRCode').value = qrCodeValue;
    }

    // Handle created_by - could be string or object
    const createdByValue = typeof equipment.created_by === 'object' ?
        (equipment.created_by?.username || equipment.created_by?.email || '') :
        (equipment.created_by || '');
    if (document.getElementById('createdBy')) document.getElementById('createdBy').value = createdByValue;

    if (document.getElementById('createdAt')) document.getElementById('createdAt').value = equipment.created_at ? equipment.created_at.replace(' ', 'T').slice(0, 16) : '';
    if (document.getElementById('updatedAt')) document.getElementById('updatedAt').value = equipment.updated_at ? equipment.updated_at.replace(' ', 'T').slice(0, 16) : '';
    if (document.getElementById('statusMeta')) document.getElementById('statusMeta').value = equipment.status || '';

    // Display QR code if available
    if (qrCodeValue && document.getElementById('qrcodeDisplay')) {
        console.log('Displaying existing QR code:', qrCodeValue);
        displayQRCode(qrCodeValue);
    }
}

function setCurrentDateTime() {
    const now = new Date();
    const dateTimeLocal = now.toISOString().slice(0, 16);
    document.getElementById('createdAt').value = dateTimeLocal;
    document.getElementById('updatedAt').value = dateTimeLocal;
}

function formatDateTimeLocal(dateString) {
    const date = new Date(dateString);
    return date.toISOString().slice(0, 16);
}

function generateQRCode() {
    const equipmentId = getEquipmentIdFromURL() || `EQ_${Date.now()}`;
    const equipmentName = document.getElementById('equipmentName').value;

    if (!equipmentName) {
        alert('Please enter equipment name first');
        return;
    }

    // Use equipment ID as QR code value
    const qrValue = equipmentId;

    const display = document.getElementById('qrcodeDisplay');
    display.innerHTML = '<div id="qrCodeContainer" style="padding: 20px; background: white; border-radius: 8px; display: inline-block;"></div>';

    // Generate QR code with QRCode.js
    const qrContainer = document.getElementById('qrCodeContainer');
    new QRCode(qrContainer, {
        text: qrValue,
        width: 200,
        height: 200,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
    });

    display.classList.add('generated');
    document.getElementById('equipmentQRCode').value = qrValue;

    // Visual feedback
    const btn = event.target;
    const originalText = btn.textContent;
    btn.textContent = 'QR Code Generated ✓';
    setTimeout(() => {
        btn.textContent = originalText;
    }, 2000);
}

function displayQRCode(qrValue) {
    const display = document.getElementById('qrcodeDisplay');
    display.innerHTML = '<div id="qrCodeContainer" style="padding: 20px; background: white; border-radius: 8px; display: inline-block;"></div>';

    // Generate QR code with QRCode.js
    const qrContainer = document.getElementById('qrCodeContainer');
    new QRCode(qrContainer, {
        text: qrValue,
        width: 200,
        height: 200,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
    });

    display.classList.add('generated');
}

async function handleEquipmentSubmit(e) {
    e.preventDefault();

    const equipmentId = getEquipmentIdFromURL();

    if (!equipmentId) {
        alert('Equipment ID is missing');
        return;
    }

    // Validate form before submission
    if (!validateEquipmentForm()) {
        return;
    }

    // Check if using FormData (for file upload) or JSON
    const imageFile = document.getElementById('equipmentImage')?.files[0];
    const removeImageFlag = document.getElementById('removeImageFlag')?.value === 'true';

    if (imageFile || removeImageFlag) {
        // Use FormData for file upload
        const formData = new FormData();
        formData.append('name', document.getElementById('equipmentName').value);
        formData.append('category', document.getElementById('equipmentCategory').value);
        formData.append('description', document.getElementById('equipmentDescription').value);
        formData.append('serial_number', document.getElementById('equipmentSerial')?.value || '');
        formData.append('quantity', document.getElementById('equipmentQuantity').value);
        formData.append('quantity_available', document.getElementById('equipmentAvailable').value);
        formData.append('location', document.getElementById('equipmentLocation').value);
        formData.append('status', document.getElementById('equipmentStatus').value);

        const maintenanceInterval = document.getElementById('maintenanceInterval')?.value;
        if (maintenanceInterval) {
            formData.append('maintenance_interval_days', maintenanceInterval);
        }

        const lastMaintInput = document.getElementById('lastMaintenance')?.value;
        if (lastMaintInput) {
            const date = new Date(lastMaintInput);
            formData.append('last_maintenance', !Number.isNaN(date.getTime()) ? date.toISOString().slice(0, 10) : lastMaintInput);
        }

        const qrCodeValue = document.getElementById('equipmentQRCode')?.value;
        if (qrCodeValue) {
            formData.append('qrcode', qrCodeValue);
        }

        if (imageFile) {
            formData.append('image', imageFile);
        }

        if (removeImageFlag) {
            formData.append('remove_image', 'true');
        }

        console.log('Submitting equipment update with FormData (image upload)');

        try {
            const response = await fetch(`/api/equipment/${equipmentId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                },
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to update equipment');
            }

            const data = await response.json();
            console.log('Equipment updated:', data);
            showSuccessModal(formData.get('name'));
        } catch (error) {
            console.error('Error updating equipment:', error);
            alert(`Failed to update equipment: ${error.message}`);
        }
    } else {
        // Use JSON for regular updates (no image changes)
        const equipmentData = {
            name: document.getElementById('equipmentName').value,
            category: document.getElementById('equipmentCategory').value,
            description: document.getElementById('equipmentDescription').value,
            serial_number: document.getElementById('equipmentSerial')?.value || '',
            quantity: Number.parseInt(document.getElementById('equipmentQuantity').value),
            quantity_available: Number.parseInt(document.getElementById('equipmentAvailable').value),
            location: document.getElementById('equipmentLocation').value,
            status: document.getElementById('equipmentStatus').value,
            maintenance_interval_days: document.getElementById('maintenanceInterval')?.value ? Number.parseInt(document.getElementById('maintenanceInterval').value) : null
        };

        const lastMaintInput = document.getElementById('lastMaintenance')?.value;
        if (lastMaintInput) {
            const date = new Date(lastMaintInput);
            equipmentData.last_maintenance = !Number.isNaN(date.getTime()) ? date.toISOString().slice(0, 10) : lastMaintInput;
        } else {
            equipmentData.last_maintenance = null;
        }

        const qrCodeValue = document.getElementById('equipmentQRCode')?.value;
        if (qrCodeValue) {
            equipmentData.qrcode = qrCodeValue;
        }

        console.log('Submitting equipment update with JSON');
        try {
            const response = await fetch(`/api/equipment/${equipmentId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                },
                body: JSON.stringify(equipmentData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to update equipment');
            }

            await response.json();
            showSuccessModal(equipmentData.name);
        } catch (error) {
            console.error('Error updating equipment:', error);
            alert(`Failed to update equipment: ${error.message}`);
        }
    }
}

function validateEquipmentForm() {
    const name = document.getElementById('equipmentName').value.trim();
    const category = document.getElementById('equipmentCategory').value;
    const location = document.getElementById('equipmentLocation').value.trim();
    const quantity = parseInt(document.getElementById('equipmentQuantity').value);
    const available = parseInt(document.getElementById('equipmentAvailable').value);
    const status = document.getElementById('equipmentStatus').value;
    const createdBy = document.getElementById('createdBy').value.trim();

    if (!name) {
        alert('Equipment name is required');
        return false;
    }

    if (!category) {
        alert('Category is required');
        return false;
    }

    if (!location) {
        alert('Location is required');
        return false;
    }

    if (!quantity || quantity < 1) {
        alert('Total quantity must be at least 1');
        return false;
    }

    if (available > quantity) {
        alert('Available quantity cannot exceed total quantity');
        return false;
    }

    if (!status) {
        alert('Equipment status is required');
        return false;
    }

    if (!createdBy) {
        alert('Created By field is required');
        return false;
    }

    return true;
}

function showSuccessModal(equipmentName) {
    const modal = document.getElementById('successModal');
    document.getElementById('successMessage').textContent =
        `The equipment "${equipmentName}" has been saved successfully.`;
    modal.style.display = 'block';
}

function closeModal() {
    const modal = document.getElementById('successModal');
    if (modal) {
        modal.style.display = 'none';
    }
    goBackToEquipment();
}

async function deleteEquipment() {
    const equipmentId = getEquipmentIdFromURL();

    if (!equipmentId) {
        alert('Equipment ID is missing');
        return;
    }

    // Show delete confirmation modal
    const deleteModal = document.getElementById('deleteModal');
    if (deleteModal) {
        deleteModal.style.display = 'block';
    } else {
        // If no modal exists, use confirm dialog
        if (confirm('Are you sure you want to delete this equipment?')) {
            await confirmDelete();
        }
    }
}

async function confirmDelete() {
    const equipmentId = getEquipmentIdFromURL();

    if (!equipmentId) {
        alert('Equipment ID is missing');
        return;
    }

    try {
        const response = await fetch(`/api/equipment/${equipmentId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to delete equipment');
        }

        const deleteModal = document.getElementById('deleteModal');
        if (deleteModal) {
            deleteModal.style.display = 'none';
        }
        alert('Equipment deleted successfully');
        goBackToEquipment();
    } catch (error) {
        console.error('Error deleting equipment:', error);
        alert('Failed to delete equipment. Please try again.');
    }
}

function goBackToEquipment() {
    window.location.href = '/admin/equipment';
}

function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    sidebar.classList.toggle('mobile-open');
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        window.location.href = 'login.html';
    }
}

// User menu toggle
document.addEventListener('DOMContentLoaded', function () {
    const userMenuBtn = document.querySelector('.user-avatar');
    const userDropdown = document.querySelector('.user-dropdown');

    if (userMenuBtn && userDropdown) {
        userMenuBtn.addEventListener('click', function () {
            userDropdown.style.display = userDropdown.style.display === 'block' ? 'none' : 'block';
        });

        document.addEventListener('click', function (e) {
            if (!e.target.closest('.user-menu')) {
                userDropdown.style.display = 'none';
            }
        });
    }
});

// Image preview functionality
function previewImage(event) {
    const file = event.target.files[0];
    const previewContainer = document.getElementById('imagePreviewContainer');
    const preview = document.getElementById('imagePreview');

    if (file) {
        // Validate file size (5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('File size must be less than 5MB');
            event.target.value = '';
            return;
        }

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            alert('Please select a valid image file (JPG, PNG, GIF, or WEBP)');
            event.target.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = function (e) {
            preview.src = e.target.result;
            previewContainer.style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
}

function cancelImageUpload() {
    const input = document.getElementById('equipmentImage');
    const previewContainer = document.getElementById('imagePreviewContainer');
    const preview = document.getElementById('imagePreview');

    input.value = '';
    preview.src = '';
    previewContainer.style.display = 'none';
}

function removeCurrentImage() {
    const currentImageContainer = document.getElementById('currentImageContainer');
    const removeImageFlag = document.getElementById('removeImageFlag');

    if (confirm('Are you sure you want to remove the current image?')) {
        currentImageContainer.style.display = 'none';
        removeImageFlag.value = 'true';
    }
}
