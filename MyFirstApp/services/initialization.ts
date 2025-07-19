import { databaseService } from './database';
import { storageService } from './storage';

export class InitializationService {
  private static isInitialized = false;

  static async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      console.log('Starting app initialization...');

      // Initialize database
      await databaseService.initialize();
      console.log('Database initialized');

      // Load user preferences
      const preferences = await storageService.getUserPreferences();
      console.log('User preferences loaded:', preferences);

      // Set app version if not set
      const currentVersion = '1.0.0';
      const storedVersion = await storageService.getAppVersion();
      if (!storedVersion) {
        await storageService.setAppVersion(currentVersion);
        console.log('App version set to:', currentVersion);
      }

      this.isInitialized = true;
      console.log('App initialization completed successfully');
    } catch (error) {
      console.error('App initialization failed:', error);
      throw new Error(`App initialization failed: ${error}`);
    }
  }

  static async reset(): Promise<void> {
    try {
      console.log('Resetting app data...');
      
      // Clear storage
      await storageService.clearAll();
      
      // Reset initialization flag
      this.isInitialized = false;
      
      // Re-initialize
      await this.initialize();
      
      console.log('App reset completed');
    } catch (error) {
      console.error('App reset failed:', error);
      throw new Error(`App reset failed: ${error}`);
    }
  }

  static getInitializationStatus(): boolean {
    return this.isInitialized;
  }
}