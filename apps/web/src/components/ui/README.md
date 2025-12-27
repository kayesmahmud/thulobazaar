# UI Components Library

Reusable UI components for ThuLoBazaar monorepo.

## Components

### Button

A versatile button component with multiple variants and sizes.

**Props:**
- `variant`: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success' (default: 'primary')
- `size`: 'sm' | 'md' | 'lg' (default: 'md')
- `fullWidth`: boolean (default: false)
- `loading`: boolean (default: false) - Shows spinner
- `icon`: ReactNode - Optional icon to display
- All standard button HTML attributes

**Usage:**
```tsx
import { Button } from '@/components/ui';

// Primary button
<Button variant="primary" onClick={handleClick}>
  Submit
</Button>

// Loading state
<Button variant="primary" loading={isLoading}>
  Saving...
</Button>

// With icon
<Button variant="success" icon={<span>✓</span>}>
  Approve
</Button>

// Outline button
<Button variant="outline" size="sm">
  Cancel
</Button>

// Full width
<Button variant="primary" fullWidth>
  Sign In
</Button>
```

---

### StatusBadge

A badge component for displaying status with consistent styling.

**Props:**
- `status`: string - The status to display (e.g., 'active', 'pending', 'approved', 'rejected')
- `size`: 'sm' | 'md' | 'lg' (default: 'md')
- `showIcon`: boolean (default: false) - Show icon next to status
- `customLabel`: string - Override the default label
- `className`: string - Additional CSS classes

**Supported Statuses:**
- `active` - Green badge
- `inactive` - Gray badge
- `pending` - Yellow badge
- `approved` - Green badge
- `rejected` - Red badge
- `verified` - Blue badge
- `unverified` - Gray badge
- `sold` - Red badge
- `available` - Green badge

**Usage:**
```tsx
import { StatusBadge } from '@/components/ui';

// Basic usage
<StatusBadge status="active" />

// With icon
<StatusBadge status="pending" showIcon />

// Custom size
<StatusBadge status="approved" size="lg" />

// Custom label
<StatusBadge status="active" customLabel="Live Now" />

// In a table
<td>
  <StatusBadge status={ad.status} size="sm" />
</td>
```

---

## Hooks

### useFormState

A hook for managing form state, loading states, and error/success messages.

**Parameters:**
- `initialData`: Object with form field initial values
- `options`: Optional configuration

**Returns:**
- `formData`: Current form data
- `setFormData`: Function to update form data
- `loading`: Loading state
- `setLoading`: Function to update loading state
- `error`: Error message
- `setError`: Function to set error message
- `success`: Success message
- `setSuccess`: Function to set success message
- `handleChange`: Function to update a specific field
- `handleInputChange`: Event handler for input changes
- `handleFileChange`: Handler for file input changes
- `reset`: Function to reset form to initial state
- `clearMessages`: Function to clear error/success messages

**Usage:**
```tsx
import { useFormState } from '@/hooks';

function MyForm() {
  const {
    formData,
    loading,
    error,
    success,
    handleInputChange,
    setLoading,
    setError,
    setSuccess,
    reset
  } = useFormState({
    email: '',
    password: '',
    name: ''
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await apiClient.post('/auth/register', formData);
      if (response.success) {
        setSuccess('Registration successful!');
        reset();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        name="email"
        value={formData.email}
        onChange={handleInputChange}
      />

      {error && <p className="text-red-600">{error}</p>}
      {success && <p className="text-green-600">{success}</p>}

      <Button type="submit" loading={loading}>
        Register
      </Button>
    </form>
  );
}
```

---

## Migration Guide

### Replacing Inline Badges with StatusBadge

**Before:**
```tsx
<span className={`px-2 py-1 rounded ${
  status === 'active' ? 'bg-green-100 text-green-700' :
  status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
  'bg-gray-100 text-gray-700'
}`}>
  {status}
</span>
```

**After:**
```tsx
<StatusBadge status={status} />
```

### Replacing Button Classes with Button Component

**Before:**
```tsx
<button className="px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary-hover">
  Submit
</button>
```

**After:**
```tsx
<Button variant="primary">Submit</Button>
```

### Replacing Form State Management with useFormState

**Before:**
```tsx
const [formData, setFormData] = useState({ email: '', password: '' });
const [loading, setLoading] = useState(false);
const [error, setError] = useState('');

const handleInputChange = (e) => {
  setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  setError('');
};
```

**After:**
```tsx
const { formData, loading, error, handleInputChange, setLoading, setError } = useFormState({
  email: '',
  password: ''
});
```

---

## Benefits

1. **Consistency**: All buttons and badges look the same across the app
2. **Maintainability**: Update styling in one place
3. **Accessibility**: Built-in focus states and ARIA attributes
4. **Type Safety**: Full TypeScript support
5. **DX**: Less code to write, easier to understand
