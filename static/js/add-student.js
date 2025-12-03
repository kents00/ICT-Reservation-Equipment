// Add Student Form Handler
document.addEventListener('DOMContentLoaded', function () {
    setupProfileImageUpload();
    setupFormValidation();
    setupFormSubmission();
});

/**
 * Setup profile image upload functionality
 */
function setupProfileImageUpload() {
    const profileImageInput = document.getElementById('profile-image');
    const profilePreview = document.getElementById('profile-preview');
    const profilePlaceholder = document.getElementById('profile-placeholder');
    const removeImageBtn = document.getElementById('remove-image-btn');

    profileImageInput.addEventListener('change', function (e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (event) {
                profilePreview.src = event.target.result;
                profilePreview.style.display = 'block';
                profilePlaceholder.style.display = 'none';
                removeImageBtn.style.display = 'inline-block';
            };
            reader.readAsDataURL(file);
        }
    });

    removeImageBtn.addEventListener('click', function () {
        profileImageInput.value = '';
        profilePreview.src = '';
        profilePreview.style.display = 'none';
        profilePlaceholder.style.display = 'flex';
        removeImageBtn.style.display = 'none';
    });
}

/**
 * Setup form validation
 */
function setupFormValidation() {
    const form = document.getElementById('addStudentForm');
    const inputs = form.querySelectorAll('input, select');

    inputs.forEach(input => {
        input.addEventListener('focus', function () {
            this.style.borderColor = '#007AFF';
            this.style.boxShadow = '0 0 0 3px rgba(0, 122, 255, 0.1)';
        });

        input.addEventListener('blur', function () {
            this.style.borderColor = '#e5e5ea';
            this.style.boxShadow = 'none';
            validateField(this);
        });

        input.addEventListener('input', function () {
            if (this.classList.contains('error')) {
                validateField(this);
            }
        });
    });
}

/**
 * Validate a single field
 */
function validateField(field) {
    const value = field.value.trim();

    if (field.hasAttribute('required') && !value) {
        field.classList.add('error');
        return false;
    }

    if (field.type === 'email' && value && !isValidEmail(value)) {
        field.classList.add('error');
        return false;
    }

    if (field.id === 'student-confirmpassword') {
        const password = document.getElementById('student-password').value;
        if (value && value !== password) {
            field.classList.add('error');
            return false;
        }
    }

    field.classList.remove('error');
    return true;
}

/**
 * Validate email format
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Setup form submission
 */
function setupFormSubmission() {
    const form = document.getElementById('addStudentForm');

    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        // Validate all fields
        const inputs = form.querySelectorAll('input[required], select[required]');
        let isValid = true;

        inputs.forEach(input => {
            if (!validateField(input)) {
                isValid = false;
            }
        });

        // Validate password match
        const password = document.getElementById('student-password').value;
        const confirmPassword = document.getElementById('student-confirmpassword').value;

        if (password !== confirmPassword) {
            showError('Passwords do not match!');
            document.getElementById('student-confirmpassword').classList.add('error');
            isValid = false;
        }

        if (!isValid) {
            showError('Please fill in all required fields correctly.');
            return;
        }

        // Submit the form
        await submitForm();
    });
}

/**
 * Submit the form to the backend
 */
async function submitForm() {
    const form = document.getElementById('addStudentForm');
    const formData = new FormData(form);

    try {
        const response = await fetch('/admin/students/add', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (response.ok) {
            showSuccess('Student account created successfully!');
            setTimeout(() => {
                window.location.href = '/admin/users';
            }, 1500);
        } else {
            showError(data.message || 'Failed to create student account.');
        }
    } catch (error) {
        console.error('Error:', error);
        showError('An error occurred while creating the student account.');
    }
}

/**
 * Show success modal
 */
function showSuccess(message) {
    const modal = document.getElementById('successModal');
    document.getElementById('successMessage').textContent = message;
    modal.style.display = 'flex';
}

/**
 * Show error modal
 */
function showError(message) {
    const modal = document.getElementById('errorModal');
    document.getElementById('errorMessage').textContent = message;
    modal.style.display = 'flex';
}

/**
 * Close modal
 */
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.style.display = 'none';

    if (modalId === 'successModal') {
        window.location.href = '/admin/users';
    }
}

/**
 * Go back to users page
 */
function goBackToUsers() {
    if (confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {
        window.location.href = '/admin/users';
    }
}

// Close modals when clicking outside
document.addEventListener('click', function (event) {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
});
