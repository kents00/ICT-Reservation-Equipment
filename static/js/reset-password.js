// Reset Password Page JavaScript

const API_BASE_URL = window.location.origin;
let verifiedToken = '';

document.addEventListener('DOMContentLoaded', function () {
    // Get token from URL
    const urlParams = new URLSearchParams(window.location.search);
    verifiedToken = urlParams.get('token');

    if (!verifiedToken) {
        showMessage('Invalid reset link. Please request a new password reset.', 'error');
        setTimeout(() => {
            window.location.href = '/admin/forgot-password';
        }, 3000);
        return;
    }

    const resetPasswordForm = document.getElementById('resetPasswordForm');
    const newPasswordInput = document.getElementById('newPassword');
    const confirmPasswordInput = document.getElementById('confirmPassword');

    if (resetPasswordForm) {
        resetPasswordForm.addEventListener('submit', handleResetPassword);
    }

    // Real-time password validation
    if (newPasswordInput) {
        newPasswordInput.addEventListener('input', validatePassword);
    }

    if (confirmPasswordInput) {
        confirmPasswordInput.addEventListener('input', validatePassword);
    }
});

function validatePassword() {
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    const reqLength = document.getElementById('req-length');
    const reqMatch = document.getElementById('req-match');
    const resetBtn = document.getElementById('resetBtn');

    // Check length requirement
    if (newPassword.length >= 6) {
        reqLength.classList.add('valid');
        reqLength.classList.remove('invalid');
    } else if (newPassword.length > 0) {
        reqLength.classList.add('invalid');
        reqLength.classList.remove('valid');
    } else {
        reqLength.classList.remove('valid', 'invalid');
    }

    // Check passwords match
    if (confirmPassword.length > 0) {
        if (newPassword === confirmPassword && newPassword.length >= 6) {
            reqMatch.classList.add('valid');
            reqMatch.classList.remove('invalid');
        } else {
            reqMatch.classList.add('invalid');
            reqMatch.classList.remove('valid');
        }
    } else {
        reqMatch.classList.remove('valid', 'invalid');
    }

    // Enable/disable submit button
    const isValid = newPassword.length >= 6 && newPassword === confirmPassword;
    resetBtn.disabled = !isValid;
}

function togglePasswordVisibility(fieldId) {
    const passwordField = document.getElementById(fieldId);
    const button = passwordField.parentElement.querySelector('.toggle-password');
    const eyeIcon = button.querySelector('.eye-icon');

    if (passwordField.type === 'password') {
        passwordField.type = 'text';
        eyeIcon.innerHTML = `
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
            <line x1="1" y1="1" x2="23" y2="23"></line>
        `;
    } else {
        passwordField.type = 'password';
        eyeIcon.innerHTML = `
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
        `;
    }
}

function handleResetPassword(e) {
    e.preventDefault();

    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    // Validation
    if (newPassword.length < 6) {
        showMessage('Password must be at least 6 characters long', 'error');
        return;
    }

    if (newPassword !== confirmPassword) {
        showMessage('Passwords do not match', 'error');
        return;
    }

    const resetBtn = document.getElementById('resetBtn');
    resetBtn.disabled = true;
    resetBtn.innerHTML = '<span>Resetting Password...</span>';

    // Send request to backend
    fetch(`${API_BASE_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            token: verifiedToken,
            new_password: newPassword
        })
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showMessage('Password reset successfully! Redirecting to login...', 'success');

                // Clear form
                document.getElementById('newPassword').value = '';
                document.getElementById('confirmPassword').value = '';

                // Redirect to login after 2 seconds
                setTimeout(() => {
                    window.location.href = '/admin/login';
                }, 2000);
            } else {
                showMessage(data.message || 'Failed to reset password. Please try again.', 'error');

                // If token expired, redirect to forgot password page
                if (data.message && data.message.includes('expired')) {
                    setTimeout(() => {
                        window.location.href = '/admin/forgot-password';
                    }, 3000);
                }
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showMessage('An error occurred. Please try again.', 'error');
        })
        .finally(() => {
            resetBtn.disabled = false;
            resetBtn.innerHTML = `
            <span>Reset Password</span>
            <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
        `;
        });
}

function showMessage(message, type) {
    const messageDiv = document.getElementById('resetPasswordMessage');
    messageDiv.textContent = message;
    messageDiv.className = `login-message ${type}`;
    messageDiv.style.display = 'block';

    // Auto-hide success messages after 5 seconds
    if (type === 'success') {
        setTimeout(() => {
            messageDiv.style.display = 'none';
        }, 5000);
    }
}
