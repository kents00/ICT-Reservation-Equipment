# Add Student API Documentation

## Endpoint

```
POST /api/admin/students/add
```

## Authentication

**Required:** JWT Bearer Token in Authorization header

```
Authorization: Bearer <jwt_token>
```

## Request

### Content Type
`multipart/form-data` (for file uploads) or `application/x-www-form-urlencoded`

### Request Body (Form Data)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `first_name` | string | Yes | Student's first name |
| `middle_name` | string | No | Student's middle name |
| `last_name` | string | Yes | Student's last name |
| `username` | string | Yes | Unique username for login |
| `email` | string | Yes | Unique email address |
| `password` | string | Yes | Password (min 6 chars) |
| `student_id` | string | Yes | Unique student ID |
| `department` | string | Yes | Course name (from dropdown) |
| `phone` | string | No | Phone number |
| `status` | string | Yes | "active" or "inactive" |
| `profile_image` | file | No | Image file (JPG, PNG, GIF) |

### Example Request (cURL)

```bash
curl -X POST http://localhost:5000/api/admin/students/add \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "first_name=John" \
  -F "middle_name=Michael" \
  -F "last_name=Doe" \
  -F "username=john.doe" \
  -F "email=john.doe@university.edu" \
  -F "password=securePassword123" \
  -F "student_id=STU-20250001" \
  -F "department=Bachelor of Science in Information Technology" \
  -F "phone=+1-555-123-4567" \
  -F "status=active" \
  -F "profile_image=@/path/to/image.jpg"
```

### Example Request (JavaScript Fetch)

```javascript
const formData = new FormData();
formData.append('first_name', 'John');
formData.append('middle_name', 'Michael');
formData.append('last_name', 'Doe');
formData.append('username', 'john.doe');
formData.append('email', 'john.doe@university.edu');
formData.append('password', 'securePassword123');
formData.append('student_id', 'STU-20250001');
formData.append('department', 'Bachelor of Science in Information Technology');
formData.append('phone', '+1-555-123-4567');
formData.append('status', 'active');

// Add image file if selected
if (imageFile) {
    formData.append('profile_image', imageFile);
}

const response = await fetch('/api/admin/students/add', {
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${jwtToken}`
    },
    body: formData
});

const data = await response.json();
```

### Example Request (Python Requests)

```python
import requests

url = 'http://localhost:5000/api/admin/students/add'
headers = {
    'Authorization': f'Bearer {jwt_token}'
}

files = {}
if profile_image_path:
    files['profile_image'] = open(profile_image_path, 'rb')

data = {
    'first_name': 'John',
    'middle_name': 'Michael',
    'last_name': 'Doe',
    'username': 'john.doe',
    'email': 'john.doe@university.edu',
    'password': 'securePassword123',
    'student_id': 'STU-20250001',
    'department': 'Bachelor of Science in Information Technology',
    'phone': '+1-555-123-4567',
    'status': 'active'
}

response = requests.post(url, headers=headers, data=data, files=files)
print(response.json())
```

## Response

### Success Response (201 Created)

```json
{
    "message": "Student created successfully",
    "user": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "username": "john.doe",
        "email": "john.doe@university.edu",
        "role": "student",
        "first_name": "John",
        "middle_name": "Michael",
        "last_name": "Doe",
        "phone": "+1-555-123-4567",
        "department": "Bachelor of Science in Information Technology",
        "student_id": "STU-20250001",
        "status": "active",
        "image_url": null,
        "created_at": "2025-01-15T10:30:00.000000",
        "is_active": true,
        "two_factor_enabled": false,
        "image_base64": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
    }
}
```

### Error Responses

#### Missing Required Field (400 Bad Request)

```json
{
    "error": "Missing required field: email"
}
```

#### Username Already Exists (409 Conflict)

```json
{
    "error": "Username already exists"
}
```

#### Email Already Exists (409 Conflict)

```json
{
    "error": "Email already exists"
}
```

#### Invalid Email Format (400 Bad Request)

```json
{
    "error": "Invalid email format"
}
```

#### Password Too Short (400 Bad Request)

```json
{
    "error": "Password must be at least 6 characters long"
}
```

#### Invalid Request Format (400 Bad Request)

```json
{
    "error": "Invalid request format"
}
```

#### Admin Access Required (403 Forbidden)

```json
{
    "error": "Admin access required"
}
```

#### Server Error (500 Internal Server Error)

```json
{
    "error": "Database constraint violation or server error message"
}
```

## Status Codes

| Code | Meaning | Possible Reasons |
|------|---------|-----------------|
| 201 | Created | Student successfully created |
| 400 | Bad Request | Missing field, invalid format, password too short |
| 403 | Forbidden | Not authenticated as admin |
| 409 | Conflict | Username/email/student ID already exists |
| 500 | Server Error | Database error, file system error |

## Validation Rules

### Username
- Required
- Must be unique
- No specific format restrictions

### Email
- Required
- Must be unique
- Must contain @ and domain
- Format: `user@domain.com`

### Password
- Required
- Minimum 6 characters
- Will be hashed before storage
- Never stored as plain text

### Student ID
- Required
- Must be unique
- Suggested format: STU-YYYYNNNNN

### Department
- Required
- Must be one of:
  - "Bachelor of Science in Marine Biology"
  - "Bachelor of Science in Information Technology"
  - "Bachelor of Technology and Livelihood Education in Industrial Arts"
  - "Bachelor of Technology and Livelihood Education in Home Economics"

### Status
- Required
- Must be "active" or "inactive"

### First Name / Last Name
- Required
- String, any length
- Can contain letters, spaces, hyphens

### Middle Name
- Optional
- String, any length

### Phone
- Optional
- String, any format
- Examples: "+1-555-123-4567", "555-123-4567", "+63 917 123 4567"

### Profile Image
- Optional
- File type: JPG, PNG, GIF
- Stored as binary in database
- Returned as base64 in response

## Rate Limiting

No rate limiting currently implemented. Subject to change.

## CORS

API is available to same-origin requests only.

## Notes

1. **Password Security**: Passwords are hashed using werkzeug's `generate_password_hash()` with SHA256
2. **Image Storage**: Images are stored as binary data in the database, not on filesystem
3. **User Role**: All students created through this endpoint are assigned the "student" role
4. **Timestamps**: Created timestamps are in UTC format (ISO 8601)
5. **ID Generation**: User IDs are auto-generated UUIDs
6. **Active Status**: Maps form status selection to database `is_active` boolean

## Examples by Language

### JavaScript/Node.js

```javascript
// Example: Create student with all fields
async function createStudent(jwtToken, studentData) {
    const formData = new FormData();

    // Add required fields
    formData.append('first_name', studentData.firstName);
    formData.append('last_name', studentData.lastName);
    formData.append('username', studentData.username);
    formData.append('email', studentData.email);
    formData.append('password', studentData.password);
    formData.append('student_id', studentData.studentId);
    formData.append('department', studentData.department);
    formData.append('status', studentData.status || 'active');

    // Add optional fields
    if (studentData.middleName) {
        formData.append('middle_name', studentData.middleName);
    }
    if (studentData.phone) {
        formData.append('phone', studentData.phone);
    }
    if (studentData.profileImage) {
        formData.append('profile_image', studentData.profileImage);
    }

    try {
        const response = await fetch('/api/admin/students/add', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${jwtToken}`
            },
            body: formData
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Failed to create student');
        }

        return result.user;
    } catch (error) {
        console.error('Error creating student:', error);
        throw error;
    }
}
```

### Python

```python
import requests
from datetime import datetime

def create_student(base_url, jwt_token, student_data, profile_image_path=None):
    """Create a new student account"""

    url = f'{base_url}/api/admin/students/add'
    headers = {
        'Authorization': f'Bearer {jwt_token}'
    }

    data = {
        'first_name': student_data['first_name'],
        'last_name': student_data['last_name'],
        'username': student_data['username'],
        'email': student_data['email'],
        'password': student_data['password'],
        'student_id': student_data['student_id'],
        'department': student_data['department'],
        'status': student_data.get('status', 'active')
    }

    # Add optional fields
    if 'middle_name' in student_data:
        data['middle_name'] = student_data['middle_name']
    if 'phone' in student_data:
        data['phone'] = student_data['phone']

    files = {}
    if profile_image_path:
        files['profile_image'] = open(profile_image_path, 'rb')

    try:
        response = requests.post(url, headers=headers, data=data, files=files)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error: {e}")
        raise
    finally:
        for file_obj in files.values():
            file_obj.close()

# Usage
if __name__ == '__main__':
    student_data = {
        'first_name': 'John',
        'middle_name': 'Michael',
        'last_name': 'Doe',
        'username': 'john.doe',
        'email': 'john.doe@university.edu',
        'password': 'securePassword123',
        'student_id': 'STU-20250001',
        'department': 'Bachelor of Science in Information Technology',
        'phone': '+1-555-123-4567',
        'status': 'active'
    }

    result = create_student(
        'http://localhost:5000',
        'your_jwt_token_here',
        student_data,
        '/path/to/profile.jpg'
    )
    print(result)
```

## Troubleshooting

### "Admin access required"
- Ensure JWT token is from an admin user
- Verify token is not expired
- Check Authorization header format

### "Missing required field"
- Verify all required fields are included in request
- Check field names match exactly (case-sensitive)

### "Username already exists"
- Choose a different username
- Check existing users in system

### "Invalid email format"
- Ensure email has @ symbol
- Ensure email has domain extension (.com, .edu, etc.)
- Example valid format: student@university.edu

### File Upload Fails
- Check file is valid image (JPG, PNG, GIF)
- Verify file size is reasonable
- Check Content-Type header is correct
