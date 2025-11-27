/**
 * QR Code Scanner for Equipment
 * Scans QR codes and displays equipment details
 */

let html5QrcodeScanner = null;

// Make functions globally accessible
window.startScanner = startScanner;
window.stopScanner = stopScanner;

async function startScanner() {
    // Check if Html5QrcodeScanner is available
    if (typeof Html5QrcodeScanner === 'undefined') {
        alert('QR Scanner library is not loaded. Please refresh the page.');
        return;
    }

    document.getElementById('startScanBtn').style.display = 'none';
    document.getElementById('stopScanBtn').style.display = 'inline-block';
    document.getElementById('equipmentDetails').style.display = 'none';

    html5QrcodeScanner = new Html5QrcodeScanner(
        "qr-reader",
        {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0
        }
    );

    html5QrcodeScanner.render(onScanSuccess, onScanError);
}

function stopScanner() {
    if (html5QrcodeScanner) {
        html5QrcodeScanner.clear();
        html5QrcodeScanner = null;
    }
    document.getElementById('startScanBtn').style.display = 'inline-block';
    document.getElementById('stopScanBtn').style.display = 'none';
}

async function onScanSuccess(decodedText, decodedResult) {
    console.log(`QR Code detected: ${decodedText}`);

    // Stop scanner
    stopScanner();

    // Show loading state
    showLoadingState();

    // Fetch equipment details
    try {
        const response = await fetch(`/api/qrcode/validate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ qr_code: decodedText })
        });

        if (!response.ok) {
            const errorData = await response.json();
            alert(errorData.error || 'Equipment not found or invalid QR code');
            return;
        }

        const data = await response.json();
        displayEquipmentDetails(data.equipment);
    } catch (error) {
        console.error('Error fetching equipment:', error);
        alert('Failed to load equipment details. Please try again.');
    }
}

function onScanError(errorMessage) {
    // Ignore scan errors (happens frequently during scanning)
    // console.log(`Scan error: ${errorMessage}`);
}

function showLoadingState() {
    const detailsSection = document.getElementById('equipmentDetails');
    detailsSection.style.display = 'block';
    detailsSection.innerHTML = `
        <div class="details-card" style="text-align: center; padding: 40px;">
            <div style="margin: 20px 0;">
                <svg width="50" height="50" viewBox="0 0 50 50" style="animation: spin 1s linear infinite;">
                    <circle cx="25" cy="25" r="20" fill="none" stroke="#007AFF" stroke-width="4" stroke-dasharray="80" stroke-dashoffset="60"/>
                </svg>
            </div>
            <p>Loading equipment details...</p>
        </div>
    `;
}

function displayEquipmentDetails(equipment) {
    const detailsSection = document.getElementById('equipmentDetails');
    detailsSection.innerHTML = `
        <div class="details-card">
            <h2 id="detailName">${escapeHtml(equipment.name)}</h2>
            <div class="detail-row">
                <strong>Category:</strong> <span id="detailCategory">${escapeHtml(equipment.category) || '-'}</span>
            </div>
            <div class="detail-row">
                <strong>Serial Number:</strong> <span id="detailSerial">${escapeHtml(equipment.serial_number) || '-'}</span>
            </div>
            <div class="detail-row">
                <strong>Location:</strong> <span id="detailLocation">${escapeHtml(equipment.location) || '-'}</span>
            </div>
            <div class="detail-row">
                <strong>Status:</strong> <span id="detailStatus" class="status-badge ${equipment.status || ''}">${(equipment.status || '').toString().replaceAll('_', ' ').toUpperCase()}</span>
            </div>
            <div class="detail-row">
                <strong>Available:</strong> <span id="detailAvailable">${equipment.quantity_available}</span> / <span id="detailQuantity">${equipment.quantity}</span>
            </div>
            <div class="detail-row">
                <strong>Description:</strong>
                <p id="detailDescription">${escapeHtml(equipment.description) || 'No description available'}</p>
            </div>
            <div class="detail-actions">
                <a id="viewEquipmentBtn" class="btn btn-primary" href="/admin/view-equipment.html?id=${equipment.id}">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 18px; height: 18px; display: inline-block; vertical-align: middle; margin-right: 6px;">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                    View Full Details
                </a>
                <a id="editEquipmentBtn" class="btn btn-secondary" href="/admin/edit-equipment.html?id=${equipment.id}">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 18px; height: 18px; display: inline-block; vertical-align: middle; margin-right: 6px;">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                    Edit Equipment
                </a>
                <button class="btn btn-info" onclick="startScanner(); document.getElementById('equipmentDetails').style.display='none';">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 18px; height: 18px; display: inline-block; vertical-align: middle; margin-right: 6px;">
                        <polyline points="1 4 1 10 7 10"></polyline>
                        <polyline points="23 20 23 14 17 14"></polyline>
                        <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"></path>
                    </svg>
                    Scan Another
                </button>
            </div>
        </div>
    `;
    detailsSection.style.display = 'block';
}

// Helper function to escape HTML
function escapeHtml(unsafe) {
    if (!unsafe && unsafe !== 0) return '';
    return String(unsafe)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// Add CSS for spinner animation
const style = document.createElement('style');
style.textContent = `
    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);
