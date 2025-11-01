'use client';

import { useState, useRef } from 'react';

interface ImageUploadProps {
  images: File[];
  onChange: (images: File[]) => void;
  maxImages?: number;
  maxSizeMB?: number;
  existingImages?: string[];
  onRemoveExisting?: (index: number) => void;
}

export default function ImageUpload({
  images,
  onChange,
  maxImages = 10,
  maxSizeMB = 5,
  existingImages = [],
  onRemoveExisting,
}: ImageUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    // Check file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return `File size must be less than ${maxSizeMB}MB`;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      return 'Only image files are allowed';
    }

    return null;
  };

  const handleFiles = (files: FileList | null) => {
    if (!files) return;

    setError('');
    const newFiles: File[] = [];
    const errors: string[] = [];

    // Convert FileList to array and validate
    Array.from(files).forEach((file) => {
      const validationError = validateFile(file);
      if (validationError) {
        errors.push(`${file.name}: ${validationError}`);
      } else {
        newFiles.push(file);
      }
    });

    // Check total count (including existing images)
    const totalImages = existingImages.length + images.length + newFiles.length;
    if (totalImages > maxImages) {
      const remaining = maxImages - existingImages.length - images.length;
      setError(`Maximum ${maxImages} images allowed. You tried to add ${newFiles.length} but only ${remaining} slots remaining.`);
      return;
    }

    if (errors.length > 0) {
      setError(errors.join(', '));
      return;
    }

    // Add new files to existing images
    onChange([...images, ...newFiles]);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onChange(newImages);
    setError('');
  };

  const handleButtonClick = () => {
    inputRef.current?.click();
  };

  return (
    <div>
      {/* Upload Area */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={handleButtonClick}
        className={`
          border-2 rounded-xl p-8 text-center cursor-pointer transition-all duration-200
          ${dragActive ? 'border-primary bg-primary-light' : 'border-dashed border-gray-300 bg-white'}
          ${images.length > 0 ? 'mb-6' : ''}
        `}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleChange}
          className="hidden"
        />

        <div className="text-5xl mb-4">
          {dragActive ? '📥' : '📷'}
        </div>

        <p className="text-base font-medium text-gray-900 mb-2">
          {dragActive ? 'Drop images here' : 'Click to upload or drag and drop'}
        </p>

        <p className="text-sm text-gray-500">
          PNG, JPG, GIF up to {maxSizeMB}MB (Max {maxImages} images)
        </p>

        <p className="text-sm text-primary mt-2 font-medium">
          {existingImages.length + images.length}/{maxImages} images total
          {existingImages.length > 0 && ` (${existingImages.length} saved, ${images.length} new)`}
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm mb-4">
          {error}
        </div>
      )}

      {/* Existing Images (from server) */}
      {existingImages.length > 0 && (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-base font-semibold text-gray-900">
              Current Images ({existingImages.length})
            </h3>
          </div>

          <div className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-4">
            {existingImages.map((imageUrl, index) => (
              <div
                key={`existing-${index}`}
                className="relative pb-[100%] rounded-lg overflow-hidden border-2 border-green-500 bg-gray-50"
              >
                {/* Image */}
                <img
                  src={`/${imageUrl}`}
                  alt={`Existing ${index + 1}`}
                  className="absolute top-0 left-0 w-full h-full object-cover"
                />

                {/* First Image Badge */}
                {index === 0 && (
                  <div className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 rounded text-xs font-semibold">
                    Main
                  </div>
                )}

                {/* Remove Button */}
                {onRemoveExisting && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveExisting(index);
                    }}
                    className="absolute top-2 right-2 bg-black/70 text-white border-none rounded-full w-7 h-7 cursor-pointer text-lg leading-none flex items-center justify-center p-0 hover:bg-black/90"
                    title="Remove image"
                  >
                    ×
                  </button>
                )}

                {/* Saved Badge */}
                <div className="absolute bottom-0 left-0 right-0 bg-green-500/90 text-white p-2 text-xs font-medium">
                  ✓ Saved
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* New Uploaded Images */}
      {images.length > 0 && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-base font-semibold text-gray-900">
              New Images ({images.length})
            </h3>
            {images.length > 0 && (
              <button
                type="button"
                onClick={() => onChange([])}
                className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-md cursor-pointer text-sm font-medium hover:bg-red-100"
              >
                Clear All
              </button>
            )}
          </div>

          <div className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-4">
            {images.map((image, index) => (
              <div
                key={index}
                className="relative pb-[100%] rounded-lg overflow-hidden border-2 border-gray-200 bg-gray-50"
              >
                {/* Image */}
                <img
                  src={URL.createObjectURL(image)}
                  alt={`Preview ${index + 1}`}
                  className="absolute top-0 left-0 w-full h-full object-cover"
                />

                {/* First Image Badge - only show if no existing images */}
                {index === 0 && existingImages.length === 0 && (
                  <div className="absolute top-2 left-2 bg-primary text-white px-2 py-1 rounded text-xs font-semibold">
                    Main
                  </div>
                )}

                {/* Remove Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeImage(index);
                  }}
                  className="absolute top-2 right-2 bg-black/70 text-white border-none rounded-full w-7 h-7 cursor-pointer text-lg leading-none flex items-center justify-center p-0 hover:bg-black/90"
                  title="Remove image"
                >
                  ×
                </button>

                {/* File Info */}
                <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white p-2 text-xs">
                  {(image.size / 1024).toFixed(0)} KB
                </div>
              </div>
            ))}
          </div>

          {/* Helper Text */}
          <p className="text-xs text-gray-500 mt-4 italic">
            💡 Tip: The first image will be used as the main photo for your ad
          </p>
        </div>
      )}
    </div>
  );
}
