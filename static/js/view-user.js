// view-user.js - Display user details

document.addEventListener('DOMContentLoaded', function () {
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('user_id') || urlParams.get('id');

    if (userId) {
        loadUserData(userId);
    } else {
        alert('No user ID provided');
        window.location.href = '/admin/users';
    }
});

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
        displayUserData(user);
    } catch (error) {
        console.error('Error loading user:', error);
        alert('Failed to load user data');
        window.location.href = '/admin/users';
    }
}

function displayUserData(user) {
    // Display profile image or placeholder
    const avatarImg = document.getElementById('userAvatar');
    const avatarPlaceholder = document.getElementById('userAvatarPlaceholder');

    if (user.image_url) {
        avatarImg.src = user.image_url;
        avatarImg.style.display = 'block';
        avatarPlaceholder.style.display = 'none';
    } else {
        const initials = `${user.first_name?.charAt(0) || ''}${user.last_name?.charAt(0) || ''}`.toUpperCase();
        avatarPlaceholder.textContent = initials;
        avatarPlaceholder.style.display = 'flex';
        avatarImg.style.display = 'none';
    }

    document.getElementById('userFirstName').textContent = user.first_name || '-';
    document.getElementById('userMiddleName').textContent = user.middle_name || '-';
    document.getElementById('userLastName').textContent = user.last_name || '-';
    document.getElementById('userEmail').textContent = user.email || '-';
    document.getElementById('userPhone').textContent = user.phone || '-';
    document.getElementById('userDepartment').textContent = user.department || '-';
    document.getElementById('userStudentId').textContent = user.student_id || '-';
    document.getElementById('userUsername').textContent = user.username || '-';
    document.getElementById('userRole').textContent = capitalizeFirst(user.role || '-');
    document.getElementById('userStatus').textContent = capitalizeFirst(user.status || (user.is_active ? 'active' : 'inactive'));
    document.getElementById('userCreatedAt').textContent = user.created_at ? new Date(user.created_at).toLocaleString() : '-';

    // Set edit button link
    document.getElementById('editUserBtn').href = `/admin/edit-user.html?user_id=${user.id}`;
}

function capitalizeFirst(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}
