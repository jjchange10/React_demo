import { databaseService } from '../../services/database';
import { DatabaseError } from '../../types/common';
import * as SQLite from 'expo-sqlite';

// Mock SQLite
jest.mock('expo-sqlite');

describe('DatabaseService', () => {
  let mockDb: any;

  beforeEach(() => {
    mockDb = {
      execAsync: jest.fn(() => Promise.resolve()),
      runAsync: jest.fn(() => Promise.resolve({ changes: 1, insertId: 1 })),
      getAllAsync: jest.fn(() => Promise.resolve([])),
      closeAsync: jest.fn(() => Promise.resolve())
    };

    (SQLite.openDatabaseAsync as jest.Mock).mockResolvedValue(mockDb);
    
    // Reset the database service state
    (databaseService as any).db = null;
    (databaseService as any).isInitialized = false;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initialize', () => {
    it('should initialize database successfully', async () => {
      await databaseService.initialize();
      
      expect(SQLite.openDatabaseAsync).toHaveBeenCalledWith('wine_sake_tracker.db');
      expect(mockDb.execAsync).toHaveBeenCalledTimes(2); // wines and sakes tables
    });

    it('should not reinitialize if already initialized', async () => {
      await databaseService.initialize();
      await databaseService.initialize();
      
      expect(SQLite.openDatabaseAsync).toHaveBeenCalledTimes(1);
    });

    it('should throw DatabaseError on initialization failure', async () => {
      (SQLite.openDatabaseAsync as jest.Mock).mockRejectedValue(new Error('DB Error'));
      
      await expect(databaseService.initialize()).rejects.toThrow(DatabaseError);
    });
  });

  describe('generateId', () => {
    it('should generate valid UUID format', () => {
      const id = databaseService.generateId();
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      
      expect(id).toMatch(uuidRegex);
    });

    it('should generate unique IDs', () => {
      const id1 = databaseService.generateId();
      const id2 = databaseService.generateId();
      
      expect(id1).not.toBe(id2);
    });
  });

  describe('create', () => {
    beforeEach(async () => {
      await databaseService.initialize();
    });

    it('should create record successfully', async () => {
      const testData = { name: 'Test Wine', rating: 4 };
      
      const id = await databaseService.create('wines', testData);
      
      expect(typeof id).toBe('string');
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO wines'),
        expect.arrayContaining([id, expect.any(String), expect.any(String), 'Test Wine', 4])
      );
    });

    it('should throw DatabaseError on create failure', async () => {
      mockDb.runAsync.mockRejectedValue(new Error('Insert failed'));
      
      await expect(databaseService.create('wines', { name: 'Test' }))
        .rejects.toThrow(DatabaseError);
    });
  });

  describe('findById', () => {
    beforeEach(async () => {
      await databaseService.initialize();
    });

    it('should find record by ID', async () => {
      const mockRecord = { id: 'test-id', name: 'Test Wine' };
      mockDb.getAllAsync.mockResolvedValue([mockRecord]);
      
      const result = await databaseService.findById('wines', 'test-id');
      
      expect(result).toEqual(mockRecord);
      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        'SELECT * FROM wines WHERE id = ?',
        ['test-id']
      );
    });

    it('should return null if record not found', async () => {
      mockDb.getAllAsync.mockResolvedValue([]);
      
      const result = await databaseService.findById('wines', 'nonexistent');
      
      expect(result).toBeNull();
    });

    it('should throw DatabaseError on query failure', async () => {
      mockDb.getAllAsync.mockRejectedValue(new Error('Query failed'));
      
      await expect(databaseService.findById('wines', 'test-id'))
        .rejects.toThrow(DatabaseError);
    });
  });

  describe('findAll', () => {
    beforeEach(async () => {
      await databaseService.initialize();
    });

    it('should find all records', async () => {
      const mockRecords = [
        { id: '1', name: 'Wine 1' },
        { id: '2', name: 'Wine 2' }
      ];
      mockDb.getAllAsync.mockResolvedValue(mockRecords);
      
      const result = await databaseService.findAll('wines');
      
      expect(result).toEqual(mockRecords);
      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        'SELECT * FROM wines ORDER BY created_at DESC',
        []
      );
    });

    it('should use custom order by', async () => {
      mockDb.getAllAsync.mockResolvedValue([]);
      
      await databaseService.findAll('wines', 'name ASC');
      
      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        'SELECT * FROM wines ORDER BY name ASC',
        []
      );
    });
  });

  describe('update', () => {
    beforeEach(async () => {
      await databaseService.initialize();
    });

    it('should update record successfully', async () => {
      mockDb.runAsync.mockResolvedValue({ changes: 1 });
      
      await databaseService.update('wines', 'test-id', { name: 'Updated Wine' });
      
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE wines SET'),
        expect.arrayContaining(['Updated Wine', expect.any(String), 'test-id'])
      );
    });

    it('should throw error if no record updated', async () => {
      mockDb.runAsync.mockResolvedValue({ changes: 0 });
      
      await expect(databaseService.update('wines', 'nonexistent', { name: 'Test' }))
        .rejects.toThrow(DatabaseError);
    });
  });

  describe('delete', () => {
    beforeEach(async () => {
      await databaseService.initialize();
    });

    it('should delete record successfully', async () => {
      mockDb.runAsync.mockResolvedValue({ changes: 1 });
      
      await databaseService.delete('wines', 'test-id');
      
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        'DELETE FROM wines WHERE id = ?',
        ['test-id']
      );
    });

    it('should throw error if no record deleted', async () => {
      mockDb.runAsync.mockResolvedValue({ changes: 0 });
      
      await expect(databaseService.delete('wines', 'nonexistent'))
        .rejects.toThrow(DatabaseError);
    });
  });

  describe('count', () => {
    beforeEach(async () => {
      await databaseService.initialize();
    });

    it('should return count of records', async () => {
      mockDb.getAllAsync.mockResolvedValue([{ count: 5 }]);
      
      const count = await databaseService.count('wines');
      
      expect(count).toBe(5);
      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        'SELECT COUNT(*) as count FROM wines',
        []
      );
    });

    it('should return 0 if no count result', async () => {
      mockDb.getAllAsync.mockResolvedValue([]);
      
      const count = await databaseService.count('wines');
      
      expect(count).toBe(0);
    });
  });

  describe('healthCheck', () => {
    beforeEach(async () => {
      await databaseService.initialize();
    });

    it('should return true for healthy database', async () => {
      mockDb.getAllAsync.mockResolvedValue([{ 1: 1 }]);
      
      const isHealthy = await databaseService.healthCheck();
      
      expect(isHealthy).toBe(true);
      expect(mockDb.getAllAsync).toHaveBeenCalledWith('SELECT 1', []);
    });

    it('should return false for unhealthy database', async () => {
      mockDb.getAllAsync.mockRejectedValue(new Error('DB Error'));
      
      const isHealthy = await databaseService.healthCheck();
      
      expect(isHealthy).toBe(false);
    });
  });

  describe('withRetry', () => {
    beforeEach(async () => {
      await databaseService.initialize();
    });

    it('should succeed on first attempt', async () => {
      const operation = jest.fn().mockResolvedValue('success');
      
      const result = await databaseService.withRetry(operation);
      
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure and eventually succeed', async () => {
      const operation = jest.fn()
        .mockRejectedValueOnce(new Error('Fail 1'))
        .mockRejectedValueOnce(new Error('Fail 2'))
        .mockResolvedValue('success');
      
      const result = await databaseService.withRetry(operation);
      
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('should throw after max retries', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Always fail'));
      
      await expect(databaseService.withRetry(operation, 2))
        .rejects.toThrow(DatabaseError);
      expect(operation).toHaveBeenCalledTimes(2);
    });
  });

  describe('mapRowToWine', () => {
    it('should map database row to Wine object', () => {
      const row = {
        id: 'test-id',
        name: 'Test Wine',
        region: 'Test Region',
        grape: 'Test Grape',
        vintage: 2020,
        rating: 4,
        notes: 'Test notes',
        photo_uri: 'test://photo.jpg',
        created_at: '2023-01-01T00:00:00.000Z',
        updated_at: '2023-01-01T00:00:00.000Z'
      };
      
      const wine = databaseService.mapRowToWine(row);
      
      expect(wine).toEqual({
        id: 'test-id',
        name: 'Test Wine',
        region: 'Test Region',
        grape: 'Test Grape',
        vintage: 2020,
        rating: 4,
        notes: 'Test notes',
        photoUri: 'test://photo.jpg',
        createdAt: new Date('2023-01-01T00:00:00.000Z'),
        updatedAt: new Date('2023-01-01T00:00:00.000Z')
      });
    });
  });

  describe('mapRowToSake', () => {
    it('should map database row to Sake object', () => {
      const row = {
        id: 'test-id',
        name: 'Test Sake',
        brewery: 'Test Brewery',
        type: '純米酒',
        region: 'Test Region',
        rating: 5,
        notes: 'Test notes',
        photo_uri: 'test://photo.jpg',
        created_at: '2023-01-01T00:00:00.000Z',
        updated_at: '2023-01-01T00:00:00.000Z'
      };
      
      const sake = databaseService.mapRowToSake(row);
      
      expect(sake).toEqual({
        id: 'test-id',
        name: 'Test Sake',
        brewery: 'Test Brewery',
        type: '純米酒',
        region: 'Test Region',
        rating: 5,
        notes: 'Test notes',
        photoUri: 'test://photo.jpg',
        createdAt: new Date('2023-01-01T00:00:00.000Z'),
        updatedAt: new Date('2023-01-01T00:00:00.000Z')
      });
    });
  });
});