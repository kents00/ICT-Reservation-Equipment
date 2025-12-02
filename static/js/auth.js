/**
 * Authentication module for admin dashboard
 * Handles login checks, token verification, logout, and remember me functionality
 */

// Dynamically set API base URL based on environment (local dev or production)
const API_BASE_URL = window.location.origin + '/api';
const REMEMBER_ME_KEY = 'remember_me_enabled';
const REMEMBER_ME_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds

/**
 * Check if user is authenticated and is admin
 * Redirects to login if not authenticated
 * Attempts auto-login if 'Remember Me' was enabled
 */
async function checkAuthentication() {
    const accessToken = localStorage.getItem('access_token');
    const userInfo = localStorage.getItem('user_info');
    const rememberMeEnabled = localStorage.getItem(REMEMBER_ME_KEY) === 'true';

    if (!accessToken || !userInfo) {
        // If Remember Me was enabled, attempt auto-login
        if (rememberMeEnabled) {
            attemptAutoLogin();
        } else {
            redirectToLogin();
        }
        return false;
    }

    try {
        const user = JSON.parse(userInfo);

        // Verify user is admin
        if (user.role !== 'admin' && user.role !== 'ADMIN') {
            console.error('User is not an admin');
            clearAuthAndRedirect();
            return false;
        }

        // Verify token is still valid with backend
        const isValid = await verifyTokenWithBackend(accessToken);
        if (!isValid) {
            clearAuthAndRedirect();
            return false;
        }

        return true;
    } catch (error) {
        console.error('Error parsing user info:', error);
        clearAuthAndRedirect();
        return false;
    }
}

/**
 * Verify token validity with backend
 */
async function verifyTokenWithBackend(token) {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/profile`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            console.error('Token verification failed:', response.status);
            return false;
        }

        const data = await response.json();

        // Update user info if it's changed
        if (data) {
            localStorage.setItem('user_info', JSON.stringify(data));
        }

        return true;
    } catch (error) {
        console.error('Token verification error:', error);
        return false;
    }
}

/**
 * Clear all auth data and redirect to login
 * Used when token is invalid or expired
 */
function clearAuthAndRedirect() {
    console.log('Clearing invalid authentication data');
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_info');
    localStorage.removeItem(REMEMBER_ME_KEY);
    localStorage.removeItem('remember_me_timestamp');
    sessionStorage.removeItem('temp_credentials');
    redirectToLogin();
}

/**
 * Get the current access token
 */
function getAccessToken() {
    return localStorage.getItem('access_token');
}

/**
 * Get the current user info
 */
function getUserInfo() {
    const userInfo = localStorage.getItem('user_info');
    if (userInfo) {
        try {
            return JSON.parse(userInfo);
        } catch (error) {
            console.error('Error parsing user info:', error);
            return null;
        }
    }
    return null;
}

/**
 * Update user display in dashboard
 */
function updateUserDisplay() {
    const user = getUserInfo();
    if (user) {
        const userNameElements = document.querySelectorAll('.user-name, .username-display');
        userNameElements.forEach(element => {
            element.textContent = user.full_name || user.username || 'Admin';
        });

        const userEmailElements = document.querySelectorAll('.user-email, .email-display');
        userEmailElements.forEach(element => {
            element.textContent = user.email || '';
        });
    }
}

/**
 * Logout user
 */
function logout() {
    console.log('Logging out user - clearing auth data');

    // Clear all authentication data immediately
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_info');
    localStorage.removeItem(REMEMBER_ME_KEY);
    localStorage.removeItem('remember_me_timestamp');
    sessionStorage.removeItem('temp_credentials');
    sessionStorage.removeItem('2fa_user_id');

    console.log('Auth data cleared, redirecting to login...');

    // Force page to reload at login with no cache
    globalThis.location.href = '/admin/login?t=' + Date.now();
}

/**
 * Redirect to login page
 */
function redirectToLogin() {
    globalThis.location.href = '/admin/login';
}

/**
 * Make API request with authentication
 */
function makeAuthenticatedRequest(endpoint, options = {}) {
    const token = getAccessToken();

    if (!token) {
        redirectToLogin();
        return Promise.reject(new Error('No authentication token'));
    }

    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers
    };

    return fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers
    })
        .then(response => {
            // If unauthorized, redirect to login
            if (response.status === 401) {
                redirectToLogin();
                return Promise.reject(new Error('Unauthorized'));
            }
            return response;
        });
}

/**
 * Initialize authentication on page load
 */
document.addEventListener('DOMContentLoaded', async function () {
    // If on login page, check if already authenticated
    if (globalThis.location.pathname.includes('/admin/login')) {
        const accessToken = localStorage.getItem('access_token');
        const userInfo = localStorage.getItem('user_info');

        if (accessToken && userInfo) {
            try {
                const user = JSON.parse(userInfo);
                // Verify token is still valid
                const isValid = await verifyTokenWithBackend(accessToken);
                if (isValid && (user.role === 'admin' || user.role === 'ADMIN')) {
                    globalThis.location.href = '/admin/dashboard';
                    return;
                } else {
                    // Clear invalid data
                    clearAuthAndRedirect();
                }
            } catch (error) {
                // Invalid stored data, clear it
                clearAuthAndRedirect();
            }
        }
    } else {
        // Check authentication on pages other than login
        await checkAuthentication();
        updateUserDisplay();
    }
});

/**
 * Handle logout button click
 */
function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
        console.log('User confirmed logout');
        logout();
    }
    return false;
}

// Expose logout functions globally
globalThis.handleLogout = handleLogout;
globalThis.logout = logout;

/**
 * Save Remember Me preference and token metadata
 * @param {boolean} rememberMe - Whether to enable Remember Me
 */
function saveRememberMePreference(rememberMe) {
    if (rememberMe) {
        localStorage.setItem(REMEMBER_ME_KEY, 'true');
        localStorage.setItem('remember_me_timestamp', new Date().getTime().toString());
    } else {
        localStorage.removeItem(REMEMBER_ME_KEY);
        localStorage.removeItem('remember_me_timestamp');
    }
}

/**
 * Check if Remember Me is still valid (within 30 days)
 * @returns {boolean} True if Remember Me is still valid
 */
function isRememberMeValid() {
    const rememberMeEnabled = localStorage.getItem(REMEMBER_ME_KEY) === 'true';
    const timestamp = localStorage.getItem('remember_me_timestamp');

    if (!rememberMeEnabled || !timestamp) {
        return false;
    }

    const savedTime = parseInt(timestamp, 10);
    const currentTime = new Date().getTime();
    const elapsed = currentTime - savedTime;

    // Check if 30 days have passed
    if (elapsed > REMEMBER_ME_DURATION) {
        // Remember Me expired, clear it
        logout();
        return false;
    }

    return true;
}

/**
 * Attempt automatic login using stored Remember Me data
 * This is called when accessing the dashboard without active tokens
 */
function attemptAutoLogin() {
    // Check if Remember Me is still valid
    if (!isRememberMeValid()) {
        redirectToLogin();
        return;
    }

    // Token should still be in localStorage from Remember Me
    const accessToken = localStorage.getItem('access_token');
    const userInfo = localStorage.getItem('user_info');

    if (accessToken && userInfo) {
        try {
            const user = JSON.parse(userInfo);
            if (user.role === 'admin' || user.role === 'ADMIN') {
                // Verify token with backend
                verifyTokenWithBackend(accessToken);
                return true;
            }
        } catch (error) {
            console.error('Error during auto-login:', error);
        }
    }

    // If auto-login fails, redirect to login
    redirectToLogin();
    return false;
}

/**
 * Check if user has Remember Me enabled
 * @returns {boolean} True if Remember Me is enabled and valid
 */
function hasRememberMeEnabled() {
    return localStorage.getItem(REMEMBER_ME_KEY) === 'true' && isRememberMeValid();
}

/**
 * Get Remember Me checkbox status from login form
 * @returns {boolean} True if Remember Me checkbox is checked
 */
function isRememberMeChecked() {
    const rememberCheckbox = document.querySelector('input[name="remember"]');
    return rememberCheckbox ? rememberCheckbox.checked : false;
}

/**
 * Restore Remember Me checkbox state on login page
 */
function restoreRememberMeCheckbox() {
    const rememberCheckbox = document.querySelector('input[name=\"remember\"]');
    if (rememberCheckbox && hasRememberMeEnabled()) {
        rememberCheckbox.checked = true;
    }
}

// ===========================
// Two-Factor Authentication
// ===========================

/**
 * Show 2FA verification popup
 * @param {string} userId - User ID for verification
 * @param {string} maskedEmail - Masked email address
 */
function show2FAPopup(userId, maskedEmail) {
    console.log('Showing 2FA popup for user:', userId);

    // Store user ID temporarily for verification
    sessionStorage.setItem('2fa_user_id', userId);

    // Hide login form
    const loginForm = document.querySelector('.login-form');
    if (loginForm) {
        loginForm.style.display = 'none';
    }

    // Show 2FA popup
    const popup = document.getElementById('twoFactorPopup');
    if (popup) {
        popup.style.display = 'flex';

        // Update email display
        const emailSpan = document.getElementById('verificationEmail');
        if (emailSpan) {
            emailSpan.textContent = maskedEmail;
        }

        // Start countdown timer
        start2FACountdown(10 * 60); // 10 minutes in seconds

        // Focus on first input
        const firstInput = document.querySelector('.code-input');
        if (firstInput) {
            firstInput.focus();
        }
    }
}

/**
 * Hide 2FA verification popup
 */
function hide2FAPopup() {
    const popup = document.getElementById('twoFactorPopup');
    if (popup) {
        popup.style.display = 'none';
    }

    // Show login form again
    const loginForm = document.querySelector('.login-form');
    if (loginForm) {
        loginForm.style.display = 'block';
    }

    // Clear stored user ID
    sessionStorage.removeItem('2fa_user_id');

    // Clear input fields
    document.querySelectorAll('.code-input').forEach(input => input.value = '');
}

/**
 * Start countdown timer for 2FA code expiry
 * @param {number} seconds - Seconds until expiry
 */
function start2FACountdown(seconds) {
    const timerElement = document.getElementById('codeTimer');
    if (!timerElement) return;

    let remaining = seconds;

    const updateTimer = () => {
        const minutes = Math.floor(remaining / 60);
        const secs = remaining % 60;
        timerElement.textContent = `${minutes}:${secs.toString().padStart(2, '0')}`;

        if (remaining <= 0) {
            timerElement.textContent = 'Code expired';
            timerElement.style.color = '#FF3B30';
            return;
        }

        remaining--;
        setTimeout(updateTimer, 1000);
    };

    updateTimer();
}

/**
 * Submit 2FA verification code
 */
async function submit2FACode() {
    const userId = sessionStorage.getItem('2fa_user_id');
    if (!userId) {
        show2FAMessage('Session expired. Please login again.', 'error');
        setTimeout(() => {
            hide2FAPopup();
        }, 2000);
        return;
    }

    // Get code from input fields
    const inputs = document.querySelectorAll('.code-input');
    const code = Array.from(inputs).map(input => input.value).join('');

    if (code.length !== 6) {
        show2FAMessage('Please enter the complete 6-digit code.', 'error');
        return;
    }

    // Disable submit button
    const submitBtn = document.getElementById('verify2FABtn');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Verifying...';
    }

    try {
        const response = await fetch(`${API_BASE_URL}/auth/verify-2fa`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                user_id: userId,
                code: code
            })
        });

        const data = await response.json();

        if (response.ok) {
            // Verification successful
            show2FAMessage('Verification successful! Redirecting...', 'success');

            // Store token and user info
            localStorage.setItem('access_token', data.access_token);
            localStorage.setItem('user_info', JSON.stringify(data.user));

            // Check if Remember Me was selected
            const rememberCheckbox = document.querySelector('input[name=\"remember\"]');
            if (rememberCheckbox && rememberCheckbox.checked) {
                saveRememberMePreference(true);
            }

            // Redirect to dashboard
            setTimeout(() => {
                globalThis.location.href = '/admin/dashboard';
            }, 1000);
        } else {
            // Verification failed
            if (data.locked) {
                show2FAMessage(data.error, 'error');
                setTimeout(() => {
                    hide2FAPopup();
                }, 3000);
            } else if (data.expired) {
                show2FAMessage('Code expired. Please request a new code.', 'error');
            } else {
                show2FAMessage(data.error || 'Invalid verification code.', 'error');
                // Clear inputs
                inputs.forEach(input => input.value = '');
                inputs[0].focus();
            }

            // Re-enable submit button
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Verify';
            }
        }
    } catch (error) {
        console.error('2FA verification error:', error);
        show2FAMessage('Network error. Please try again.', 'error');

        // Re-enable submit button
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Verify';
        }
    }
}

/**
 * Resend 2FA verification code
 */
async function resend2FACode() {
    const userId = sessionStorage.getItem('2fa_user_id');
    if (!userId) {
        show2FAMessage('Session expired. Please login again.', 'error');
        return;
    }

    const resendBtn = document.getElementById('resend2FABtn');
    if (resendBtn) {
        resendBtn.disabled = true;
        resendBtn.textContent = 'Sending...';
    }

    try {
        const response = await fetch(`${API_BASE_URL}/auth/resend-2fa`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                user_id: userId
            })
        });

        const data = await response.json();

        if (response.ok) {
            show2FAMessage('New verification code sent to your email.', 'success');
            // Restart countdown
            start2FACountdown(10 * 60);
            // Clear inputs
            document.querySelectorAll('.code-input').forEach(input => input.value = '');
            document.querySelector('.code-input').focus();
        } else {
            show2FAMessage(data.error || 'Failed to resend code.', 'error');
        }
    } catch (error) {
        console.error('Resend 2FA error:', error);
        show2FAMessage('Network error. Please try again.', 'error');
    } finally {
        if (resendBtn) {
            resendBtn.disabled = false;
            resendBtn.textContent = 'Resend Code';
        }
    }
}

/**
 * Show message in 2FA popup
 * @param {string} message - Message to display
 * @param {string} type - Message type ('success' or 'error')
 */
function show2FAMessage(message, type) {
    const messageDiv = document.getElementById('twoFactorMessage');
    if (messageDiv) {
        messageDiv.textContent = message;
        messageDiv.className = `verification-message ${type}`;
        messageDiv.style.display = 'block';

        // Auto-hide success messages
        if (type === 'success') {
            setTimeout(() => {
                messageDiv.style.display = 'none';
            }, 3000);
        }
    }
}

/**
 * Handle input in 2FA code fields - auto-advance to next field
 */
function handle2FAInput(event, index) {
    const input = event.target;
    const value = input.value;

    // Only allow digits
    if (value && !/^\d$/.test(value)) {
        input.value = '';
        return;
    }

    // Auto-advance to next field
    if (value && index < 5) {
        const nextInput = document.querySelectorAll('.code-input')[index + 1];
        if (nextInput) {
            nextInput.focus();
        }
    }

    // Auto-submit when all 6 digits are entered
    const allInputs = document.querySelectorAll('.code-input');
    const allFilled = Array.from(allInputs).every(inp => inp.value.length === 1);
    if (allFilled) {
        // Small delay before auto-submit
        setTimeout(() => submit2FACode(), 300);
    }
}

/**
 * Handle backspace in 2FA code fields - move to previous field
 */
function handle2FAKeydown(event, index) {
    if (event.key === 'Backspace' && !event.target.value && index > 0) {
        const prevInput = document.querySelectorAll('.code-input')[index - 1];
        if (prevInput) {
            prevInput.focus();
            prevInput.select();
        }
    }
}
