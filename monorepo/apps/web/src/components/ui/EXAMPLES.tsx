/**
 * Example Usage of UI Components
 *
 * This file demonstrates how to use the reusable UI components
 * in your ThuLoBazaar pages and components.
 */

import React, { FormEvent } from 'react';
import { Button, StatusBadge } from '@/components/ui';
import { useFormState } from '@/hooks';

// ==============================================
// EXAMPLE 1: StatusBadge in Dashboard Table
// ==============================================

export function AdStatusExample({ ads }: { ads: any[] }) {
  return (
    <table>
      <thead>
        <tr>
          <th>Title</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {ads.map((ad) => (
          <tr key={ad.id}>
            <td>{ad.title}</td>
            <td>
              {/* Replace inline badge classes with StatusBadge */}
              <StatusBadge status={ad.status} size="sm" showIcon />
            </td>
            <td>
              {/* Replace button classes with Button component */}
              <Button variant="outline" size="sm">
                View
              </Button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ==============================================
// EXAMPLE 2: Button Variants
// ==============================================

export function ButtonVariantsExample() {
  return (
    <div className="flex flex-wrap gap-4">
      {/* Primary button */}
      <Button variant="primary" onClick={() => console.log('Primary clicked')}>
        Primary Action
      </Button>

      {/* Secondary button */}
      <Button variant="secondary">Secondary Action</Button>

      {/* Outline button */}
      <Button variant="outline">Cancel</Button>

      {/* Ghost button */}
      <Button variant="ghost">Learn More</Button>

      {/* Danger button */}
      <Button variant="danger">Delete</Button>

      {/* Success button */}
      <Button variant="success" icon={<span>✓</span>}>
        Approve
      </Button>

      {/* Loading state */}
      <Button variant="primary" loading>
        Saving...
      </Button>

      {/* Different sizes */}
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>

      {/* Full width */}
      <Button variant="primary" fullWidth>
        Full Width Button
      </Button>
    </div>
  );
}

// ==============================================
// EXAMPLE 3: Form with useFormState Hook
// ==============================================

export function LoginFormExample() {
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
    password: ''
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Simulated API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (formData.email && formData.password) {
        setSuccess('Login successful!');
        // Reset form after success
        setTimeout(() => reset(), 2000);
      } else {
        setError('Please fill in all fields');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto">
      <div className="mb-4">
        <label htmlFor="email" className="block mb-2 font-semibold">
          Email
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleInputChange}
          className="w-full px-4 py-3 border rounded-lg"
          required
        />
      </div>

      <div className="mb-4">
        <label htmlFor="password" className="block mb-2 font-semibold">
          Password
        </label>
        <input
          type="password"
          id="password"
          name="password"
          value={formData.password}
          onChange={handleInputChange}
          className="w-full px-4 py-3 border rounded-lg"
          required
        />
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg">
          {success}
        </div>
      )}

      <Button type="submit" variant="primary" fullWidth loading={loading}>
        {loading ? 'Signing in...' : 'Sign In'}
      </Button>
    </form>
  );
}

// ==============================================
// EXAMPLE 4: Dashboard Stats with StatusBadge
// ==============================================

export function DashboardStatsExample({ stats }: { stats: any }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-white p-6 rounded-xl shadow-sm">
        <h3 className="text-gray-500 text-sm font-medium mb-2">Total Ads</h3>
        <p className="text-3xl font-bold">{stats.totalAds}</p>
        <div className="mt-3 flex gap-2">
          <StatusBadge status="active" size="sm" />
          <span className="text-sm text-gray-600">{stats.activeAds} active</span>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm">
        <h3 className="text-gray-500 text-sm font-medium mb-2">Pending Review</h3>
        <p className="text-3xl font-bold">{stats.pendingAds}</p>
        <div className="mt-3">
          <StatusBadge status="pending" size="sm" showIcon />
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm">
        <h3 className="text-gray-500 text-sm font-medium mb-2">Rejected</h3>
        <p className="text-3xl font-bold">{stats.rejectedAds}</p>
        <div className="mt-3">
          <StatusBadge status="rejected" size="sm" showIcon />
        </div>
      </div>
    </div>
  );
}

// ==============================================
// EXAMPLE 5: Action Buttons Row
// ==============================================

export function AdActionsExample({ ad, onApprove, onReject, onView }: any) {
  return (
    <div className="flex items-center gap-3">
      <StatusBadge status={ad.status} size="sm" />

      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => onView(ad.id)}>
          View
        </Button>

        <Button
          variant="success"
          size="sm"
          icon={<span>✓</span>}
          onClick={() => onApprove(ad.id)}
        >
          Approve
        </Button>

        <Button
          variant="danger"
          size="sm"
          icon={<span>✕</span>}
          onClick={() => onReject(ad.id)}
        >
          Reject
        </Button>
      </div>
    </div>
  );
}

// ==============================================
// EXAMPLE 6: Verification Status
// ==============================================

export function VerificationStatusExample({ user }: { user: any }) {
  return (
    <div className="bg-white p-6 rounded-xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Account Status</h3>
        <StatusBadge
          status={user.individualVerified ? 'verified' : 'unverified'}
          showIcon
        />
      </div>

      {!user.individualVerified && (
        <div className="mb-4">
          <p className="text-gray-600 mb-4">
            Verify your account to gain more trust from buyers
          </p>
          <Button variant="primary">
            Start Verification
          </Button>
        </div>
      )}

      {user.businessVerificationStatus && (
        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center justify-between">
            <span className="text-gray-700">Business Verification</span>
            <StatusBadge status={user.businessVerificationStatus} size="sm" />
          </div>
        </div>
      )}
    </div>
  );
}
