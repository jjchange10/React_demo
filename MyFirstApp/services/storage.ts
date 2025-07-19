import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  USER_PREFERENCES: '@wine_sake_app/user_preferences',
  LAST_SYNC: '@wine_sake_app/last_sync',
  APP_VERSION: '@wine_sake_app/app_version',
} as const;

export interface UserPreferences {
  theme?: 'light' | 'dark' | 'system';
  language?: 'ja' | 'en';
  defaultRating?: number;
  showRecommendations?: boolean;
}

class StorageService {
  async setUserPreferences(preferences: UserPreferences): Promise<void> {
    try {
      const jsonValue = JSON.stringify(preferences);
      await AsyncStorage.setItem(STORAGE_KEYS.USER_PREFERENCES, jsonValue);
    } catch (error) {
      console.error('Failed to save user preferences:', error);
      throw new Error(`Failed to save user preferences: ${error}`);
    }
  }

  async getUserPreferences(): Promise<UserPreferences> {
    try {
      const jsonValue = await AsyncStorage.getItem(STORAGE_KEYS.USER_PREFERENCES);
      if (jsonValue != null) {
        return JSON.parse(jsonValue);
      }

      // Return default preferences
      return {
        theme: 'system',
        language: 'ja',
        defaultRating: 3,
        showRecommendations: true,
      };
    } catch (error) {
      console.error('Failed to load user preferences:', error);
      // Return default preferences on error
      return {
        theme: 'system',
        language: 'ja',
        defaultRating: 3,
        showRecommendations: true,
      };
    }
  }

  async setLastSync(timestamp: Date): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNC, timestamp.toISOString());
    } catch (error) {
      console.error('Failed to save last sync timestamp:', error);
      throw new Error(`Failed to save last sync timestamp: ${error}`);
    }
  }

  async getLastSync(): Promise<Date | null> {
    try {
      const timestamp = await AsyncStorage.getItem(STORAGE_KEYS.LAST_SYNC);
      return timestamp ? new Date(timestamp) : null;
    } catch (error) {
      console.error('Failed to load last sync timestamp:', error);
      return null;
    }
  }

  async setAppVersion(version: string): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.APP_VERSION, version);
    } catch (error) {
      console.error('Failed to save app version:', error);
      throw new Error(`Failed to save app version: ${error}`);
    }
  }

  async getAppVersion(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.APP_VERSION);
    } catch (error) {
      console.error('Failed to load app version:', error);
      return null;
    }
  }

  async clearAll(): Promise<void> {
    try {
      await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
    } catch (error) {
      console.error('Failed to clear storage:', error);
      throw new Error(`Failed to clear storage: ${error}`);
    }
  }

  async getStorageSize(): Promise<number> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      let totalSize = 0;

      for (const key of keys) {
        const value = await AsyncStorage.getItem(key);
        if (value) {
          totalSize += value.length;
        }
      }

      return totalSize;
    } catch (error) {
      console.error('Failed to calculate storage size:', error);
      return 0;
    }
  }
}

// Export singleton instance
export const storageService = new StorageService();