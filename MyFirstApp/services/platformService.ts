import { Platform } from 'react-native';
import { databaseService } from './database';
import { wineService } from './wineService';
import { sakeService } from './sakeService';
import { webStorageService } from './webStorage';
import { Wine, WineCreateInput, WineUpdateInput } from '../types/wine';
import { Sake, SakeCreateInput, SakeUpdateInput } from '../types/sake';

// プラットフォーム検出
const isWeb = Platform.OS === 'web';

// 統一されたサービスインターface
interface PlatformWineService {
  create(data: WineCreateInput): Promise<Wine>;
  findById(id: string): Promise<Wine | null>;
  findAll(): Promise<Wine[]>;
  update(id: string, data: WineUpdateInput): Promise<Wine>;
  delete(id: string): Promise<void>;
  count(): Promise<number>;
}

interface PlatformSakeService {
  create(data: SakeCreateInput): Promise<Sake>;
  findById(id: string): Promise<Sake | null>;
  findAll(): Promise<Sake[]>;
  update(id: string, data: SakeUpdateInput): Promise<Sake>;
  delete(id: string): Promise<void>;
  count(): Promise<number>;
}

interface PlatformDatabaseService {
  initialize(): Promise<void>;
  healthCheck(): Promise<boolean>;
}

// Web用のアダプター
class WebWineServiceAdapter implements PlatformWineService {
  async create(data: WineCreateInput): Promise<Wine> {
    return webStorageService.createWine(data);
  }

  async findById(id: string): Promise<Wine | null> {
    return webStorageService.findWineById(id);
  }

  async findAll(): Promise<Wine[]> {
    return webStorageService.findAllWines();
  }

  async update(id: string, data: WineUpdateInput): Promise<Wine> {
    return webStorageService.updateWine(id, data);
  }

  async delete(id: string): Promise<void> {
    return webStorageService.deleteWine(id);
  }

  async count(): Promise<number> {
    return webStorageService.countWines();
  }
}

class WebSakeServiceAdapter implements PlatformSakeService {
  async create(data: SakeCreateInput): Promise<Sake> {
    return webStorageService.createSake(data);
  }

  async findById(id: string): Promise<Sake | null> {
    return webStorageService.findSakeById(id);
  }

  async findAll(): Promise<Sake[]> {
    return webStorageService.findAllSakes();
  }

  async update(id: string, data: SakeUpdateInput): Promise<Sake> {
    return webStorageService.updateSake(id, data);
  }

  async delete(id: string): Promise<void> {
    return webStorageService.deleteSake(id);
  }

  async count(): Promise<number> {
    return webStorageService.countSakes();
  }
}

class WebDatabaseServiceAdapter implements PlatformDatabaseService {
  async initialize(): Promise<void> {
    // Web環境では特に初期化は不要
    console.log('Web storage initialized');
  }

  async healthCheck(): Promise<boolean> {
    return webStorageService.healthCheck();
  }
}

// プラットフォームに応じたサービスをエクスポート
export const platformWineService: PlatformWineService = isWeb 
  ? new WebWineServiceAdapter() 
  : wineService;

export const platformSakeService: PlatformSakeService = isWeb 
  ? new WebSakeServiceAdapter() 
  : sakeService;

export const platformDatabaseService: PlatformDatabaseService = isWeb 
  ? new WebDatabaseServiceAdapter() 
  : databaseService;

export { isWeb };