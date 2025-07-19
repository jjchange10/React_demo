import { wineService } from '../../services/wineService';
import { sakeService } from '../../services/sakeService';
import { databaseService } from '../../services/databaseProvider';
import { WineCreateInput } from '../../types/wine';
import { SakeCreateInput } from '../../types/sake';

// Mock the database service
jest.mock('../../services/databaseProvider');

const mockDatabaseService = databaseService as jest.Mocked<typeof databaseService>;

describe('Simple Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup database service mocks
    mockDatabaseService.initialize.mockResolvedValue();
    mockDatabaseService.close.mockResolvedValue();
    mockDatabaseService.generateId.mockReturnValue('test-id');
    
    // Setup mapping functions
    mockDatabaseService.mapRowToWine.mockImplementation((row) => ({
      id: row.id,
      name: row.name,
      region: row.region || undefined,
      grape: row.grape || undefined,
      vintage: row.vintage || undefined,
      rating: row.rating,
      notes: row.notes || undefined,
      photoUri: row.photo_uri || undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    }));
    
    mockDatabaseService.mapRowToSake.mockImplementation((row) => ({
      id: row.id,
      name: row.name,
      brewery: row.brewery || undefined,
      type: row.type || undefined,
      region: row.region || undefined,
      rating: row.rating,
      notes: row.notes || undefined,
      photoUri: row.photo_uri || undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    }));
  });

  describe('Wine Service Integration', () => {
    it('should create wine successfully', async () => {
      const mockDbRow = {
        id: 'test-id',
        name: 'Test Wine',
        region: 'Test Region',
        grape: 'Test Grape',
        vintage: 2020,
        rating: 4,
        notes: 'Test notes',
        photo_uri: null,
        created_at: '2023-01-01T00:00:00.000Z',
        updated_at: '2023-01-01T00:00:00.000Z'
      };

      mockDatabaseService.create.mockResolvedValue('test-id');
      mockDatabaseService.findById.mockResolvedValue(mockDbRow);

      const wineData: WineCreateInput = {
        name: 'Test Wine',
        region: 'Test Region',
        grape: 'Test Grape',
        vintage: 2020,
        rating: 4,
        notes: 'Test notes'
      };

      const result = await wineService.create(wineData);

      expect(result).toBeDefined();
      expect(result.id).toBe('test-id');
      expect(result.name).toBe('Test Wine');
      expect(result.region).toBe('Test Region');
      expect(result.rating).toBe(4);
      
      expect(mockDatabaseService.create).toHaveBeenCalledWith('wines', {
        name: 'Test Wine',
        region: 'Test Region',
        grape: 'Test Grape',
        vintage: 2020,
        rating: 4,
        notes: 'Test notes',
        photo_uri: null
      });
    });

    it('should read wine by id', async () => {
      const mockDbRow = {
        id: 'test-id',
        name: 'Test Wine',
        region: 'Test Region',
        rating: 4,
        grape: null,
        vintage: null,
        notes: null,
        photo_uri: null,
        created_at: '2023-01-01T00:00:00.000Z',
        updated_at: '2023-01-01T00:00:00.000Z'
      };

      mockDatabaseService.findById.mockResolvedValue(mockDbRow);

      const result = await wineService.findById('test-id');

      expect(result).toBeDefined();
      expect(result!.id).toBe('test-id');
      expect(result!.name).toBe('Test Wine');
      expect(mockDatabaseService.findById).toHaveBeenCalledWith('wines', 'test-id');
    });

    it('should update wine', async () => {
      const originalDbRow = {
        id: 'test-id',
        name: 'Original Wine',
        region: 'Original Region',
        rating: 3,
        grape: null,
        vintage: null,
        notes: null,
        photo_uri: null,
        created_at: '2023-01-01T00:00:00.000Z',
        updated_at: '2023-01-01T00:00:00.000Z'
      };

      const updatedDbRow = {
        ...originalDbRow,
        name: 'Updated Wine',
        rating: 5,
        updated_at: '2023-01-01T01:00:00.000Z'
      };

      mockDatabaseService.findById.mockResolvedValueOnce(originalDbRow)
        .mockResolvedValueOnce(updatedDbRow);
      mockDatabaseService.update.mockResolvedValue();

      const result = await wineService.update('test-id', {
        name: 'Updated Wine',
        rating: 5
      });

      expect(result.name).toBe('Updated Wine');
      expect(result.rating).toBe(5);
      expect(mockDatabaseService.update).toHaveBeenCalledWith('wines', 'test-id', {
        name: 'Updated Wine',
        rating: 5
      });
    });

    it('should delete wine', async () => {
      const mockDbRow = {
        id: 'test-id',
        name: 'Test Wine',
        rating: 4,
        region: null,
        grape: null,
        vintage: null,
        notes: null,
        photo_uri: null,
        created_at: '2023-01-01T00:00:00.000Z',
        updated_at: '2023-01-01T00:00:00.000Z'
      };

      mockDatabaseService.findById.mockResolvedValue(mockDbRow);
      mockDatabaseService.delete.mockResolvedValue();

      await wineService.delete('test-id');

      expect(mockDatabaseService.delete).toHaveBeenCalledWith('wines', 'test-id');
    });
  });

  describe('Sake Service Integration', () => {
    it('should create sake successfully', async () => {
      const mockDbRow = {
        id: 'test-id',
        name: 'Test Sake',
        brewery: 'Test Brewery',
        type: '純米酒',
        region: 'Test Region',
        rating: 5,
        notes: 'Test notes',
        photo_uri: null,
        created_at: '2023-01-01T00:00:00.000Z',
        updated_at: '2023-01-01T00:00:00.000Z'
      };

      mockDatabaseService.create.mockResolvedValue('test-id');
      mockDatabaseService.findById.mockResolvedValue(mockDbRow);

      const sakeData: SakeCreateInput = {
        name: 'Test Sake',
        brewery: 'Test Brewery',
        type: '純米酒',
        region: 'Test Region',
        rating: 5,
        notes: 'Test notes'
      };

      const result = await sakeService.create(sakeData);

      expect(result).toBeDefined();
      expect(result.id).toBe('test-id');
      expect(result.name).toBe('Test Sake');
      expect(result.brewery).toBe('Test Brewery');
      expect(result.type).toBe('純米酒');
      expect(result.rating).toBe(5);
      
      expect(mockDatabaseService.create).toHaveBeenCalledWith('sakes', {
        name: 'Test Sake',
        brewery: 'Test Brewery',
        type: '純米酒',
        region: 'Test Region',
        rating: 5,
        notes: 'Test notes',
        photo_uri: null
      });
    });

    it('should read sake by id', async () => {
      const mockDbRow = {
        id: 'test-id',
        name: 'Test Sake',
        brewery: 'Test Brewery',
        type: '純米酒',
        rating: 5,
        region: null,
        notes: null,
        photo_uri: null,
        created_at: '2023-01-01T00:00:00.000Z',
        updated_at: '2023-01-01T00:00:00.000Z'
      };

      mockDatabaseService.findById.mockResolvedValue(mockDbRow);

      const result = await sakeService.findById('test-id');

      expect(result).toBeDefined();
      expect(result!.id).toBe('test-id');
      expect(result!.name).toBe('Test Sake');
      expect(result!.brewery).toBe('Test Brewery');
      expect(mockDatabaseService.findById).toHaveBeenCalledWith('sakes', 'test-id');
    });
  });

  describe('Error Handling', () => {
    it('should handle non-existent records', async () => {
      mockDatabaseService.findById.mockResolvedValue(null);

      const wineResult = await wineService.findById('non-existent');
      const sakeResult = await sakeService.findById('non-existent');

      expect(wineResult).toBeNull();
      expect(sakeResult).toBeNull();
    });

    it('should handle database errors gracefully', async () => {
      mockDatabaseService.create.mockRejectedValue(new Error('Database error'));

      await expect(wineService.create({
        name: 'Test Wine',
        rating: 4
      })).rejects.toThrow('Database error');

      await expect(sakeService.create({
        name: 'Test Sake',
        rating: 5
      })).rejects.toThrow('Database error');
    });
  });

  describe('Data Validation', () => {
    it('should validate wine data', async () => {
      // Test empty name
      await expect(wineService.create({
        name: '',
        rating: 4
      })).rejects.toThrow();

      // Test invalid rating
      await expect(wineService.create({
        name: 'Test Wine',
        rating: 0
      })).rejects.toThrow();

      await expect(wineService.create({
        name: 'Test Wine',
        rating: 6
      })).rejects.toThrow();
    });

    it('should validate sake data', async () => {
      // Test empty name
      await expect(sakeService.create({
        name: '',
        rating: 5
      })).rejects.toThrow();

      // Test invalid rating
      await expect(sakeService.create({
        name: 'Test Sake',
        rating: 0
      })).rejects.toThrow();

      await expect(sakeService.create({
        name: 'Test Sake',
        rating: 6
      })).rejects.toThrow();
    });
  });
});