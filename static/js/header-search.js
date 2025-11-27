// Header Search Dropdown Functionality - Real Data from API
document.addEventListener('DOMContentLoaded', function () {
    const searchInput = document.getElementById('searchInput');
    const searchDropdown = document.getElementById('searchDropdown');
    const searchClear = document.getElementById('searchClear');
    const searchResults = document.getElementById('searchResults');
    const searchNoResults = document.getElementById('searchNoResults');
    const searchSummary = document.getElementById('searchSummary');
    const notificationBadge = document.getElementById('notificationBadge');
    const notificationsBtn = document.getElementById('notificationsBtn');

    let searchTimeout;

    // Only run search bar logic if searchInput exists
    if (searchInput) {
        // Search input event listener with debouncing
        searchInput.addEventListener('input', function () {
            const query = this.value.trim();

            // Show/hide clear button
            searchClear.style.display = query ? 'block' : 'none';

            if (query.length === 0) {
                searchDropdown.style.display = 'none';
                clearTimeout(searchTimeout);
                return;
            }

            if (query.length < 2) {
                searchSummary.textContent = 'Type at least 2 characters to search...';
                searchDropdown.style.display = 'block';
                searchResults.style.display = 'none';
                searchNoResults.style.display = 'none';
                clearTimeout(searchTimeout);
                return;
            }

            // Debounce search API calls (wait 300ms after user stops typing)
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                performHeaderSearch(query);
            }, 300);

            searchDropdown.style.display = 'block';
        });

        // Focus event to show dropdown
        searchInput.addEventListener('focus', function () {
            if (this.value.trim().length >= 2) {
                searchDropdown.style.display = 'block';
            }
        });

        // Clear button click
        searchClear.addEventListener('click', function () {
            searchInput.value = '';
            searchClear.style.display = 'none';
            searchDropdown.style.display = 'none';
        });

        // Keyboard navigation
        searchInput.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') {
                searchDropdown.style.display = 'none';
                searchInput.blur();
            } else if (e.key === 'Enter') {
                const query = this.value.trim();
                if (query) {
                    // Navigate to full search page
                    window.location.href = 'search.html?q=' + encodeURIComponent(query);
                }
            }
        });
    }

    // Close dropdown when clicking outside
    document.addEventListener('click', function (e) {
        const searchContainer = document.querySelector('.search-bar-container');
        if (searchContainer && !searchContainer.contains(e.target)) {
            searchDropdown.style.display = 'none';
        }
    });

    // Perform search across all categories using API
    async function performHeaderSearch(query) {
        try {
            // Get JWT token from localStorage
            const token = localStorage.getItem('access_token');

            if (!token) {
                searchSummary.textContent = 'Please login to search';
                searchResults.style.display = 'none';
                searchNoResults.style.display = 'block';
                return;
            }

            // Show loading state
            searchSummary.textContent = 'Searching...';
            searchResults.style.display = 'none';

            // Call the comprehensive search API
            const response = await fetch(`/api/admin/search/comprehensive?q=${encodeURIComponent(query)}&limit=5`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                if (response.status === 401) {
                    searchSummary.textContent = 'Session expired. Please login again.';
                } else {
                    searchSummary.textContent = 'Search failed. Please try again.';
                }
                searchResults.style.display = 'none';
                searchNoResults.style.display = 'block';
                return;
            }

            const data = await response.json();

            // Calculate total results
            const totalResults =
                (data.equipment?.length || 0) +
                (data.reservations?.length || 0) +
                (data.users?.length || 0) +
                (data.approvals?.length || 0) +
                (data.reports?.length || 0) +
                (data.settings?.length || 0);

            if (totalResults === 0) {
                searchSummary.textContent = `No results found for "${query}"`;
                searchResults.style.display = 'none';
                searchNoResults.style.display = 'block';
                return;
            }

            // Update search summary
            searchSummary.textContent = `Found ${totalResults} results for "${query}"`;

            // Populate results
            populateResultsCategory('equipment', data.equipment || []);
            populateResultsCategory('reservations', data.reservations || []);
            populateResultsCategory('users', data.users || []);
            populateResultsCategory('approvals', data.approvals || []);
            populateResultsCategory('reports', data.reports || []);
            populateResultsCategory('settings', data.settings || []);

            searchResults.style.display = 'block';
            searchNoResults.style.display = 'none';

        } catch (error) {
            console.error('Search error:', error);
            searchSummary.textContent = 'Error performing search. Please try again.';
            searchResults.style.display = 'none';
            searchNoResults.style.display = 'block';
        }
    }

    // Populate results for a category
    function populateResultsCategory(category, items) {
        const container = document.getElementById(`${category}-results`);
        // Only select results-section inside the search dropdown
        const section = document.querySelector('.search-dropdown [data-section="' + category + '"]');

        if (!container || !section) return;

        if (items.length === 0) {
            container.innerHTML = '';
            section.style.display = 'none';
            return;
        }

        const html = items.map(item => createResultItem(item, category)).join('');
        container.innerHTML = html;
        section.style.display = 'block';
    }

    // Create result item HTML
    function createResultItem(item, category) {
        const statusClass = item.status ? item.status.toLowerCase().replace(/\s+/g, '-') : '';
        return `
            <div class="result-item" data-id="${item.id}">
                <h4>${escapeHtml(item.title)}</h4>
                <p>${escapeHtml(item.description)}</p>
                <span class="result-status ${statusClass}">${escapeHtml(item.status)}</span>
                <a href="${item.link}" class="result-link">View Details <i class="fas fa-arrow-right"></i></a>
            </div>
        `;
    }

    // Escape HTML to prevent XSS
    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // --- Notification Badge Logic for Header ---
    // Fetch unread notification count
    async function updateNotificationBadge() {
        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch('/api/admin/notifications', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to fetch notifications');
            const data = await response.json();

            // Count unread and not dismissed notifications
            const dismissed = JSON.parse(localStorage.getItem('dismissed_notifications') || '[]');
            const unreadCount = (data.notifications || [])
                .filter(n => !n.read && !dismissed.includes(n.id))
                .length;

            notificationBadge.textContent = unreadCount;
        } catch (err) {
            if (notificationBadge) notificationBadge.textContent = '0';
        }
    }

    // Navigate to notifications page
    if (notificationsBtn) {
        notificationsBtn.onclick = function () {
            window.location.href = '/admin/notifications';
        };
    }

    updateNotificationBadge();
});
