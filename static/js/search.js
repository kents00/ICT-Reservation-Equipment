// Perform search
function performSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchQuery = searchInput.value.toLowerCase();

    // Update search summary
    const searchSummary = document.getElementById('searchSummary');
    searchSummary.textContent = searchQuery ? `Showing results for "${searchQuery}"` : 'Showing results for your search';

    // Get all results sections
    const resultsSections = document.querySelectorAll('.results-section');

    // If search query is empty, show all sections
    if (!searchQuery) {
        resultsSections.forEach(section => {
            section.style.display = 'block';
            const items = section.querySelectorAll('.result-item');
            items.forEach(item => {
                item.style.display = 'block';
            });
        });
        return;
    }

    // Filter sections and items based on search query
    resultsSections.forEach(section => {
        const sectionTitle = section.querySelector('.results-category').textContent.toLowerCase();
        const items = section.querySelectorAll('.result-item');
        let visibleItems = 0;

        items.forEach(item => {
            const itemText = item.textContent.toLowerCase();
            const matches = itemText.includes(searchQuery);
            item.style.display = matches ? 'block' : 'none';
            if (matches) visibleItems++;
        });

        // Show/hide entire section based on visible items
        section.style.display = visibleItems > 0 || sectionTitle.includes(searchQuery) ? 'block' : 'none';
    });
}

// Handle search input on page load
document.addEventListener('DOMContentLoaded', function () {
    const urlParams = new URLSearchParams(window.location.search);
    const searchQuery = urlParams.get('q');

    if (searchQuery) {
        document.getElementById('searchInput').value = searchQuery;
        performSearch();
    }
});

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
