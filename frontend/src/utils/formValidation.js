/**
 * Comprehensive form validation utility
 * Provides reusable validation functions and form state management
 */

// Validation rules
export const validators = {
  // Required field
  required: (value, fieldName = 'This field') => {
    if (!value || (typeof value === 'string' && !value.trim())) {
      return `${fieldName} is required`;
    }
    return null;
  },

  // Email validation
  email: (value) => {
    if (!value) return null;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return 'Please enter a valid email address';
    }
    return null;
  },

  // Phone validation (Nepal format)
  phone: (value) => {
    if (!value) return null;
    const phoneRegex = /^(98|97)\d{8}$/;
    if (!phoneRegex.test(value.replace(/[\s-]/g, ''))) {
      return 'Please enter a valid 10-digit phone number (98XXXXXXXX or 97XXXXXXXX)';
    }
    return null;
  },

  // Minimum length
  minLength: (min) => (value, fieldName = 'This field') => {
    if (!value) return null;
    if (value.length < min) {
      return `${fieldName} must be at least ${min} characters`;
    }
    return null;
  },

  // Maximum length
  maxLength: (max) => (value, fieldName = 'This field') => {
    if (!value) return null;
    if (value.length > max) {
      return `${fieldName} must not exceed ${max} characters`;
    }
    return null;
  },

  // Number validation
  number: (value, fieldName = 'This field') => {
    if (!value) return null;
    if (isNaN(value)) {
      return `${fieldName} must be a number`;
    }
    return null;
  },

  // Min value
  minValue: (min) => (value, fieldName = 'This field') => {
    if (!value) return null;
    if (Number(value) < min) {
      return `${fieldName} must be at least ${min}`;
    }
    return null;
  },

  // Max value
  maxValue: (max) => (value, fieldName = 'This field') => {
    if (!value) return null;
    if (Number(value) > max) {
      return `${fieldName} must not exceed ${max}`;
    }
    return null;
  },

  // URL validation
  url: (value) => {
    if (!value) return null;
    try {
      new URL(value);
      return null;
    } catch {
      return 'Please enter a valid URL';
    }
  },

  // Password strength
  password: (value) => {
    if (!value) return null;
    if (value.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    if (!/[A-Z]/.test(value)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/[a-z]/.test(value)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!/[0-9]/.test(value)) {
      return 'Password must contain at least one number';
    }
    return null;
  },

  // Match field (for password confirmation)
  match: (fieldToMatch, fieldName = 'field') => (value, allValues) => {
    if (!value) return null;
    if (value !== allValues[fieldToMatch]) {
      return `${fieldName} does not match`;
    }
    return null;
  },

  // Pattern match
  pattern: (regex, message = 'Invalid format') => (value) => {
    if (!value) return null;
    if (!regex.test(value)) {
      return message;
    }
    return null;
  },

  // File validation
  file: {
    maxSize: (maxSizeMB) => (file) => {
      if (!file) return null;
      const maxSizeBytes = maxSizeMB * 1024 * 1024;
      if (file.size > maxSizeBytes) {
        return `File size must not exceed ${maxSizeMB}MB`;
      }
      return null;
    },

    allowedTypes: (types) => (file) => {
      if (!file) return null;
      const fileType = file.type || '';
      const fileExt = file.name?.split('.').pop()?.toLowerCase();

      const isAllowed = types.some(type => {
        if (type.includes('/')) {
          return fileType === type;
        }
        return fileExt === type;
      });

      if (!isAllowed) {
        return `Only ${types.join(', ')} files are allowed`;
      }
      return null;
    }
  }
};

// Validate a single field
export function validateField(value, rules, fieldName, allValues = {}) {
  if (!rules || rules.length === 0) return null;

  for (const rule of rules) {
    const error = typeof rule === 'function'
      ? rule(value, allValues)
      : rule(value, fieldName);

    if (error) return error;
  }

  return null;
}

// Validate entire form
export function validateForm(values, validationSchema) {
  const errors = {};

  for (const [field, rules] of Object.entries(validationSchema)) {
    const error = validateField(values[field], rules, field, values);
    if (error) {
      errors[field] = error;
    }
  }

  return {
    errors,
    isValid: Object.keys(errors).length === 0
  };
}

// Custom hook for form validation
export function useFormValidation(initialValues, validationSchema) {
  const [values, setValues] = React.useState(initialValues);
  const [errors, setErrors] = React.useState({});
  const [touched, setTouched] = React.useState({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleChange = (field, value) => {
    setValues(prev => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));

    // Validate on blur
    if (validationSchema[field]) {
      const error = validateField(values[field], validationSchema[field], field, values);
      if (error) {
        setErrors(prev => ({ ...prev, [field]: error }));
      }
    }
  };

  const handleSubmit = async (onSubmit) => {
    setIsSubmitting(true);

    // Validate all fields
    const { errors: validationErrors, isValid } = validateForm(values, validationSchema);

    if (!isValid) {
      setErrors(validationErrors);
      setTouched(Object.keys(validationSchema).reduce((acc, key) => {
        acc[key] = true;
        return acc;
      }, {}));
      setIsSubmitting(false);
      return;
    }

    try {
      await onSubmit(values);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const reset = () => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  };

  return {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    reset,
    setErrors,
    setValues
  };
}

// Pre-defined validation schemas for common forms
export const schemas = {
  // Ad posting validation
  postAd: {
    title: [
      validators.required,
      validators.minLength(10),
      validators.maxLength(100)
    ],
    description: [
      validators.required,
      validators.minLength(20),
      validators.maxLength(1000)
    ],
    price: [
      validators.required,
      validators.number,
      validators.minValue(1)
    ],
    categoryId: [validators.required],
    locationId: [validators.required],
    sellerName: [
      validators.required,
      validators.minLength(2),
      validators.maxLength(50)
    ],
    sellerPhone: [
      validators.required,
      validators.phone
    ]
  },

  // User registration
  register: {
    fullName: [
      validators.required,
      validators.minLength(2),
      validators.maxLength(50)
    ],
    email: [
      validators.required,
      validators.email
    ],
    phone: [
      validators.required,
      validators.phone
    ],
    password: [
      validators.required,
      validators.password
    ],
    confirmPassword: [
      validators.required,
      validators.match('password', 'Passwords')
    ]
  },

  // Login
  login: {
    email: [
      validators.required,
      validators.email
    ],
    password: [validators.required]
  },

  // Profile update
  profile: {
    fullName: [
      validators.required,
      validators.minLength(2),
      validators.maxLength(50)
    ],
    phone: [validators.phone],
    bio: [validators.maxLength(500)]
  },

  // Business verification
  businessVerification: {
    businessName: [
      validators.required,
      validators.minLength(2),
      validators.maxLength(100)
    ],
    businessCategory: [validators.required],
    businessPhone: [
      validators.required,
      validators.phone
    ],
    businessEmail: [
      validators.required,
      validators.email
    ],
    businessAddress: [
      validators.required,
      validators.minLength(10)
    ]
  }
};

export default {
  validators,
  validateField,
  validateForm,
  useFormValidation,
  schemas
};
