// Web環境用のストレージ実装（LocalStorageベース）
import { Wine, WineCreateInput, WineUpdateInput } from '../types/wine';
import { Sake, SakeCreateInput, SakeUpdateInput } from '../types/sake';
import { DatabaseError } from '../types/common';

interface StorageData {
  wines: Wine[];
  sakes: Sake[];
}

class WebStorageService {
  private readonly storageKey = 'wine_sake_tracker_data';

  private generateId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  private getData(): StorageData {
    try {
      const data = localStorage.getItem(this.storageKey);
      if (data) {
        const parsed = JSON.parse(data);
        // Date オブジェクトを復元
        parsed.wines = parsed.wines.map((wine: any) => ({
          ...wine,
          createdAt: new Date(wine.createdAt),
          updatedAt: new Date(wine.updatedAt)
        }));
        parsed.sakes = parsed.sakes.map((sake: any) => ({
          ...sake,
          createdAt: new Date(sake.createdAt),
          updatedAt: new Date(sake.updatedAt)
        }));
        return parsed;
      }
      return { wines: [], sakes: [] };
    } catch (error) {
      console.error('Failed to get data from localStorage:', error);
      return { wines: [], sakes: [] };
    }
  }

  private saveData(data: StorageData): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save data to localStorage:', error);
      throw new DatabaseError(`Failed to save data: ${error}`);
    }
  }

  // Wine operations
  async createWine(data: WineCreateInput): Promise<Wine> {
    const storage = this.getData();
    const now = new Date();
    const wine: Wine = {
      id: this.generateId(),
      ...data,
      createdAt: now,
      updatedAt: now
    };
    
    storage.wines.push(wine);
    this.saveData(storage);
    return wine;
  }

  async findWineById(id: string): Promise<Wine | null> {
    const storage = this.getData();
    return storage.wines.find(wine => wine.id === id) || null;
  }

  async findAllWines(): Promise<Wine[]> {
    const storage = this.getData();
    return storage.wines.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async updateWine(id: string, data: WineUpdateInput): Promise<Wine> {
    const storage = this.getData();
    const index = storage.wines.findIndex(wine => wine.id === id);
    
    if (index === -1) {
      throw new DatabaseError(`Wine not found with id: ${id}`);
    }

    const updatedWine = {
      ...storage.wines[index],
      ...data,
      updatedAt: new Date()
    };

    storage.wines[index] = updatedWine;
    this.saveData(storage);
    return updatedWine;
  }

  async deleteWine(id: string): Promise<void> {
    const storage = this.getData();
    const index = storage.wines.findIndex(wine => wine.id === id);
    
    if (index === -1) {
      throw new DatabaseError(`Wine not found with id: ${id}`);
    }

    storage.wines.splice(index, 1);
    this.saveData(storage);
  }

  async countWines(): Promise<number> {
    const storage = this.getData();
    return storage.wines.length;
  }

  // Sake operations
  async createSake(data: SakeCreateInput): Promise<Sake> {
    const storage = this.getData();
    const now = new Date();
    const sake: Sake = {
      id: this.generateId(),
      ...data,
      createdAt: now,
      updatedAt: now
    };
    
    storage.sakes.push(sake);
    this.saveData(storage);
    return sake;
  }

  async findSakeById(id: string): Promise<Sake | null> {
    const storage = this.getData();
    return storage.sakes.find(sake => sake.id === id) || null;
  }

  async findAllSakes(): Promise<Sake[]> {
    const storage = this.getData();
    return storage.sakes.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async updateSake(id: string, data: SakeUpdateInput): Promise<Sake> {
    const storage = this.getData();
    const index = storage.sakes.findIndex(sake => sake.id === id);
    
    if (index === -1) {
      throw new DatabaseError(`Sake not found with id: ${id}`);
    }

    const updatedSake = {
      ...storage.sakes[index],
      ...data,
      updatedAt: new Date()
    };

    storage.sakes[index] = updatedSake;
    this.saveData(storage);
    return updatedSake;
  }

  async deleteSake(id: string): Promise<void> {
    const storage = this.getData();
    const index = storage.sakes.findIndex(sake => sake.id === id);
    
    if (index === -1) {
      throw new DatabaseError(`Sake not found with id: ${id}`);
    }

    storage.sakes.splice(index, 1);
    this.saveData(storage);
  }

  async countSakes(): Promise<number> {
    const storage = this.getData();
    return storage.sakes.length;
  }

  // Utility methods
  async clearAll(): Promise<void> {
    localStorage.removeItem(this.storageKey);
  }

  async healthCheck(): Promise<boolean> {
    try {
      const testKey = 'health_check_test';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch (error) {
      return false;
    }
  }
}

export const webStorageService = new WebStorageService();