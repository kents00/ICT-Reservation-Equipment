// Forgot Password Page JavaScript

const API_BASE_URL = window.location.origin;
let userEmail = '';
let resetToken = '';
let timerInterval;

document.addEventListener('DOMContentLoaded', function () {
    const forgotPasswordForm = document.getElementById('forgotPasswordForm');

    if (forgotPasswordForm) {
        forgotPasswordForm.addEventListener('submit', handleForgotPassword);
    }
});

function handleForgotPassword(e) {
    e.preventDefault();

    const email = document.getElementById('email').value.trim();

    if (!email) {
        showMessage('Please enter your email address', 'error');
        return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showMessage('Please enter a valid email address', 'error');
        return;
    }

    const submitBtn = document.querySelector('.btn-login');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span>Sending...</span>';

    // Send request to backend
    fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email })
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                userEmail = email;
                resetToken = data.reset_token;

                // Show masked email
                const maskedEmail = maskEmail(email);
                document.getElementById('maskedEmail').textContent = maskedEmail;

                // Show hint below email input
                const emailHint = document.getElementById('emailHint');
                emailHint.textContent = `Verification code sent to ${maskedEmail}`;
                emailHint.style.display = 'block';
                emailHint.style.color = 'var(--secondary-color)';

                showMessage('Verification code sent to your email', 'success');

                // Show verification popup after a short delay
                setTimeout(() => {
                    showVerificationPopup();
                }, 1500);
            } else {
                showMessage(data.message || 'Failed to send verification code', 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showMessage('An error occurred. Please try again.', 'error');
        })
        .finally(() => {
            submitBtn.disabled = false;
            submitBtn.innerHTML = `
            <span>Send Reset Code</span>
            <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
        `;
        });
}

function maskEmail(email) {
    const [localPart, domain] = email.split('@');
    const visibleChars = Math.min(2, Math.floor(localPart.length / 2));
    const maskedLocal = localPart.substring(0, visibleChars) + '*'.repeat(localPart.length - visibleChars);
    return `${maskedLocal}@${domain}`;
}

function showVerificationPopup() {
    const popup = document.getElementById('verificationPopup');
    popup.style.display = 'flex';

    // Focus first input
    const firstInput = document.querySelector('.code-input');
    if (firstInput) {
        firstInput.focus();
    }

    // Start timer
    startTimer(600); // 10 minutes
}

function hideVerificationPopup() {
    const popup = document.getElementById('verificationPopup');
    popup.style.display = 'none';

    // Clear inputs
    const inputs = document.querySelectorAll('.code-input');
    inputs.forEach(input => input.value = '');

    // Stop timer
    if (timerInterval) {
        clearInterval(timerInterval);
    }
}

function startTimer(seconds) {
    let timeRemaining = seconds;
    const timerElement = document.getElementById('codeTimer');

    if (timerInterval) {
        clearInterval(timerInterval);
    }

    timerInterval = setInterval(() => {
        const minutes = Math.floor(timeRemaining / 60);
        const secs = timeRemaining % 60;
        timerElement.textContent = `${minutes}:${secs.toString().padStart(2, '0')}`;

        if (timeRemaining <= 0) {
            clearInterval(timerInterval);
            timerElement.textContent = 'Expired';
            showVerificationMessage('Verification code has expired. Please request a new one.', 'error');
            document.getElementById('verifyCodeBtn').disabled = true;
        }

        timeRemaining--;
    }, 1000);
}

function handleVerificationInput(event, index) {
    const input = event.target;
    const value = input.value;

    // Only allow numbers
    if (!/^\d*$/.test(value)) {
        input.value = '';
        return;
    }

    if (value.length === 1 && index < 5) {
        const nextInput = document.querySelectorAll('.code-input')[index + 1];
        if (nextInput) {
            nextInput.focus();
        }
    }
}

function handleVerificationKeydown(event, index) {
    if (event.key === 'Backspace' && !event.target.value && index > 0) {
        const prevInput = document.querySelectorAll('.code-input')[index - 1];
        if (prevInput) {
            prevInput.focus();
        }
    } else if (event.key === 'Enter') {
        submitVerificationCode();
    }
}

function submitVerificationCode() {
    const inputs = document.querySelectorAll('.code-input');
    let code = '';

    inputs.forEach(input => {
        code += input.value;
    });

    if (code.length !== 6) {
        showVerificationMessage('Please enter all 6 digits', 'error');
        return;
    }

    const verifyBtn = document.getElementById('verifyCodeBtn');
    verifyBtn.disabled = true;
    verifyBtn.innerHTML = '<span>Verifying...</span>';

    // Verify code with backend
    fetch(`${API_BASE_URL}/api/auth/verify-reset-code`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            email: userEmail,
            code: code,
            reset_token: resetToken
        })
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showVerificationMessage('Code verified successfully!', 'success');

                // Stop timer
                if (timerInterval) {
                    clearInterval(timerInterval);
                }

                // Redirect to reset password page
                setTimeout(() => {
                    window.location.href = `/admin/reset-password?token=${data.verified_token}`;
                }, 1000);
            } else {
                showVerificationMessage(data.message || 'Invalid verification code', 'error');

                // Clear inputs on error
                inputs.forEach(input => input.value = '');
                inputs[0].focus();
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showVerificationMessage('An error occurred. Please try again.', 'error');
        })
        .finally(() => {
            verifyBtn.disabled = false;
            verifyBtn.innerHTML = `
            <span>Verify Code</span>
            <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
        `;
        });
}

function resendVerificationCode() {
    const resendBtn = document.getElementById('resendCodeBtn');
    resendBtn.disabled = true;
    resendBtn.textContent = 'Sending...';

    fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: userEmail })
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                resetToken = data.reset_token;
                showVerificationMessage('New code sent to your email', 'success');

                // Clear inputs
                const inputs = document.querySelectorAll('.code-input');
                inputs.forEach(input => input.value = '');
                inputs[0].focus();

                // Restart timer
                startTimer(600);

                // Re-enable verify button
                document.getElementById('verifyCodeBtn').disabled = false;
            } else {
                showVerificationMessage(data.message || 'Failed to resend code', 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showVerificationMessage('An error occurred. Please try again.', 'error');
        })
        .finally(() => {
            resendBtn.disabled = false;
            resendBtn.textContent = 'Resend Code';
        });
}

function showMessage(message, type) {
    const messageDiv = document.getElementById('forgotPasswordMessage');
    messageDiv.textContent = message;
    messageDiv.className = `login-message ${type}`;
    messageDiv.style.display = 'block';

    // Auto-hide after 5 seconds
    setTimeout(() => {
        messageDiv.style.display = 'none';
    }, 5000);
}

function showVerificationMessage(message, type) {
    const messageDiv = document.getElementById('verificationMessage');
    messageDiv.textContent = message;
    messageDiv.className = `verification-message ${type}`;
    messageDiv.style.display = 'block';

    // Auto-hide after 5 seconds
    setTimeout(() => {
        messageDiv.style.display = 'none';
    }, 5000);
}
