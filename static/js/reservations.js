// reservations.js
// Loads reservation data from API and renders the table in reservations.html

document.addEventListener('DOMContentLoaded', function () {
    loadReservations();
});

function loadReservations() {
    const token = localStorage.getItem('access_token');
    fetch('/api/reservation/all', {
        method: 'GET',
        headers: {
            ...(token ? { 'Authorization': 'Bearer ' + token } : {})
        }
    })
        .then(response => {
            if (!response.ok) throw new Error('Unauthorized or failed to fetch reservations');
            return response.json();
        })
        .then(data => {
            // API returns an array, not {reservations: []}
            renderReservationsTable(Array.isArray(data) ? data : (data.reservations || []));
        })
        .catch(() => {
            renderReservationsTable([]);
        });
}

function renderReservationsTable(reservations) {
    const tbody = document.getElementById('reservationsTable');
    tbody.innerHTML = '';

    if (!reservations.length) {
        const tr = document.createElement('tr');
        tr.innerHTML = '<td colspan="7" class="text-center">No reservations found</td>';
        tbody.appendChild(tr);
        return;
    }

    for (const reservation of reservations) {
        const tr = document.createElement('tr');
        const statusBadge = `<span class="status-badge ${escapeHtml(reservation.status)}">${capitalize(reservation.status)}</span>`;

        // Add action buttons based on status
        let actionButtons = '';
        if (reservation.status === 'approved') {
            // Approved: Show Checkout and Cancel buttons
            actionButtons = `
                <button class="btn btn-sm btn-primary" onclick="checkoutReservation('${escapeHtml(reservation.id)}')">Checkout</button>
                <button class="btn btn-sm btn-danger" onclick="cancelReservation('${escapeHtml(reservation.id)}')">Cancel</button>
            `;
        } else if (reservation.status === 'checked_out') {
            // Checked Out: Student must request return, admin verifies in Approvals page
            actionButtons = '<button class="btn btn-sm btn-secondary" disabled>Awaiting Student Return Request</button>';
        } else if (reservation.status === 'return_pending') {
            // Return Pending: Redirect to Approvals page
            actionButtons = '<button class="btn btn-sm btn-secondary" disabled>Check the Approvals Section</button>';
        } else {
            actionButtons = '<span class="text-muted">-</span>';
        }

        tr.innerHTML = `
            <td><strong>${escapeHtml(reservation.id)}</strong></td>
            <td>${escapeHtml(reservation.user && reservation.user.full_name ? reservation.user.full_name : '')}</td>
            <td>${escapeHtml(reservation.equipment && reservation.equipment.name ? reservation.equipment.name : '')}</td>
            <td>${escapeHtml(formatDate(reservation.start_date))}</td>
            <td>${escapeHtml(formatDate(reservation.end_date))}</td>
            <td>${statusBadge}</td>
            <td class="action-buttons">${actionButtons}</td>
        `;
        tbody.appendChild(tr);
    }
}

function checkoutReservation(reservationId) {
    if (!confirm('Are you sure you want to mark this reservation as checked out?')) return;

    const token = localStorage.getItem('access_token');
    fetch(`/api/reservation/${reservationId}/checkout`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': 'Bearer ' + token } : {})
        }
    })
        .then(response => {
            if (!response.ok) throw new Error('Failed to checkout reservation');
            return response.json();
        })
        .then(() => {
            alert('Reservation checked out successfully');
            loadReservations();
        })
        .catch(err => {
            alert('Error checking out reservation: ' + err.message);
        });
}

// Note: returnReservation() function removed - students must request returns via mobile app
// Admins verify returns using acceptReturn() and rejectReturn() functions below

function acceptReturn(reservationId) {
    if (!confirm('Accept this equipment return? Verify that the equipment is in good condition.')) return;

    const token = localStorage.getItem('access_token');
    fetch(`/api/reservation/${reservationId}/verify-return`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': 'Bearer ' + token } : {})
        },
        body: JSON.stringify({
            approved: true,
            notes: 'Equipment verified and accepted'
        })
    })
        .then(response => {
            if (!response.ok) throw new Error('Failed to accept return');
            return response.json();
        })
        .then(() => {
            alert('Return accepted successfully. Student has been notified.');
            loadReservations();
        })
        .catch(err => {
            alert('Error accepting return: ' + err.message);
        });
}

function rejectReturn(reservationId) {
    const reason = prompt('Why is this return being rejected? (e.g., equipment damaged, missing parts)');
    if (!reason) return;

    const token = localStorage.getItem('access_token');
    fetch(`/api/reservation/${reservationId}/verify-return`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': 'Bearer ' + token } : {})
        },
        body: JSON.stringify({
            approved: false,
            notes: reason
        })
    })
        .then(response => {
            if (!response.ok) throw new Error('Failed to reject return');
            return response.json();
        })
        .then(() => {
            alert('Return rejected. Student has been notified.');
            loadReservations();
        })
        .catch(err => {
            alert('Error rejecting return: ' + err.message);
        });
}

function cancelReservation(reservationId) {
    if (!confirm('Are you sure you want to cancel this reservation? This action cannot be undone.')) return;

    const token = localStorage.getItem('access_token');
    fetch(`/api/reservation/${reservationId}/cancel`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': 'Bearer ' + token } : {})
        }
    })
        .then(response => {
            if (!response.ok) throw new Error('Failed to cancel reservation');
            return response.json();
        })
        .then(() => {
            alert('Reservation cancelled successfully');
            loadReservations();
        })
        .catch(err => {
            alert('Error cancelling reservation: ' + err.message);
        });
}

// --- Search and Filter Logic ---
let allReservations = [];

document.addEventListener('DOMContentLoaded', function () {
    loadReservations();
    document.getElementById('reservationSearch').addEventListener('input', filterReservations);
    document.getElementById('equipmentNameFilter').addEventListener('change', filterReservations);
    document.getElementById('statusFilter').addEventListener('change', filterReservations);
});

function loadReservations() {
    const token = localStorage.getItem('access_token');
    fetch('/api/reservation/all', {
        method: 'GET',
        headers: {
            ...(token ? { 'Authorization': 'Bearer ' + token } : {})
        }
    })
        .then(response => {
            if (!response.ok) throw new Error('Unauthorized or failed to fetch reservations');
            return response.json();
        })
        .then(data => {
            allReservations = Array.isArray(data) ? data : (data.reservations || []);
            populateEquipmentFilter();
            filterReservations();
        })
        .catch(() => {
            allReservations = [];
            filterReservations();
        });
}

function filterReservations() {
    const search = document.getElementById('reservationSearch').value.trim().toLowerCase();
    const equipmentName = document.getElementById('equipmentNameFilter').value;
    const status = document.getElementById('statusFilter').value;
    let filtered = allReservations;
    if (search) {
        filtered = filtered.filter(r => {
            const user = r.user && r.user.full_name ? r.user.full_name.toLowerCase() : '';
            const equipment = r.equipment && r.equipment.name ? r.equipment.name.toLowerCase() : '';
            const id = r.id ? r.id.toLowerCase() : '';
            return user.includes(search) || equipment.includes(search) || id.includes(search);
        });
    }
    if (equipmentName) {
        filtered = filtered.filter(r => r.equipment && r.equipment.name === equipmentName);
    }
    if (status) {
        filtered = filtered.filter(r => r.status === status);
    }
    renderReservationsTable(filtered);
}

function populateEquipmentFilter() {
    const equipmentSet = new Set();
    allReservations.forEach(r => {
        if (r.equipment && r.equipment.name) {
            equipmentSet.add(r.equipment.name);
        }
    });
    const select = document.getElementById('equipmentNameFilter');
    const sortedEquipment = Array.from(equipmentSet).sort();
    sortedEquipment.forEach(name => {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = name;
        select.appendChild(option);
    });
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d)) return dateStr;
    return d.toLocaleString();
}

function escapeHtml(unsafe) {
    if (!unsafe && unsafe !== 0) return '';
    return String(unsafe)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function capitalize(str) {
    if (!str) return '';
    // Handle specific status labels
    if (str === 'return_pending') return 'Return Pending';
    if (str === 'checked_out') return 'Checked Out';
    // Default: capitalize first letter
    return str.charAt(0).toUpperCase() + str.slice(1);
}
