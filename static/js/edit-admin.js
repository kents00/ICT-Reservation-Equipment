// Mock admin data
const adminData = {
    'ADM001': {
        id: 'ADM001',
        firstName: 'John',
        lastName: 'Administrator',
        middleName: 'Michael',
        adminId: 'ADM001',
        adminTitle: 'System Administrator',
        department: 'Equipment Management Department',
        email: 'john.admin@equipment.com',
        phone: '+1 (555) 123-4567',
        office: 'Building A, Room 201',
        permissions: 'Full Access'
    }
};

// Load admin data on page load
document.addEventListener('DOMContentLoaded', function () {
    const urlParams = new URLSearchParams(window.location.search);
    const adminId = urlParams.get('id') || 'ADM001';
    loadAdminData(adminId);
});

// Load admin data into form
function loadAdminData(adminId) {
    const admin = adminData[adminId];

    if (admin) {
        document.getElementById('firstName').value = admin.firstName;
        document.getElementById('lastName').value = admin.lastName;
        document.getElementById('middleName').value = admin.middleName || '';
        document.getElementById('adminId').value = admin.adminId;
        document.getElementById('adminTitle').value = admin.adminTitle;
        document.getElementById('department').value = admin.department;
        document.getElementById('email').value = admin.email;
        document.getElementById('phone').value = admin.phone;
        document.getElementById('office').value = admin.office || '';
        document.getElementById('permissions').value = admin.permissions;
    }
}

// Handle form submission
function handleAdminSubmit(event) {
    event.preventDefault();

    // Get form values
    const firstName = document.getElementById('firstName').value.trim();
    const lastName = document.getElementById('lastName').value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const adminTitle = document.getElementById('adminTitle').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    // Validation
    if (!firstName || !lastName || !email || !phone || !adminTitle) {
        alert('Please fill in all required fields');
        return;
    }

    if (!isValidEmail(email)) {
        alert('Please enter a valid email address');
        return;
    }

    // Password validation
    if (password || confirmPassword) {
        if (password.length < 6) {
            alert('Password must be at least 6 characters long');
            return;
        }

        if (password !== confirmPassword) {
            alert('Passwords do not match');
            return;
        }
    }

    // Show success modal
    document.getElementById('modalMessage').textContent = 'Admin profile updated successfully!';
    showModal('successModal');
}

// Validate email format
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Show modal
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
    }
}

// Close modal
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

// Navigate back to dashboard
function goBackToDashboard() {
    window.location.href = 'dashboard.html';
}

// Logout function
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        window.location.href = 'login.html';
    }
}

// Toggle sidebar on mobile
function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
        sidebar.classList.toggle('active');
    }
}
