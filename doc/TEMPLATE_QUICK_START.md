# Flask Template System - Quick Start Guide

## 🎯 What Changed?

HTML files are now **Jinja2 templates** with **inheritance** instead of standalone HTML files.

## 📁 Where to Find Things

| What | Location |
|------|----------|
| Page content | `templates/admin/[page-name].html` |
| Sidebar | `templates/admin/includes/sidebar.html` |
| Header | `templates/admin/includes/header.html` |
| Layout wrapper | `templates/admin/layout.html` |
| Root template | `templates/base.html` |
| Styles | `admin_dashboard/css/styles.css` |
| Scripts | `admin_dashboard/js/*.js` |
| Routes/Views | `app.py` |

## 🚀 Common Tasks

### Add a New Admin Page

1. **Create template** (`templates/admin/mypage.html`):
```jinja2
{% extends "admin/layout.html" %}

{% block title %}My Page - Equipment Reservation System{% endblock %}
{% block page_title %}My Page{% endblock %}

{% block page_content %}
<section class="section active">
    <h2>Welcome to My Page</h2>
</section>
{% endblock %}
```

2. **Add route** in `app.py`:
```python
@app.route('/admin/mypage')
def admin_mypage():
    return render_template('admin/mypage.html', active_section='mypage')
```

3. **Access at**: `http://localhost:5000/admin/mypage`

### Update Navigation

Edit `templates/admin/includes/sidebar.html` - appears on **all** admin pages.

### Update Page Header

Edit `templates/admin/includes/header.html` - appears on **all** admin pages.

### Pass Data to Template

**In Flask route:**
```python
@app.route('/admin/dashboard')
def admin_dashboard():
    return render_template(
        'admin/dashboard.html',
        active_section='dashboard',
        total_equipment=48,
        recent_items=[...]
    )
```

**In template:**
```jinja2
<h3>{{ total_equipment }}</h3>
{% for item in recent_items %}
    <div>{{ item.name }}</div>
{% endfor %}
```

### Show Content Based on User Role

```jinja2
{% if user.role == 'admin' %}
    <button>Admin Only Button</button>
{% endif %}
```

### Loop Through List Items

```jinja2
<table>
    {% for equipment in equipment_list %}
    <tr>
        <td>{{ equipment.name }}</td>
        <td>{{ equipment.location }}</td>
    </tr>
    {% endfor %}
</table>
```

### Generate URLs to Routes

```jinja2
{# Link to another page #}
<a href="{{ url_for('admin_dashboard') }}">Dashboard</a>

{# Link with parameters #}
<a href="{{ url_for('admin_edit_equipment', equipment_id=5) }}">Edit</a>

{# Static files #}
<img src="{{ url_for('static', filename='admin_dashboard/css/styles.css') }}">
<link href="{{ url_for('static', filename='admin_dashboard/css/styles.css') }}">
<script src="{{ url_for('static', filename='admin_dashboard/js/auth.js') }}"></script>
```

## 📋 Template Structure Quick Reference

```jinja2
{% extends "admin/layout.html" %}           ← Inherit from layout

{% block title %}Page Title{% endblock %}   ← Browser tab title

{% block page_title %}Page Title{% endblock %} ← Page header

{% block page_content %}                    ← Page specific content
    <section class="section active">
        <h2>Content Here</h2>
    </section>
{% endblock %}

{% block modals %}                          ← Modal dialogs
    <div class="modal"></div>
{% endblock %}

{% block additional_scripts %}              ← Extra JS
    <script src="{{ url_for('static', filename='admin_dashboard/js/myfile.js') }}"></script>
{% endblock %}
```

## 🔗 Links Between Pages

| Page | Route | Function |
|------|-------|----------|
| Login | `/admin/login` | `admin_login()` |
| Dashboard | `/admin/dashboard` | `admin_dashboard()` |
| Equipment List | `/admin/equipment` | `admin_equipment()` |
| Add Equipment | `/admin/equipment/add` | `admin_add_equipment()` |
| Edit Equipment | `/admin/equipment/<id>/edit` | `admin_edit_equipment(id)` |
| Users | `/admin/users` | `admin_users()` |
| Edit User | `/admin/users/<id>/edit` | `admin_edit_user(id)` |
| Admin Profile | `/admin/profile` | `edit_admin_profile()` |
| Reservations | `/admin/reservations` | `admin_reservations()` |
| Approvals | `/admin/approvals` | `admin_approvals()` |
| Reports | `/admin/reports` | `admin_reports()` |
| Settings | `/admin/settings` | `admin_settings()` |

## 🧩 Template Hierarchy

Every page follows this chain:

```
page.html
    ↓ extends
layout.html
    ↓ extends
base.html
    ↓
Full HTML document
```

This means you only define **unique content** in each page!

## ⚡ Jinja2 Cheat Sheet

| Feature | Syntax | Example |
|---------|--------|---------|
| Variable | `{{ name }}` | `<h1>{{ title }}</h1>` |
| Condition | `{% if condition %}...{% endif %}` | `{% if user %}Hello!{% endif %}` |
| Loop | `{% for item in list %}...{% endfor %}` | `{% for x in items %}<li>{{ x }}</li>{% endfor %}` |
| Filter | `\|filter_name` | `{{ name\|capitalize }}` |
| Include | `{% include 'file' %}` | `{% include 'admin/includes/sidebar.html' %}` |
| Extends | `{% extends 'base' %}` | `{% extends 'admin/layout.html' %}` |
| Block | `{% block name %}...{% endblock %}` | `{% block content %}...{% endblock %}` |
| Comment | `{# comment #}` | `{# This is a comment #}` |

## 🧪 Testing Your Page

1. **Start Flask**:
```bash
cd backend
python app.py
```

2. **Visit page**:
```
http://localhost:5000/admin/mypage
```

3. **Check template renders**:
- Sidebar appears
- Header appears
- Your content appears
- No Jinja2 syntax visible in page source

## 🐛 Common Issues

| Issue | Solution |
|-------|----------|
| Page not found | Check route in `app.py` |
| Sidebar/header missing | Make sure you `{% extends "admin/layout.html" %}` |
| `{{ variable }}` shows on page | Variable not passed from Flask route |
| Wrong URL generated | Use `url_for('function_name')` not hardcoded URLs |
| CSS/JS not loading | Use `url_for('static', filename='...')` |

## 📚 Learn More

- [Flask Template Tutorial](https://flask.palletsprojects.com/en/stable/tutorial/templates/)
- [Jinja2 Template Designer Docs](https://jinja.palletsprojects.com/templates/)
- See `TEMPLATE_REFACTORING_GUIDE.md` for detailed info
- See `TEMPLATE_ARCHITECTURE.md` for visual diagrams

## 💡 Pro Tips

1. **Use meaningful block names** - makes templates easier to read
2. **Keep templates simple** - complex logic belongs in Python
3. **DRY principle** - Don't repeat HTML across files
4. **Always use url_for()** - Never hardcode URLs
5. **Comment your blocks** - Helps future developers understand structure
6. **Test data rendering** - Pass sample data from routes to verify templates

---

**Need help?** Check the docs or look at existing templates for examples!
