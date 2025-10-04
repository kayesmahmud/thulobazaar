import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { styles, colors, spacing } from '../../styles/theme';

function ImageCropperModal({ isOpen, imageSrc, type, onCropComplete, onCancel }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const onCropAreaComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleCropConfirm = () => {
    onCropComplete(croppedAreaPixels);
  };

  if (!isOpen) return null;

  const aspectRatio = type === 'avatar' ? 1 : 16 / 9;

  return (
    <div style={styles.modal.overlay}>
      <div style={{
        ...styles.modal.container,
        maxWidth: '800px',
        padding: spacing['2xl']
      }}>
        <h2 style={styles.heading.h2}>
          Crop {type === 'avatar' ? 'Profile Photo' : 'Cover Photo'}
        </h2>

        {/* Cropper Container */}
        <div style={{
          position: 'relative',
          width: '100%',
          height: '400px',
          backgroundColor: colors.background.dark,
          borderRadius: '8px',
          overflow: 'hidden',
          marginBottom: spacing.xl
        }}>
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspectRatio}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropAreaComplete}
          />
        </div>

        {/* Zoom Control */}
        <div style={{ marginBottom: spacing.xl }}>
          <label style={styles.label.default}>
            Zoom
          </label>
          <input
            type="range"
            min={1}
            max={3}
            step={0.1}
            value={zoom}
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            style={{
              width: '100%',
              cursor: 'pointer'
            }}
          />
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: spacing.md }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              ...styles.button.ghost,
              flex: 1
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCropConfirm}
            style={{
              ...styles.button.primary,
              flex: 1
            }}
          >
            ✓ Apply Crop
          </button>
        </div>
      </div>
    </div>
  );
}

export default ImageCropperModal;
