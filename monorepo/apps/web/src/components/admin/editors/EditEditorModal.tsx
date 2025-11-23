'use client';

import { useState, useRef, useEffect } from 'react';
import { updateEditor } from '@/lib/editorApi';
import { ImageCropperModal } from './ImageCropperModal';

interface Editor {
  id: number;
  fullName: string;
  email: string;
  avatar: string | null;
  status: 'active' | 'suspended';
}

interface EditEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editor: Editor | null;
}

export function EditEditorModal({ isOpen, onClose, onSuccess, editor }: EditEditorModalProps) {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Image cropper states
  const [showCropper, setShowCropper] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);

  // Pre-populate form when editor changes
  useEffect(() => {
    if (editor) {
      setFormData({
        fullName: editor.fullName,
        email: editor.email,
        password: '',
        confirmPassword: '',
      });
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      setImagePreview(editor.avatar ? `${apiBase}/uploads/avatars/${editor.avatar}` : null);
    }
  }, [editor]);

  if (!isOpen || !editor) return null;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setErrors({ ...errors, image: 'Please select a valid image file' });
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors({ ...errors, image: 'Image size must be less than 5MB' });
        return;
      }

      setErrors({ ...errors, image: '' });

      // Open cropper
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageToCrop(reader.result as string);
        setShowCropper(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCroppedImage = async (croppedBlob: Blob) => {
    const file = new File([croppedBlob], 'avatar.jpg', { type: 'image/jpeg' });
    setProfileImage(file);

    // Create preview from cropped blob
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(croppedBlob);

    setShowCropper(false);
    setImageToCrop(null);
  };

  const handleRemoveImage = () => {
    setProfileImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password is optional for editing
    if (formData.password) {
      if (formData.password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters';
      }

      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Prepare update data
      const updateData: { fullName: string; email: string; password?: string; avatar?: File | null } = {
        fullName: formData.fullName,
        email: formData.email,
      };

      // Only include password if provided
      if (formData.password) {
        updateData.password = formData.password;
      }

      // Include avatar file if one was selected
      if (profileImage) {
        updateData.avatar = profileImage;
      }

      // Call real API to update editor
      const response = await updateEditor(editor.id, updateData);

      if (response.success) {
        // Reset form
        setFormData({
          fullName: '',
          email: '',
          password: '',
          confirmPassword: '',
        });
        setProfileImage(null);
        setImagePreview(null);
        setErrors({});

        onSuccess();
        onClose();
      } else {
        setErrors({ submit: response.message || 'Failed to update editor. Please try again.' });
      }
    } catch (error: any) {
      console.error('Error updating editor:', error);
      setErrors({ submit: error.message || 'Failed to update editor. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-amber-500 to-orange-600 text-white p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Edit Editor</h2>
              <p className="text-amber-100 text-sm mt-1">Update editor information</p>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Profile Image Upload */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Profile Image <span className="text-gray-400 font-normal">(Optional)</span>
            </label>
            <div className="flex items-start gap-6">
              {/* Image Preview */}
              <div className="relative">
                <div className="w-32 h-32 rounded-2xl border-4 border-amber-100 overflow-hidden bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center">
                      <svg className="w-12 h-12 mx-auto text-amber-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  )}
                </div>
                {imagePreview && (
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute -top-2 -right-2 w-8 h-8 bg-rose-500 hover:bg-rose-600 text-white rounded-full flex items-center justify-center shadow-lg transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Upload Button */}
              <div className="flex-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  id="edit-profile-image"
                />
                <label
                  htmlFor="edit-profile-image"
                  className="block w-full px-6 py-4 border-2 border-dashed border-amber-200 rounded-xl cursor-pointer hover:border-amber-400 hover:bg-amber-50 transition-all text-center"
                >
                  <svg className="w-8 h-8 mx-auto text-amber-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm font-semibold text-gray-600">Click to upload new image</span>
                  <span className="block text-xs text-gray-400 mt-1">PNG, JPG up to 5MB</span>
                </label>
                {errors.image && <p className="text-rose-600 text-sm mt-2">{errors.image}</p>}
              </div>
            </div>
          </div>

          {/* Full Name */}
          <div className="mb-5">
            <label htmlFor="fullName" className="block text-sm font-semibold text-gray-700 mb-2">
              Full Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              id="fullName"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-all ${
                errors.fullName
                  ? 'border-rose-300 focus:border-rose-500 focus:ring-4 focus:ring-rose-50'
                  : 'border-gray-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-50'
              }`}
              placeholder="Enter editor's full name"
            />
            {errors.fullName && <p className="text-rose-600 text-sm mt-1">{errors.fullName}</p>}
          </div>

          {/* Email */}
          <div className="mb-5">
            <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
              Email Address <span className="text-rose-500">*</span>
            </label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-all ${
                errors.email
                  ? 'border-rose-300 focus:border-rose-500 focus:ring-4 focus:ring-rose-50'
                  : 'border-gray-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-50'
              }`}
              placeholder="editor@thulobazaar.com"
            />
            {errors.email && <p className="text-rose-600 text-sm mt-1">{errors.email}</p>}
          </div>

          {/* Password */}
          <div className="mb-5">
            <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
              New Password <span className="text-gray-400 font-normal">(Leave blank to keep current)</span>
            </label>
            <input
              type="password"
              id="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-all ${
                errors.password
                  ? 'border-rose-300 focus:border-rose-500 focus:ring-4 focus:ring-rose-50'
                  : 'border-gray-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-50'
              }`}
              placeholder="Minimum 8 characters"
            />
            {errors.password && <p className="text-rose-600 text-sm mt-1">{errors.password}</p>}
          </div>

          {/* Confirm Password */}
          {formData.password && (
            <div className="mb-6">
              <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-2">
                Confirm New Password <span className="text-rose-500">*</span>
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-all ${
                  errors.confirmPassword
                    ? 'border-rose-300 focus:border-rose-500 focus:ring-4 focus:ring-rose-50'
                    : 'border-gray-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-50'
                }`}
                placeholder="Re-enter password"
              />
              {errors.confirmPassword && <p className="text-rose-600 text-sm mt-1">{errors.confirmPassword}</p>}
            </div>
          )}

          {/* Submit Error */}
          {errors.submit && (
            <div className="mb-5 p-4 bg-rose-50 border-2 border-rose-200 rounded-xl">
              <p className="text-rose-700 text-sm font-semibold">{errors.submit}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Updating...
                </span>
              ) : (
                'Update Editor'
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Image Cropper Modal */}
      <ImageCropperModal
        isOpen={showCropper}
        imageSrc={imageToCrop}
        onClose={() => {
          setShowCropper(false);
          setImageToCrop(null);
        }}
        onSave={handleCroppedImage}
        title="Crop Editor Avatar"
      />
    </div>
  );
}
