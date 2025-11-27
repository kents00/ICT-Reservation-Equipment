# Flask Template Refactoring Guide

## Overview
The admin dashboard has been refactored to use Flask's structured template system following the [Flask Tutorial](https://flask.palletsprojects.com/en/stable/tutorial/templates/) best practices. This improves maintainability, reduces code duplication, and makes future updates easier.

## Directory Structure

```
backend/
├── templates/
│   ├── base.html                      # Base template with HTML structure
│   └── admin/
│       ├── layout.html                # Admin dashboard layout (extends base.html)
│       ├── login.html                 # Login page
│       ├── dashboard.html             # Dashboard home
│       ├── equipment.html             # Equipment list
│       ├── add-equipment.html         # Add equipment form
│       ├── edit-equipment.html        # Edit equipment form
│       ├── users.html                 # Users list
│       ├── edit-user.html             # Edit user form
│       ├── edit-admin.html            # Edit admin profile
│       ├── reservations.html          # Reservations list
│       ├── approvals.html             # Reservations approvals
│       ├── reports.html               # Reports dashboard
│       ├── settings.html              # System settings
│       └── includes/
│           ├── sidebar.html           # Sidebar navigation
│           └── header.html            # Page header
├── app.py                             # Updated with render_template routes
└── admin_dashboard/
    ├── css/                           # Stylesheets (unchanged)
    ├── js/                            # JavaScript files (unchanged)
    └── [old HTML files]               # Can be removed after migration
```

## Key Benefits

### 1. **Template Inheritance**
- `base.html` defines the root HTML structure
- `admin/layout.html` extends base.html and adds dashboard-specific layout
- Individual pages extend `admin/layout.html` to only define their unique content

### 2. **Code Reusability**
- **sidebar.html**: Common navigation used across all admin pages
- **header.html**: Common header with user profile menu
- No more duplicate code across multiple HTML files

### 3. **Maintainability**
- Update sidebar navigation in one place (`includes/sidebar.html`)
- Change header styling once and it applies everywhere
- Add new pages by simply extending `admin/layout.html`

### 4. **Dynamic Content**
Templates use Jinja2 to render dynamic data:
```jinja2
<h1>{{ page_title }}</h1>
<p>Total Equipment: {{ total_equipment }}</p>

{% if equipment %}
    {% for item in equipment %}
        <div>{{ item.name }}</div>
    {% endfor %}
{% endif %}
```

## Template Blocks

### Base Blocks (base.html)
- `{% block title %}` - Page title for browser tab
- `{% block stylesheets %}` - CSS files
- `{% block body_class %}` - Body tag classes
- `{% block content %}` - Main page content
- `{% block scripts %}` - JavaScript files

### Admin Layout Blocks (admin/layout.html)
- `{% block page_title %}` - Page header title
- `{% block page_content %}` - Page specific content
- `{% block modals %}` - Modal dialogs
- `{% block additional_stylesheets %}` - Extra CSS per page
- `{% block additional_scripts %}` - Extra JS per page

## Usage Examples

### Adding a New Admin Page

1. **Create new template** (`templates/admin/new-page.html`):
```jinja2
{% extends "admin/layout.html" %}

{% block title %}New Page - Equipment Reservation System{% endblock %}
{% block page_title %}New Page Title{% endblock %}

{% block page_content %}
<section class="section active">
    <!-- Your page content here -->
</section>
{% endblock %}
```

2. **Add route in app.py**:
```python
@app.route('/admin/new-page')
def admin_new_page():
    """Serve new page"""
    return render_template('admin/new-page.html', active_section='new-page')
```

### Updating Sidebar Navigation

Edit `templates/admin/includes/sidebar.html` - changes apply everywhere automatically.

### Passing Dynamic Data

From Flask route:
```python
@app.route('/admin/dashboard')
def admin_dashboard():
    equipment_count = get_equipment_count()
    return render_template(
        'admin/dashboard.html',
        active_section='dashboard',
        total_equipment=equipment_count
    )
```

In template:
```jinja2
<h3 class="stat-number">{{ total_equipment or 0 }}</h3>
```

## Migrating from Old Static HTML

### Old Approach
- Each page was a complete, standalone HTML file
- Sidebar code repeated in every file (~100+ lines)
- Header code repeated everywhere
- Updates to navigation required editing 8+ files

### New Approach
- Each template is 50-150 lines (much cleaner)
- Navigation in one place
- Header in one place
- Single update applies everywhere

## Static Files

Static assets (CSS, JS, images) are still served from `admin_dashboard/` folder:
- CSS: `admin_dashboard/css/styles.css`
- JavaScript: `admin_dashboard/js/auth.js`, etc.

They are referenced in templates using Flask's `url_for()`:
```jinja2
<link rel="stylesheet" href="{{ url_for('static', filename='admin_dashboard/css/styles.css') }}">
```

## Route Changes

### Before
- `/admin/login` → served `admin_dashboard/login.html`
- `/admin/` + hash navigation → multiple sections in one HTML

### After
- `/admin/login` → `admin/login.html` template
- `/admin/dashboard` → `admin/dashboard.html` template
- `/admin/equipment` → `admin/equipment.html` template
- `/admin/equipment/add` → `admin/add-equipment.html` template
- etc.

Each route is now explicit and maps directly to a template.

## Jinja2 Template Features Used

### Variables
```jinja2
{{ variable_name }}
{{ user.email }}
```

### Conditionals
```jinja2
{% if condition %}
    Content shown if true
{% else %}
    Content shown if false
{% endif %}
```

### Loops
```jinja2
{% for item in items %}
    <div>{{ item.name }}</div>
{% endfor %}
```

### Filters
```jinja2
{{ text|capitalize }}
{{ date|dateformat }}
```

### Include Other Templates
```jinja2
{% include "admin/includes/sidebar.html" %}
```

## Best Practices Applied

✅ **DRY (Don't Repeat Yourself)** - Reusable components in includes/
✅ **Separation of Concerns** - Templates focus on presentation
✅ **Scalability** - Easy to add new pages
✅ **Maintainability** - Single source of truth for shared UI
✅ **Flask Conventions** - Follows official Flask tutorial structure
✅ **Security** - Jinja2 auto-escaping prevents XSS attacks

## Next Steps

1. **Remove old HTML files** from `admin_dashboard/` (backup first if needed)
2. **Update JavaScript** to work with new URLs if using hash navigation
3. **Add data rendering** - Replace hardcoded demo data with actual database queries
4. **Test all routes** - Ensure each page renders correctly
5. **Update frontend** - Expo app should now call the proper Flask routes

## References

- [Flask Template Tutorial](https://flask.palletsprojects.com/en/stable/tutorial/templates/)
- [Jinja2 Documentation](https://jinja.palletsprojects.com/)
- [Flask url_for()](https://flask.palletsprojects.com/en/stable/api/#flask.url_for)
