import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { DatabaseError } from '../types/common';

export interface ImagePickerOptions {
  allowsEditing?: boolean;
  aspect?: [number, number];
  quality?: number;
  allowsMultipleSelection?: boolean;
}

export interface ImageInfo {
  uri: string;
  width: number;
  height: number;
  type?: 'image' | 'video';
  fileSize?: number;
  fileName?: string;
}

export class ImageService {
  private readonly imageDirectory: string;

  constructor() {
    this.imageDirectory = `${FileSystem.documentDirectory}images/`;
  }

  // Initialize image directory
  async initialize(): Promise<void> {
    try {
      const dirInfo = await FileSystem.getInfoAsync(this.imageDirectory);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(this.imageDirectory, { intermediates: true });
        console.log('Image directory created:', this.imageDirectory);
      }
    } catch (error) {
      console.error('Failed to initialize image directory:', error);
      throw new DatabaseError(`Failed to initialize image directory: ${error}`);
    }
  }

  // Request camera permissions
  async requestCameraPermissions(): Promise<boolean> {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Failed to request camera permissions:', error);
      return false;
    }
  }

  // Request media library permissions
  async requestMediaLibraryPermissions(): Promise<boolean> {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Failed to request media library permissions:', error);
      return false;
    }
  }

  // Take photo with camera
  async takePhoto(options: ImagePickerOptions = {}): Promise<ImageInfo | null> {
    try {
      // Request camera permissions
      const hasPermission = await this.requestCameraPermissions();
      if (!hasPermission) {
        throw new DatabaseError('Camera permission not granted');
      }

      const defaultOptions: ImagePicker.ImagePickerOptions = {
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: options.allowsEditing ?? true,
        aspect: options.aspect ?? [1, 1],
        quality: options.quality ?? 0.8,
        allowsMultipleSelection: false
      };

      const result = await ImagePicker.launchCameraAsync(defaultOptions);

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return null;
      }

      const asset = result.assets[0];
      return {
        uri: asset.uri,
        width: asset.width,
        height: asset.height,
        type: asset.type as 'image' | 'video',
        fileSize: asset.fileSize,
        fileName: asset.fileName
      };
    } catch (error) {
      console.error('Failed to take photo:', error);
      throw new DatabaseError(`Failed to take photo: ${error}`);
    }
  }

  // Pick image from gallery
  async pickImage(options: ImagePickerOptions = {}): Promise<ImageInfo | null> {
    try {
      // Request media library permissions
      const hasPermission = await this.requestMediaLibraryPermissions();
      if (!hasPermission) {
        throw new DatabaseError('Media library permission not granted');
      }

      const defaultOptions: ImagePicker.ImagePickerOptions = {
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: options.allowsEditing ?? true,
        aspect: options.aspect ?? [1, 1],
        quality: options.quality ?? 0.8,
        allowsMultipleSelection: options.allowsMultipleSelection ?? false
      };

      const result = await ImagePicker.launchImageLibraryAsync(defaultOptions);

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return null;
      }

      const asset = result.assets[0];
      return {
        uri: asset.uri,
        width: asset.width,
        height: asset.height,
        type: asset.type as 'image' | 'video',
        fileSize: asset.fileSize,
        fileName: asset.fileName
      };
    } catch (error) {
      console.error('Failed to pick image:', error);
      throw new DatabaseError(`Failed to pick image: ${error}`);
    }
  }

  // Save image to app directory
  async saveImage(imageUri: string, fileName?: string): Promise<string> {
    try {
      await this.initialize();

      // Generate unique filename if not provided
      const timestamp = Date.now();
      const extension = imageUri.split('.').pop() || 'jpg';
      const finalFileName = fileName || `image_${timestamp}.${extension}`;
      const destinationUri = `${this.imageDirectory}${finalFileName}`;

      // Copy image to app directory
      await FileSystem.copyAsync({
        from: imageUri,
        to: destinationUri
      });

      console.log('Image saved to:', destinationUri);
      return destinationUri;
    } catch (error) {
      console.error('Failed to save image:', error);
      throw new DatabaseError(`Failed to save image: ${error}`);
    }
  }

  // Load image (check if exists)
  async loadImage(imageUri: string): Promise<boolean> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(imageUri);
      return fileInfo.exists;
    } catch (error) {
      console.error('Failed to load image:', error);
      return false;
    }
  }

  // Delete image
  async deleteImage(imageUri: string): Promise<void> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(imageUri);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(imageUri);
        console.log('Image deleted:', imageUri);
      }
    } catch (error) {
      console.error('Failed to delete image:', error);
      throw new DatabaseError(`Failed to delete image: ${error}`);
    }
  }

  // Get image info
  async getImageInfo(imageUri: string): Promise<FileSystem.FileInfo | null> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(imageUri);
      return fileInfo.exists ? fileInfo : null;
    } catch (error) {
      console.error('Failed to get image info:', error);
      return null;
    }
  }

  // Clean up orphaned images (images not referenced in database)
  async cleanupOrphanedImages(referencedUris: string[]): Promise<number> {
    try {
      await this.initialize();

      const dirInfo = await FileSystem.readDirectoryAsync(this.imageDirectory);
      let deletedCount = 0;

      for (const fileName of dirInfo) {
        const fullPath = `${this.imageDirectory}${fileName}`;
        const isReferenced = referencedUris.some(uri => uri === fullPath);

        if (!isReferenced) {
          await FileSystem.deleteAsync(fullPath);
          deletedCount++;
          console.log('Deleted orphaned image:', fullPath);
        }
      }

      console.log(`Cleaned up ${deletedCount} orphaned images`);
      return deletedCount;
    } catch (error) {
      console.error('Failed to cleanup orphaned images:', error);
      throw new DatabaseError(`Failed to cleanup orphaned images: ${error}`);
    }
  }

  // Get total storage used by images
  async getStorageUsage(): Promise<number> {
    try {
      await this.initialize();

      const dirInfo = await FileSystem.readDirectoryAsync(this.imageDirectory);
      let totalSize = 0;

      for (const fileName of dirInfo) {
        const fullPath = `${this.imageDirectory}${fileName}`;
        const fileInfo = await FileSystem.getInfoAsync(fullPath);
        if (fileInfo.exists && fileInfo.size) {
          totalSize += fileInfo.size;
        }
      }

      return totalSize;
    } catch (error) {
      console.error('Failed to get storage usage:', error);
      return 0;
    }
  }

  // Resize image (basic implementation using ImagePicker)
  async resizeImage(imageUri: string, width: number, height: number): Promise<string> {
    try {
      // For now, we'll use the quality parameter to reduce file size
      // In a production app, you might want to use a dedicated image manipulation library
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [width, height],
        quality: 0.7,
        allowsMultipleSelection: false
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        throw new DatabaseError('Image resize was canceled');
      }

      return result.assets[0].uri;
    } catch (error) {
      console.error('Failed to resize image:', error);
      throw new DatabaseError(`Failed to resize image: ${error}`);
    }
  }

  // Utility method to show image picker options
  async showImagePickerOptions(): Promise<ImageInfo | null> {
    try {
      // This would typically show an action sheet or modal
      // For now, we'll default to picking from gallery
      return await this.pickImage();
    } catch (error) {
      console.error('Failed to show image picker options:', error);
      throw error;
    }
  }

  // Validate image file
  validateImage(imageInfo: ImageInfo): boolean {
    const maxFileSize = 10 * 1024 * 1024; // 10MB
    const maxDimension = 4096; // 4K resolution

    if (imageInfo.fileSize && imageInfo.fileSize > maxFileSize) {
      throw new DatabaseError('画像ファイルサイズが大きすぎます（最大10MB）');
    }

    if (imageInfo.width > maxDimension || imageInfo.height > maxDimension) {
      throw new DatabaseError('画像の解像度が大きすぎます（最大4096px）');
    }

    return true;
  }

  // Get image directory path
  getImageDirectory(): string {
    return this.imageDirectory;
  }
}

// Export singleton instance
export const imageService = new ImageService();