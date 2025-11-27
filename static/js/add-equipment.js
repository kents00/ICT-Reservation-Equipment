// Initialize the page
document.addEventListener('DOMContentLoaded', function () {
    initializeAddEquipmentPage();
});

function initializeAddEquipmentPage() {
    // Set current date/time for new equipment
    setCurrentDateTime();

    // Set up form submission
    const form = document.getElementById('addEquipmentForm');
    if (form) {
        form.addEventListener('submit', handleEquipmentSubmit);
    }

    // Initialize sidebar navigation
    const navItems = document.querySelectorAll('.nav-item');
    for (const item of navItems) {
        item.addEventListener('click', function (e) {
            if (!this.href.includes('?')) {
                e.preventDefault();
            }
        });
    }
}

function setCurrentDateTime() {
    const now = new Date();
    // Format as yyyy-MM-ddTHH:mm for datetime-local input
    const pad = n => n.toString().padStart(2, '0');
    const dateTimeLocal = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
    document.getElementById('createdAt').value = dateTimeLocal;
    document.getElementById('updatedAt').value = dateTimeLocal;
}

function generateQRCode() {
    const equipmentName = document.getElementById('equipmentName').value;

    if (!equipmentName) {
        alert('Please enter equipment name first');
        return;
    }

    // Generate unique equipment ID based on timestamp and name
    const timestamp = Date.now();
    const equipmentId = `EQ_${timestamp}`;

    // Generate actual QR code using qrcode.js library
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
    console.log('QR Code generated and set to hidden field:', qrValue);

    // Visual feedback
    const btn = event.target;
    const originalText = btn.textContent;
    btn.textContent = 'QR Code Generated ✓';
    setTimeout(() => {
        btn.textContent = originalText;
    }, 2000);
}

function handleEquipmentSubmit(e) {
    e.preventDefault();

    // Validate form
    if (!validateEquipmentForm()) {
        return;
    }

    // Get form data using FormData to handle file uploads
    const form = document.getElementById('addEquipmentForm');
    const formData = new FormData(form);

    // Include QR code if generated
    const qrCodeValue = document.getElementById('equipmentQRCode')?.value;
    console.log('QR Code Value from hidden field:', qrCodeValue);
    if (qrCodeValue) {
        formData.set('qrcode', qrCodeValue);
        console.log('Added QR code to equipment data');
    } else {
        console.log('No QR code value found in hidden field');
    }

    // Generate new timestamps
    const now = new Date().toISOString();
    formData.set('created_at', now);
    formData.set('updated_at', now);

    // Send to API with Authorization header
    console.log('Submitting equipment with image...');
    const token = localStorage.getItem('access_token');
    fetch('/api/equipment', {
        method: 'POST',
        headers: {
            ...(token ? { 'Authorization': 'Bearer ' + token } : {})
            // Don't set Content-Type - let browser set it with boundary for multipart/form-data
        },
        body: formData
    })
        .then(response => {
            if (!response.ok) throw new Error('Failed to add equipment');
            return response.json();
        })
        .then(data => {
            console.log('Equipment added successfully:', data);
            // Redirect to equipment management page after successful add
            window.location.href = '/admin/equipment';
        })
        .catch(err => {
            console.error('Error adding equipment:', err);
            alert('Error adding equipment: ' + err.message);
        });
}

function validateEquipmentForm() {
    const name = document.getElementById('equipmentName').value.trim();
    const category = document.getElementById('equipmentCategory').value;
    const location = document.getElementById('equipmentLocation').value.trim();
    const quantity = Number.parseInt(document.getElementById('equipmentQuantity').value);
    const available = Number.parseInt(document.getElementById('equipmentAvailable').value);
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
        `The equipment "${equipmentName}" has been successfully added to the system.`;
    modal.classList.add('show');
}

function closeModal() {
    const modal = document.getElementById('successModal');
    modal.classList.remove('show');
    goBackToEquipment();
}

function goBackToEquipment() {
    globalThis.location.href = 'dashboard.html?section=equipment';
}

function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    sidebar.classList.toggle('mobile-open');
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        globalThis.location.href = 'login.html';
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

function removeImage() {
    const input = document.getElementById('equipmentImage');
    const previewContainer = document.getElementById('imagePreviewContainer');
    const preview = document.getElementById('imagePreview');

    input.value = '';
    preview.src = '';
    previewContainer.style.display = 'none';
}
