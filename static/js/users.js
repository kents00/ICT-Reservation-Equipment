// users.js - Handles user management actions for Users Management page

document.addEventListener('DOMContentLoaded', function () {
    let allUsers = [];
    loadStudentUsers();

    // Filter and search event listeners
    document.getElementById('userSearchInput').addEventListener('input', filterAndRenderUsers);
    document.getElementById('departmentFilter').addEventListener('change', filterAndRenderUsers);
    document.getElementById('statusFilter').addEventListener('change', filterAndRenderUsers);

    // Filtering function
    function filterAndRenderUsers() {
        const search = document.getElementById('userSearchInput').value.trim().toLowerCase();
        const department = document.getElementById('departmentFilter').value;
        const status = document.getElementById('statusFilter').value;
        let filtered = allUsers;
        if (department) {
            filtered = filtered.filter(u => (u.department || '').toLowerCase() === department.toLowerCase());
        }
        if (status) {
            filtered = filtered.filter(u => (u.status || '').toLowerCase() === status.toLowerCase());
        }
        if (search) {
            filtered = filtered.filter(u => {
                return (
                    (u.username && u.username.toLowerCase().includes(search)) ||
                    (u.first_name && u.first_name.toLowerCase().includes(search)) ||
                    (u.middle_name && u.middle_name.toLowerCase().includes(search)) ||
                    (u.last_name && u.last_name.toLowerCase().includes(search)) ||
                    (u.student_id && String(u.student_id).toLowerCase().includes(search)) ||
                    (u.email && u.email.toLowerCase().includes(search))
                );
            });
        }
        renderUsersTable(filtered);
    }

    // Patch loadStudentUsers to update allUsers and re-filter
    async function loadStudentUsers() {
        const tbody = document.getElementById('usersTable');
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">Loading...</td></tr>';
        try {
            const resp = await fetch('/api/admin/users?role=student', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                }
            });
            if (!resp.ok) throw new Error('Failed to fetch users');
            const data = await resp.json();
            allUsers = data.users || [];
            filterAndRenderUsers();
        } catch (err) {
            console.error('Error loading users:', err);
            tbody.innerHTML = '<tr><td colspan="7" class="text-center">Error loading users</td></tr>';
        }
    }

    // Patch deleteUser to reload and re-filter
    window.deleteUser = function (userId) {
        if (!confirm('Are you sure you want to delete this user?')) return;
        fetch(`/api/admin/users/${userId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                'Content-Type': 'application/json'
            }
        })
            .then(resp => {
                if (!resp.ok) throw new Error('Failed to delete user');
                return resp.json();
            })
            .then(data => {
                alert('User deleted successfully');
                loadStudentUsers();
            })
            .catch(err => {
                console.error('Error deleting user:', err);
                alert('Error deleting user.');
            });
    };
});


async function loadStudentUsers() {
    const tbody = document.getElementById('usersTable');
    // ...moved to DOMContentLoaded for filter support...
}

function renderUsersTable(users) {
    const tbody = document.getElementById('usersTable');
    tbody.innerHTML = '';
    if (!users.length) {
        tbody.innerHTML = '<tr><td colspan="9" class="text-center">No users found</td></tr>';
        return;
    }
    for (const user of users) {
        const fullName = `${escapeHtml(user.first_name)} ${user.middle_name ? escapeHtml(user.middle_name) + ' ' : ''}${escapeHtml(user.last_name)}`;
        const initials = `${user.first_name?.charAt(0) || ''}${user.last_name?.charAt(0) || ''}`.toUpperCase();

        // Create avatar HTML
        let avatarHtml;
        if (user.image_url) {
            avatarHtml = `<img src="${escapeHtml(user.image_url)}" alt="${escapeHtml(user.first_name)}"
                              style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;">`;
        } else {
            avatarHtml = `<div style="width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 16px;">
                ${initials}
            </div>`;
        }

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${avatarHtml}</td>
            <td><strong>${fullName}</strong></td>
            <td>${escapeHtml(user.username || '-')}</td>
            <td>${escapeHtml(user.student_id || '-')}</td>
            <td>${escapeHtml(user.email)}</td>
            <td>${escapeHtml(user.department || '-')}</td>
            <td><span class="role-badge ${escapeHtml(user.role)}">${capitalize(user.role)}</span></td>
            <td><span class="status-badge ${escapeHtml(user.status)}">${capitalize(user.status)}</span></td>
            <td class="action-buttons">
                <a href="/admin/edit-user.html?user_id=${user.id}" class="btn btn-sm btn-primary">Edit</a>
                <a href="/admin/view-user.html?user_id=${user.id}" class="btn btn-sm btn-secondary">View</a>
                <button type="button" class="btn btn-sm btn-danger" onclick="deleteUser('${user.id}')">Delete</button>
            </td>
        `;
        tbody.appendChild(tr);
    }
}

function escapeHtml(text) {
    if (!text && text !== 0) return '';
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function deleteUser(userId) {
    if (!confirm('Are you sure you want to delete this user?')) return;
    fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
            'Content-Type': 'application/json'
        }
    })
        .then(resp => {
            if (!resp.ok) throw new Error('Failed to delete user');
            return resp.json();
        })
        .then(data => {
            alert('User deleted successfully');
            // Optionally remove row from table
            loadStudentUsers();
        })
        .catch(err => {
            console.error('Error deleting user:', err);
            alert('Error deleting user.');
        });
}

function removeUserRow(userId) {
    const row = document.querySelector(`button[onclick*="deleteUser('${userId}')"]`)?.closest('tr');
    if (row) row.remove();
}
