// Mock user data for editing
const mockUsers = {
    'STU001': {
        id: 'STU001',
        firstName: 'John',
        lastName: 'Student',
        middleName: '',
        studentId: 'STU001',
        course: 'Computer Science',
        email: 'john.student@college.edu',
        phone: '+1 (555) 123-4567',
        role: 'student',
        status: 'Active'
    },
    'ADM001': {
        id: 'ADM001',
        firstName: 'Admin',
        lastName: 'User',
        middleName: '',
        email: 'admin@equipment.com',
        phone: '+1 (555) 987-6543',
        role: 'admin',
        status: 'Active'
    }
};

// Initialize the page
document.addEventListener('DOMContentLoaded', function () {
    initializeEditUserPage();

    // Setup image upload preview
    const profileImageInput = document.getElementById('profile-image');
    if (profileImageInput) {
        profileImageInput.addEventListener('change', handleImagePreview);
    }

    // Setup remove image button
    const removeImageBtn = document.getElementById('remove-image-btn');
    if (removeImageBtn) {
        removeImageBtn.addEventListener('click', handleRemoveImage);
    }
});

function handleImagePreview(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            const preview = document.getElementById('profile-preview');
            const placeholder = document.getElementById('profile-placeholder');
            const removeBtn = document.getElementById('remove-image-btn');

            preview.src = e.target.result;
            preview.style.display = 'block';
            placeholder.style.display = 'none';
            if (removeBtn) removeBtn.style.display = 'inline-block';
        };
        reader.readAsDataURL(file);
    }
}

function handleRemoveImage() {
    const preview = document.getElementById('profile-preview');
    const placeholder = document.getElementById('profile-placeholder');
    const input = document.getElementById('profile-image');
    const removeBtn = document.getElementById('remove-image-btn');

    preview.src = '';
    preview.style.display = 'none';
    placeholder.style.display = 'flex';
    input.value = '';
    if (removeBtn) removeBtn.style.display = 'none';
}

function initializeEditUserPage() {
    const urlParams = new URLSearchParams(globalThis.location.search);
    const userId = urlParams.get('user_id') || urlParams.get('id');

    if (userId) {
        loadUserData(userId);
    } else {
        showMessage('No user ID provided', 'error');
    }

    // Setup form submission
    const form = document.getElementById('editUserForm');
    if (form) {
        form.addEventListener('submit', handleUserSubmit);
    }

    setupNavigationHandlers();
}

function setupNavigationHandlers() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', function (e) {
            const section = this.getAttribute('data-section');
            if (section && section !== 'users') {
                e.preventDefault();
                globalThis.location.href = `dashboard.html?section=${section}`;
            }
        });
    });
}

async function loadUserData(userId) {
    try {
        const resp = await fetch(`/api/admin/users/${userId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`
            }
        });

        if (!resp.ok) {
            throw new Error('Failed to load user data');
        }

        const data = await resp.json();
        const user = data.user || data;
        populateUserForm(user);
    } catch (error) {
        console.error('Error loading user:', error);
        showMessage('Failed to load user data', 'error');
    }
}

function populateUserForm(user) {
    // Store user ID
    if (document.getElementById('user-id')) {
        document.getElementById('user-id').value = user.id;
    }

    // Display profile image or placeholder
    const preview = document.getElementById('profile-preview');
    const placeholder = document.getElementById('profile-placeholder');
    const removeBtn = document.getElementById('remove-image-btn');

    if (user.image_url) {
        preview.src = user.image_url;
        preview.style.display = 'block';
        placeholder.style.display = 'none';
        if (removeBtn) removeBtn.style.display = 'inline-block';
    } else {
        const initials = `${user.first_name?.charAt(0) || ''}${user.last_name?.charAt(0) || ''}`.toUpperCase();
        placeholder.textContent = initials;
        placeholder.style.display = 'flex';
        preview.style.display = 'none';
        if (removeBtn) removeBtn.style.display = 'none';
    }

    // Populate form fields with individual name components
    if (document.getElementById('user-username')) document.getElementById('user-username').value = user.username || '';
    if (document.getElementById('user-firstname')) document.getElementById('user-firstname').value = user.first_name || '';
    if (document.getElementById('user-middlename')) document.getElementById('user-middlename').value = user.middle_name || '';
    if (document.getElementById('user-lastname')) document.getElementById('user-lastname').value = user.last_name || '';
    if (document.getElementById('user-email')) document.getElementById('user-email').value = user.email || '';
    if (document.getElementById('user-phone')) document.getElementById('user-phone').value = user.phone || '';
    if (document.getElementById('user-department')) document.getElementById('user-department').value = user.department || '';
    if (document.getElementById('user-studentid')) document.getElementById('user-studentid').value = user.student_id || '';
    if (document.getElementById('user-role')) document.getElementById('user-role').value = user.role || '';
    if (document.getElementById('user-status')) document.getElementById('user-status').value = user.status || (user.is_active ? 'active' : 'inactive');
}

async function handleUserSubmit(event) {
    event.preventDefault();

    const userId = document.getElementById('user-id').value;

    if (!userId) {
        showMessage('User ID is missing', 'error');
        return;
    }

    // Create FormData to handle both regular fields and file upload
    const formData = new FormData();

    // Add text fields
    formData.append('username', document.getElementById('user-username').value.trim());
    formData.append('first_name', document.getElementById('user-firstname').value.trim());
    formData.append('middle_name', document.getElementById('user-middlename').value.trim());
    formData.append('last_name', document.getElementById('user-lastname').value.trim());
    formData.append('email', document.getElementById('user-email').value.trim());
    formData.append('phone', document.getElementById('user-phone').value.trim());
    formData.append('department', document.getElementById('user-department').value.trim());
    formData.append('student_id', document.getElementById('user-studentid').value.trim());
    formData.append('role', document.getElementById('user-role').value);
    formData.append('is_active', document.getElementById('user-status').value === 'active' ? 'true' : 'false');

    // Add profile image if selected
    const profileImageInput = document.getElementById('profile-image');
    if (profileImageInput && profileImageInput.files.length > 0) {
        formData.append('profile_image', profileImageInput.files[0]);
    }

    // Validate required fields
    if (!formData.get('username')) {
        showMessage('Username is required', 'error');
        return;
    }

    if (!formData.get('first_name') || !formData.get('last_name')) {
        showMessage('First name and last name are required', 'error');
        return;
    }

    if (!formData.get('email') || !isValidEmail(formData.get('email'))) {
        showMessage('Valid email is required', 'error');
        return;
    }

    if (!formData.get('role')) {
        showMessage('Role is required', 'error');
        return;
    }

    try {
        const resp = await fetch(`/api/admin/users/${userId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                // Note: Don't set Content-Type for FormData, browser will set it with boundary
            },
            body: formData
        });

        if (!resp.ok) {
            const errorData = await resp.json().catch(() => ({ error: 'Failed to update user' }));
            throw new Error(errorData.error || `Server error: ${resp.status}`);
        }

        await resp.json();
        showMessage('User updated successfully!', 'success');

        // Redirect after a short delay
        setTimeout(() => {
            globalThis.location.href = '/admin/users';
        }, 1500);
    } catch (error) {
        console.error('Error updating user:', error);
        showMessage(error.message || 'Failed to update user. Please try again.', 'error');
    }
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function goBackToUsers() {
    globalThis.location.href = '/admin/users';
}

function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    sidebar.classList.toggle('active');
}

function logout() {
    if (globalThis.confirm('Are you sure you want to logout?')) {
        globalThis.location.href = 'login.html';
    }
}

function showMessage(message, type) {
    const modal = document.getElementById('successModal');
    const modalMessage = document.querySelector('#successModal p');

    if (type === 'error') {
        const heading = modal.querySelector('h2');
        heading.textContent = 'Error';
        modal.classList.add('error');
        modal.classList.remove('success');
    } else {
        const heading = modal.querySelector('h2');
        heading.textContent = 'User Updated Successfully';
        modal.classList.remove('error');
        modal.classList.add('success');
    }

    if (modalMessage) {
        modalMessage.textContent = message;
    }
    showModal('successModal');
}

function showModal(modalId) {
    document.getElementById(modalId).style.display = 'flex';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
    // If closing success modal, redirect to users page
    if (modalId === 'successModal') {
        setTimeout(() => {
            globalThis.location.href = '/admin/users';
        }, 500);
    }
}

// Make user dropdown toggle work on click
document.addEventListener('DOMContentLoaded', function () {
    const userAvatar = document.querySelector('.user-avatar');
    if (userAvatar) {
        userAvatar.addEventListener('click', function (e) {
            e.stopPropagation();
            const dropdown = this.parentElement.querySelector('.user-dropdown');
            if (dropdown) {
                dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
            }
        });
    }

    // Close dropdown when clicking elsewhere
    document.addEventListener('click', function () {
        const dropdown = document.querySelector('.user-dropdown');
        if (dropdown) {
            dropdown.style.display = 'none';
        }
    });
});
