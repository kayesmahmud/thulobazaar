// @ts-nocheck
'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useUserAuth } from '@/contexts/UserAuthContext';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Cropper from 'react-easy-crop';
import { Point, Area } from 'react-easy-crop/types';
import { Button } from '@/components/ui';

interface ShopProfileClientProps {
  shopId: number;
  shopSlug: string;
  lang: string;
  initialAvatar?: string | null;
  initialCover?: string | null;
  shopName: string;
  businessVerificationStatus?: string | null;
  individualVerified?: boolean;
  accountType?: string | null;
  stats: {
    total_ads: number;
    total_views: number;
    member_since: string;
  };
}

interface CropperModalState {
  isOpen: boolean;
  type: 'avatar' | 'cover' | null;
  imageSrc: string | null;
}

export default function ShopProfileClient({
  shopId,
  shopSlug,
  lang,
  initialAvatar,
  initialCover,
  shopName,
  businessVerificationStatus,
  individualVerified,
  accountType,
  stats,
}: ShopProfileClientProps) {
  const { user, isAuthenticated, refreshUser } = useUserAuth();
  const router = useRouter();
  const [isOwner, setIsOwner] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Image cropper states
  const [cropperModal, setCropperModal] = useState<CropperModalState>({
    isOpen: false,
    type: null,
    imageSrc: null,
  });
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    console.log('ShopProfileClient - Owner check:', {
      isAuthenticated,
      userId: user?.id,
      shopId,
      match: user?.id === shopId,
    });
    if (isAuthenticated && user && user.id === shopId) {
      console.log('✅ User is owner of this shop');
      setIsOwner(true);
    } else {
      console.log('❌ User is NOT owner');
      setIsOwner(false);
    }
  }, [isAuthenticated, user, shopId]);

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('Avatar must be less than 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setCropperModal({ isOpen: true, type: 'avatar', imageSrc: reader.result as string });
        setCrop({ x: 0, y: 0 });
        setZoom(1);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCoverSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Cover photo must be less than 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setCropperModal({ isOpen: true, type: 'cover', imageSrc: reader.result as string });
        setCrop({ x: 0, y: 0 });
        setZoom(1);
      };
      reader.readAsDataURL(file);
    }
  };

  const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (error) => reject(error));
      image.setAttribute('crossOrigin', 'anonymous');
      image.src = url;
    });

  const getCroppedImg = async (imageSrc: string, pixelCrop: Area): Promise<Blob> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('No 2d context');
    }

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob as Blob);
      }, 'image/jpeg', 0.95);
    });
  };

  const uploadImage = async (file: File, type: 'avatar' | 'cover') => {
    setUploading(true);
    try {
      const token = user?.backendToken;

      if (!token) {
        alert('You must be logged in to upload images. Please refresh and try again.');
        setUploading(false);
        return;
      }

      const formData = new FormData();
      // Backend expects field name to match the type ('avatar' or 'cover')
      formData.append(type, file);

      const endpoint = type === 'avatar' ? '/api/profile/avatar' : '/api/profile/cover';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        alert(`${type === 'avatar' ? 'Avatar' : 'Cover photo'} uploaded successfully!`);
        // Refresh NextAuth session to update header avatar
        await refreshUser();
        router.refresh(); // Refresh server component data
      } else {
        alert(data.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleCropSave = async () => {
    if (!cropperModal.imageSrc || !croppedAreaPixels || !cropperModal.type) return;

    try {
      const croppedBlob = await getCroppedImg(cropperModal.imageSrc, croppedAreaPixels);
      const file = new File([croppedBlob], 'cropped-image.jpg', { type: 'image/jpeg' });

      await uploadImage(file, cropperModal.type);
      setCropperModal({ isOpen: false, type: null, imageSrc: null });
    } catch (error) {
      console.error('Error cropping image:', error);
      alert('Failed to crop image. Please try again.');
    }
  };

  const handleRemoveAvatar = async () => {
    if (!window.confirm('Are you sure you want to remove your avatar?')) return;

    try {
      const token = user?.backendToken;

      if (!token) {
        alert('You must be logged in to remove avatar. Please refresh and try again.');
        return;
      }

      const response = await fetch(
        `/api/profile/avatar`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        alert('Avatar removed successfully!');
        // Refresh NextAuth session to update header avatar
        await refreshUser();
        router.refresh();
      } else {
        alert(data.message || 'Failed to remove avatar');
      }
    } catch (error) {
      console.error('Error removing avatar:', error);
      alert('Failed to remove avatar. Please try again.');
    }
  };

  const handleRemoveCover = async () => {
    if (!window.confirm('Are you sure you want to remove your cover photo?')) return;

    try {
      const token = user?.backendToken;

      if (!token) {
        alert('You must be logged in to remove cover photo. Please refresh and try again.');
        return;
      }

      const response = await fetch(
        `/api/profile/cover`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        alert('Cover photo removed successfully!');
        // Refresh NextAuth session to update header (cover doesn't show in header, but refresh for consistency)
        await refreshUser();
        router.refresh();
      } else {
        alert(data.message || 'Failed to remove cover photo');
      }
    } catch (error) {
      console.error('Error removing cover photo:', error);
      alert('Failed to remove cover photo. Please try again.');
    }
  };

  return (
    <>
      {/* Cover Photo & Avatar Card */}
      <div className="card mb-4 md:mb-8 p-0 overflow-visible">
        {/* Cover Photo with Edit Buttons */}
        <div className="relative">
          <div
            className={`w-full h-[180px] sm:h-[240px] md:h-[300px] rounded-t-xl bg-cover bg-center ${
              initialCover
                ? ''
                : 'bg-gradient-to-br from-primary to-purple-600'
            }`}
            style={initialCover ? { backgroundImage: `url(/uploads/covers/${initialCover})` } : undefined}
          />

          {/* Cover Edit Buttons - Only show for owner */}
          {isOwner && (
            <>
              <div className="absolute top-2 right-2 sm:top-4 sm:right-4 flex gap-1 sm:gap-2 z-10">
                <Button
                  onClick={() => coverInputRef.current?.click()}
                  disabled={uploading}
                  variant="danger"
                  size="sm"
                  icon={uploading ? '⏳' : '📷'}
                  className="shadow-lg"
                >
                  <span className="hidden sm:inline">{initialCover ? 'Change Cover' : 'Add Cover'}</span>
                </Button>
                {initialCover && (
                  <Button
                    onClick={handleRemoveCover}
                    variant="danger"
                    size="sm"
                    icon="🗑️"
                    className="shadow-lg"
                  >
                    <span className="hidden sm:inline">Remove</span>
                  </Button>
                )}
              </div>

              {/* Recommended Cover Dimensions - hide on mobile */}
              <div className="hidden md:block absolute bottom-4 right-4 text-xs text-white bg-black bg-opacity-50 px-2 py-1 rounded">
                Recommended: 1280 x 720
              </div>
            </>
          )}
        </div>

        {/* Profile Info Section with Overlapping Avatar */}
        <div className="px-4 sm:px-6 md:px-8 pb-4 sm:pb-6 md:pb-8 relative flex flex-col md:flex-row md:items-end gap-4 md:gap-6">
          {/* Shop Avatar - Overlapping Cover */}
          <div className="relative -mt-[40px] sm:-mt-[45px] flex-shrink-0 w-[100px] sm:w-[120px] md:w-[150px]">
            {initialAvatar ? (
              <div className="relative">
                <Image
                  src={`/uploads/avatars/${initialAvatar}`}
                  alt={shopName}
                  width={150}
                  height={150}
                  className={`w-[100px] h-[100px] sm:w-[120px] sm:h-[120px] md:w-[150px] md:h-[150px] rounded-full object-cover border-[4px] sm:border-[5px] shadow-xl ${
                    businessVerificationStatus === 'verified' || businessVerificationStatus === 'approved'
                      ? 'border-yellow-400'
                      : individualVerified
                      ? 'border-blue-500'
                      : 'border-gray-200'
                  }`}
                />
              </div>
            ) : (
              <div className={`w-[100px] h-[100px] sm:w-[120px] sm:h-[120px] md:w-[150px] md:h-[150px] rounded-full bg-primary text-white flex items-center justify-center text-3xl sm:text-4xl md:text-5xl font-bold border-[4px] sm:border-[5px] shadow-xl ${
                  businessVerificationStatus === 'verified' || businessVerificationStatus === 'approved'
                    ? 'border-yellow-400'
                    : individualVerified
                    ? 'border-blue-500'
                    : 'border-gray-200'
                }`}>
                {shopName.charAt(0).toUpperCase()}
              </div>
            )}

            {/* Avatar Edit Button - Only show for owner */}
            {isOwner && (
              <>
                {initialAvatar ? (
                  <button
                    onClick={handleRemoveAvatar}
                    className="absolute bottom-[5px] right-[5px] sm:bottom-[8px] sm:right-[8px] md:bottom-[10px] md:right-[10px] w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full bg-red-600 border-[2px] sm:border-[3px] border-white text-white hover:bg-red-700 transition-colors shadow-lg flex items-center justify-center"
                    title="Remove avatar"
                  >
                    <svg width="14" height="14" className="sm:w-4 sm:h-4 md:w-[18px] md:h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      <line x1="10" y1="11" x2="10" y2="17"></line>
                      <line x1="14" y1="11" x2="14" y2="17"></line>
                    </svg>
                  </button>
                ) : (
                  <button
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={uploading}
                    className="absolute bottom-[5px] right-[5px] sm:bottom-[8px] sm:right-[8px] md:bottom-[10px] md:right-[10px] w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full bg-gray-200 border-[2px] sm:border-[3px] border-white text-gray-600 hover:bg-gray-300 transition-colors shadow-lg flex items-center justify-center disabled:opacity-60"
                    title={uploading ? 'Uploading...' : 'Add avatar'}
                  >
                    <svg width="14" height="14" className="sm:w-4 sm:h-4 md:w-[18px] md:h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                      <circle cx="12" cy="13" r="4"></circle>
                    </svg>
                  </button>
                )}
              </>
            )}
          </div>

          {/* Shop Info */}
          <div className="flex-1 pb-2 md:pb-4">
            {/* Name and Badge */}
            <div className="flex items-center gap-2 sm:gap-3 md:gap-4 mb-1 sm:mb-2">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 break-words">{shopName}</h1>
              {/* Golden Badge for Business Verified */}
              {(businessVerificationStatus === 'verified' || businessVerificationStatus === 'approved') && (
                <Image
                  src="/golden-badge.png"
                  alt="Verified Business"
                  title="Verified Business Account"
                  width={32}
                  height={32}
                  className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 flex-shrink-0"
                />
              )}
              {/* Blue Badge for Individual Verified (but not business verified) */}
              {individualVerified && businessVerificationStatus !== 'verified' && businessVerificationStatus !== 'approved' && (
                <Image
                  src="/blue-badge.png"
                  alt="Verified Seller"
                  title="Verified Individual Seller"
                  width={32}
                  height={32}
                  className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 flex-shrink-0"
                />
              )}
            </div>

            <p className="text-gray-600 text-sm sm:text-base md:text-lg mb-3 sm:mb-4">
              {businessVerificationStatus === 'verified' || businessVerificationStatus === 'approved'
                ? 'Verified Business Account'
                : individualVerified
                ? 'Verified Individual Seller'
                : accountType === 'business'
                ? 'Business Account'
                : 'Individual Seller'}
            </p>

            {/* Stats */}
            <div className="flex flex-wrap gap-4 sm:gap-6 md:gap-8">
              <div>
                <div className="text-lg sm:text-xl md:text-2xl font-bold text-primary">{stats.total_ads}</div>
                <div className="text-xs sm:text-sm text-gray-600">Active Ads</div>
              </div>
              <div>
                <div className="text-lg sm:text-xl md:text-2xl font-bold text-primary">{stats.total_views.toLocaleString()}</div>
                <div className="text-xs sm:text-sm text-gray-600">Total Views</div>
              </div>
              <div>
                <div className="text-lg sm:text-xl md:text-2xl font-bold text-primary">{stats.member_since}</div>
                <div className="text-xs sm:text-sm text-gray-600">Member Since</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden File Inputs */}
      <input
        ref={avatarInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleAvatarSelect}
      />
      <input
        ref={coverInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleCoverSelect}
      />

      {/* Image Cropper Modal */}
      {cropperModal.isOpen && cropperModal.imageSrc && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[9999] p-2 sm:p-4 md:p-8">
          <div className="bg-white rounded-lg sm:rounded-xl max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-auto">
            {/* Modal Header */}
            <div className="p-4 sm:p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg sm:text-xl md:text-2xl font-semibold">
                {cropperModal.type === 'avatar' ? 'Crop Profile Picture' : 'Crop Cover Photo'}
              </h2>
            </div>

            {/* Cropper Area */}
            <div className="relative w-full h-[250px] sm:h-[300px] md:h-[400px] bg-black">
              <Cropper
                image={cropperModal.imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={cropperModal.type === 'avatar' ? 1 : 16 / 9}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
                cropShape={cropperModal.type === 'avatar' ? 'round' : 'rect'}
              />
            </div>

            {/* Zoom Control */}
            <div className="p-4 sm:p-6 border-t border-b border-gray-200">
              <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">Zoom</label>
              <input
                type="range"
                min={1}
                max={3}
                step={0.1}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full cursor-pointer"
              />
            </div>

            {/* Modal Actions */}
            <div className="p-4 sm:p-6 flex flex-col-reverse sm:flex-row gap-2 sm:gap-4 sm:justify-end">
              <Button
                onClick={() => setCropperModal({ isOpen: false, type: null, imageSrc: null })}
                disabled={uploading}
                variant="secondary"
                className="text-sm sm:text-base"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCropSave}
                disabled={uploading}
                variant="primary"
                loading={uploading}
                className="text-sm sm:text-base"
              >
                {uploading ? 'Uploading...' : 'Save & Upload'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
