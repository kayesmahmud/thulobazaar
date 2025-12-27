'use client';

import { useState, useCallback } from 'react';
import { getSession } from 'next-auth/react';
import type { Location, LocationFormData } from './types';

export function useLocations() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const getAuthToken = async () => {
    const session = await getSession();
    if (!session) return null;
    return session?.user?.backendToken || (session as any)?.backendToken || null;
  };

  const loadLocations = useCallback(async () => {
    try {
      setLoading(true);
      const token = await getAuthToken();

      if (!token) {
        setError('Not authenticated');
        return;
      }

      const response = await fetch('/api/admin/locations', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.data) {
        setLocations(data.data);
      } else {
        throw new Error(data.error || 'Failed to load locations');
      }
    } catch (err: any) {
      console.error('Error loading locations:', err);
      setError(err.message || 'Failed to load locations');
    } finally {
      setLoading(false);
    }
  }, []);

  const saveLocation = async (formData: LocationFormData, editingId?: number) => {
    setError('');
    setSuccess('');

    try {
      const token = await getAuthToken();

      if (!token) {
        setError('Not authenticated');
        return false;
      }

      const data = {
        name: formData.name,
        slug: formData.slug || undefined,
        type: formData.type,
        parent_id: formData.parent_id ? parseInt(formData.parent_id) : undefined,
        latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
        longitude: formData.longitude ? parseFloat(formData.longitude) : undefined,
      };

      const url = editingId
        ? `/api/admin/locations/${editingId}`
        : `/api/admin/locations`;

      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `Failed to ${editingId ? 'update' : 'create'} location`);
      }

      setSuccess(editingId ? 'Location updated successfully' : 'Location created successfully');
      await loadLocations();
      return true;
    } catch (err: any) {
      setError(err.message || 'Failed to save location');
      return false;
    }
  };

  const deleteLocation = async (location: Location) => {
    if (!confirm(`Are you sure you want to delete "${location.name}"?`)) {
      return false;
    }

    try {
      setError('');
      const token = await getAuthToken();

      if (!token) {
        setError('Not authenticated');
        return false;
      }

      const response = await fetch(`/api/admin/locations/${location.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete location');
      }

      setSuccess('Location deleted successfully');
      await loadLocations();
      setTimeout(() => setSuccess(''), 3000);
      return true;
    } catch (err: any) {
      setError(err.message || 'Failed to delete location');
      setTimeout(() => setError(''), 5000);
      return false;
    }
  };

  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  return {
    locations,
    loading,
    error,
    success,
    loadLocations,
    saveLocation,
    deleteLocation,
    clearMessages,
  };
}
