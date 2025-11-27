// approvals.js
// Loads pending reservations and handles approve/reject actions

let allApprovals = [];
let currentReservationId = null;

document.addEventListener('DOMContentLoaded', function () {
    loadApprovals();
    document.getElementById('approvalSearch').addEventListener('input', filterApprovals);
    document.getElementById('equipmentNameFilter').addEventListener('change', filterApprovals);
});

function loadApprovals() {
    const token = localStorage.getItem('access_token');
    // Always hide the rejection modal before loading approvals
    document.getElementById('rejectionModal').style.display = 'none';

    console.log('=== LOADING APPROVALS ===');
    console.log('Token exists:', !!token);

    fetch('/api/reservation/all', {
        method: 'GET',
        headers: {
            ...(token ? { 'Authorization': 'Bearer ' + token } : {})
        }
    })
        .then(response => {
            console.log('Response status:', response.status);
            if (!response.ok) throw new Error('Failed to fetch approvals');
            return response.json();
        })
        .then(data => {
            console.log('Received data:', data);
            console.log('Is array?', Array.isArray(data));

            // Filter pending reservations and return pending requests
            const allReservations = Array.isArray(data) ? data : (data.reservations || []);
            console.log('Total reservations:', allReservations.length);

            allApprovals = allReservations.filter(r => r.status === 'pending' || r.status === 'return_pending');
            console.log('Filtered approvals:', allApprovals.length);
            console.log('Approvals by status:', {
                pending: allApprovals.filter(r => r.status === 'pending').length,
                return_pending: allApprovals.filter(r => r.status === 'return_pending').length
            });

            populateEquipmentFilter();
            filterApprovals();
        })
        .catch((error) => {
            console.error('Error loading approvals:', error);
            allApprovals = [];
            filterApprovals();
        });
}

function populateEquipmentFilter() {
    const equipmentSet = new Set();
    for (const r of allApprovals) {
        if (r.equipment && r.equipment.name) {
            equipmentSet.add(r.equipment.name);
        }
    }
    const select = document.getElementById('equipmentNameFilter');
    const sortedEquipment = Array.from(equipmentSet).sort();
    for (const name of sortedEquipment) {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = name;
        select.appendChild(option);
    }
}

function filterApprovals() {
    const search = document.getElementById('approvalSearch').value.trim().toLowerCase();
    const equipmentName = document.getElementById('equipmentNameFilter').value;
    let filtered = allApprovals;
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
    renderApprovalsTable(filtered);
}

function renderApprovalsTable(approvals) {
    console.log('=== RENDERING APPROVALS TABLE ===');
    console.log('Number of approvals to render:', approvals.length);

    const tbody = document.getElementById('approvalsTable');
    tbody.innerHTML = '';

    if (!approvals.length) {
        const tr = document.createElement('tr');
        tr.innerHTML = '<td colspan="8" class="text-center">No pending approvals or return verifications</td>';
        tbody.appendChild(tr);
        return;
    }

    for (const approval of approvals) {
        console.log('Rendering approval:', {
            id: approval.id,
            status: approval.status,
            user: approval.user?.full_name || approval.user?.first_name + ' ' + approval.user?.last_name,
            equipment: approval.equipment?.name
        });

        const tr = document.createElement('tr');

        // Different action buttons based on status
        let actionButtons = '';
        let statusBadge = '';

        if (approval.status === 'pending') {
            statusBadge = '<span class="status-badge pending">Pending Approval</span>';
            actionButtons = `
                <button class="btn btn-sm btn-success" onclick="approveReservation('${escapeHtml(approval.id)}')">Approve</button>
                <button class="btn btn-sm btn-danger" onclick="openRejectionModal('${escapeHtml(approval.id)}')">Reject</button>
            `;
        } else if (approval.status === 'return_pending') {
            statusBadge = '<span class="status-badge return_pending">Return Verification</span>';
            actionButtons = `
                <button class="btn btn-sm btn-success" onclick="acceptReturn('${escapeHtml(approval.id)}')">Accept Return</button>
                <button class="btn btn-sm btn-warning" onclick="rejectReturn('${escapeHtml(approval.id)}')">Reject Return</button>
            `;
        }

        // Get user name - try multiple formats
        const userName = approval.user?.full_name ||
            (approval.user?.first_name && approval.user?.last_name
                ? `${approval.user.first_name} ${approval.user.last_name}`
                : '') ||
            approval.user?.username ||
            'Unknown User';

        tr.innerHTML = `
            <td><strong>${escapeHtml(approval.id)}</strong></td>
            <td>${escapeHtml(userName)}</td>
            <td>${escapeHtml(approval.equipment && approval.equipment.name ? approval.equipment.name : '')}</td>
            <td>${escapeHtml(formatDate(approval.start_date))}</td>
            <td>${escapeHtml(formatDate(approval.end_date))}</td>
            <td>${escapeHtml(approval.reason || 'N/A')}</td>
            <td>${statusBadge}</td>
            <td class="action-buttons">${actionButtons}</td>
        `;
        tbody.appendChild(tr);
    }

    console.log('=== TABLE RENDERED ===');
}

function approveReservation(reservationId) {
    if (!confirm('Are you sure you want to approve this reservation?')) return;

    const token = localStorage.getItem('access_token');
    fetch(`/api/reservation/${reservationId}/approve`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': 'Bearer ' + token } : {})
        }
    })
        .then(response => {
            if (!response.ok) throw new Error('Failed to approve reservation');
            return response.json();
        })
        .then(() => {
            alert('Reservation approved successfully');
            loadApprovals();
        })
        .catch(err => {
            alert('Error approving reservation: ' + err.message);
        });
}

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
            loadApprovals();
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
            loadApprovals();
        })
        .catch(err => {
            alert('Error rejecting return: ' + err.message);
        });
}

function openRejectionModal(reservationId) {
    currentReservationId = reservationId;
    document.getElementById('rejectionReason').value = '';
    document.getElementById('rejectionModal').style.display = 'block';
}

function closeRejectionModal() {
    currentReservationId = null;
    document.getElementById('rejectionModal').style.display = 'none';
}

function confirmRejection() {
    const reason = document.getElementById('rejectionReason').value.trim();
    if (!reason) {
        alert('Please provide a reason for rejection');
        return;
    }

    const token = localStorage.getItem('access_token');
    fetch(`/api/reservation/${currentReservationId}/reject`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': 'Bearer ' + token } : {})
        },
        body: JSON.stringify({ rejection_reason: reason })
    })
        .then(response => {
            if (!response.ok) throw new Error('Failed to reject reservation');
            return response.json();
        })
        .then(() => {
            alert('Reservation rejected successfully');
            closeRejectionModal();
            loadApprovals();
        })
        .catch(err => {
            alert('Error rejecting reservation: ' + err.message);
        });
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return dateStr;
    return d.toLocaleString();
}

function escapeHtml(unsafe) {
    if (!unsafe && unsafe !== 0) return '';
    return String(unsafe)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}
