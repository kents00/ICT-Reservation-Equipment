// Reports Dashboard JavaScript with Charts and Export Functionality

let currentCharts = {};
let chartLibraryReady = false;

// Wait for Chart.js to be loaded before initializing
function waitForChartLibrary(callback, attempts = 0) {
    if (typeof Chart !== 'undefined') {
        chartLibraryReady = true;
        if (callback) callback();
    } else if (attempts < 100) {
        setTimeout(() => waitForChartLibrary(callback, attempts + 1), 50);
    } else {
        console.error('Chart.js library failed to load after timeout');
    }
}

// Check if Chart is already available
if (typeof Chart !== 'undefined') {
    chartLibraryReady = true;
}

// Initialize reports when page loads
document.addEventListener('DOMContentLoaded', function () {
    // Wait for Chart library if not already loaded
    if (!chartLibraryReady) {
        waitForChartLibrary(() => {
            initializeDateFilters();
            loadAllReports();
            attachEventListeners();
        });
    } else {
        initializeDateFilters();
        loadAllReports();
        attachEventListeners();
    }
});

/**
 * Attach event listeners for date filters
 */
function attachEventListeners() {
    document.getElementById('startDate')?.addEventListener('change', loadAllReports);
    document.getElementById('endDate')?.addEventListener('change', loadAllReports);
    document.getElementById('refreshReports')?.addEventListener('click', loadAllReports);
}

/**
 * Initialize date filters with default values
 */
function initializeDateFilters() {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 1); // Default to last month

    const startInput = document.getElementById('startDate');
    const endInput = document.getElementById('endDate');

    if (startInput) startInput.valueAsDate = startDate;
    if (endInput) endInput.valueAsDate = endDate;
}

/**
 * Load all reports with current filters
 */
async function loadAllReports() {
    showLoading();

    try {
        await Promise.all([
            loadEquipmentUsageReport(),
            loadReservationBreakdownReport(),
            loadUserActivityReport(),
            loadOccupancyReport()
        ]);
    } catch (error) {
        console.error('Error loading reports:', error);
        showNotification('Error loading reports', 'error');
    } finally {
        hideLoading();
    }
}

/**
 * Load Equipment Usage Report
 */
async function loadEquipmentUsageReport() {
    try {
        const params = getDateParams();
        const response = await fetch(`/api/reports/equipment/usage?${params}`, {
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('API Error:', response.status, errorData);
            throw new Error(`Failed to load equipment usage report: ${response.status}`);
        }

        const data = await response.json();
        // Backend returns 'most_borrowed' array
        renderEquipmentUsageChart(data.most_borrowed || []);
        updateEquipmentUsageStats(data.most_borrowed || []);
    } catch (error) {
        console.error('Equipment usage report error:', error);
        document.getElementById('equipmentUsageChart').innerHTML =
            '<p class="error-message">Failed to load equipment usage data</p>';
    }
}/**
 * Render Equipment Usage Chart (Bar Chart)
 */
function renderEquipmentUsageChart(data) {
    const ctx = document.getElementById('equipmentUsageChart');
    if (!ctx) return;

    // Destroy existing chart
    if (currentCharts.equipmentUsage) {
        currentCharts.equipmentUsage.destroy();
    }

    const chartData = {
        labels: data.map(item => item.equipment_name || 'Unknown'),
        datasets: [{
            label: 'Total Reservations',
            data: data.map(item => item.reservation_count || 0),
            backgroundColor: 'rgba(99, 102, 241, 0.7)',
            borderColor: 'rgba(99, 102, 241, 1)',
            borderWidth: 2,
            borderRadius: 8,
            hoverBackgroundColor: 'rgba(79, 70, 229, 0.8)'
        }]
    };

    currentCharts.equipmentUsage = new Chart(ctx, {
        type: 'bar',
        data: chartData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        font: { size: 13, weight: '600' },
                        color: '#1e293b',
                        padding: 15
                    }
                },
                title: {
                    display: true,
                    text: 'Equipment Usage Statistics',
                    font: { size: 16, weight: 'bold' },
                    color: '#1e293b',
                    padding: { bottom: 20 }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1,
                        color: '#64748b',
                        font: { size: 12, weight: '500' }
                    },
                    grid: {
                        color: 'rgba(226, 232, 240, 0.5)'
                    }
                },
                x: {
                    ticks: {
                        color: '#64748b',
                        font: { size: 12, weight: '500' }
                    },
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

/**
 * Update Equipment Usage Statistics
 */
function updateEquipmentUsageStats(data) {
    const totalReservations = data.reduce((sum, item) => sum + (item.reservation_count || 0), 0);
    const mostUsed = data.length > 0 ? data[0] : null;

    const statsElement = document.getElementById('equipmentUsageStats');
    if (statsElement) {
        statsElement.innerHTML = `
            <div class="stat-item">
                <i class="fas fa-chart-bar"></i>
                <span>Total: ${totalReservations}</span>
            </div>
            ${mostUsed ? `
            <div class="stat-item">
                <i class="fas fa-trophy"></i>
                <span>Most Used: ${mostUsed.equipment_name} (${mostUsed.reservation_count})</span>
            </div>
            ` : ''}
        `;
    }
}

/**
 * Load Reservation Status Breakdown Report
 */
async function loadReservationBreakdownReport() {
    try {
        const params = getDateParams();
        const response = await fetch(`/api/reports/reservation-status-breakdown?${params}`, {
            headers: getAuthHeaders()
        });

        if (!response.ok) throw new Error('Failed to load reservation breakdown');

        const data = await response.json();
        // Convert status_breakdown object to array
        const breakdownArray = Object.entries(data.status_breakdown || {}).map(([status, count]) => ({
            status,
            count
        }));
        renderReservationBreakdownChart(breakdownArray);
    } catch (error) {
        console.error('Reservation breakdown error:', error);
        document.getElementById('reservationBreakdownChart').innerHTML =
            '<p class="error-message">Failed to load reservation breakdown</p>';
    }
}/**
 * Render Reservation Breakdown Chart (Pie Chart)
 */
function renderReservationBreakdownChart(data) {
    const ctx = document.getElementById('reservationBreakdownChart');
    if (!ctx) return;

    // Destroy existing chart
    if (currentCharts.reservationBreakdown) {
        currentCharts.reservationBreakdown.destroy();
    }

    const statusColors = {
        'pending': 'rgba(245, 158, 11, 0.7)',
        'approved': 'rgba(52, 199, 89, 0.7)',
        'rejected': 'rgba(239, 68, 68, 0.7)',
        'completed': 'rgba(129, 140, 248, 0.7)',
        'cancelled': 'rgba(148, 163, 184, 0.7)',
        'checked_out': 'rgba(99, 102, 241, 0.7)',
        'returned': 'rgba(16, 185, 129, 0.7)'
    };

    const chartData = {
        labels: data.map(item => item.status ? item.status.charAt(0).toUpperCase() + item.status.slice(1) : 'Unknown'),
        datasets: [{
            data: data.map(item => item.count || 0),
            backgroundColor: data.map(item => statusColors[item.status] || 'rgba(201, 203, 207, 0.6)'),
            borderColor: data.map(item => statusColors[item.status]?.replace('0.6', '1') || 'rgba(201, 203, 207, 1)'),
            borderWidth: 2
        }]
    };

    currentCharts.reservationBreakdown = new Chart(ctx, {
        type: 'pie',
        data: chartData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'right',
                    labels: {
                        font: { size: 13, weight: '600' },
                        color: '#1e293b',
                        padding: 12,
                        usePointStyle: true,
                        pointStyle: 'circle'
                    }
                },
                title: {
                    display: true,
                    text: 'Reservation Status Distribution',
                    font: { size: 16, weight: 'bold' },
                    color: '#1e293b',
                    padding: { bottom: 20 }
                }
            }
        }
    });
}

/**
 * Load User Activity Report
 */
async function loadUserActivityReport() {
    try {
        const params = getDateParams();
        const response = await fetch(`/api/reports/user-activity?${params}`, {
            headers: getAuthHeaders()
        });

        if (!response.ok) throw new Error('Failed to load user activity report');

        const data = await response.json();
        // Backend returns 'user_activity' array
        renderUserActivityChart(data.user_activity || []);
    } catch (error) {
        console.error('User activity report error:', error);
        document.getElementById('userActivityChart').innerHTML =
            '<p class="error-message">Failed to load user activity data</p>';
    }
}/**
 * Render User Activity Chart (Bar Chart)
 */
function renderUserActivityChart(data) {
    const ctx = document.getElementById('userActivityChart');
    if (!ctx) return;

    // Destroy existing chart
    if (currentCharts.userActivity) {
        currentCharts.userActivity.destroy();
    }

    const chartData = {
        labels: data.map(item => item.username || 'Unknown'),
        datasets: [{
            label: 'Reservations Made',
            data: data.map(item => item.total_reservations || 0),
            backgroundColor: 'rgba(129, 140, 248, 0.7)',
            borderColor: 'rgba(129, 140, 248, 1)',
            borderWidth: 2,
            borderRadius: 8,
            hoverBackgroundColor: 'rgba(99, 102, 241, 0.8)'
        }]
    }; currentCharts.userActivity = new Chart(ctx, {
        type: 'bar',
        data: chartData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y', // Horizontal bar chart
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        font: { size: 13, weight: '600' },
                        color: '#1e293b',
                        padding: 15
                    }
                },
                title: {
                    display: true,
                    text: 'Top Active Users',
                    font: { size: 16, weight: 'bold' },
                    color: '#1e293b',
                    padding: { bottom: 20 }
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1,
                        color: '#64748b',
                        font: { size: 12, weight: '500' }
                    },
                    grid: {
                        color: 'rgba(226, 232, 240, 0.5)'
                    }
                },
                y: {
                    ticks: {
                        color: '#64748b',
                        font: { size: 12, weight: '500' }
                    },
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

/**
 * Load Occupancy Report
 */
async function loadOccupancyReport() {
    try {
        const params = getDateParams();
        const response = await fetch(`/api/reports/occupancy?${params}`, {
            headers: getAuthHeaders()
        });

        if (!response.ok) throw new Error('Failed to load occupancy report');

        const data = await response.json();
        // Backend returns 'occupancy_data' array
        // Transform to match expected format with date and count
        const chartData = (data.occupancy_data || []).map(item => ({
            date: item.equipment_name,
            count: item.active_reservations
        }));
        renderOccupancyChart(chartData);
    } catch (error) {
        console.error('Occupancy report error:', error);
        document.getElementById('occupancyChart').innerHTML =
            '<p class="error-message">Failed to load occupancy data</p>';
    }
}/**
 * Render Occupancy Chart (Line Chart)
 */
function renderOccupancyChart(data) {
    const ctx = document.getElementById('occupancyChart');
    if (!ctx) return;

    // Destroy existing chart
    if (currentCharts.occupancy) {
        currentCharts.occupancy.destroy();
    }

    const chartData = {
        labels: data.map(item => item.date || 'Unknown'),
        datasets: [{
            label: 'Active Reservations',
            data: data.map(item => item.count || 0),
            backgroundColor: 'rgba(165, 180, 252, 0.3)',
            borderColor: 'rgba(99, 102, 241, 1)',
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: 'rgba(99, 102, 241, 1)',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 5,
            pointHoverRadius: 7,
            pointHoverBackgroundColor: 'rgba(79, 70, 229, 1)',
            pointHoverBorderWidth: 3
        }]
    };

    currentCharts.occupancy = new Chart(ctx, {
        type: 'line',
        data: chartData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        font: { size: 13, weight: '600' },
                        color: '#1e293b',
                        padding: 15
                    }
                },
                title: {
                    display: true,
                    text: 'Daily Occupancy Trend',
                    font: { size: 16, weight: 'bold' },
                    color: '#1e293b',
                    padding: { bottom: 20 }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1,
                        color: '#64748b',
                        font: { size: 12, weight: '500' }
                    },
                    grid: {
                        color: 'rgba(226, 232, 240, 0.5)'
                    }
                },
                x: {
                    ticks: {
                        color: '#64748b',
                        font: { size: 12, weight: '500' }
                    },
                    grid: {
                        color: 'rgba(226, 232, 240, 0.3)'
                    }
                }
            }
        }
    });
}

/**
 * Export Equipment Usage Report to Excel
 */
async function exportEquipmentUsageExcel() {
    try {
        showLoading();
        const params = getDateParams();
        const response = await fetch(`/api/reports/equipment/usage?${params}`, {
            headers: getAuthHeaders()
        });

        if (!response.ok) throw new Error('Failed to fetch data');

        const result = await response.json();
        const data = result.most_borrowed || [];

        // Prepare data for Excel
        const excelData = data.map(item => ({
            'Equipment Name': item.equipment_name || 'N/A',
            'Total Reservations': item.reservation_count || 0,
            'Equipment ID': item.equipment_id || 'N/A'
        }));        // Create workbook
        const ws = XLSX.utils.json_to_sheet(excelData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Equipment Usage');

        // Download file
        const filename = `equipment_usage_${formatDateForFilename()}.xlsx`;
        XLSX.writeFile(wb, filename);

        showNotification('Excel file downloaded successfully', 'success');
    } catch (error) {
        console.error('Excel export error:', error);
        showNotification('Failed to export to Excel', 'error');
    } finally {
        hideLoading();
    }
}

/**
 * Export Equipment Usage Report to PDF
 */
async function exportEquipmentUsagePDF() {
    try {
        showLoading();
        const params = getDateParams();
        const response = await fetch(`/api/reports/equipment/usage?${params}`, {
            headers: getAuthHeaders()
        });

        if (!response.ok) throw new Error('Failed to fetch data');

        const result = await response.json();
        const data = result.most_borrowed || [];

        // Create PDF
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // Add title
        doc.setFontSize(18);
        doc.text('Equipment Usage Report', 14, 20);

        // Add date range
        doc.setFontSize(10);
        const dateRange = getDateRangeText();
        doc.text(dateRange, 14, 28);

        // Prepare table data
        const tableData = data.map(item => [
            item.equipment_name || 'N/A',
            (item.reservation_count || 0).toString(),
            item.equipment_type || 'N/A',
            item.category || 'N/A'
        ]);

        // Add table
        doc.autoTable({
            head: [['Equipment Name', 'Reservations', 'Type', 'Category']],
            body: tableData,
            startY: 35,
            theme: 'grid',
            headStyles: { fillColor: [54, 162, 235] }
        });

        // Download file
        const filename = `equipment_usage_${formatDateForFilename()}.pdf`;
        doc.save(filename);

        showNotification('PDF file downloaded successfully', 'success');
    } catch (error) {
        console.error('PDF export error:', error);
        showNotification('Failed to export to PDF', 'error');
    } finally {
        hideLoading();
    }
}

/**
 * Export Reservation Breakdown to Excel
 */
async function exportReservationBreakdownExcel() {
    try {
        showLoading();
        const params = getDateParams();
        const response = await fetch(`/api/reports/reservation-status-breakdown?${params}`, {
            headers: getAuthHeaders()
        });

        if (!response.ok) throw new Error('Failed to fetch data');

        const result = await response.json();
        const data = Object.entries(result.status_breakdown || {}).map(([status, count]) => ({ status, count }));

        const total = data.reduce((sum, d) => sum + d.count, 0);
        const excelData = data.map(item => ({
            'Status': item.status ? item.status.charAt(0).toUpperCase() + item.status.slice(1) : 'N/A',
            'Count': item.count || 0,
            'Percentage': `${((item.count / total) * 100).toFixed(1)}%`
        })); const ws = XLSX.utils.json_to_sheet(excelData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Reservation Breakdown');

        const filename = `reservation_breakdown_${formatDateForFilename()}.xlsx`;
        XLSX.writeFile(wb, filename);

        showNotification('Excel file downloaded successfully', 'success');
    } catch (error) {
        console.error('Excel export error:', error);
        showNotification('Failed to export to Excel', 'error');
    } finally {
        hideLoading();
    }
}

/**
 * Export Reservation Breakdown to PDF
 */
async function exportReservationBreakdownPDF() {
    try {
        showLoading();
        const params = getDateParams();
        const response = await fetch(`/api/reports/reservation-status-breakdown?${params}`, {
            headers: getAuthHeaders()
        });

        if (!response.ok) throw new Error('Failed to fetch data');

        const result = await response.json();
        const data = Object.entries(result.status_breakdown || {}).map(([status, count]) => ({ status, count }));
        const total = data.reduce((sum, item) => sum + (item.count || 0), 0); const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        doc.setFontSize(18);
        doc.text('Reservation Status Breakdown', 14, 20);

        doc.setFontSize(10);
        doc.text(getDateRangeText(), 14, 28);

        const tableData = data.map(item => [
            item.status ? item.status.charAt(0).toUpperCase() + item.status.slice(1) : 'N/A',
            (item.count || 0).toString(),
            `${((item.count / total) * 100).toFixed(1)}%`
        ]);

        doc.autoTable({
            head: [['Status', 'Count', 'Percentage']],
            body: tableData,
            startY: 35,
            theme: 'grid',
            headStyles: { fillColor: [54, 162, 235] }
        });

        const filename = `reservation_breakdown_${formatDateForFilename()}.pdf`;
        doc.save(filename);

        showNotification('PDF file downloaded successfully', 'success');
    } catch (error) {
        console.error('PDF export error:', error);
        showNotification('Failed to export to PDF', 'error');
    } finally {
        hideLoading();
    }
}

/**
 * Export User Activity to Excel
 */
async function exportUserActivityExcel() {
    try {
        showLoading();
        const params = getDateParams();
        const response = await fetch(`/api/reports/user-activity?${params}`, {
            headers: getAuthHeaders()
        });

        if (!response.ok) throw new Error('Failed to fetch data');

        const result = await response.json();
        const data = result.user_activity || [];

        const excelData = data.map(item => ({
            'User Name': item.username || 'N/A',
            'Total Reservations': item.total_reservations || 0,
            'Email': item.email || 'N/A'
        })); const ws = XLSX.utils.json_to_sheet(excelData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'User Activity');

        const filename = `user_activity_${formatDateForFilename()}.xlsx`;
        XLSX.writeFile(wb, filename);

        showNotification('Excel file downloaded successfully', 'success');
    } catch (error) {
        console.error('Excel export error:', error);
        showNotification('Failed to export to Excel', 'error');
    } finally {
        hideLoading();
    }
}

/**
 * Export User Activity to PDF
 */
async function exportUserActivityPDF() {
    try {
        showLoading();
        const params = getDateParams();
        const response = await fetch(`/api/reports/user-activity?${params}`, {
            headers: getAuthHeaders()
        });

        if (!response.ok) throw new Error('Failed to fetch data');

        const result = await response.json();
        const data = result.user_activity || [];

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        doc.setFontSize(18);
        doc.text('User Activity Report', 14, 20);

        doc.setFontSize(10);
        doc.text(getDateRangeText(), 14, 28);

        const tableData = data.map(item => [
            item.username || 'N/A',
            (item.total_reservations || 0).toString(),
            item.email || 'N/A'
        ]); doc.autoTable({
            head: [['User Name', 'Reservations', 'Email']],
            body: tableData,
            startY: 35,
            theme: 'grid',
            headStyles: { fillColor: [75, 192, 192] }
        });

        const filename = `user_activity_${formatDateForFilename()}.pdf`;
        doc.save(filename);

        showNotification('PDF file downloaded successfully', 'success');
    } catch (error) {
        console.error('PDF export error:', error);
        showNotification('Failed to export to PDF', 'error');
    } finally {
        hideLoading();
    }
}

/**
 * Export Occupancy Report to Excel
 */
async function exportOccupancyExcel() {
    try {
        showLoading();
        const params = getDateParams();
        const response = await fetch(`/api/reports/occupancy?${params}`, {
            headers: getAuthHeaders()
        });

        if (!response.ok) throw new Error('Failed to fetch data');

        const result = await response.json();
        // Transform occupancy_data to match expected format
        const data = (result.occupancy_data || []).map(item => ({
            date: item.equipment_name,
            count: item.active_reservations
        }));

        const excelData = data.map(item => ({
            'Date': item.date || 'N/A',
            'Active Reservations': item.count || 0
        }));

        const ws = XLSX.utils.json_to_sheet(excelData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Occupancy');

        const filename = `occupancy_${formatDateForFilename()}.xlsx`;
        XLSX.writeFile(wb, filename);

        showNotification('Excel file downloaded successfully', 'success');
    } catch (error) {
        console.error('Excel export error:', error);
        showNotification('Failed to export to Excel', 'error');
    } finally {
        hideLoading();
    }
}

/**
 * Export Occupancy Report to PDF
 */
async function exportOccupancyPDF() {
    try {
        showLoading();
        const params = getDateParams();
        const response = await fetch(`/api/reports/occupancy?${params}`, {
            headers: getAuthHeaders()
        });

        if (!response.ok) throw new Error('Failed to fetch data');

        const result = await response.json();
        // Transform occupancy_data to match expected format
        const data = (result.occupancy_data || []).map(item => ({
            date: item.equipment_name,
            count: item.active_reservations
        }));

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        doc.setFontSize(18);
        doc.text('Occupancy Report', 14, 20);

        doc.setFontSize(10);
        doc.text(getDateRangeText(), 14, 28);

        const tableData = data.map(item => [
            item.date || 'N/A',
            (item.count || 0).toString()
        ]);

        doc.autoTable({
            head: [['Date', 'Active Reservations']],
            body: tableData,
            startY: 35,
            theme: 'grid',
            headStyles: { fillColor: [153, 102, 255] }
        });

        const filename = `occupancy_${formatDateForFilename()}.pdf`;
        doc.save(filename);

        showNotification('PDF file downloaded successfully', 'success');
    } catch (error) {
        console.error('PDF export error:', error);
        showNotification('Failed to export to PDF', 'error');
    } finally {
        hideLoading();
    }
}

/**
 * Get date parameters for API requests
 */
function getDateParams() {
    const startDate = document.getElementById('startDate')?.value;
    const endDate = document.getElementById('endDate')?.value;

    const params = new URLSearchParams();

    // Calculate days difference if both dates are provided
    if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        params.append('days', diffDays);
    } else {
        // Default to 30 days if no dates provided
        params.append('days', 30);
    }

    return params.toString();
}/**
 * Get date range text for reports
 */
function getDateRangeText() {
    const startDate = document.getElementById('startDate')?.value;
    const endDate = document.getElementById('endDate')?.value;

    if (startDate && endDate) {
        return `Date Range: ${formatDate(startDate)} to ${formatDate(endDate)}`;
    } else if (startDate) {
        return `From: ${formatDate(startDate)}`;
    } else if (endDate) {
        return `Until: ${formatDate(endDate)}`;
    }
    return 'All Time';
}

/**
 * Format date for display
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

/**
 * Format date for filename
 */
function formatDateForFilename() {
    const now = new Date();
    return now.toISOString().split('T')[0];
}

/**
 * Get authentication headers
 */
function getAuthHeaders() {
    const token = localStorage.getItem('access_token');
    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };
}

/**
 * Show loading overlay
 */
function showLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.style.display = 'flex';
    }
}

/**
 * Hide loading overlay
 */
function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.style.display = 'none';
    }
}

/**
 * Show notification
 */
function showNotification(message, type = 'info') {
    // Create fallback notification
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
        color: white;
        border-radius: 4px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        z-index: 10000;
        font-family: Arial, sans-serif;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}