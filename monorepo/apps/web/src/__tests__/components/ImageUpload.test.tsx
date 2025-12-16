import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ImageUpload from '@/components/forms/ImageUpload';

// Mock URL.createObjectURL
global.URL.createObjectURL = vi.fn(() => 'mock-object-url');

// Helper to create mock File
function createMockFile(name: string, size: number, type: string): File {
  const file = new File([''], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
}

describe('ImageUpload', () => {
  const defaultProps = {
    images: [] as File[],
    onChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================
  // Rendering Tests
  // ==========================================
  describe('Rendering', () => {
    it('should render upload area', () => {
      render(<ImageUpload {...defaultProps} />);

      expect(screen.getByText(/click to upload or drag and drop/i)).toBeInTheDocument();
    });

    it('should display max images and size info', () => {
      render(<ImageUpload {...defaultProps} maxImages={5} maxSizeMB={3} />);

      expect(screen.getByText(/up to 3MB/i)).toBeInTheDocument();
      expect(screen.getByText(/Max 5 images/i)).toBeInTheDocument();
    });

    it('should show image count', () => {
      render(<ImageUpload {...defaultProps} maxImages={10} />);

      expect(screen.getByText(/0\/10 images total/i)).toBeInTheDocument();
    });

    it('should show count with existing images', () => {
      render(
        <ImageUpload
          {...defaultProps}
          existingImages={['image1.jpg', 'image2.jpg']}
          maxImages={10}
        />
      );

      expect(screen.getByText(/2\/10 images total/i)).toBeInTheDocument();
      expect(screen.getByText(/2 saved/i)).toBeInTheDocument();
    });
  });

  // ==========================================
  // File Input Tests
  // ==========================================
  describe('File Input', () => {
    it('should have hidden file input', () => {
      render(<ImageUpload {...defaultProps} />);

      const input = document.querySelector('input[type="file"]');
      expect(input).toBeInTheDocument();
      expect(input).toHaveClass('hidden');
    });

    it('should accept image files only', () => {
      render(<ImageUpload {...defaultProps} />);

      const input = document.querySelector('input[type="file"]');
      expect(input).toHaveAttribute('accept', 'image/*');
    });

    it('should allow multiple file selection', () => {
      render(<ImageUpload {...defaultProps} />);

      const input = document.querySelector('input[type="file"]');
      expect(input).toHaveAttribute('multiple');
    });

    it('should call onChange when valid files are selected', () => {
      const onChange = vi.fn();
      render(<ImageUpload {...defaultProps} onChange={onChange} />);

      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = createMockFile('test.jpg', 1024, 'image/jpeg');

      fireEvent.change(input, { target: { files: [file] } });

      expect(onChange).toHaveBeenCalledWith([file]);
    });
  });

  // ==========================================
  // Validation Tests
  // ==========================================
  describe('File Validation', () => {
    it('should reject files larger than maxSizeMB', () => {
      const onChange = vi.fn();
      render(<ImageUpload {...defaultProps} onChange={onChange} maxSizeMB={1} />);

      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      // File size is 2MB (2 * 1024 * 1024 bytes)
      const file = createMockFile('large.jpg', 2 * 1024 * 1024, 'image/jpeg');

      fireEvent.change(input, { target: { files: [file] } });

      expect(onChange).not.toHaveBeenCalled();
      expect(screen.getByText(/less than 1MB/i)).toBeInTheDocument();
    });

    it('should reject non-image files', () => {
      const onChange = vi.fn();
      render(<ImageUpload {...defaultProps} onChange={onChange} />);

      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = createMockFile('document.pdf', 1024, 'application/pdf');

      fireEvent.change(input, { target: { files: [file] } });

      expect(onChange).not.toHaveBeenCalled();
      expect(screen.getByText(/only image files/i)).toBeInTheDocument();
    });

    it('should reject when max images exceeded', () => {
      const onChange = vi.fn();
      const existingImages = ['img1.jpg', 'img2.jpg'];
      render(
        <ImageUpload
          {...defaultProps}
          onChange={onChange}
          existingImages={existingImages}
          maxImages={3}
        />
      );

      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      const files = [
        createMockFile('new1.jpg', 1024, 'image/jpeg'),
        createMockFile('new2.jpg', 1024, 'image/jpeg'),
      ];

      fireEvent.change(input, { target: { files } });

      expect(onChange).not.toHaveBeenCalled();
      expect(screen.getByText(/maximum 3 images allowed/i)).toBeInTheDocument();
    });

    it('should accept valid image files', () => {
      const onChange = vi.fn();
      render(<ImageUpload {...defaultProps} onChange={onChange} maxSizeMB={5} />);

      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = createMockFile('valid.jpg', 1024 * 1024, 'image/jpeg'); // 1MB

      fireEvent.change(input, { target: { files: [file] } });

      expect(onChange).toHaveBeenCalledWith([file]);
    });
  });

  // ==========================================
  // Drag and Drop Tests
  // ==========================================
  describe('Drag and Drop', () => {
    it('should show drag active state on dragenter', () => {
      render(<ImageUpload {...defaultProps} />);

      const dropZone = screen.getByText(/click to upload/i).closest('div');
      fireEvent.dragEnter(dropZone!);

      expect(screen.getByText(/drop images here/i)).toBeInTheDocument();
    });

    it('should remove drag active state on dragleave', () => {
      render(<ImageUpload {...defaultProps} />);

      const dropZone = screen.getByText(/click to upload/i).closest('div');
      fireEvent.dragEnter(dropZone!);
      fireEvent.dragLeave(dropZone!);

      expect(screen.getByText(/click to upload/i)).toBeInTheDocument();
    });

    it('should handle file drop', () => {
      const onChange = vi.fn();
      render(<ImageUpload {...defaultProps} onChange={onChange} />);

      const dropZone = screen.getByText(/click to upload/i).closest('div');
      const file = createMockFile('dropped.jpg', 1024, 'image/jpeg');

      const dataTransfer = {
        files: [file],
      };

      fireEvent.drop(dropZone!, { dataTransfer });

      expect(onChange).toHaveBeenCalledWith([file]);
    });
  });

  // ==========================================
  // Image Preview Tests
  // ==========================================
  describe('Image Preview', () => {
    it('should display new images section when images exist', () => {
      const images = [createMockFile('test.jpg', 1024, 'image/jpeg')];
      render(<ImageUpload {...defaultProps} images={images} />);

      expect(screen.getByText(/new images/i)).toBeInTheDocument();
    });

    it('should show image count in header', () => {
      const images = [
        createMockFile('test1.jpg', 1024, 'image/jpeg'),
        createMockFile('test2.jpg', 1024, 'image/jpeg'),
      ];
      render(<ImageUpload {...defaultProps} images={images} />);

      expect(screen.getByText(/new images \(2\)/i)).toBeInTheDocument();
    });

    it('should show "Main" badge on first image', () => {
      const images = [createMockFile('test.jpg', 1024, 'image/jpeg')];
      render(<ImageUpload {...defaultProps} images={images} />);

      expect(screen.getByText('Main')).toBeInTheDocument();
    });

    it('should not show "Main" badge on first new image if existing images present', () => {
      const images = [createMockFile('test.jpg', 1024, 'image/jpeg')];
      render(
        <ImageUpload
          {...defaultProps}
          images={images}
          existingImages={['existing.jpg']}
        />
      );

      // There should be one "Main" badge for existing image, not for new image
      const mainBadges = screen.getAllByText('Main');
      expect(mainBadges).toHaveLength(1);
    });

    it('should show file size', () => {
      const images = [createMockFile('test.jpg', 2048, 'image/jpeg')];
      render(<ImageUpload {...defaultProps} images={images} />);

      expect(screen.getByText('2 KB')).toBeInTheDocument();
    });
  });

  // ==========================================
  // Remove Image Tests
  // ==========================================
  describe('Remove Images', () => {
    it('should remove image when remove button clicked', () => {
      const onChange = vi.fn();
      const images = [
        createMockFile('test1.jpg', 1024, 'image/jpeg'),
        createMockFile('test2.jpg', 1024, 'image/jpeg'),
      ];
      render(<ImageUpload {...defaultProps} images={images} onChange={onChange} />);

      const removeButtons = screen.getAllByTitle('Remove image');
      fireEvent.click(removeButtons[0]);

      // Should call onChange with the second image only
      expect(onChange).toHaveBeenCalledWith([images[1]]);
    });

    it('should show clear all button when images exist', () => {
      const images = [createMockFile('test.jpg', 1024, 'image/jpeg')];
      render(<ImageUpload {...defaultProps} images={images} />);

      expect(screen.getByText('Clear All')).toBeInTheDocument();
    });

    it('should clear all images when clear all button clicked', () => {
      const onChange = vi.fn();
      const images = [
        createMockFile('test1.jpg', 1024, 'image/jpeg'),
        createMockFile('test2.jpg', 1024, 'image/jpeg'),
      ];
      render(<ImageUpload {...defaultProps} images={images} onChange={onChange} />);

      const clearAllButton = screen.getByText('Clear All');
      fireEvent.click(clearAllButton);

      expect(onChange).toHaveBeenCalledWith([]);
    });

    it('should call onRemoveExisting for existing images', () => {
      const onRemoveExisting = vi.fn();
      render(
        <ImageUpload
          {...defaultProps}
          existingImages={['image1.jpg', 'image2.jpg']}
          onRemoveExisting={onRemoveExisting}
        />
      );

      const removeButtons = screen.getAllByTitle('Remove image');
      fireEvent.click(removeButtons[0]);

      expect(onRemoveExisting).toHaveBeenCalledWith(0);
    });
  });

  // ==========================================
  // Existing Images Tests
  // ==========================================
  describe('Existing Images', () => {
    it('should display existing images section', () => {
      render(
        <ImageUpload
          {...defaultProps}
          existingImages={['image1.jpg']}
        />
      );

      expect(screen.getByText(/current images/i)).toBeInTheDocument();
    });

    it('should show saved badge on existing images', () => {
      render(
        <ImageUpload
          {...defaultProps}
          existingImages={['image1.jpg']}
        />
      );

      expect(screen.getByText('✓ Saved')).toBeInTheDocument();
    });

    it('should hide remove button if onRemoveExisting not provided', () => {
      render(
        <ImageUpload
          {...defaultProps}
          existingImages={['image1.jpg']}
          onRemoveExisting={undefined}
        />
      );

      expect(screen.queryByTitle('Remove image')).not.toBeInTheDocument();
    });
  });

  // ==========================================
  // Helper Text Tests
  // ==========================================
  describe('Helper Text', () => {
    it('should show tip about main photo when images uploaded', () => {
      const images = [createMockFile('test.jpg', 1024, 'image/jpeg')];
      render(<ImageUpload {...defaultProps} images={images} />);

      expect(screen.getByText(/first image will be used as the main photo/i)).toBeInTheDocument();
    });
  });
});
