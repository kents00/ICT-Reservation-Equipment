# Toast Notification System - Quick Reference

## Overview

A lightweight, beautiful toast notification system for the Equipment Reservation app. Replaces Alert dialogs with non-blocking toast messages.

## Features

✓ **Non-blocking**: Doesn't interrupt user flow
✓ **Auto-dismiss**: Automatically hides after duration
✓ **4 Types**: Success, Error, Warning, Info
✓ **Animated**: Smooth fade-in/out and slide animations
✓ **Tap to dismiss**: Users can tap to close early
✓ **Beautiful UI**: Color-coded with icons

## Usage

### Import

```typescript
import { toast } from '../utils/Toast';
```

### Basic Usage

```typescript
// Success toast (green)
toast.success('Login successful!');

// Error toast (red)
toast.error('Invalid credentials');

// Warning toast (orange)
toast.warning('Session expiring soon');

// Info toast (blue)
toast.info('New feature available');
```

### With Custom Duration

```typescript
// Show for 5 seconds (default is 3 seconds)
toast.success('Operation completed', 5000);

// Show for 2 seconds
toast.error('Failed', 2000);
```

## Toast Types

| Type | Color | Icon | Use Case |
|------|-------|------|----------|
| **success** | Green (#4CAF50) | ✓ | Successful operations, confirmations |
| **error** | Red (#F44336) | ✗ | Errors, failures, validation issues |
| **warning** | Orange (#FF9800) | ⚠ | Warnings, cautions |
| **info** | Blue (#2196F3) | ℹ | Information, tips |

## Examples from LoginScreen

### Before (with Alert)
```typescript
if (!username.trim() || !password.trim()) {
  Alert.alert('Validation Error', 'Please fill in all fields');
  return;
}

// User has to tap OK button
// Blocks interaction
```

### After (with Toast)
```typescript
if (!username.trim() || !password.trim()) {
  toast.error('Please fill in all fields');
  return;
}

// Toast appears at top
// Auto-dismisses after 3 seconds
// User can continue interacting
```

### Navigation with Toast
```typescript
// Success with navigation
toast.success(`Welcome back, ${data.user.first_name}!`);

// Navigate after brief delay to show toast
setTimeout(() => {
  onLoginSuccess();
}, 300);
```

## Implementation in App.tsx

The `ToastContainer` component is added to the root App component:

```typescript
import { ToastContainer } from './src/utils/Toast';

export default function App() {
  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <ToastContainer />  {/* Add this */}
      {/* Your screens */}
    </View>
  );
}
```

## Common Patterns

### Form Validation
```typescript
if (!email.includes('@')) {
  toast.error('Please enter a valid email');
  return;
}
```

### API Errors
```typescript
try {
  const response = await fetch(API_URL);
  if (!response.ok) {
    toast.error('Failed to load data');
  }
} catch (error) {
  toast.error('Network connection failed');
}
```

### Success Operations
```typescript
await saveData();
toast.success('Changes saved successfully');
```

### Loading with Completion
```typescript
setLoading(true);
await performOperation();
setLoading(false);
toast.success('Operation completed');
```

## Best Practices

### ✅ DO

- Keep messages short and clear (one line)
- Use appropriate toast type for context
- Show success feedback for user actions
- Use error toasts for validation and failures

### ❌ DON'T

- Don't use for critical confirmations (use Alert dialog)
- Don't chain multiple toasts rapidly
- Don't use very long messages
- Don't use for actions requiring user input

## Migration Guide

### Replace Alert.alert()

**Before:**
```typescript
Alert.alert('Title', 'Message', [{ text: 'OK' }]);
```

**After:**
```typescript
toast.error('Message');  // or .success, .warning, .info
```

### Replace Alert with Callback

**Before:**
```typescript
Alert.alert('Success', 'Login successful', [
  { text: 'OK', onPress: navigateToHome }
]);
```

**After:**
```typescript
toast.success('Login successful');
setTimeout(() => navigateToHome(), 300);
```

## Customization

### Default Durations
- Default: 3000ms (3 seconds)
- Error/Warning: Consider 4000ms for more reading time
- Quick feedback: 2000ms

### Toast Position
Currently: Top of screen (50px from top)
To change: Edit `styles.container.top` in `Toast.tsx`

### Colors
Edit the `getBackgroundColor()` function in `Toast.tsx`:
```typescript
case 'success':
  return '#4CAF50';  // Change this
```

## Troubleshooting

### Toast not showing
- Ensure `<ToastContainer />` is in App.tsx
- Check import: `import { toast } from '../utils/Toast'`
- Verify component is rendered

### Toast appears behind elements
- ToastContainer has `zIndex: 9999`
- Ensure no parent has higher z-index

### Multiple toasts overlap
- Current implementation: One toast at a time
- New toasts replace existing ones

## Summary of Changes

### Files Modified
1. **Created**: `frontend/src/utils/Toast.tsx`
   - Toast component
   - ToastContainer component
   - toast manager (singleton)

2. **Modified**: `frontend/App.tsx`
   - Added ToastContainer to both login and main views

3. **Modified**: `frontend/src/screens/LoginScreen.tsx`
   - Replaced all Alert.alert with toast notifications
   - Fixed navigation delay issue
   - Better error handling

4. **Modified**: `frontend/src/screens/EquipmentListScreen.tsx`
   - Replaced Alert with toast for equipment loading errors

## Benefits

🎯 **Better UX**: Non-blocking, doesn't interrupt user flow
⚡ **Faster**: No need to tap OK button
🎨 **Beautiful**: Color-coded with smooth animations
📱 **Mobile-friendly**: Positioned at top, easy to see
🔧 **Easy to use**: Simple API, one-line calls
