// settings.js - Handles system settings management

document.addEventListener('DOMContentLoaded', function () {
    loadSettings();
    loadAdminProfile();

    // Tab switching functionality
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(button => {
        button.addEventListener('click', function () {
            const tabName = this.textContent.trim().toLowerCase();
            showTab(tabName);
        });
    });

    // Form submission handlers
    document.querySelectorAll('.settings-form').forEach(form => {
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            saveSettings();
        });
    });

    // Setup admin profile image upload preview
    const adminProfileImageInput = document.getElementById('admin-profile-image');
    if (adminProfileImageInput) {
        adminProfileImageInput.addEventListener('change', handleAdminImagePreview);
    }
});

function handleAdminImagePreview(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            const preview = document.getElementById('admin-profile-preview');
            const placeholder = document.getElementById('admin-profile-placeholder');

            preview.src = e.target.result;
            preview.style.display = 'block';
            placeholder.style.display = 'none';
        };
        reader.readAsDataURL(file);
    }
}

/**
 * Show specific settings tab
 */
function showTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });

    // Remove active class from all buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Show selected tab
    const tabContent = document.getElementById(`${tabName}-tab`);
    if (tabContent) {
        tabContent.classList.add('active');
    }

    // Activate corresponding button
    const buttons = document.querySelectorAll('.tab-btn');
    buttons.forEach(btn => {
        if (btn.textContent.trim().toLowerCase() === tabName) {
            btn.classList.add('active');
        }
    });
}

/**
 * Load current settings from the server
 */
async function loadSettings() {
    try {
        const response = await fetch('/api/admin/settings', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to load settings');
        }

        const settings = await response.json();
        populateSettingsForm(settings);
    } catch (error) {
        console.error('Error loading settings:', error);
        showNotification('Error loading settings', 'error');
    }
}

/**
 * Load admin profile data
 */
async function loadAdminProfile() {
    try {
        const response = await fetch('/api/admin/settings/admin-profile', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to load admin profile');
        }

        const admin = await response.json();
        populateAdminFields(admin);
    } catch (error) {
        console.error('Error loading admin profile:', error);
        // Admin fields already populated from template, so this is optional
    }
}

/**
 * Populate admin account fields
 */
function populateAdminFields(admin) {
    const usernameInput = document.getElementById('admin-username');
    const emailInput = document.getElementById('admin-email');
    const firstNameInput = document.getElementById('admin-firstname');
    const middleNameInput = document.getElementById('admin-middlename');
    const lastNameInput = document.getElementById('admin-lastname');
    const phoneInput = document.getElementById('admin-phone');
    const profilePreview = document.getElementById('admin-profile-preview');
    const profilePlaceholder = document.getElementById('admin-profile-placeholder');

    if (usernameInput) usernameInput.value = admin.username || '';
    if (emailInput) emailInput.value = admin.email || '';
    if (firstNameInput) firstNameInput.value = admin.first_name || '';
    if (middleNameInput) middleNameInput.value = admin.middle_name || '';
    if (lastNameInput) lastNameInput.value = admin.last_name || '';
    if (phoneInput) phoneInput.value = admin.phone || '';

    // Display profile image or placeholder
    if (admin.image_url && profilePreview && profilePlaceholder) {
        profilePreview.src = admin.image_url;
        profilePreview.style.display = 'block';
        profilePlaceholder.style.display = 'none';
    } else if (profilePlaceholder && profilePreview) {
        const initials = `${admin.first_name?.charAt(0) || 'A'}${admin.last_name?.charAt(0) || 'D'}`.toUpperCase();
        profilePlaceholder.textContent = initials;
        profilePlaceholder.style.display = 'flex';
        profilePreview.style.display = 'none';
    }
}

/**
 * Populate form fields with settings data
 */
function populateSettingsForm(settings) {
    // General settings
    const systemNameInput = document.getElementById('system-name');
    const systemDescInput = document.getElementById('system-description');
    if (systemNameInput) systemNameInput.value = settings.system_name || 'Equipment Reservation System';
    if (systemDescInput) systemDescInput.value = settings.description || '';

    // Reservation settings
    const maxDurationInput = document.getElementById('max-duration');
    const maxAdvanceInput = document.getElementById('max-advance');
    if (maxDurationInput) maxDurationInput.value = settings.max_reservation_duration || 30;
    if (maxAdvanceInput) maxAdvanceInput.value = settings.max_advance_booking || 90;

    // Checkboxes for require approval (in reservations tab)
    const requireApprovalCheckboxes = document.querySelectorAll('input[type="checkbox"]');
    requireApprovalCheckboxes.forEach(checkbox => {
        const label = checkbox.parentElement.textContent.trim().toLowerCase();

        if (label.includes('require approval')) {
            checkbox.checked = settings.require_approval || false;
        } else if (label.includes('email notifications')) {
            checkbox.checked = settings.email_notifications || false;
        } else if (label.includes('sms notifications')) {
            checkbox.checked = settings.sms_notifications || false;
        } else if (label.includes('two-factor')) {
            checkbox.checked = settings.two_factor_auth || false;
        }
    });

    // Security settings
    const sessionTimeoutInput = document.getElementById('session-timeout');
    if (sessionTimeoutInput) sessionTimeoutInput.value = settings.session_timeout || 30;
}

/**
 * Collect settings data from all forms
 */
function collectSettingsData() {
    const data = {};

    // General settings
    const systemName = document.getElementById('system-name');
    const systemDesc = document.getElementById('system-description');
    if (systemName) data.system_name = systemName.value.trim();
    if (systemDesc) data.description = systemDesc.value.trim();

    // Admin account data
    const adminUsername = document.getElementById('admin-username');
    const adminEmail = document.getElementById('admin-email');
    const adminFirstName = document.getElementById('admin-firstname');
    const adminMiddleName = document.getElementById('admin-middlename');
    const adminLastName = document.getElementById('admin-lastname');
    const adminPhone = document.getElementById('admin-phone');
    const adminPassword = document.getElementById('admin-password');
    const adminPasswordConfirm = document.getElementById('admin-password-confirm');

    data.admin = {};
    if (adminUsername) data.admin.username = adminUsername.value.trim();
    if (adminEmail) data.admin.email = adminEmail.value.trim();
    if (adminFirstName) data.admin.first_name = adminFirstName.value.trim();
    if (adminMiddleName) data.admin.middle_name = adminMiddleName.value.trim();
    if (adminLastName) data.admin.last_name = adminLastName.value.trim();
    if (adminPhone) data.admin.phone = adminPhone.value.trim();

    // Only include password if user entered one
    if (adminPassword && adminPassword.value) {
        data.admin.password = adminPassword.value;
        data.admin.confirm_password = adminPasswordConfirm ? adminPasswordConfirm.value : '';
    }

    // Reservation settings
    const maxDuration = document.getElementById('max-duration');
    const maxAdvance = document.getElementById('max-advance');
    if (maxDuration) data.max_reservation_duration = parseInt(maxDuration.value);
    if (maxAdvance) data.max_advance_booking = parseInt(maxAdvance.value);

    // Find checkboxes and extract their values
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        const label = checkbox.parentElement.textContent.trim().toLowerCase();

        if (label.includes('require approval')) {
            data.require_approval = checkbox.checked;
        } else if (label.includes('email notifications')) {
            data.email_notifications = checkbox.checked;
        } else if (label.includes('sms notifications')) {
            data.sms_notifications = checkbox.checked;
        } else if (label.includes('two-factor')) {
            data.two_factor_auth = checkbox.checked;
        }
    });

    // Security settings
    const sessionTimeout = document.getElementById('session-timeout');
    if (sessionTimeout) data.session_timeout = parseInt(sessionTimeout.value);

    return data;
}

/**
 * Save settings to the server
 */
async function saveSettings() {
    try {
        const data = collectSettingsData();

        // Save system settings
        const settingsResponse = await fetch('/api/admin/settings', {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (!settingsResponse.ok) {
            const errorData = await settingsResponse.json();
            throw new Error(errorData.error || 'Failed to save settings');
        }

        // Save admin profile if any admin data was provided
        if (data.admin && Object.keys(data.admin).length > 0) {
            // Create FormData to handle image upload
            const formData = new FormData();

            // Add admin fields
            for (const key in data.admin) {
                if (data.admin[key] !== null && data.admin[key] !== undefined && data.admin[key] !== '') {
                    formData.append(key, data.admin[key]);
                }
            }

            // Add profile image if selected
            const profileImageInput = document.getElementById('admin-profile-image');
            if (profileImageInput && profileImageInput.files.length > 0) {
                formData.append('profile_image', profileImageInput.files[0]);
            }

            const adminResponse = await fetch('/api/admin/settings/admin-profile', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                    // Don't set Content-Type for FormData, browser will set it with boundary
                },
                body: formData
            });

            if (!adminResponse.ok) {
                let errorMessage = 'Failed to update admin profile';
                try {
                    const errorData = await adminResponse.json();
                    errorMessage = errorData.error || errorMessage;
                } catch (e) {
                    // If response is not JSON, use default error message
                    console.error('Server returned non-JSON response:', await adminResponse.text());
                }
                throw new Error(errorMessage);
            }

            // Try to parse JSON response
            try {
                const adminData = await adminResponse.json();
                console.log('Admin profile updated:', adminData);
            } catch (e) {
                console.log('Admin profile updated (no JSON response)');
            }
        }

        showNotification('Settings saved successfully', 'success');

        // Clear password fields
        const passwordInput = document.getElementById('admin-password');
        const confirmInput = document.getElementById('admin-password-confirm');
        if (passwordInput) passwordInput.value = '';
        if (confirmInput) confirmInput.value = '';

        // Reload settings to ensure UI is in sync
        await loadSettings();
        await loadAdminProfile();
    } catch (error) {
        console.error('Error saving settings:', error);
        showNotification(error.message || 'Error saving settings', 'error');
    }
}

/**
 * Show notification message
 */
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background-color: ${type === 'success' ? '#4caf50' : type === 'error' ? '#f44336' : '#2196f3'};
        color: white;
        border-radius: 4px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
    `;
    notification.textContent = message;

    document.body.appendChild(notification);

    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
