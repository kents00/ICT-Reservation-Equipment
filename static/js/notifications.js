// Filter notifications by type
function filterNotifications(type) {
    // Update active filter button
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');

    // Filter notification items
    const notifications = document.querySelectorAll('.notification-item');
    notifications.forEach(notification => {
        if (type === 'all') {
            notification.style.display = 'flex';
        } else if (type === 'new') {
            notification.style.display = notification.classList.contains('unread') ? 'flex' : 'none';
        } else {
            // Filter by notification icon class
            const iconClass = notification.querySelector('.notification-icon').className;
            notification.style.display = iconClass.includes(type) ? 'flex' : 'none';
        }
    });
}

// Mark all notifications as read
function markAllAsRead() {
    const unreadNotifications = document.querySelectorAll('.notification-item.unread');
    unreadNotifications.forEach(notification => {
        notification.classList.remove('unread');
        notification.classList.add('read');
    });

    // Update notification badge
    const badge = document.querySelector('.notification-badge');
    if (badge) {
        badge.textContent = '0';
    }
}

// Dismiss notification - will be overridden in DOMContentLoaded
function dismissNotification(button) {
    // This function will be replaced by the one in DOMContentLoaded
}

// View notification details
function viewNotification(section) {
    // Navigate to the related section in dashboard
    window.location.href = `dashboard.html?section=${section}`;
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

// notifications.js - Admin Notifications Functionality

document.addEventListener('DOMContentLoaded', function () {
    const notificationsList = document.getElementById('notifications-list');
    const noNotifications = document.getElementById('no-notifications');

    // Get dismissed notifications from localStorage
    function getDismissedNotifications() {
        const dismissed = localStorage.getItem('dismissed_notifications');
        return dismissed ? JSON.parse(dismissed) : [];
    }

    // Add notification to dismissed list
    function addToDismissed(notificationId) {
        const dismissed = getDismissedNotifications();
        if (!dismissed.includes(notificationId)) {
            dismissed.push(notificationId);
            localStorage.setItem('dismissed_notifications', JSON.stringify(dismissed));
        }
    }

    // Filter out dismissed notifications
    function filterDismissedNotifications(notifications) {
        const dismissed = getDismissedNotifications();
        return notifications.filter(n => !dismissed.includes(n.id));
    }

    // Fetch notifications from API
    async function fetchNotifications() {
        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch('/api/admin/notifications', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to fetch notifications');
            const data = await response.json();

            // Filter out dismissed notifications
            const visibleNotifications = filterDismissedNotifications(data.notifications || []);
            renderNotifications(visibleNotifications);
            updateBadgeCount();
        } catch (err) {
            console.error('Error fetching notifications:', err);
            if (notificationsList) {
                notificationsList.innerHTML = '<p>Error loading notifications.</p>';
            }
        }
    }

    // Update badge count
    async function updateBadgeCount() {
        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch('/api/admin/notifications', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) return;
            const data = await response.json();

            // Count unread and not dismissed notifications
            const dismissed = getDismissedNotifications();
            const unreadCount = (data.notifications || [])
                .filter(n => !n.read && !dismissed.includes(n.id))
                .length;

            const badge = document.querySelector('.notification-badge');
            if (badge) {
                badge.textContent = unreadCount || '0';
            }
        } catch (err) {
            console.error('Error updating badge count:', err);
        }
    }

    // Render notifications
    function renderNotifications(notifications) {
        if (!notificationsList) return;

        if (notifications.length === 0) {
            notificationsList.innerHTML = '';
            if (noNotifications) noNotifications.style.display = 'block';
            return;
        }
        if (noNotifications) noNotifications.style.display = 'none';
        notificationsList.innerHTML = notifications.map(n => notificationItem(n)).join('');
        addNotificationEventListeners();
    }

    // Notification item HTML
    function notificationItem(n) {
        const iconType = getIconType(n.title, n.message);
        return `<div class="notification-item${n.read ? ' read' : ' unread'}${n.muted ? ' muted' : ''}" data-id="${n.id}">
            <div class="notification-icon ${iconType}">
                <i class="${getIconClass(iconType)}"></i>
            </div>
            <div class="notification-content">
                <h4>${escapeHtml(n.title)}</h4>
                <p>${escapeHtml(n.message)}</p>
                <span class="notification-time">${escapeHtml(n.date)}</span>
            </div>
            <div class="notification-actions">
                <button class="btn btn-sm btn-primary view-btn">View</button>
                <button class="btn btn-sm btn-dismiss dismiss-btn">Dismiss</button>
            </div>
        </div>`;
    }

    // Get icon type based on notification content
    function getIconType(title, message) {
        const text = (title + ' ' + message).toLowerCase();
        if (text.includes('approved')) return 'approved';
        if (text.includes('equipment') || text.includes('added')) return 'equipment';
        if (text.includes('returned')) return 'returned';
        if (text.includes('overdue')) return 'overdue';
        if (text.includes('pending') || text.includes('approval')) return 'pending';
        if (text.includes('maintenance')) return 'maintenance';
        if (text.includes('system')) return 'system';
        return 'system';
    }

    // Get icon class based on type
    function getIconClass(type) {
        const icons = {
            'equipment': 'fas fa-cube',
            'approved': 'fas fa-check-circle',
            'returned': 'fas fa-undo',
            'overdue': 'fas fa-exclamation-triangle',
            'pending': 'fas fa-clock',
            'maintenance': 'fas fa-wrench',
            'system': 'fas fa-info-circle'
        };
        return icons[type] || 'fas fa-bell';
    }

    // Add event listeners for notification actions
    function addNotificationEventListeners() {
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.onclick = function () {
                const item = this.closest('.notification-item');
                const id = item.dataset.id;
                // Mark as read when viewing
                toggleRead(id);
                // Navigate to related section (implement as needed)
            };
        });

        document.querySelectorAll('.dismiss-btn').forEach(btn => {
            btn.onclick = async function (e) {
                e.preventDefault();
                const item = this.closest('.notification-item');
                const id = item.dataset.id;
                await dismissNotificationAPI(id, item);
            };
        });
    }

    // Dismiss notification via API
    async function dismissNotificationAPI(id, notificationItem) {
        try {
            // Add to dismissed list in localStorage
            addToDismissed(id);

            // Animate removal
            notificationItem.style.animation = 'slideOut 0.3s ease-in-out forwards';
            setTimeout(() => {
                notificationItem.remove();
                // Update badge count after removing notification
                updateBadgeCount();
                // Check if no notifications left
                if (notificationsList.children.length === 0) {
                    notificationsList.innerHTML = '';
                    if (noNotifications) noNotifications.style.display = 'block';
                }
            }, 300);
        } catch (err) {
            console.error('Error dismissing notification:', err);
            alert('Failed to dismiss notification. Please try again.');
        }
    }

    // Toggle read/unread
    async function toggleRead(id) {
        const token = localStorage.getItem('access_token');
        try {
            await fetch(`/api/admin/notifications/${id}/toggle_read`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchNotifications();
        } catch (err) {
            console.error('Error toggling read status:', err);
        }
    }

    // Escape HTML
    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Initial fetch
    if (notificationsList) {
        fetchNotifications();
    }

    // Make updateBadgeCount globally accessible
    window.updateBadgeCount = updateBadgeCount;
    window.dismissNotificationAPI = dismissNotificationAPI;
});
