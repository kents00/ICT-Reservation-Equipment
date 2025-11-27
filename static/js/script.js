// Login Page Functions
function togglePassword() {
    const passwordField = document.getElementById('password');
    if (passwordField.type === 'password') {
        passwordField.type = 'text';
    } else {
        passwordField.type = 'password';
    }
}

document.addEventListener('DOMContentLoaded', function () {
    console.log('DOM Content Loaded - script.js');

    const loginForm = document.getElementById('loginForm');
    console.log('Login form found:', !!loginForm);

    if (loginForm) {
        // Restore Remember Me checkbox state
        if (typeof restoreRememberMeCheckbox === 'function') {
            restoreRememberMeCheckbox();
        }

        loginForm.addEventListener('submit', function (e) {
            console.log('Form submit event triggered');
            e.preventDefault();
            handleLogin();
            return false;
        });

        console.log('Login form event listener attached');
    }

    // Initialize dashboard navigation
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', function (e) {
            const section = this.dataset.section || this.getAttribute('data-section');

            // If the target section exists on the current page, handle client-side navigation
            const targetId = section ? `${section}-section` : null;
            const targetSection = targetId ? document.getElementById(targetId) : null;

            if (targetSection) {
                e.preventDefault();
                navigateToSection(section);
                // update URL to reflect section without reloading (optional)
                const href = this.getAttribute('href');
                if (href) {
                    try { history.replaceState(null, '', href); } catch (err) { /* ignore */ }
                }
            }
            // otherwise allow the link to perform a normal navigation to the server route
        });
    });

    // Handle URL parameters for section navigation
    const params = new URLSearchParams(globalThis.location.search);
    const section = params.get('section');
    if (section) {
        navigateToSection(section);
    }
});

function handleLogin() {
    console.log('handleLogin called');

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    // Check if isRememberMeChecked is available from auth.js
    let rememberMe = false;
    if (typeof isRememberMeChecked === 'function') {
        rememberMe = isRememberMeChecked();
    } else {
        // Fallback if auth.js hasn't loaded yet
        const rememberCheckbox = document.querySelector('input[name="remember"]');
        rememberMe = rememberCheckbox ? rememberCheckbox.checked : false;
    }

    console.log('Login attempt:', { username, rememberMe });

    // Validation
    if (!username || !password) {
        showMessage('Please enter both username and password', 'error');
        return;
    }

    // Disable form submission
    const submitBtn = document.querySelector('.btn-login');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Signing in...';

    console.log('Sending login request to:', `${API_BASE_URL}/auth/login`);

    // Call Flask API
    fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            username: username,
            password: password
        })
    })
        .then(response => {
            console.log('Response status:', response.status);
            console.log('Response headers:', response.headers);

            if (!response.ok) {
                console.error('HTTP error! status:', response.status);
                return response.json().then(data => {
                    throw new Error(data.error || `HTTP error! status: ${response.status}`);
                });
            }
            return response.json();
        })
        .then(data => {
            console.log('Login response:', data);

            // Check if 2FA is required
            if (data.requires_2fa) {
                showMessage('Verification code sent to your email', 'success');

                // Show 2FA popup (function from auth.js)
                if (typeof show2FAPopup === 'function') {
                    setTimeout(() => {
                        show2FAPopup(data.user_id, data.email);
                    }, 1000);
                } else {
                    console.error('show2FAPopup function not available');
                    showMessage('2FA setup error. Please refresh and try again.', 'error');
                }

                // Re-enable submit button
                submitBtn.disabled = false;
                submitBtn.textContent = 'Sign In';
                return;
            }

            if (data.access_token && data.user) {
                // Check if user is admin
                if (data.user.role === 'admin' || data.user.role === 'ADMIN') {
                    showMessage('Login successful! Redirecting...', 'success');

                    // Store token and user info in localStorage
                    localStorage.setItem('access_token', data.access_token);
                    localStorage.setItem('user_info', JSON.stringify(data.user));

                    // Save Remember Me preference
                    if (typeof saveRememberMePreference === 'function') {
                        saveRememberMePreference(rememberMe);
                    } else if (rememberMe) {
                        // Fallback if auth.js hasn't loaded
                        localStorage.setItem('remember_me_enabled', 'true');
                        localStorage.setItem('remember_me_timestamp', Date.now().toString());
                    }

                    // Redirect to dashboard after a short delay
                    setTimeout(() => {
                        globalThis.location.href = '/admin/dashboard';
                    }, 1500);
                } else {
                    showMessage('Access denied. Admin privileges required.', 'error');
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Sign In';
                }
            } else {
                showMessage(data.error || 'Login failed. Please try again.', 'error');
                submitBtn.disabled = false;
                submitBtn.textContent = 'Sign In';
            }
        })
        .catch(error => {
            console.error('Login error:', error);
            console.error('Error message:', error.message);
            showMessage('Connection error. Please check if the server is running. ' + error.message, 'error');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Sign In';
        });
}

function showMessage(message, type) {
    const messageDiv = document.getElementById('loginMessage');
    messageDiv.textContent = message;
    messageDiv.className = `login-message ${type}`;
}

// Dashboard Functions
function navigateToSection(sectionName) {
    // Hide all sections
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => {
        section.classList.remove('active');
    });

    // Remove active class from all nav items
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.classList.remove('active');
    });

    // Show selected section
    const sectionId = `${sectionName}-section`;
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
    }

    // Set active nav item
    const activeNavItem = document.querySelector(`[data-section="${sectionName}"]`);
    if (activeNavItem) {
        activeNavItem.classList.add('active');
    }

    // Update page title
    const titleMap = {
        'dashboard': 'Dashboard',
        'equipment': 'Equipment Management',
        'reservations': 'Reservations',
        'approvals': 'Pending Approvals',
        'users': 'Users Management',
        'reports': 'Reports',
        'settings': 'Settings'
    };

    const pageTitle = document.querySelector('.page-title');
    if (pageTitle) {
        pageTitle.textContent = titleMap[sectionName] || 'Dashboard';
    }
}

function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    sidebar.classList.toggle('active');
}

// Logout is now handled entirely by auth.js
// This ensures no conflicts between script.js and auth.js

// Equipment Management
function addEquipment() {
    window.location.href = 'add-equipment.html';
}

function editEquipment(id) {
    // Map equipment row ID to Equipment ID
    const equipmentIdMap = {
        '1': 'EQ001',
        '2': 'EQ002',
        '3': 'EQ003',
        '4': 'EQ004'
    };

    const equipmentId = equipmentIdMap[id] || `EQ${id}`;
    window.location.href = `edit-equipment.html?id=${equipmentId}`;
}

function deleteEquipment(id) {
    if (confirm('Are you sure you want to delete this equipment?')) {
        alert(`Equipment ${id} deleted successfully`);
        // In a real application, this would make an API call to delete the equipment
    }
}

// Reservation Management
function viewReservation(id) {
    // Map reservation row ID to Reservation ID
    const reservationIdMap = {
        '1': 'RES001',
        '2': 'RES002',
        '3': 'RES003'
    };

    const reservationId = reservationIdMap[id] || `RES${id}`;
    globalThis.location.href = `view-reservation.html?id=${reservationId}`;
}

// Approval Management
function approveRequest(id) {
    if (confirm('Are you sure you want to approve this request?')) {
        alert(`Request ${id} approved successfully`);
        // Remove the approval card or update its status
        const card = event.target.closest('.approval-card');
        if (card) {
            card.remove();
        }
    }
}

function rejectRequest(id) {
    if (confirm('Are you sure you want to reject this request?')) {
        alert(`Request ${id} rejected successfully`);
        // Remove the approval card or update its status
        const card = event.target.closest('.approval-card');
        if (card) {
            card.remove();
        }
    }
}

// User Management
function addUser() {
    alert('Modal: Add New User Form');
    // In a real application, this would open a modal with a form
}

function editUser(id) {
    // Map user row ID to User ID
    const userIdMap = {
        '1': 'STU001',
        '2': 'ADM001'
    };

    const userId = userIdMap[id] || `USER${id}`;
    globalThis.location.href = `edit-user.html?id=${userId}`;
}

function deleteUser(id) {
    if (confirm('Are you sure you want to delete this user?')) {
        alert(`User ${id} deleted successfully`);
        // In a real application, this would make an API call to delete the user
    }
}

// Reports
function generateReport() {
    alert('Generating report...');
    // In a real application, this would generate a report and download it
}

function viewReport(reportType) {
    alert(`Viewing ${reportType} report`);
    // In a real application, this would display the report
}

// Settings
function saveSettings() {
    alert('Settings saved successfully!');
    // In a real application, this would make an API call to save settings
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function () {
    // Set dashboard as active section on page load
    const dashboardSection = document.getElementById('dashboard-section');
    if (dashboardSection) {
        dashboardSection.classList.add('active');
    }

    // Check if we're on the login page and handle form submission
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function (e) {
            e.preventDefault();
            handleLogin();
        });
    }

    // Simulate chart rendering (in a real app, use Chart.js or similar)
    const reservationChart = document.getElementById('reservationChart');
    if (reservationChart) {
        // Placeholder for chart - would be replaced with actual charting library
        console.log('Chart initialized');
    }
});

// Close user dropdown when clicking outside
document.addEventListener('click', function (event) {
    const userMenu = document.querySelector('.user-menu');
    if (userMenu && !userMenu.contains(event.target)) {
        const dropdown = userMenu.querySelector('.user-dropdown');
        if (dropdown) {
            dropdown.style.display = 'none';
        }
    }
});

// Make user dropdown toggle work on click
document.addEventListener('DOMContentLoaded', function () {
    const userAvatar = document.querySelector('.user-avatar');
    if (userAvatar) {
        userAvatar.addEventListener('click', function (e) {
            const dropdown = this.parentElement.querySelector('.user-dropdown');
            if (dropdown) {
                dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
            }
        });
    }
});

// Notification handling
function handleNotifications() {
    const notificationBtn = document.querySelector('.notification-btn');
    if (notificationBtn) {
        notificationBtn.addEventListener('click', function () {
            alert('You have 3 new notifications');
            // In a real application, this would show a notification panel
        });
    }
}

// Search functionality
function initializeSearch() {
    const searchInput = document.querySelector('.search-bar input');
    if (searchInput) {
        searchInput.addEventListener('input', function (e) {
            const searchQuery = e.target.value;
            console.log('Searching for:', searchQuery);
            // In a real application, this would filter the current table/list
        });
    }
}

// Notification Badge Initialization
function initializeNotificationBadge() {
    const token = localStorage.getItem('access_token');
    if (!token) return; // User not logged in

    fetch('/api/admin/notifications', {
        headers: { 'Authorization': `Bearer ${token}` }
    })
        .then(response => {
            if (!response.ok) throw new Error('Failed to fetch notifications');
            return response.json();
        })
        .then(data => {
            // Count unread and not dismissed notifications
            const dismissed = JSON.parse(localStorage.getItem('dismissed_notifications') || '[]');
            const unreadCount = (data.notifications || [])
                .filter(n => !n.read && !dismissed.includes(n.id))
                .length;

            const badge = document.querySelector('.notification-badge');
            if (badge) {
                badge.textContent = unreadCount || '0';
            }
        })
        .catch(err => {
            console.error('Error initializing notification badge:', err);
        });
}

// Initialize all functionalities
document.addEventListener('DOMContentLoaded', function () {
    handleNotifications();
    initializeSearch();
    initializeNotificationBadge();
});

// Export Report Functions
function exportReport(reportType, format) {
    const reportData = getReportData(reportType);

    if (format === 'excel') {
        exportToExcel(reportData, reportType);
    } else if (format === 'pdf') {
        exportToPDF(reportData, reportType);
    }
}

function getReportData(reportType) {
    const reportDataMap = {
        'utilization': {
            title: 'Equipment Utilization Report',
            data: [
                ['Equipment Type', 'Usage Rate', 'Available Units'],
                ['Laptops', '78%', '32/48'],
                ['Microscopes', '85%', '20/24'],
                ['Cameras', '65%', '26/40'],
                ['Oscilloscopes', '72%', '14/20'],
                ['Other', '80%', '28/35']
            ],
            stats: ['Overall Utilization: 78%', 'Available Units: 32/48']
        },
        'trends': {
            title: 'Reservation Trends Report',
            data: [
                ['Week', 'Reservations', 'Peak Day', 'Avg Daily'],
                ['Week 1', '18', 'Nov 8', '2.6'],
                ['Week 2', '22', 'Nov 12', '3.1'],
                ['Week 3', '20', 'Nov 18', '2.9'],
                ['Week 4', '27', 'Nov 22', '3.9'],
                ['Current', '20', 'Nov 22', '2.9']
            ],
            stats: ['Total Reservations: 87', 'Peak Day: Nov 18']
        },
        'overdue': {
            title: 'Overdue Equipment Report',
            data: [
                ['Duration', 'Count', 'Percentage'],
                ['0-7 days', '12', '60%'],
                ['7-14 days', '2', '10%'],
                ['14+ days', '12', '30%']
            ],
            stats: ['Total Overdue Items: 4', 'Critical Items: 12']
        },
        'activity': {
            title: 'User Activity Report',
            data: [
                ['Student ID', 'Reservations', 'Active', 'Status'],
                ['STU001', '24', 'Yes', 'Regular'],
                ['STU002', '18', 'Yes', 'Regular'],
                ['STU003', '22', 'Yes', 'Regular'],
                ['STU004', '17', 'No', 'Inactive']
            ],
            stats: ['Active Users: 12', 'Avg Reservations: 7.25']
        }
    };

    return reportDataMap[reportType] || reportDataMap['utilization'];
}

function exportToExcel(reportData, reportType) {
    let csv = reportData.title + '\n\n';

    // Add data rows
    reportData.data.forEach(row => {
        csv += row.join(',') + '\n';
    });

    // Add stats
    csv += '\n';
    reportData.stats.forEach(stat => {
        csv += stat + '\n';
    });

    // Create blob and download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', reportType + '_report_' + new Date().toISOString().slice(0, 10) + '.csv');
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function exportToPDF(reportData, reportType) {
    // Create a simple PDF content
    let pdfContent = `
%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /Resources 4 0 R /MediaBox [0 0 612 792] /Contents 5 0 R >>
endobj
4 0 obj
<< /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >>
endobj
5 0 obj
<< /Length 500 >>
stream
BT
/F1 20 Tf
50 750 Td
(${reportData.title}) Tj
ET
BT
/F1 12 Tf
50 700 Td
(Report Generated: ${new Date().toLocaleDateString()}) Tj
ET
endstream
endobj
xref
0 6
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000206 00000 n
0000000311 00000 n
trailer
<< /Size 6 /Root 1 0 R >>
startxref
863
%%EOF
    `;

    // For a more robust PDF export, consider using a library like jsPDF
    // This is a simplified version that creates a basic PDF
    const blob = new Blob([pdfContent], { type: 'application/pdf' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', reportType + '_report_' + new Date().toISOString().slice(0, 10) + '.pdf');
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Search Function
function handleDashboardSearch(event) {
    const searchQuery = event.target.value.trim();
    if (searchQuery.length > 0) {
        // Redirect to search page with query parameter
        window.location.href = 'search.html?q=' + encodeURIComponent(searchQuery);
    }
}
