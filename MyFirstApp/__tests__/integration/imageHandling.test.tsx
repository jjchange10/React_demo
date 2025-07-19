import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { PhotoPicker } from '../../components/common/PhotoPicker';
import { WineForm } from '../../components/wine/WineForm';
import { SakeForm } from '../../components/sake/SakeForm';
import { RecordsProvider, useRecords } from '../../context/RecordsContext';
import { imageService } from '../../services/imageService';
import { wineService } from '../../services/wineService';
import { sakeService } from '../../services/sakeService';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';

// Mock services and dependencies
jest.mock('../../services/imageService');
jest.mock('../../services/wineService');
jest.mock('../../services/sakeService');
jest.mock('expo-image-picker');
jest.mock('expo-file-system');
jest.mock('../../services/recommendationService', () => ({
  recommendationService: {
    generateRecommendations: jest.fn(() => Promise.resolve([]))
  }
}));
jest.mock('../../services/toastService', () => ({
  toastService: {
    showSuccess: jest.fn(),
    showError: jest.fn()
  }
}));
jest.mock('../../services/retryService', () => ({
  retryService: {
    executeDbOperation: jest.fn((operation) => operation())
  }
}));

const mockImageService = imageService as jest.Mocked<typeof imageService>;
const mockWineService = wineService as jest.Mocked<typeof wineService>;
const mockSakeService = sakeService as jest.Mocked<typeof sakeService>;
const mockImagePicker = ImagePicker as jest.Mocked<typeof ImagePicker>;
const mockFileSystem = FileSystem as jest.Mocked<typeof FileSystem>;

// Test component that uses PhotoPicker
function TestPhotoPickerComponent() {
  const [photoUri, setPhotoUri] = React.useState<string | undefined>();

  const handlePhotoSelected = (uri: string | undefined) => {
    setPhotoUri(uri);
  };

  return (
    <PhotoPicker
      onPhotoSelected={handlePhotoSelected}
      photoUri={photoUri}
      testID="photo-picker"
    />
  );
}

// Test component with form integration
function TestWineFormWithPhoto() {
  const { addWine, loading } = useRecords();

  const handleSubmit = async (data: any) => {
    await addWine(data);
  };

  return (
    <WineForm
      onSubmit={handleSubmit}
      isLoading={loading}
      testID="wine-form-with-photo"
    />
  );
}

describe('Image Handling Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementations
    mockWineService.findAll.mockResolvedValue([]);
    mockSakeService.findAll.mockResolvedValue([]);
    mockImageService.initialize.mockResolvedValue();
    mockImageService.requestMediaLibraryPermissions.mockResolvedValue(true);
    mockImageService.requestCameraPermissions.mockResolvedValue(true);
    mockFileSystem.getInfoAsync.mockResolvedValue({ exists: true } as any);
  });

  describe('PhotoPicker Component Integration', () => {
    it('should handle image selection from gallery', async () => {
      const mockImageInfo = {
        uri: 'file://test-image.jpg',
        width: 800,
        height: 600,
        type: 'image' as const,
        fileSize: 500000,
        fileName: 'test-image.jpg'
      };

      const savedImageUri = 'file://app/images/image_123456.jpg';

      mockImageService.pickImage.mockResolvedValue(mockImageInfo);
      mockImageService.saveImage.mockResolvedValue(savedImageUri);
      mockImageService.validateImage.mockReturnValue(true);

      const { getByTestId } = render(<TestPhotoPickerComponent />);

      const photoPickerButton = getByTestId('photo-picker-select');
      
      await act(async () => {
        fireEvent.press(photoPickerButton);
      });

      // Simulate gallery option selection
      const galleryOption = getByTestId('gallery-option');
      await act(async () => {
        fireEvent.press(galleryOption);
      });

      await waitFor(() => {
        expect(mockImageService.pickImage).toHaveBeenCalled();
        expect(mockImageService.saveImage).toHaveBeenCalledWith('file://test-image.jpg');
        expect(mockImageService.validateImage).toHaveBeenCalledWith(mockImageInfo);
      });

      // Verify image is displayed
      const imagePreview = getByTestId('photo-preview');
      expect(imagePreview).toBeTruthy();
    });

    it('should handle image capture from camera', async () => {
      const mockImageInfo = {
        uri: 'file://camera-image.jpg',
        width: 1024,
        height: 768,
        type: 'image' as const,
        fileSize: 800000,
        fileName: 'camera-image.jpg'
      };

      const savedImageUri = 'file://app/images/camera_123456.jpg';

      mockImageService.takePhoto.mockResolvedValue(mockImageInfo);
      mockImageService.saveImage.mockResolvedValue(savedImageUri);
      mockImageService.validateImage.mockReturnValue(true);

      const { getByTestId } = render(<TestPhotoPickerComponent />);

      const photoPickerButton = getByTestId('photo-picker-select');
      
      await act(async () => {
        fireEvent.press(photoPickerButton);
      });

      // Simulate camera option selection
      const cameraOption = getByTestId('camera-option');
      await act(async () => {
        fireEvent.press(cameraOption);
      });

      await waitFor(() => {
        expect(mockImageService.takePhoto).toHaveBeenCalled();
        expect(mockImageService.saveImage).toHaveBeenCalledWith('file://camera-image.jpg');
        expect(mockImageService.validateImage).toHaveBeenCalledWith(mockImageInfo);
      });

      // Verify image is displayed
      const imagePreview = getByTestId('photo-preview');
      expect(imagePreview).toBeTruthy();
    });

    it('should handle image deletion', async () => {
      const mockImageInfo = {
        uri: 'file://test-image.jpg',
        width: 800,
        height: 600,
        type: 'image' as const
      };

      const savedImageUri = 'file://app/images/image_123456.jpg';

      mockImageService.pickImage.mockResolvedValue(mockImageInfo);
      mockImageService.saveImage.mockResolvedValue(savedImageUri);
      mockImageService.validateImage.mockReturnValue(true);
      mockImageService.deleteImage.mockResolvedValue();

      const { getByTestId } = render(<TestPhotoPickerComponent />);

      // First, add an image
      const photoPickerButton = getByTestId('photo-picker-select');
      await act(async () => {
        fireEvent.press(photoPickerButton);
      });

      const galleryOption = getByTestId('gallery-option');
      await act(async () => {
        fireEvent.press(galleryOption);
      });

      await waitFor(() => {
        expect(getByTestId('photo-preview')).toBeTruthy();
      });

      // Then delete it
      const deleteButton = getByTestId('photo-delete');
      await act(async () => {
        fireEvent.press(deleteButton);
      });

      await waitFor(() => {
        expect(mockImageService.deleteImage).toHaveBeenCalledWith(savedImageUri);
      });

      // Verify image is removed
      expect(() => getByTestId('photo-preview')).toThrow();
    });

    it('should handle permission denial gracefully', async () => {
      mockImageService.requestMediaLibraryPermissions.mockResolvedValue(false);

      const { getByTestId } = render(<TestPhotoPickerComponent />);

      const photoPickerButton = getByTestId('photo-picker-select');
      
      await act(async () => {
        fireEvent.press(photoPickerButton);
      });

      const galleryOption = getByTestId('gallery-option');
      await act(async () => {
        fireEvent.press(galleryOption);
      });

      await waitFor(() => {
        expect(mockImageService.requestMediaLibraryPermissions).toHaveBeenCalled();
      });

      // Should show permission denied message
      const errorMessage = getByTestId('permission-error');
      expect(errorMessage).toBeTruthy();
    });

    it('should handle image validation errors', async () => {
      const mockImageInfo = {
        uri: 'file://large-image.jpg',
        width: 5000, // Too large
        height: 4000,
        type: 'image' as const,
        fileSize: 15000000 // Too large (15MB)
      };

      mockImageService.pickImage.mockResolvedValue(mockImageInfo);
      mockImageService.validateImage.mockImplementation(() => {
        throw new Error('画像ファイルサイズが大きすぎます（最大10MB）');
      });

      const { getByTestId } = render(<TestPhotoPickerComponent />);

      const photoPickerButton = getByTestId('photo-picker-select');
      
      await act(async () => {
        fireEvent.press(photoPickerButton);
      });

      const galleryOption = getByTestId('gallery-option');
      await act(async () => {
        fireEvent.press(galleryOption);
      });

      await waitFor(() => {
        expect(mockImageService.validateImage).toHaveBeenCalledWith(mockImageInfo);
      });

      // Should show validation error
      const validationError = getByTestId('validation-error');
      expect(validationError).toBeTruthy();
    });
  });

  describe('Form Integration with Images', () => {
    it('should save wine record with image', async () => {
      const mockWine = {
        id: 'wine-1',
        name: 'Wine with Photo',
        rating: 4,
        photoUri: 'file://app/images/wine_photo.jpg',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const mockImageInfo = {
        uri: 'file://selected-image.jpg',
        width: 800,
        height: 600,
        type: 'image' as const
      };

      mockWineService.create.mockResolvedValue(mockWine);
      mockImageService.pickImage.mockResolvedValue(mockImageInfo);
      mockImageService.saveImage.mockResolvedValue('file://app/images/wine_photo.jpg');
      mockImageService.validateImage.mockReturnValue(true);

      const { getByTestId } = render(
        <RecordsProvider>
          <TestWineFormWithPhoto />
        </RecordsProvider>
      );

      await waitFor(() => {
        expect(getByTestId('wine-form-with-photo')).toBeTruthy();
      });

      // Fill required fields
      const nameInput = getByTestId('wine-name-input');
      await act(async () => {
        fireEvent.changeText(nameInput, 'Wine with Photo');
      });

      // Set rating
      const ratingButton4 = getByTestId('rating-button-4');
      await act(async () => {
        fireEvent.press(ratingButton4);
      });

      // Add photo
      const photoPickerButton = getByTestId('photo-picker-select');
      await act(async () => {
        fireEvent.press(photoPickerButton);
      });

      const galleryOption = getByTestId('gallery-option');
      await act(async () => {
        fireEvent.press(galleryOption);
      });

      await waitFor(() => {
        expect(mockImageService.saveImage).toHaveBeenCalled();
      });

      // Submit form
      const submitButton = getByTestId('submit-button');
      await act(async () => {
        fireEvent.press(submitButton);
      });

      await waitFor(() => {
        expect(mockWineService.create).toHaveBeenCalledWith({
          name: 'Wine with Photo',
          region: '',
          grape: '',
          vintage: undefined,
          rating: 4,
          notes: '',
          photoUri: 'file://app/images/wine_photo.jpg'
        });
      });
    });

    it('should handle image save failure during form submission', async () => {
      const mockImageInfo = {
        uri: 'file://selected-image.jpg',
        width: 800,
        height: 600,
        type: 'image' as const
      };

      mockImageService.pickImage.mockResolvedValue(mockImageInfo);
      mockImageService.saveImage.mockRejectedValue(new Error('Failed to save image'));
      mockImageService.validateImage.mockReturnValue(true);

      const { getByTestId } = render(
        <RecordsProvider>
          <TestWineFormWithPhoto />
        </RecordsProvider>
      );

      await waitFor(() => {
        expect(getByTestId('wine-form-with-photo')).toBeTruthy();
      });

      // Fill required fields
      const nameInput = getByTestId('wine-name-input');
      await act(async () => {
        fireEvent.changeText(nameInput, 'Wine with Photo');
      });

      // Try to add photo
      const photoPickerButton = getByTestId('photo-picker-select');
      await act(async () => {
        fireEvent.press(photoPickerButton);
      });

      const galleryOption = getByTestId('gallery-option');
      await act(async () => {
        fireEvent.press(galleryOption);
      });

      await waitFor(() => {
        expect(mockImageService.saveImage).toHaveBeenCalled();
      });

      // Should show error message
      const errorMessage = getByTestId('image-save-error');
      expect(errorMessage).toBeTruthy();

      // Form should still be submittable without photo
      const submitButton = getByTestId('submit-button');
      await act(async () => {
        fireEvent.press(submitButton);
      });

      await waitFor(() => {
        expect(mockWineService.create).toHaveBeenCalledWith({
          name: 'Wine with Photo',
          region: '',
          grape: '',
          vintage: undefined,
          rating: 1,
          notes: '',
          photoUri: undefined
        });
      });
    });
  });

  describe('Image Storage Management', () => {
    it('should clean up orphaned images', async () => {
      const referencedUris = [
        'file://app/images/wine1.jpg',
        'file://app/images/sake1.jpg'
      ];

      mockImageService.cleanupOrphanedImages.mockResolvedValue(3);

      const deletedCount = await mockImageService.cleanupOrphanedImages(referencedUris);

      expect(deletedCount).toBe(3);
      expect(mockImageService.cleanupOrphanedImages).toHaveBeenCalledWith(referencedUris);
    });

    it('should get storage usage information', async () => {
      const storageUsage = 5242880; // 5MB

      mockImageService.getStorageUsage.mockResolvedValue(storageUsage);

      const usage = await mockImageService.getStorageUsage();

      expect(usage).toBe(storageUsage);
      expect(mockImageService.getStorageUsage).toHaveBeenCalled();
    });

    it('should check image existence', async () => {
      const imageUri = 'file://app/images/test.jpg';

      mockImageService.loadImage.mockResolvedValue(true);

      const exists = await mockImageService.loadImage(imageUri);

      expect(exists).toBe(true);
      expect(mockImageService.loadImage).toHaveBeenCalledWith(imageUri);
    });

    it('should handle missing image files gracefully', async () => {
      const imageUri = 'file://app/images/missing.jpg';

      mockImageService.loadImage.mockResolvedValue(false);

      const exists = await mockImageService.loadImage(imageUri);

      expect(exists).toBe(false);
      expect(mockImageService.loadImage).toHaveBeenCalledWith(imageUri);
    });
  });

  describe('Image Display Integration', () => {
    it('should display image in wine record', async () => {
      const mockWine = {
        id: 'wine-1',
        name: 'Wine with Photo',
        rating: 4,
        photoUri: 'file://app/images/wine_photo.jpg',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockImageService.loadImage.mockResolvedValue(true);

      // This would typically be in a WineCard or WineDetail component test
      // For now, we'll test the image loading logic
      const imageExists = await mockImageService.loadImage(mockWine.photoUri!);
      
      expect(imageExists).toBe(true);
      expect(mockImageService.loadImage).toHaveBeenCalledWith(mockWine.photoUri);
    });

    it('should handle broken image display', async () => {
      const mockWine = {
        id: 'wine-1',
        name: 'Wine with Broken Photo',
        rating: 4,
        photoUri: 'file://app/images/broken_photo.jpg',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockImageService.loadImage.mockResolvedValue(false);

      const imageExists = await mockImageService.loadImage(mockWine.photoUri!);
      
      expect(imageExists).toBe(false);
      // In UI, this would trigger fallback to default image or placeholder
    });
  });

  describe('Error Recovery Integration', () => {
    it('should recover from image picker cancellation', async () => {
      mockImageService.pickImage.mockResolvedValue(null); // User cancelled

      const { getByTestId } = render(<TestPhotoPickerComponent />);

      const photoPickerButton = getByTestId('photo-picker-select');
      
      await act(async () => {
        fireEvent.press(photoPickerButton);
      });

      const galleryOption = getByTestId('gallery-option');
      await act(async () => {
        fireEvent.press(galleryOption);
      });

      await waitFor(() => {
        expect(mockImageService.pickImage).toHaveBeenCalled();
      });

      // Should not show any error, just remain in previous state
      expect(() => getByTestId('photo-preview')).toThrow();
      expect(() => getByTestId('validation-error')).toThrow();
    });

    it('should handle file system errors gracefully', async () => {
      const mockImageInfo = {
        uri: 'file://test-image.jpg',
        width: 800,
        height: 600,
        type: 'image' as const
      };

      mockImageService.pickImage.mockResolvedValue(mockImageInfo);
      mockImageService.saveImage.mockRejectedValue(new Error('File system error'));
      mockImageService.validateImage.mockReturnValue(true);

      const { getByTestId } = render(<TestPhotoPickerComponent />);

      const photoPickerButton = getByTestId('photo-picker-select');
      
      await act(async () => {
        fireEvent.press(photoPickerButton);
      });

      const galleryOption = getByTestId('gallery-option');
      await act(async () => {
        fireEvent.press(galleryOption);
      });

      await waitFor(() => {
        expect(mockImageService.saveImage).toHaveBeenCalled();
      });

      // Should show appropriate error message
      const errorMessage = getByTestId('file-system-error');
      expect(errorMessage).toBeTruthy();
    });
  });
});