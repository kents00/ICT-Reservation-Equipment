# Template Architecture Visualization

## Template Inheritance Chain

```
┌─────────────────────────────────────────────────────┐
│              base.html                              │
│  (HTML5 structure, meta, title block)               │
├─────────────────────────────────────────────────────┤
│  • {% block title %}                                │
│  • {% block stylesheets %}                          │
│  • {% block body_class %}                           │
│  • {% block content %}                              │
│  • {% block scripts %}                              │
└────────────────────────┬────────────────────────────┘
                         │ extends
                         ▼
┌─────────────────────────────────────────────────────┐
│          admin/layout.html                          │
│  (Dashboard layout with sidebar & header)           │
├─────────────────────────────────────────────────────┤
│  • {% include sidebar %}                            │
│  • {% include header %}                             │
│  • {% block page_title %}                           │
│  • {% block page_content %}                         │
│  • {% block modals %}                               │
│  • {% block additional_scripts %}                   │
└────────────────────────┬────────────────────────────┘
                         │ extends
        ┌────────────────┼────────────────┬──────────┐
        ▼                ▼                ▼          ▼
   ┌─────────┐    ┌──────────┐    ┌────────────┐  ┌──────────┐
   │dashboard│    │equipment │    │add-equipment│  │ users    │
   │.html    │    │.html     │    │.html       │  │.html     │
   └─────────┘    └──────────┘    └────────────┘  └──────────┘

        ... and more admin pages
```

## Page Rendering Flow

```
HTTP Request
    │
    ▼
┌───────────────────────────────────┐
│  Flask Route (app.py)             │
│  @app.route('/admin/dashboard')   │
│  def admin_dashboard():           │
├───────────────────────────────────┤
│  • Get data from database         │
│  • Pass context to render_template│
└──────────────────┬────────────────┘
                   │ render_template('admin/dashboard.html', **context)
                   ▼
┌───────────────────────────────────┐
│  admin/dashboard.html             │
│  {% extends 'admin/layout.html' %} │
├───────────────────────────────────┤
│  Content specific to dashboard    │
└──────────────────┬────────────────┘
                   │ inherits from
                   ▼
┌───────────────────────────────────┐
│  admin/layout.html                │
│  {% extends 'base.html' %}        │
├───────────────────────────────────┤
│  • {% include sidebar %}          │
│  • {% include header %}           │
│  • Dashboard wrapper structure    │
└──────────────────┬────────────────┘
                   │ inherits from
                   ▼
┌───────────────────────────────────┐
│  base.html                        │
├───────────────────────────────────┤
│  <!DOCTYPE html>                  │
│  <html>                           │
│  <head>...</head>                 │
│  <body>{% block content %}</body> │
│  </html>                          │
└──────────────────┬────────────────┘
                   │ compiles to
                   ▼
         ┌──────────────────┐
         │   Final HTML     │
         │  Sent to Browser │
         └──────────────────┘
```

## Component Reuse Pattern

```
┌──────────────────────────────────────────────────────┐
│           admin/includes/sidebar.html                │
│  (Used by ALL admin dashboard pages)                 │
├──────────────────────────────────────────────────────┤
│  • Navigation links                                  │
│  • Logo and branding                                │
│  • User logout button                               │
│  Uses {{ active_section }} to highlight current page│
└────────────┬─────────────┬──────────┬──────┬────────┘
             │             │          │      │
        ┌────▼────┐  ┌─────▼───┐  ┌──▼─┐  ┌▼──────┐
        │dashboard│  │equipment│  │user│  │ ...  │
        │.html    │  │.html    │  │.html   │.html  │
        └─────────┘  └─────────┘  └──────┘ └──────┘
                All pages include the same sidebar
             (Single point of maintenance!)
```

## File Organization Benefits

### Before Refactoring
```
admin_dashboard/
├── login.html           (320 lines)
├── dashboard.html       (947 lines)
├── add-equipment.html   (367 lines)
├── edit-equipment.html  (367 lines)
├── edit-user.html       (276 lines)
├── edit-admin.html      (302 lines)
├── notifications.html   (296 lines)
├── search.html          (289 lines)
├── view-reservation.html (348 lines)
└── ... plus duplicated sidebar/header in each file

ISSUES:
✗ ~100 lines of sidebar code in EACH file
✗ ~80 lines of header code in EACH file
✗ Update navigation = edit 8+ files
✗ Hard to find actual page content
✗ Inconsistent updates prone to errors
```

### After Refactoring
```
templates/
├── base.html                    (Essential structure only)
└── admin/
    ├── layout.html              (Shared layout)
    ├── dashboard.html           (Content focused)
    ├── equipment.html           (Content focused)
    ├── add-equipment.html       (Content focused)
    ├── ... more pages           (Content focused)
    └── includes/
        ├── sidebar.html         (ONCE for all pages)
        └── header.html          (ONCE for all pages)

BENEFITS:
✓ Single sidebar file used by all
✓ Single header file used by all
✓ Update navigation = edit 1 file
✓ Each file focuses on its purpose
✓ 50% less total HTML code
✓ Easier to find page-specific content
✓ Consistent across all pages
```

## Jinja2 Template Features Used

### 1. Blocks - Override content in child templates
```jinja2
{# base.html #}
{% block title %}Default Title{% endblock %}

{# admin/layout.html #}
{% block title %}Admin Dashboard{% endblock %}

{# admin/dashboard.html #}
{% block title %}Dashboard - Equipment Reservation{% endblock %}
```

### 2. Extends - Inherit from parent template
```jinja2
{# admin/dashboard.html #}
{% extends "admin/layout.html" %}
```

### 3. Include - Reuse component templates
```jinja2
{# admin/layout.html #}
{% include "admin/includes/sidebar.html" %}
{% include "admin/includes/header.html" %}
```

### 4. Variables - Dynamic content
```jinja2
<h3>{{ total_equipment }}</h3>
<p>Welcome, {{ user.first_name }}!</p>
```

### 5. Filters - Format variables
```jinja2
{{ timestamp|date }}
{{ text|capitalize }}
{{ number|round(2) }}
```

### 6. Conditionals - Show/hide content
```jinja2
{% if user.is_admin %}
    <button>Admin Tools</button>
{% endif %}
```

### 7. Loops - Iterate over collections
```jinja2
{% for item in equipment_list %}
    <tr>
        <td>{{ item.name }}</td>
        <td>{{ item.status }}</td>
    </tr>
{% endfor %}
```

## URL Generation with url_for()

```jinja2
{# Instead of hardcoded URLs... #}
<a href="dashboard.html">Dashboard</a>        ✗ Bad
<a href="/admin/dashboard">Dashboard</a>      ✗ OK
<a href="/admin/dashboard.html">Dashboard</a> ✗ Wrong

{# Use Flask's url_for() #}
<a href="{{ url_for('admin_dashboard') }}">Dashboard</a>                      ✓ Best
<a href="{{ url_for('admin_edit_equipment', equipment_id=5) }}">Edit</a>     ✓ Best

{# Advantages:
   - URLs update automatically if routes change
   - Handles URL parameters properly
   - Absolute vs relative paths handled automatically
#}
```

## Content Integration Example

### Route in app.py
```python
@app.route('/admin/dashboard')
def admin_dashboard():
    # Get data
    stats = {
        'total_equipment': 48,
        'available': 32,
        'reserved': 12,
        'maintenance': 4
    }

    # Pass to template
    return render_template(
        'admin/dashboard.html',
        active_section='dashboard',
        **stats
    )
```

### Template Usage
```jinja2
<div class="stat-card">
    <h3 class="stat-number">{{ total_equipment }}</h3>
    <p class="stat-label">Total Equipment</p>
</div>

<div class="stat-card">
    <h3 class="stat-number">{{ available }}</h3>
    <p class="stat-label">Available</p>
</div>
```

## Migration Path for Old HTML Files

```
Current State:
admin_dashboard/
├── login.html (old, standalone)
├── dashboard.html (old, standalone)
└── ...

Migration Steps:
1. Created templates/ folder with new structure
2. Created refactored versions as Jinja2 templates
3. Updated app.py routes to use render_template()

Cleanup (after testing):
- Backup old admin_dashboard/*.html files
- Remove old files
- Keep admin_dashboard/css/ and admin_dashboard/js/
- JS files still serve from admin_dashboard/js/
- CSS files still serve from admin_dashboard/css/
```

---

This architecture provides a clean, maintainable, and scalable template system
that follows Flask best practices and eliminates code duplication.
