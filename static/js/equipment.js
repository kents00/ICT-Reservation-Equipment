/**
 * Equipment page client-side loader
 * Loads equipment list from the Flask API and renders the table
 * Provides view and delete actions (delete uses authenticated request)
 * Includes search and filter functionality
 */

let allEquipmentData = [];

document.addEventListener('DOMContentLoaded', function () {
    // Initialize modal close
    const modal = document.getElementById('equipmentDetailModal');
    const modalClose = document.getElementById('modalClose');
    if (modalClose) modalClose.addEventListener('click', () => { modal.style.display = 'none'; });
    globalThis.addEventListener('click', (e) => { if (e.target === modal) modal.style.display = 'none'; });

    // Initialize search and filters
    const searchInput = document.getElementById('equipmentSearch');
    const categoryFilter = document.getElementById('categoryFilter');
    const statusFilter = document.getElementById('statusFilter');

    if (searchInput) {
        searchInput.addEventListener('input', () => filterAndRenderEquipment());
    }
    if (categoryFilter) {
        categoryFilter.addEventListener('change', () => filterAndRenderEquipment());
    }
    if (statusFilter) {
        statusFilter.addEventListener('change', () => filterAndRenderEquipment());
    }

    loadEquipment();
});

async function loadEquipment(page = 1, perPage = 100) {
    const tbody = document.getElementById('equipmentTable');
    const loadingRow = document.getElementById('loadingRow');
    if (loadingRow) loadingRow.style.display = '';

    try {
        const resp = await fetch(`/api/equipment?page=${page}&per_page=${perPage}`);
        if (!resp.ok) throw new Error('Failed to load equipment');
        const data = await resp.json();

        allEquipmentData = data.equipment || [];

        // Render filtered equipment
        filterAndRenderEquipment();

    } catch (err) {
        console.error('Error loading equipment:', err);
        tbody.innerHTML = '<tr><td colspan="8" class="text-center">Error loading equipment</td></tr>';
    } finally {
        if (loadingRow) loadingRow.style.display = 'none';
    }
}

function filterAndRenderEquipment() {
    const searchQuery = document.getElementById('equipmentSearch').value.toLowerCase();
    const categoryFilter = document.getElementById('categoryFilter').value.toLowerCase();
    const statusFilter = document.getElementById('statusFilter').value.toLowerCase();

    const filtered = allEquipmentData.filter(item => {
        const matchesSearch = !searchQuery ||
            item.name.toLowerCase().includes(searchQuery) ||
            (item.category && item.category.toLowerCase().includes(searchQuery)) ||
            (item.serial_number && item.serial_number.toLowerCase().includes(searchQuery));

        const matchesCategory = !categoryFilter ||
            (item.category && item.category.toLowerCase() === categoryFilter);

        const matchesStatus = !statusFilter ||
            (item.status && item.status.toLowerCase() === statusFilter);

        return matchesSearch && matchesCategory && matchesStatus;
    });

    renderEquipmentTable(filtered);
}

function renderEquipmentTable(list) {
    const tbody = document.getElementById('equipmentTable');
    tbody.innerHTML = '';

    if (list.length === 0) {
        const tr = document.createElement('tr');
        tr.innerHTML = '<td colspan="9" class="text-center">No equipment found</td>';
        tbody.appendChild(tr);
        return;
    }

    for (const item of list) {
        const tr = document.createElement('tr');

        // Image column
        const imageTd = document.createElement('td');
        if (item.image_url) {
            const img = document.createElement('img');
            img.src = item.image_url;
            img.alt = item.name;
            img.className = 'equipment-thumbnail';
            img.style.width = '50px';
            img.style.height = '50px';
            img.style.objectFit = 'cover';
            img.style.borderRadius = '4px';
            imageTd.appendChild(img);
        } else {
            const placeholder = document.createElement('div');
            placeholder.className = 'equipment-thumbnail-placeholder';
            placeholder.style.width = '50px';
            placeholder.style.height = '50px';
            placeholder.style.backgroundColor = '#f0f0f0';
            placeholder.style.borderRadius = '4px';
            placeholder.style.display = 'flex';
            placeholder.style.alignItems = 'center';
            placeholder.style.justifyContent = 'center';
            placeholder.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>';
            imageTd.appendChild(placeholder);
        }

        const nameTd = document.createElement('td');
        nameTd.innerHTML = `<strong>${escapeHtml(item.name)}</strong>`;

        const categoryTd = document.createElement('td');
        categoryTd.textContent = item.category || '';

        const serialTd = document.createElement('td');
        serialTd.textContent = item.serial_number || '-';

        const locationTd = document.createElement('td');
        locationTd.textContent = item.location || '';

        const statusTd = document.createElement('td');
        const statusSpan = document.createElement('span');
        statusSpan.className = `status-badge ${item.status || ''}`;
        statusSpan.textContent = (item.status || '').toString().replaceAll('_', ' ').toUpperCase();
        statusTd.appendChild(statusSpan);

        const qtyTd = document.createElement('td');
        qtyTd.textContent = item.quantity ?? '';

        const availableTd = document.createElement('td');
        availableTd.textContent = item.quantity_available ?? '';

        const actionsTd = document.createElement('td');
        actionsTd.className = 'action-buttons';

        const editLink = document.createElement('a');
        editLink.className = 'btn btn-sm btn-primary';
        editLink.textContent = 'Edit';
        editLink.href = `/admin/edit-equipment.html?equipment_id=${item.id}`;
        editLink.addEventListener('click', function (e) {
            e.preventDefault();
            goToEditEquipment(item.id);
        });

        const viewLink = document.createElement('a');
        viewLink.className = 'btn btn-sm btn-secondary';
        viewLink.textContent = 'View';
        viewLink.href = `/admin/view-equipment.html?id=${item.id}`;
        // Optionally, you can use window.location for SPA navigation
        viewLink.addEventListener('click', function (e) {
            e.preventDefault();
            window.location.href = `/admin/view-equipment.html?id=${item.id}`;
        });

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn btn-sm btn-danger';
        deleteBtn.textContent = 'Delete';
        deleteBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to delete this equipment?')) {
                deleteEquipment(item.id);
            }
        });

        actionsTd.appendChild(editLink);
        actionsTd.appendChild(document.createTextNode(' '));
        actionsTd.appendChild(viewLink);
        actionsTd.appendChild(document.createTextNode(' '));
        actionsTd.appendChild(deleteBtn);

        tr.appendChild(imageTd);
        tr.appendChild(nameTd);
        tr.appendChild(categoryTd);
        tr.appendChild(serialTd);
        tr.appendChild(locationTd);
        tr.appendChild(statusTd);
        tr.appendChild(qtyTd);
        tr.appendChild(availableTd);
        tr.appendChild(actionsTd);

        tbody.appendChild(tr);
    }
}

async function viewEquipment(equipmentId) {
    try {
        const resp = await fetch(`/api/equipment/${encodeURIComponent(equipmentId)}`);
        if (!resp.ok) throw new Error('Failed to load equipment details');
        const item = await resp.json();

        document.getElementById('detailName').textContent = item.name || 'Equipment Details';
        document.getElementById('detailDescription').textContent = item.description || '';
        document.getElementById('detailCategory').textContent = item.category || '';
        document.getElementById('detailSerial').textContent = item.serial_number || '-';
        document.getElementById('detailLocation').textContent = item.location || '';
        document.getElementById('detailStatus').textContent = (item.status || '').toString().replace(/_/g, ' ');
        document.getElementById('detailQuantity').textContent = item.quantity ?? '';
        document.getElementById('detailAvailable').textContent = item.quantity_available ?? '';
        document.getElementById('detailActiveReservations').textContent = item.active_reservations ?? '0';

        const qrDiv = document.getElementById('detailQrImage');
        qrDiv.innerHTML = '';
        if (item.qr_code) {
            // Fetch QR image
            try {
                const qrResp = await fetch(`/api/equipment/${encodeURIComponent(equipmentId)}/qr-code`);
                if (qrResp.ok) {
                    const qrData = await qrResp.json();
                    if (qrData.qr_code_image) {
                        const img = document.createElement('img');
                        img.src = `data:image/png;base64,${qrData.qr_code_image}`;
                        img.alt = 'QR Code';
                        img.style.maxWidth = '180px';
                        qrDiv.appendChild(img);
                    }
                }
            } catch (e) {
                console.warn('Failed to load QR code:', e);
            }
        }

        const modal = document.getElementById('equipmentDetailModal');
        modal.style.display = 'block';

    } catch (err) {
        console.error('Error fetching equipment details:', err);
        alert('Unable to load equipment details');
    }
}

async function deleteEquipment(equipmentId) {
    try {
        // Use the global makeAuthenticatedRequest helper if available
        if (typeof makeAuthenticatedRequest === 'function') {
            const resp = await makeAuthenticatedRequest(`/equipment/${encodeURIComponent(equipmentId)}`, { method: 'DELETE' });
            if (!resp.ok) {
                const body = await resp.json().catch(() => ({}));
                throw new Error(body.error || 'Delete failed');
            }
        } else {
            // Fallback: direct authenticated fetch using token from localStorage
            const token = localStorage.getItem('access_token');
            if (!token) throw new Error('Not authenticated');
            const resp = await fetch(`/api/equipment/${encodeURIComponent(equipmentId)}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!resp.ok) {
                const body = await resp.json().catch(() => ({}));
                throw new Error(body.error || 'Delete failed');
            }
        }

        alert('Equipment deleted successfully');
        loadEquipment();
    } catch (err) {
        console.error('Error deleting equipment:', err);
        alert('Failed to delete equipment: ' + (err.message || 'Unknown error'));
    }
}

// Simple helper to avoid HTML injection when rendering names/descriptions
function escapeHtml(unsafe) {
    if (!unsafe && unsafe !== 0) return '';
    return String(unsafe)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// Navigate to edit equipment page
function goToEditEquipment(equipmentId) {
    window.location.href = `/admin/edit-equipment.html?equipment_id=${equipmentId}`;
}
