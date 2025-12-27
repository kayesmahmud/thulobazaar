import { useState, useCallback, ChangeEvent } from 'react';

export interface UseFormStateOptions {
  resetOnSuccess?: boolean;
}

export interface UseFormStateReturn<T> {
  formData: T;
  setFormData: React.Dispatch<React.SetStateAction<T>>;
  loading: boolean;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  error: string;
  setError: React.Dispatch<React.SetStateAction<string>>;
  success: string;
  setSuccess: React.Dispatch<React.SetStateAction<string>>;
  handleChange: (name: keyof T, value: any) => void;
  handleInputChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  handleFileChange: (name: keyof T, file: File | null) => void;
  reset: () => void;
  clearMessages: () => void;
}

export function useFormState<T extends Record<string, any>>(
  initialData: T,
  options: UseFormStateOptions = {}
): UseFormStateReturn<T> {
  const [formData, setFormData] = useState<T>(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = useCallback((name: keyof T, value: any) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
  }, []);

  const handleInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const { name, value, type } = e.target;
      const finalValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
      handleChange(name as keyof T, finalValue);
    },
    [handleChange]
  );

  const handleFileChange = useCallback(
    (name: keyof T, file: File | null) => {
      handleChange(name, file);
    },
    [handleChange]
  );

  const reset = useCallback(() => {
    setFormData(initialData);
    setError('');
    setSuccess('');
    setLoading(false);
  }, [initialData]);

  const clearMessages = useCallback(() => {
    setError('');
    setSuccess('');
  }, []);

  return {
    formData,
    setFormData,
    loading,
    setLoading,
    error,
    setError,
    success,
    setSuccess,
    handleChange,
    handleInputChange,
    handleFileChange,
    reset,
    clearMessages,
  };
}
