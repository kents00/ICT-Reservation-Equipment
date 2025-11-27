/**
 * Load dashboard statistics from API
 */
async function loadDashboardStats() {
    const token = localStorage.getItem('access_token');

    if (!token) {
        console.error('No access token found');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/admin/dashboard/stats`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            if (response.status === 401) {
                // Token expired or invalid
                console.error('Unauthorized - redirecting to login');
                window.location.href = '/admin/login';
                return;
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        updateDashboardUI(data);
    } catch (error) {
        console.error('Error loading dashboard stats:', error);
        // Show default/cached data or error message
    }
}

/**
 * Update dashboard UI with fetched data
 */
function updateDashboardUI(data) {
    // Update equipment stats
    if (data.equipment) {
        const totalEl = document.getElementById('total-equipment');
        const availableEl = document.getElementById('available-equipment');
        const reservedEl = document.getElementById('reserved-equipment');
        const maintenanceEl = document.getElementById('maintenance-equipment');

        if (totalEl) totalEl.textContent = data.equipment.total;
        if (availableEl) availableEl.textContent = data.equipment.available;
        if (reservedEl) reservedEl.textContent = data.equipment.reserved;
        if (maintenanceEl) maintenanceEl.textContent = data.equipment.in_maintenance;

        // Update percentages
        const total = data.equipment.total;
        if (total > 0) {
            const availablePercent = Math.round((data.equipment.available / total) * 100);
            const reservedPercent = Math.round((data.equipment.reserved / total) * 100);
            const maintenancePercent = Math.round((data.equipment.in_maintenance / total) * 100);

            // Update percentage displays if they exist
            updateStatPercentage(availableEl, availablePercent, 'available');
            updateStatPercentage(reservedEl, reservedPercent, 'reserved');
            updateStatPercentage(maintenanceEl, maintenancePercent, 'maintenance');
        }

        // Update pie chart
        updateEquipmentPieChart(data.equipment);

        // Update pie chart legend
        updateChartLegend(data.equipment);
    }

    // Update reservations chart
    if (data.reservations) {
        console.log('Reservations:', data.reservations);
        updateReservationsChart(data.reservations);
    }

    // Update users data
    if (data.users) {
        console.log('Users:', data.users);
    }
}

/**
 * Update stat percentage display
 */
function updateStatPercentage(element, percent, type) {
    if (!element) return;

    const statCard = element.closest('.stat-card');
    if (!statCard) return;

    const changeSpan = statCard.querySelector('.stat-change');
    if (changeSpan) {
        if (type === 'available') {
            changeSpan.textContent = `${percent}% available`;
        } else if (type === 'reserved') {
            changeSpan.textContent = `${percent}% reserved`;
        } else if (type === 'maintenance') {
            changeSpan.textContent = `${percent}% maintenance`;
        }
    }
}

/**
 * Update equipment distribution pie chart
 */
function updateEquipmentPieChart(equipment) {
    const pieChartContainer = document.querySelector('.pie-chart-container');
    if (!pieChartContainer) return;

    const total = equipment.total || 0;
    const available = equipment.available || 0;
    const reserved = equipment.reserved || 0;
    const maintenance = equipment.in_maintenance || 0;

    console.log('Updating pie chart with:', { total, available, reserved, maintenance });

    if (total === 0) {
        pieChartContainer.innerHTML = '<div class="no-data">No Equipment Data</div>';
        return;
    }

    // If only one category has all items, show full circle
    if (available === total) {
        pieChartContainer.innerHTML = `
            <svg viewBox="0 0 200 200" class="pie-chart-svg">
                <circle cx="100" cy="100" r="70" fill="#34C759" opacity="0.9"/>
                <circle cx="100" cy="100" r="35" fill="white"/>
                <text x="100" y="100" text-anchor="middle" dominant-baseline="middle" font-size="24" font-weight="bold" fill="#333">${total}</text>
            </svg>
        `;
        return;
    }

    if (reserved === total) {
        pieChartContainer.innerHTML = `
            <svg viewBox="0 0 200 200" class="pie-chart-svg">
                <circle cx="100" cy="100" r="70" fill="#818cf8" opacity="0.9"/>
                <circle cx="100" cy="100" r="35" fill="white"/>
                <text x="100" y="100" text-anchor="middle" dominant-baseline="middle" font-size="24" font-weight="bold" fill="#333">${total}</text>
            </svg>
        `;
        return;
    }

    if (maintenance === total) {
        pieChartContainer.innerHTML = `
            <svg viewBox="0 0 200 200" class="pie-chart-svg">
                <circle cx="100" cy="100" r="70" fill="#fb923c" opacity="0.9"/>
                <circle cx="100" cy="100" r="35" fill="white"/>
                <text x="100" y="100" text-anchor="middle" dominant-baseline="middle" font-size="24" font-weight="bold" fill="#333">${total}</text>
            </svg>
        `;
        return;
    }

    // Calculate angles for each segment
    const availableAngle = (available / total) * 360;
    const reservedAngle = (reserved / total) * 360;
    const maintenanceAngle = (maintenance / total) * 360;

    // Helper function to create pie slice path
    const createSlice = (startAngle, endAngle, color) => {
        const start = (startAngle - 90) * Math.PI / 180;
        const end = (endAngle - 90) * Math.PI / 180;

        const x1 = 100 + 70 * Math.cos(start);
        const y1 = 100 + 70 * Math.sin(start);
        const x2 = 100 + 70 * Math.cos(end);
        const y2 = 100 + 70 * Math.sin(end);

        const largeArc = (endAngle - startAngle) > 180 ? 1 : 0;

        return `<path d="M 100 100 L ${x1} ${y1} A 70 70 0 ${largeArc} 1 ${x2} ${y2} Z" fill="${color}" opacity="0.9"/>`;
    };

    let currentAngle = 0;
    let svgPath = '';

    // Add available slice
    if (available > 0) {
        svgPath += createSlice(currentAngle, currentAngle + availableAngle, '#34C759');
        currentAngle += availableAngle;
    }

    // Add reserved slice
    if (reserved > 0) {
        svgPath += createSlice(currentAngle, currentAngle + reservedAngle, '#818cf8');
        currentAngle += reservedAngle;
    }

    // Add maintenance slice
    if (maintenance > 0) {
        svgPath += createSlice(currentAngle, currentAngle + maintenanceAngle, '#fb923c');
    }

    pieChartContainer.innerHTML = `
        <svg viewBox="0 0 200 200" class="pie-chart-svg">
            ${svgPath}
            <circle cx="100" cy="100" r="35" fill="white"/>
            <text x="100" y="100" text-anchor="middle" dominant-baseline="middle" font-size="24" font-weight="bold" fill="#333">${total}</text>
        </svg>
    `;
}

/**
 * Update pie chart legend with current numbers
 */
function updateChartLegend(equipment) {
    const legendAvailable = document.getElementById('legend-available');
    const legendReserved = document.getElementById('legend-reserved');
    const legendMaintenance = document.getElementById('legend-maintenance');

    if (legendAvailable) legendAvailable.textContent = equipment.available;
    if (legendReserved) legendReserved.textContent = equipment.reserved;
    if (legendMaintenance) legendMaintenance.textContent = equipment.in_maintenance;
}

/**
 * Update reservations chart
 */
function updateReservationsChart(reservations) {
    const chartContainer = document.querySelector('.reservations-chart-container');
    if (!chartContainer) return;

    const total = reservations.total;

    if (total === 0) {
        chartContainer.innerHTML = '<div class="no-data">No Data Found</div>';
        return;
    }

    const pending = reservations.pending || 0;
    const approved = reservations.approved || 0;
    const checkedOut = reservations.checked_out || 0;

    const maxValue = Math.max(pending, approved, checkedOut, 1);

    // Create bar chart and vertical legend
    const barHTML = `
        <div class="bar-chart">
            <div class="bar-group">
                <div class="bar-wrapper">
                    <div class="bar" style="height: ${(pending / maxValue) * 100}%; background: linear-gradient(135deg, #f59e0b, #fbbf24);">
                        <span class="bar-value">${pending}</span>
                    </div>
                </div>
                <span class="bar-label">Pending</span>
            </div>
            <div class="bar-group">
                <div class="bar-wrapper">
                    <div class="bar" style="height: ${(approved / maxValue) * 100}%; background: linear-gradient(135deg, #34C759, #4ade80);">
                        <span class="bar-value">${approved}</span>
                    </div>
                </div>
                <span class="bar-label">Approved</span>
            </div>
            <div class="bar-group">
                <div class="bar-wrapper">
                    <div class="bar" style="height: ${(checkedOut / maxValue) * 100}%; background: linear-gradient(135deg, #818cf8, #a5b4fc);">
                        <span class="bar-value">${checkedOut}</span>
                    </div>
                </div>
                <span class="bar-label">Checked Out</span>
            </div>
        </div>
    `;

    chartContainer.innerHTML = barHTML;
}

/**
 * Load recent activity
 */
async function loadRecentActivity() {
    const token = localStorage.getItem('access_token');

    if (!token) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/admin/reservations/all?per_page=5`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();
            // Update activity list with recent reservations
            console.log('Recent activity:', data);
        }
    } catch (error) {
        console.error('Error loading recent activity:', error);
    }
}

/**
 * Initialize dashboard
 */
document.addEventListener('DOMContentLoaded', function () {
    // Only run on dashboard page
    if (window.location.pathname.includes('/admin/dashboard') ||
        window.location.pathname === '/admin/' ||
        window.location.pathname === '/admin') {

        // Load initial data
        loadDashboardStats();
        loadRecentActivity();

        // Refresh stats every 30 seconds
        setInterval(loadDashboardStats, 30000);
    }
});
